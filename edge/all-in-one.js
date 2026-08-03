/**
 * Subscription Merger Worker
 * - Fetches multiple VPN subscription links (plain text or base64), decodes/normalizes them,
 *   deduplicates configs, and serves a single combined base64 subscription link.
 * - Add or remove sources in SUBSCRIPTION_URLS as needed.
 * - Optional KV caching: bind a KV namespace named SUB_CACHE in wrangler.toml to enable it;
 *   without it, the worker fetches fresh on every request (no setup required).
 * - Visit with ?debug=1 to see per-source fetch status instead of the final sub link.
 */

const SUBSCRIPTION_URLS = [
  'https://raw.githubusercontent.com/igareck/vpn-configs-for-russia/refs/heads/main/BLACK_SS%2BAll_RUS.txt',
  'https://raw.githubusercontent.com/iampedii/whitedns-sub/refs/heads/main/base64.txt',
  'https://raw.githubusercontent.com/nscl5/5/refs/heads/main/configs/hysteria2.txt',
  'https://raw.githubusercontent.com/Argh94/V2RayAutoConfig/refs/heads/main/configs/Hysteria2.txt',
  'https://raw.githubusercontent.com/sakha1370/OpenRay/refs/heads/main/output_iran/iran_top100_checked.txt',
  'https://github.com/Epodonios/v2ray-configs/raw/main/Splitted-By-Protocol/vmess.txt',
];

const FETCH_TIMEOUT_MS = 15000;
const GLOBAL_TIMEOUT_MS = 25000;
const CACHE_KEY = 'combined-sub-v1';
const CACHE_TTL_SECONDS = 300;

async function fetchWithTimeout(url, timeout = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0',
        Accept: 'text/plain,*/*',
        'Cache-Control': 'no-cache',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { content: '', error: `HTTP ${response.status}`, url };
    }

    const content = await response.text();
    return { content, error: null, url };
  } catch (error) {
    clearTimeout(timeoutId);
    return { content: '', error: error.message, url };
  }
}

function tryBase64Decode(str) {
  try {
    const binary = atob(str);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch (e) {
    return null;
  }
}

function isValidConfigText(text) {
  return /(vless|vmess|trojan|ss|hysteria2?|tuic):\/\//.test(text);
}

function normalizeContent(rawContent) {
  const trimmed = rawContent.trim();
  if (!trimmed) return '';

  const decoded = tryBase64Decode(trimmed);
  if (decoded && isValidConfigText(decoded)) {
    return decoded;
  }
  return trimmed;
}

function encodeBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function buildCombinedConfig() {
  const results = await Promise.race([
    Promise.all(SUBSCRIPTION_URLS.map((url) => fetchWithTimeout(url))),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Global fetch timeout')), GLOBAL_TIMEOUT_MS)
    ),
  ]);

  let combined = '';
  const debugLines = [];

  for (const { content, error, url } of results) {
    debugLines.push(`URL: ${url}`);
    debugLines.push(`Status: ${error ? 'ERROR - ' + error : 'SUCCESS'}`);
    debugLines.push(`Content Length: ${content.length}`);

    if (content) {
      const normalized = normalizeContent(content);
      if (normalized) combined += normalized + '\n';
    }
    debugLines.push('---');
  }

  const lines = combined.split('\n').filter((line) => line.trim().length > 0);
  const uniqueLines = [...new Set(lines)];
  const finalContent = uniqueLines.join('\n');

  return { finalContent, uniqueCount: uniqueLines.length, debugInfo: debugLines.join('\n') };
}

async function getCachedOrFresh(env) {
  const kv = env && env.SUB_CACHE;

  if (kv) {
    const cached = await kv.get(CACHE_KEY, { type: 'json' });
    if (cached) {
      return { ...cached, fromCache: true };
    }
  }

  const fresh = await buildCombinedConfig();

  if (kv) {
    await kv.put(CACHE_KEY, JSON.stringify(fresh), { expirationTtl: CACHE_TTL_SECONDS });
  }

  return { ...fresh, fromCache: false };
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const result = await getCachedOrFresh(env);

      if (url.searchParams.get('debug') === '1') {
        const debugHeader = `From Cache: ${result.fromCache}\nTotal Unique Configs: ${result.uniqueCount}\n\n`;
        return new Response(debugHeader + result.debugInfo, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      const finalBase64 = encodeBase64(result.finalContent);

      return new Response(finalBase64, {
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Total-Configs': result.uniqueCount.toString(),
          'X-From-Cache': result.fromCache.toString(),
        },
      });
    } catch (error) {
      return new Response('Error: ' + error.message, {
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
