/**
 * V2Ray Subscription Aggregator for Cloudflare Workers
 * Last Update: Sun, Aug 30, 2026, 04:20 UTC
 *
 * Fetches multiple V2Ray subscription sources (plain text or base64),
 * decodes & normalizes them, removes duplicates, and serves a single combined
 * subscription with proper headers for modern clients.
 *
 * DEPLOYMENT : Cloudflare Workers
 * OPTIONAL KV CACHING: KV namespace bound as "SUB_CACHE".
 *   Without it : The worker fetches fresh on every request (no setup required).
 *
 * Optional environment variable:
 *   SUBSCRIPTION_URLS : newline- or comma-separated list of sources.
 *                       Falls back to DEFAULT_SUBSCRIPTION_URLS if unset.
 *
 * QUERY PARAMETERS:
 *   ?debug=1            -> show source status report
 *   ?name=<title>       -> override profile title
 *   ?protocol=<list>    -> filter protocols (e.g. ?protocol=ss OR  ?protocol=vless,ss)
 *   ?limit=<number>     -> cap the number of configs returned
 * 
 */
 
const DEFAULT_SUBSCRIPTION_URLS = [
  'https://raw.githubusercontent.com/teknovpnhub/v2ray-subscription/refs/heads/main/servers.txt',
  'https://raw.githubusercontent.com/0xRadikal/Free-v2ray-Configs/main/top100.txt',
  'https://raw.githubusercontent.com/Mosifree/-FREE2CONFIG/refs/heads/main/Reality',
  'https://raw.githubusercontent.com/ShatakVPN/ConfigForge-V2Ray/main/configs/shadowsocks.txt',
  'https://raw.githubusercontent.com/sakha1370/OpenRay/refs/heads/main/output_iran/iran_top100_checked.txt',
  'https://raw.githubusercontent.com/igareck/vpn-configs-for-russia/refs/heads/main/BLACK_SS%2BAll_RUS.txt',
  'https://raw.githubusercontent.com/iampedii/whitedns-sub/refs/heads/main/base64.txt',
  'https://sub.forcerun-panel.workers.dev/55e2a7eb-b802-4ba4-ba0b-d50ae42a9b02',
];

const FETCH_TIMEOUT_MS = 15000;
const GLOBAL_TIMEOUT_MS = 25000;
const CACHE_KEY = 'combined-sub-v2';
const CACHE_TTL_SECONDS = 300;
const MIN_ACCEPTABLE_CONFIGS = 20;
const PROFILE_NAME = 'Robin';
const MAX_SOURCE_BYTES = 2_000_000;
const MAX_DECODE_ROUNDS = 3;

// Cosmetic traffic info shown by some clients (Hiddify / Nekobox / Exclave / Streisand, etc.)
const DISPLAY_TOTAL_BYTES = 100 * 1024 * 1024 * 1024;
const DISPLAY_EXPIRE_DAYS = 90;

const CONFIG_LINE_REGEX = /^(vless|vmess|trojan|ss|hy2|hysteria2?|tuic):///i;
const CONFIG_ANYWHERE_REGEX = /(vless|vmess|trojan|ss|hy2|hysteria2?|tuic):\/\//i;

// Params whose values are case-insensitive. Everything else (e.g. `pbk` in
// Reality or the userinfo of `ss`) is compared exactly to avoid false dedup.
const CASE_INSENSITIVE_PARAMS = new Set([
  'type', 'security', 'flow', 'encryption', 'fp', 'alpn',
  'mode', 'net', 'sni', 'host', 'authority',
]);

// ---Fetching---
async function fetchWithTimeout(url, timeout = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0',
        Accept: 'text/plain, */*',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      clearTimeout(timeoutId);
      return { content: '', error: `HTTP ${response.status}`, url };
    }

    // Skip obviously oversized sources early when the size is declared.
    const declared = Number(response.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > MAX_SOURCE_BYTES) {
      clearTimeout(timeoutId);
      return { content: '', error: 'Response too large', url };
    }

    const content = await response.text();
    clearTimeout(timeoutId);

    if (content.length > MAX_SOURCE_BYTES) {
      return { content: '', error: 'Response too large', url };
    }
    return { content, error: null, url };
  } catch (error) {
    clearTimeout(timeoutId);
    const message = error && error.name === 'AbortError' ? 'Timeout' : error.message;
    return { content: '', error: message, url };
  }
}

// Retries only while the global time budget still allows it.
async function fetchWithRetry(url, retries = 1, deadline = Infinity) {
  let result = await fetchWithTimeout(url);
  while (!result.content && retries > 0) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    retries -= 1;
    result = await fetchWithTimeout(url, Math.min(FETCH_TIMEOUT_MS, remaining));
  }
  return result;
}

function getSubscriptionUrls(env) {
  const raw = env && env.SUBSCRIPTION_URLS;
  if (typeof raw === 'string' && raw.trim()) {
    const urls = raw.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    if (urls.length) return urls;
  }
  return DEFAULT_SUBSCRIPTION_URLS;
}

// ---Normalization & validation---
function normalizeBase64String(str) {
  let s = str.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4 !== 0) s += '=';
  return s;
}

function tryBase64Decode(str) {
  try {
    const binary = atob(normalizeBase64String(str));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch (e) {
    return null;
  }
}

function isValidConfigText(text) {
  return CONFIG_ANYWHERE_REGEX.test(text);
}

// Handles plain text, base64, and even double-encoded base64 content.
function normalizeContent(rawContent) {
  let text = rawContent.replace(/^\uFEFF/, '').trim();
  if (!text) return '';
  for (let round = 0; round < MAX_DECODE_ROUNDS; round++) {
    if (isValidConfigText(text)) return text;
    const decoded = tryBase64Decode(text);
    if (!decoded) return '';
    text = decoded.trim();
  }
  return isValidConfigText(text) ? text : '';
}

// Beyond the prefix, require a valid host and port.
function isPlausibleConfig(line) {
  if (!CONFIG_LINE_REGEX.test(line)) return false;
  if (/^vmess:\/\//i.test(line)) return true; // vmess payload is JSON, not a URL
  try {
    const u = new URL(line);
    if (!u.hostname) return false;
    const port = Number(u.port);
    return Number.isInteger(port) && port > 0 && port < 65536;
  } catch (e) {
    return false;
  }
}

function encodeBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}


/**
 * ---Deduplication---
 * vmess links carry a base64-encoded JSON payload, so they need a
 * dedicated canonical key built from the decoded fields.
 */
function vmessKey(line) {
  try {
    const payload = line.slice('vmess://'.length).trim();
    const obj = JSON.parse(atob(normalizeBase64String(payload)));
    return [
      'vmess',
      String(obj.add || '').toLowerCase(),
      String(obj.port || ''),
      String(obj.id || '').toLowerCase(),
      String(obj.aid || ''),
      String(obj.scy || '').toLowerCase(),
      String(obj.net || '').toLowerCase(),
      String(obj.type || '').toLowerCase(),
      String(obj.host || '').toLowerCase(),
      String(obj.path || ''),
      String(obj.tls || '').toLowerCase(),
      String(obj.sni || '').toLowerCase(),
    ].join('|');
  } catch (e) {
    return line;
  }
}

function canonicalKey(line) {
  const trimmed = line.trim();
  if (/^vmess:\/\//i.test(trimmed)) return vmessKey(trimmed);
  try {
    const u = new URL(trimmed);
    const proto = u.protocol.toLowerCase();
    // ss:// userinfo is base64(method:password) -> must stay case-sensitive.
    const user = proto === 'ss:' ? u.username : u.username.toLowerCase();
    const params = [...u.searchParams.entries()]
      .map(([k, v]) => {
        const key = k.toLowerCase();
        const value = CASE_INSENSITIVE_PARAMS.has(key) ? v.toLowerCase() : v;
        return `${key}=${value}`;
      })
      .sort()
      .join('&');
    return `${proto}${user}@${u.hostname.toLowerCase()}:${u.port}?${params}`;
  } catch (e) {
    return trimmed;
  }
}

// ---Build combined subscription---
async function buildCombinedConfig(env) {
  const urls = getSubscriptionUrls(env);
  const deadline = Date.now() + GLOBAL_TIMEOUT_MS;

  // Each source has its own deadline, so one slow source never kills the rest.
  const settled = await Promise.allSettled(
    urls.map((sourceUrl) => fetchWithRetry(sourceUrl, 1, deadline))
  );

  const debugLines = [];
  const allLines = [];
  let failedSources = 0;

  settled.forEach((entry, index) => {
    const { content, error, url } =
      entry.status === 'fulfilled'
        ? entry.value
        : { content: '', error: String(entry.reason), url: urls[index] };

    if (error) failedSources += 1;

    const normalized = content ? normalizeContent(content) : '';
    const sourceLines = normalized
      ? normalized.split(/\r?\n/).map((l) => l.trim()).filter((l) => isPlausibleConfig(l))
      : [];

    debugLines.push(`URL: ${url}`);
    debugLines.push(`Status: ${error ? 'ERROR - ' + error : 'SUCCESS'}`);
    debugLines.push(`Content Length: ${content.length}`);
    debugLines.push(`Valid Configs: ${sourceLines.length}`);
    debugLines.push('---');

    if (sourceLines.length) allLines.push(...sourceLines);
  });

  const seen = new Map();
  for (const line of allLines) {
    const key = canonicalKey(line);
    if (!seen.has(key)) seen.set(key, line);
  }
  const uniqueLines = [...seen.values()];

  return {
    finalContent: uniqueLines.join('\n'),
    uniqueCount: uniqueLines.length,
    totalParsed: allLines.length,
    sourceCount: urls.length,
    failedSources,
    debugInfo: debugLines.join('\n'),
    fetchedAt: Date.now(),
  };
}

/**
 * ---Caching---
 * (stale-while-revalidate) + request coalescing
 */
let inflightBuild = null;

// Ensures concurrent cold-cache requests trigger only one upstream fetch.
function buildCoalesced(env) {
  if (!inflightBuild) {
    inflightBuild = buildCombinedConfig(env).finally(() => {
      inflightBuild = null;
    });
  }
  return inflightBuild;
}

async function getCachedOrFresh(env) {
  const kv = env && env.SUB_CACHE;
  let cached = null;

  if (kv) {
    try {
      cached = await kv.get(CACHE_KEY, { type: 'json' });
    } catch (e) {
      cached = null;
    }
  }

  if (cached && cached.uniqueCount >= MIN_ACCEPTABLE_CONFIGS) {
    return { ...cached, fromCache: true, stale: false };
  }

  let fresh;
  try {
    fresh = await buildCoalesced(env);
  } catch (error) {
    // Total failure -> an old cache is better than an error.
    if (cached && cached.finalContent) {
      return { ...cached, fromCache: true, stale: true };
    }
    throw error;
  }

  // Weak fresh result -> serve the old cache instead.
  if (fresh.uniqueCount < MIN_ACCEPTABLE_CONFIGS && cached && cached.finalContent) {
    return { ...cached, fromCache: true, stale: true };
  }

  if (kv && fresh.uniqueCount >= MIN_ACCEPTABLE_CONFIGS) {
    try {
      await kv.put(CACHE_KEY, JSON.stringify(fresh), { expirationTtl: CACHE_TTL_SECONDS });
    } catch (e) {
      // A cache write failure must not break the response.
    }
  }

  return { ...fresh, fromCache: false, stale: false };
}

// ---Filters & headers---
function applyFilters(lines, protocolParam, limit) {
  let out = lines;
  if (protocolParam) {
    const wanted = protocolParam
      .split(',')
      .map((p) => p.trim().toLowerCase())
      .filter(Boolean);
    if (wanted.length) {
      out = out.filter((line) =>
        wanted.some((p) => line.toLowerCase().startsWith(`${p}://`))
      );
    }
  }
  if (Number.isFinite(limit) && limit > 0) {
    out = out.slice(0, limit);
  }
  return out;
}

function buildSubscriptionUserinfo() {
  const expire = Math.floor(Date.now() / 1000) + DISPLAY_EXPIRE_DAYS * 24 * 3600;
  return `upload=0; download=0; total=${DISPLAY_TOTAL_BYTES}; expire=${expire}`;
}

function buildContentDisposition(name) {
  const ascii = name.replace(/[^\x20-\x7e]/g, '').replace(/["\\]/g, '').trim() || 'subscription';
  const encoded = encodeURIComponent(`${name}.txt`);
  return `inline; filename="${ascii}.txt"; filename*=UTF-8''${encoded}`;
}

function buildProfileHeaders(profileName) {
  return {
    'profile-title': `base64:${encodeBase64(profileName)}`,
    'profile-update-interval': '6',
    'content-disposition': buildContentDisposition(profileName),
  };
}


// ---Worker entry point---
export default {
  async fetch(request, env) {
    try {
      const requestUrl = new URL(request.url);
      const result = await getCachedOrFresh(env);

      if (requestUrl.searchParams.get('debug') === '1') {
        const header = [
          `From Cache: ${result.fromCache}`,
          `Stale Cache: ${Boolean(result.stale)}`,
          `Total Unique Configs: ${result.uniqueCount}`,
          `Sources: ${result.sourceCount ?? '-'} (failed: ${result.failedSources ?? '-'})`,
          result.fetchedAt ? `Fetched At: ${new Date(result.fetchedAt).toISOString()}` : '',
          '',
          '',
        ].join('\n');
        return new Response(header + (result.debugInfo || ''), {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      if (!result.uniqueCount) {
        return new Response('Error: could not fetch any configs from sources.', {
          status: 503,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      const profileName = (requestUrl.searchParams.get('name') || '').trim() || PROFILE_NAME;
      const protocolParam = requestUrl.searchParams.get('protocol');
      const limitParam = Number.parseInt(requestUrl.searchParams.get('limit'), 10);

      const lines = applyFilters(
        result.finalContent.split('\n').filter(Boolean),
        protocolParam,
        limitParam
      );

      if (!lines.length) {
        return new Response('Error: no configs matched the requested filters.', {
          status: 404,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      const finalBase64 = encodeBase64(lines.join('\n'));

      return new Response(finalBase64, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
          'X-Total-Configs': String(lines.length),
          'X-From-Cache': String(result.fromCache),
          'X-Stale': String(Boolean(result.stale)),
          'X-Source-Count': String(result.sourceCount ?? 0),
          'X-Failed-Sources': String(result.failedSources ?? 0),
          'subscription-userinfo': buildSubscriptionUserinfo(),
          ...buildProfileHeaders(profileName),
        },
      });
    } catch (error) {
      return new Response('Error: ' + error.message, {
        status: 500,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
