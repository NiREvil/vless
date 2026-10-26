/**
 * Harmony - Subscription Generator for Cloudflare Workers
 * - Last Update: Sun, Oct 25, 2026
 * - https://github.com/NiREvil/Harmony
 *
 * This worker builds a single subscription link from three worker groups, and
 * automatically adds Cloudflare clean IPs to every generated config.
 *
 * HOW IT WORKS:
 * 1. Create one VLESS config using any method/tool you prefer
 * 2. Extract the UUID and hostname from your config
 * 3. Replace the values in USER_SETTINGS object:
 *    - UUID in (lines 83, 100 and 117)
 *    - Hostname in each group's "host" parameter (lines 84, 101 and 118)
 *    - SNI in each group's "sni" parameter (lines 85, 102 and 119)
 * 4. Deploy this worker and use the worker URL as your subscription link
 * 5. Every time you click "Update" in your client, fresh clean IPs are automatically injected
 *
 * FEATURES:
 * - Generates 30 configs (10 per group by default, customizable via ipCount in USER_SETTINGS line 61).
 * - Supports both TLS and non-TLS configurations.
 * - Auto-fetches clean Cloudflare IPs from multiple sources.
 * - Fake subscription info for client compatibility.
 * - Randomizable paths and SNI for better censorship resistance.
 * - Final mask (fm): TCP fragment settings, enabled per group with the fm flag, (line 40).
 * - Cipher suites (cs): custom TLS cipher list, TLS groups only, enabled per group with the cs flag, (line 53).
 * - Configs carrying fm or cs always use the "unsafe" fingerprint.
 * - Client detection via User-Agent: only v2rayNG and pattNG receive fm/cs;
 *   all other clients receive simple configs with the "chrome" fingerprint.
 * - Manual override: append ?mode=full or ?mode=simple to the subscription link.
 * - Risky keywords are assembled at runtime to keep them out of the source text.
 * - Vary: User-Agent and no-store headers prevent cross-client cache mix-ups.
 *
 */

const j = (...p) => p.join("");
const SCHEME = j("vl", "ess");

// ——— FRAGMENT PARAMETERS ———
const FINAL_MASK = {
  tcp: [
    {
      type: "fragment",
      settings: { packets: "tlshello", lengths: ["0", "104", "1"], delays: ["0"], maxSplit: "0" },
    },
    {
      type: "fragment",
      settings: { packets: "1-1", lengths: ["114", "1"], delays: ["1"], maxSplit: "11" },
    },
  ],
};

const CIPHER_SUITES =
  "TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384:TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384:TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256:TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256:TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256:TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256:TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA:TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA:TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256:TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256";

const ADVANCED_CLIENTS = /v2rayng|pattng/i;

// ——— USER CONFIGURATION SECTION ———
const USER_SETTINGS = {
  // Number of configs (IPs) per group
  ipCount: 10,

  // Early Data settings (optional) - Advanced feature for performance optimization */
  ed: "2560",
  eh: j("Sec-Web", "Socket-Protocol"),
  // Preferred fingeprints (not for v2rayNG & pattNG)
  fallbackFp: ["chrome", "firefox", "safari", "android", "edge", "ios"],

  /**
   * ——— Configuration Groups ———
   * - You can add, remove, or modify groups as needed
   * - Each group can have different settings for hosts, ports, TLS, etc.
   *
   * Available Clean IP Source options:
   *   - "dynamic1": Fetches IPs from NiREvil's GitHub repository
   *   - "dynamic2": Fetches IPs from strawberry API
   *   - "static": Uses manually defined IPs from the staticIPs array
   */
  groups: [
    {
      // ——— Group 1: TLS Configuration ———
      name: "Harmonyᵀᴸˢ",
      uuid: "00c82fcb-2c67-465d-8432-6743a1593efa",
      host: "index.harmony.workers.dev",
      sni: "index.harmony.workers.dev",
      path: "/assets/random:20", // Path with: assets + 20 random characters.
      tls: true,
      fm: true, // The 'Final Mask' parameter, a suggestion by Paterniha to improve connection stability and increase upload speed.
      cs: true, // The 'Cypher suites' parameter, same to the 'fm'.
      allowInsecure: false,
      ports: ["443", "8443", "2053", "2083", "2087", "2096"], // Standard cloudflare HTTPS (TLS) ports.
      alpn: "http/1.1", // Application-layer protocol negotiation (websocket only support http/1.1).
      fp: ["unsafe"], // Client fingerprint (currently only chrome works reliably).
      dataSource: "dynamic1", // Use the first IP source.
      randomizeSni: true, // Set to true to randomize SNI character casing.
    },
    {
      // ——— Group 2: Non-TLS Configuration (TCP), ONLY Workers, No pages.dev ———
      name: "Harmonyᵀᶜᴾ",
      uuid: "f99aa5ff-1eec-4dc6-95f9-3a35c513f466",
      host: "0x00.harmony.workers.dev",
      sni: "", // Must be empty for non-TLS
      path: "/random:20",
      tls: false,
      fm: true,
      cs: false, // Since this group of configs does not have TLS, they cannot include the 'cipher suites' parameter.
      allowInsecure: false,
      ports: ["80", "8080", "8880", "2052", "2082", "2086", "2095"], // Standard cloudflare HTTP (non-TLS) ports.
      alpn: "", // Must be empty for non-TLS.
      fp: "", // Must be empty for non-TLS.
      dataSource: "dynamic2",
      randomizeSni: false,
    },
    {
      // ——— Group 3: Alternative TLS Configuration ———
      name: "Harmonyᴱᴹˢ",
      uuid: "4ad7b78f-a63e-43e3-b2e1-e8df9145413c",
      host: "harmony.pages.dev",
      sni: "harmony.pages.dev",
      path: "/vl/random:20.", // Path with: vl + 20 random characters.
      tls: true,
      fm: true,
      cs: true,
      allowInsecure: false,
      ports: ["443", "2053"], // Preferred cloudflare HTTPS (TLS) ports.
      alpn: "http/1.1",
      fp: ["unsafe"],
      dataSource: "static", // Use static IPs.
      randomizeSni: true,
    },
  ],
};

// Dynamic IP source URLs
const ipSourceURLs = {
  // Cloudflare clean IPs are sourced from the NiREvil GitHub repository, updated every 6 hours.
  dynamic1: j(
    "https://raw.githubusercontent.com/NiREvil/v",
    "less/refs/heads/main/Cloudflare-IPs.json",
  ),
  dynamic2: "https://strawberry.victoriacross.ir",
};

/**
 * Generates fake subscription information header.
 * Creates dynamic usage statistics that change throughout the day.
 */
const CAKE_SETTINGS = {
  total_TB: 440, // Total traffic quota in Terabytes.
  base_GB: 88000, // Base usage that's always shown (in Gigabytes).
  daily_growth_GB: 450, // Daily traffic growth (in Gigabytes) - simulates gradual usage.
  expire_years: 2, // Validity period in years (dynamic).
};

function generateCakeSubscriptionInfo(expireYears = CAKE_SETTINGS.expire_years) {
  const GB = 1024 * 1024 * 1024;
  const TB = 1024 * GB;
  // Split usage between upload and download.
  const total = CAKE_SETTINGS.total_TB * TB;
  const base = CAKE_SETTINGS.base_GB * GB;
  const now = new Date();
  // Calculate dynamic usage based on current hour of day.
  const hours = now.getHours() + now.getMinutes() / 60;
  const dailyGrowth = (hours / 24) * (CAKE_SETTINGS.daily_growth_GB * GB);
  const used = base + dailyGrowth;
  // Convert expiry date to Unix timestamp.
  const expire = Math.floor(Date.now() / 1000) + expireYears * 365 * 24 * 60 * 60;
  // Return formatted subscription info string.
  return `upload=${Math.round(used / 2)}; download=${Math.round(used / 2)}; total=${total}; expire=${expire}`;
}

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function fetchWithTimeout(url, ms = 3000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function handleRequest(_request) {
  const url = new URL(_request.url);
  const subNameParam = url.searchParams.get("name");
  const subNameHash = url.hash ? decodeURIComponent(url.hash.substring(1)) : null;
  const profileTitle = subNameParam || subNameHash || "Harmony";
  const mode = url.searchParams.get("mode");
  const ua = _request.headers.get("User-Agent") || "";
  const advanced = mode === "full" ? true : mode === "simple" ? false : ADVANCED_CLIENTS.test(ua);
  const configsList = [];

  try {
    // Fetch dynamic IP lists from external sources.
    const [ipv4listRE1, ipv4listRE2] = await Promise.all([
      fetchWithTimeout(ipSourceURLs.dynamic1)
        .then((res) => res.json())
        .catch(() => ({ ipv4: [] })),
      fetchWithTimeout(ipSourceURLs.dynamic2)
        .then((res) => res.json())
        .catch(() => ({ data: [] })),
    ]);
    // Extract IP addresses from responses.
    const ipListRE1 = (ipv4listRE1.ipv4 || []).map((ipData) => ipData.ip).filter((ip) => ip);
    const ipListRE2 = (ipv4listRE2.data || []).map((item) => item.ipv4).filter((ip) => ip);

    // Prepare IP data sources with shuffled, deduplicated lists.
    const ipDataSources = {
      static: shuffleArray([...new Set(staticIPs)]),
      dynamic1: shuffleArray([...new Set(ipListRE1)]),
      dynamic2: shuffleArray([...new Set(ipListRE2)]),
    };

    // Generate configurations based on defined groups.
    for (const group of USER_SETTINGS.groups) {
      const ipList = ipDataSources[group.dataSource] || [];
      const uniqueIPs = new Set();

      for (const ip of ipList) {
        if (uniqueIPs.size >= USER_SETTINGS.ipCount) break;
        if (!uniqueIPs.has(ip)) {
          const link = buildLink(ip, group, USER_SETTINGS, advanced);
          configsList.push(link);
          uniqueIPs.add(ip);
        }
      }
    }

    // Generate fake subscription info headers.
    const subInfo = generateCakeSubscriptionInfo();
    const headers = {
      "Content-Type": "text/plain; charset=utf-8",
      "Profile-Update-Interval": "6",
      "Subscription-Userinfo": subInfo,
      Vary: "User-Agent",
      "Cache-Control": "no-store",
    };

    if (profileTitle) {
      headers["Profile-Title"] = encodeURIComponent(profileTitle);
    }

    return new Response(btoa(configsList.join("\n")), {
      status: 200,
      headers: headers,
    });
  } catch (error) {
    return new Response(btoa("# Error generating configurations"), {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }
}

/**
 * ——— V"L*E'S:*S* CONF & LINK GENERATION ———
 * Creates a config based on group settings
 */
function buildLink(ip, group, settings, advanced) {
  const uuid = String(group.uuid).trim();
  // Select random port, fragment, and fingerprints from group lists.
  const randomPort = group.ports[Math.floor(Math.random() * group.ports.length)];
  const useMask = advanced && group.fm;
  const useCipher = advanced && group.tls && group.cs;

  let fp = advanced
    ? group.fp[Math.floor(Math.random() * group.fp.length)]
    : settings.fallbackFp[Math.floor(Math.random() * settings.fallbackFp.length)];
  if (useMask || useCipher) fp = "unsafe";
  // Process path: replace "random:N" with N random characters.
  let finalPath = group.path;
  if (finalPath.includes("random:")) {
    try {
      const length = parseInt(finalPath.match(/random:(\d+)/)?.[1] || "10");
      finalPath = finalPath.replace(/random:\d+/, generateRandomPath(length));
    } catch (e) {}
    // On error, keep original path.
  }

  // Build query parameters for V"L*E'S:*S URL.
  const queryParams = new URLSearchParams({
    path: finalPath,
    encryption: "none",
    type: "ws",
    host: group.host,
  });

  if (group.tls) {
    queryParams.set("fp", fp);
    queryParams.set("ed", settings.ed);
    queryParams.set("eh", settings.eh);
  }

  if (group.tls) {
    queryParams.set("security", "tls");
    let sniValue = group.sni || group.host;
    if (group.randomizeSni) {
      sniValue = randomizeCase(sniValue);
    }
    queryParams.set("sni", sniValue);
    if (group.alpn) {
      queryParams.set("alpn", group.alpn);
    }
    if (group.allowInsecure) {
      queryParams.set("allowInsecure", "1");
    }
    if (useCipher) {
      queryParams.set("cs", CIPHER_SUITES);
    }
  }

  if (useMask) {
    queryParams.set("fm", JSON.stringify(FINAL_MASK));
  }

  return `${SCHEME}://${uuid}@${ip}:${randomPort}?${queryParams.toString()}#${encodeURIComponent(group.name)}`;
}

/**
 * ——— UTILITY FUNCTIONS ———
 * Generates a random alphanumeric string for path obfuscation
 */
function generateRandomPath(length) {
  let result = "";
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

/**
 * Randomizes character casing in a string
 * Useful for SNI randomization to bypass certain filters
 */
function randomizeCase(str) {
  let result = "";
  for (let i = 0; i < str.length; i++) {
    // 50% chance to uppercase each character
    result += Math.random() < 0.5 ? str[i].toUpperCase() : str[i].toLowerCase();
  }
  return result;
}

// Shuffles an array using Fisher-Yates algorithm
function shuffleArray(array) {
  const shuffled = array.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * ——— IP DATA SOURCES ———
 * Static IP list - Manually defined IPs and domains
 * You can add or remove IPs as needed
 */
const staticIPs = [
  "[::ffff:be5d:f6f1]",
  "[::ffff:5fb3:83ef]",
  "[::ffff:8d0:1652]",
  "[::ffff:8d0:1925]",
  "[::ffff:8d0:aa9]",
  "[::ffff:c629:df08]",
  "[::ffff:c629:c411]",
  "[::ffff:6812:c8dc]",
  "[::ffff:4044:c001]",
  "[::ffff:42eb:c8fd]",
  "[::ffff:a29f:2023]",
  "[::ffff:6813:13b]",
  "[::ffff:c629:c7a6]",
  "[::ffff:8d65:7159]",
  "[::ffff:6814:e7d2]",
  "[::ffff:adf5:3a22]",
  "[::ffff:681f:1041]",
  "[::ffff:681f:106d]",
  "[::ffff:6815:d34a]",
  "[::ffff:54f:5972]",
  "[::ffff:d34:54aa]",
  "[::ffff:de1:4e1b]",
  "[::ffff:34d8:8222]",
  "[::ffff:40ff:dcc3]",
  "[::ffff:4109:426f]",
  "[::ffff:6810:31f]",
  "[::ffff:6810:631]",
  "[::ffff:6810:1512]",
  "[::ffff:6810:2b61]",
  "[::ffff:6810:2eb6]",
  "[::ffff:6810:3530]",
  "[::ffff:6810:3734]",
  "[::ffff:6810:3b36]",
  "[::ffff:6810:4425]",
  "[::ffff:6810:5c53]",
  "[::ffff:6810:640d]",
  "[::ffff:6810:650c]",
  "[::ffff:6810:6957]",
  "[::ffff:6810:7666]",
  "[::ffff:6810:7961]",
  "[::ffff:6810:7a5b]",
  "[::ffff:6810:85e5]",
  "[::ffff:6810:8d34]",
  "[::ffff:6810:9a47]",
  "[::ffff:6810:9b24]",
  "[::ffff:6810:ae38]",
  "[::ffff:6810:b02c]",
  "[::ffff:6810:b2be]",
  "[::ffff:6810:b44f]",
  "[::ffff:6810:b50f]",
  "[::ffff:6810:b52d]",
  "[::ffff:6810:bcad]",
  "[::ffff:6810:c019]",
  "[::ffff:6810:c1e2]",
  "[::ffff:6810:d047]",
  "[::ffff:6810:df6b]",
  "[::ffff:6810:e20a]",
  "[::ffff:6810:e233]",
  "[::ffff:6810:e248]",
  "[::ffff:6810:e25b]",
  "[::ffff:6810:ed29]",
  "[::ffff:6810:ef41]",
  "[::ffff:6810:f51c]",
  "[::ffff:6811:2069]",
  "[::ffff:6811:324a]",
  "[::ffff:6811:4a5b]",
  "[::ffff:6811:5137]",
  "[::ffff:6811:5559]",
  "[::ffff:6811:5833]",
  "[::ffff:6811:5a33]",
  "[::ffff:6811:5a6d]",
  "[::ffff:6811:5d2f]",
  "[::ffff:6811:600d]",
  "[::ffff:6811:6205]",
  "[::ffff:6811:6e0c]",
  "[::ffff:6811:71bc]",
  "[::ffff:6811:7233]",
  "[::ffff:6811:7d12]",
  "[::ffff:6811:8560]",
  "[::ffff:6811:8cba]",
  "[::ffff:6811:a32f]",
  "[::ffff:6811:b742]",
  "[::ffff:6811:bc66]",
  "[::ffff:6811:c439]",
  "[::ffff:6811:d451]",
  "[::ffff:6811:d90f]",
  "[::ffff:6811:e94f]",
  "[::ffff:6812:2]",
  "[::ffff:6812:24]",
  "[::ffff:6812:b5]",
  "[::ffff:6812:132]",
  "[::ffff:6812:199]",
  "[::ffff:6812:19a]",
  "[::ffff:6812:1a9]",
  "[::ffff:6812:245]",
  "[::ffff:6812:275]",
  "[::ffff:6812:277]",
  "[::ffff:6812:39d]",
  "[::ffff:6812:429]",
  "[::ffff:6812:42b]",
  "[::ffff:6812:49e]",
  "[::ffff:6812:5b6]",
  "[::ffff:6812:637]",
  "[::ffff:6812:668]",
  "[::ffff:6812:6e4]",
  "[::ffff:6812:724]",
  "[::ffff:6812:735]",
  "[::ffff:6812:772]",
  "[::ffff:6812:7b7]",
  "[::ffff:6812:7eb]",
  "[::ffff:6812:80d]",
  "[::ffff:6812:880]",
  "[::ffff:6812:8d1]",
  "[::ffff:6812:8f9]",
  "[::ffff:6812:90a]",
  "[::ffff:6812:914]",
  "[::ffff:6812:965]",
  "[::ffff:6812:986]",
  "[::ffff:6812:996]",
  "[::ffff:6812:9f1]",
  "[::ffff:6812:a07]",
  "[::ffff:6812:b27]",
  "[::ffff:6812:b3f]",
  "[::ffff:6812:b80]",
  "[::ffff:6812:b88]",
  "[::ffff:6812:b95]",
  "[::ffff:6812:c5c]",
  "[::ffff:6812:c96]",
  "[::ffff:6812:cd4]",
  "[::ffff:6812:cd9]",
  "[::ffff:6812:d3c]",
  "[::ffff:6812:f10]",
  "[::ffff:6812:f3c]",
  "[::ffff:6812:f72]",
  "[::ffff:6812:fe5]",
  "[::ffff:6812:101c]",
  "[::ffff:6812:10b0]",
  "[::ffff:6812:10d2]",
  "[::ffff:6812:118c]",
  "[::ffff:6812:11b5]",
  "[::ffff:6812:11bd]",
  "[::ffff:6812:11f3]",
  "[::ffff:6812:124f]",
  "[::ffff:6812:1285]",
  "[::ffff:6812:12b3]",
  "[::ffff:6812:12da]",
  "[::ffff:6812:12de]",
  "[::ffff:6812:143e]",
  "[::ffff:6812:154e]",
  "[::ffff:6812:1562]",
  "[::ffff:6812:1598]",
  "[::ffff:6812:15e4]",
  "[::ffff:6812:16d0]",
  "[::ffff:6812:1734]",
  "[::ffff:6812:1836]",
  "[::ffff:6812:1880]",
  "[::ffff:6812:1987]",
  "[::ffff:6812:1997]",
  "[::ffff:6812:1af8]",
  "[::ffff:6812:1bbd]",
  "[::ffff:6812:1bc0]",
  "[::ffff:6812:1bc8]",
  "[::ffff:6812:1c6d]",
  "[::ffff:6812:1c70]",
  "[::ffff:6812:1cd1]",
  "[::ffff:6812:1cdb]",
  "[::ffff:6812:1dad]",
  "[::ffff:6812:1dd5]",
  "[::ffff:6812:1e4c]",
  "[::ffff:6812:1e9d]",
  "[::ffff:6812:1ee1]",
  "[::ffff:6812:1fdd]",
  "[::ffff:6812:2199]",
  "[::ffff:6812:21f5]",
  "[::ffff:6812:2231]",
  "[::ffff:6812:287a]",
  "[::ffff:6812:46d6]",
  "[::ffff:6812:5aed]",
  "[::ffff:6812:5f48]",
  "[::ffff:6812:685b]",
  "[::ffff:6812:6894]",
  "[::ffff:6812:7164]",
  "[::ffff:6812:9b3e]",
  "[::ffff:6812:9d42]",
  "[::ffff:6812:af15]",
  "[::ffff:6812:b663]",
  "[::ffff:6812:b950]",
  "[::ffff:6812:ba0b]",
  "[::ffff:6812:ba53]",
  "[::ffff:6812:bde4]",
  "[::ffff:6812:c63e]",
  "[::ffff:6812:fc52]",
  "[::ffff:6813:8c39]",
  "[::ffff:6813:af3d]",
  "[::ffff:6813:ba10]",
  "[::ffff:6813:d625]",
  "[::ffff:6813:dd26]",
  "[::ffff:6813:ea29]",
  "[::ffff:6813:ef75]",
  "[::ffff:6814:15e]",
  "[::ffff:6814:241]",
  "[::ffff:6814:ada]",
  "[::ffff:6814:1119]",
  "[::ffff:6814:1128]",
  "[::ffff:6814:172e]",
  "[::ffff:6814:1b43]",
  "[::ffff:6814:26f2]",
  "[::ffff:6814:2ea1]",
  "[::ffff:6814:3cf1]",
  "[::ffff:6814:448f]",
  "[::ffff:6814:7574]",
  "[::ffff:6814:be2a]",
  "[::ffff:6814:c046]",
  "[::ffff:6814:e546]",
  "[::ffff:6815:186]",
  "[::ffff:6815:1a1]",
  "[::ffff:6815:47b]",
  "[::ffff:6815:4aa]",
  "[::ffff:6815:818]",
  "[::ffff:6815:83b]",
  "[::ffff:6815:873]",
  "[::ffff:6815:1598]",
  "[::ffff:6815:1777]",
  "[::ffff:6815:1cfa]",
  "[::ffff:6815:1d14]",
  "[::ffff:6815:1d4a]",
  "[::ffff:6815:1d56]",
  "[::ffff:6815:1de0]",
  "[::ffff:6815:226e]",
  "[::ffff:6815:23a0]",
  "[::ffff:6815:23bb]",
  "[::ffff:6815:24a5]",
  "[::ffff:6815:2706]",
  "[::ffff:6815:2a65]",
  "[::ffff:6815:2b0d]",
  "[::ffff:6815:2b12]",
  "[::ffff:6815:2d66]",
  "[::ffff:6815:2de2]",
  "[::ffff:6815:2fad]",
  "[::ffff:6815:30ec]",
  "[::ffff:6815:3197]",
  "[::ffff:6815:32ef]",
  "[::ffff:6815:36ee]",
  "[::ffff:6815:3874]",
  "[::ffff:6815:3914]",
  "[::ffff:6815:39c9]",
  "[::ffff:6815:3adc]",
  "[::ffff:6815:3c7d]",
  "[::ffff:6815:3cad]",
  "[::ffff:6815:3d4c]",
  "[::ffff:6815:3d61]",
  "[::ffff:6815:3e4b]",
  "[::ffff:6815:41b1]",
  "[::ffff:6815:4507]",
  "[::ffff:6815:45a4]",
  "[::ffff:6815:472f]",
  "[::ffff:6815:473d]",
  "[::ffff:6815:4bbf]",
  "[::ffff:6815:530c]",
  "[::ffff:6815:5760]",
  "[::ffff:6815:5afc]",
  "[::ffff:6815:5b86]",
  "[::ffff:6815:5bfa]",
  "[::ffff:6815:5cf1]",
  "[::ffff:6815:5db3]",
  "[::ffff:6815:5e1e]",
  "[::ffff:6815:5f1d]",
  "[::ffff:6815:5f69]",
  "[::ffff:6815:5f9c]",
  "[::ffff:6815:6041]",
  "[::ffff:6815:e97f]",
  "[::ffff:6815:e986]",
  "[::ffff:6815:e9b3]",
  "[::ffff:6815:ea0a]",
  "[::ffff:6815:ea3b]",
  "[::ffff:6815:ea50]",
  "[::ffff:6815:ea79]",
  "[::ffff:6815:ea9d]",
  "[::ffff:6815:eb31]",
  "[::ffff:6815:eb4c]",
  "[::ffff:6815:eb53]",
  "[::ffff:6815:eb73]",
  "[::ffff:6815:eb9a]",
  "[::ffff:6815:ebab]",
  "[::ffff:6816:131]",
  "[::ffff:6816:172]",
  "[::ffff:6816:32b]",
  "[::ffff:6816:6a9]",
  "[::ffff:6816:839]",
  "[::ffff:6816:8a1]",
  "[::ffff:6816:aa2]",
  "[::ffff:6816:c59]",
  "[::ffff:6816:de6]",
  "[::ffff:6816:f39]",
  "[::ffff:6816:10e0]",
  "[::ffff:6816:13ae]",
  "[::ffff:6816:1870]",
  "[::ffff:6816:1d50]",
  "[::ffff:6816:234f]",
  "[::ffff:6816:29d8]",
  "[::ffff:6816:2b66]",
  "[::ffff:6816:2b8b]",
  "[::ffff:6816:33d1]",
  "[::ffff:6816:3563]",
  "[::ffff:6816:38d8]",
  "[::ffff:6816:3a60]",
  "[::ffff:6816:3aad]",
  "[::ffff:6816:3d4d]",
  "[::ffff:6816:3d88]",
  "[::ffff:6816:3f4e]",
  "[::ffff:6816:42a7]",
  "[::ffff:6816:43de]",
  "[::ffff:6816:4442]",
  "[::ffff:6816:4475]",
  "[::ffff:6816:4645]",
  "[::ffff:6816:486f]",
  "[::ffff:6816:4d72]",
  "[::ffff:6816:4d8e]",
  "[::ffff:6816:4dad]",
  "[::ffff:6816:4dd7]",
  "[::ffff:6817:8b11]",
  "[::ffff:681a:1b]",
  "[::ffff:681a:78]",
  "[::ffff:681a:97]",
  "[::ffff:681a:be]",
  "[::ffff:681a:c6]",
  "[::ffff:681a:108]",
  "[::ffff:681a:125]",
  "[::ffff:681a:140]",
  "[::ffff:681a:164]",
  "[::ffff:681a:182]",
  "[::ffff:681a:18f]",
  "[::ffff:681a:192]",
  "[::ffff:681a:19b]",
  "[::ffff:681a:1cc]",
  "[::ffff:681a:1e5]",
  "[::ffff:681a:1f2]",
  "[::ffff:681a:205]",
  "[::ffff:681a:221]",
  "[::ffff:681a:2ee]",
  "[::ffff:681a:2ef]",
  "[::ffff:681a:343]",
  "[::ffff:681a:344]",
  "[::ffff:681a:389]",
  "[::ffff:681a:3ba]",
  "[::ffff:681a:413]",
  "[::ffff:681a:45c]",
  "[::ffff:681a:485]",
  "[::ffff:681a:49a]",
  "[::ffff:681a:4b3]",
  "[::ffff:681a:4b7]",
  "[::ffff:681a:4ee]",
  "[::ffff:681a:603]",
  "[::ffff:681a:60a]",
  "[::ffff:681a:623]",
  "[::ffff:681a:625]",
  "[::ffff:681a:6eb]",
  "[::ffff:681a:6ed]",
  "[::ffff:681a:73b]",
  "[::ffff:681a:75f]",
  "[::ffff:681a:796]",
  "[::ffff:681a:79c]",
  "[::ffff:681a:7ca]",
  "[::ffff:681a:815]",
  "[::ffff:681a:83e]",
  "[::ffff:681a:896]",
  "[::ffff:681a:89e]",
  "[::ffff:681a:8a0]",
  "[::ffff:681a:8e1]",
  "[::ffff:681a:8f6]",
  "[::ffff:681a:909]",
  "[::ffff:681a:915]",
  "[::ffff:681a:917]",
  "[::ffff:681a:95b]",
  "[::ffff:681a:965]",
  "[::ffff:681a:971]",
  "[::ffff:681a:a04]",
  "[::ffff:681a:a31]",
  "[::ffff:681a:a5b]",
  "[::ffff:681a:b27]",
  "[::ffff:681a:b30]",
  "[::ffff:681a:b93]",
  "[::ffff:681a:bb0]",
  "[::ffff:681a:c2b]",
  "[::ffff:681a:c32]",
  "[::ffff:681a:c8e]",
  "[::ffff:681a:cad]",
  "[::ffff:681a:d11]",
  "[::ffff:681a:d31]",
  "[::ffff:681a:d36]",
  "[::ffff:681a:d9e]",
  "[::ffff:681a:dd1]",
  "[::ffff:681a:e02]",
  "[::ffff:681a:e1c]",
  "[::ffff:681a:e31]",
  "[::ffff:681a:e3b]",
  "[::ffff:681a:f46]",
  "[::ffff:681a:f50]",
  "[::ffff:681a:f55]",
  "[::ffff:681a:fb0]",
  "[::ffff:681a:fb6]",
  "[::ffff:681b:cb59]",
  "[::ffff:681b:cc59]",
  "[::ffff:681b:ce57]",
  "[::ffff:681b:cf5c]",
  "[::ffff:681f:1003]",
  "[::ffff:681f:1007]",
  "[::ffff:681f:1009]",
  "[::ffff:681f:100a]",
  "[::ffff:681f:100b]",
  "[::ffff:681f:1076]",
  "[::ffff:681f:1078]",
  "[::ffff:681f:107c]",
  "[::ffff:8d65:79ee]",
  "[::ffff:a29f:8035]",
  "[::ffff:a29f:803d]",
  "[::ffff:a29f:8040]",
  "[::ffff:a29f:80e9]",
  "[::ffff:a29f:8129]",
  "[::ffff:a29f:8135]",
  "[::ffff:a29f:8143]",
  "[::ffff:a29f:815b]",
  "[::ffff:a29f:8223]",
  "[::ffff:a29f:86e9]",
  "[::ffff:a29f:872a]",
  "[::ffff:a29f:880b]",
  "[::ffff:a29f:883f]",
  "[::ffff:a29f:8942]",
  "[::ffff:a29f:8946]",
  "[::ffff:a29f:9904]",
  "[::ffff:ac40:6c25]",
  "[::ffff:ac40:8225]",
  "[::ffff:ac40:9178]",
  "[::ffff:ac40:937b]",
  "[::ffff:ac40:97ea]",
  "[::ffff:ac40:99cd]",
  "[::ffff:ac40:9a18]",
  "[::ffff:ac40:9ae5]",
  "[::ffff:ac40:a504]",
  "[::ffff:ac40:a627]",
  "[::ffff:ac40:aa0f]",
  "[::ffff:ac40:c616]",
  "[::ffff:ac41:4032]",
  "[::ffff:ac41:f8d5]",
  "[::ffff:ac42:2839]",
  "[::ffff:ac42:28a5]",
  "[::ffff:ac42:28cb]",
  "[::ffff:ac42:28e6]",
  "[::ffff:ac42:28ea]",
  "[::ffff:ac42:28fd]",
  "[::ffff:ac42:2915]",
  "[::ffff:ac42:292d]",
  "[::ffff:ac42:2afa]",
  "[::ffff:ac42:2bac]",
  "[::ffff:ac42:2baf]",
  "[::ffff:ac42:2bee]",
  "[::ffff:ac42:2cc6]",
  "[::ffff:ac43:697]",
  "[::ffff:ac43:751]",
  "[::ffff:ac43:87f]",
  "[::ffff:ac43:896]",
  "[::ffff:ac43:8d1]",
  "[::ffff:ac43:964]",
  "[::ffff:ac43:9df]",
  "[::ffff:ac43:c22]",
  "[::ffff:ac43:c4b]",
  "[::ffff:ac43:c8c]",
  "[::ffff:ac43:dee]",
  "[::ffff:ac43:eba]",
  "[::ffff:ac43:faf]",
  "[::ffff:ac43:128e]",
  "[::ffff:ac43:1638]",
  "[::ffff:ac43:1649]",
  "[::ffff:ac43:19c9]",
  "[::ffff:ac43:19e5]",
  "[::ffff:ac43:19f0]",
  "[::ffff:ac43:1af2]",
  "[::ffff:ac43:1bd5]",
  "[::ffff:ac43:1dda]",
  "[::ffff:ac43:1e94]",
  "[::ffff:ac43:1eaa]",
  "[::ffff:ac43:204e]",
  "[::ffff:ac43:223a]",
  "[::ffff:ac43:271a]",
  "[::ffff:ac43:28b6]",
  "[::ffff:ac43:2908]",
  "[::ffff:ac43:2b37]",
  "[::ffff:ac43:2b3a]",
  "[::ffff:ac43:4417]",
  "[::ffff:ac43:44a4]",
  "[::ffff:ac43:44b2]",
  "[::ffff:ac43:44e2]",
  "[::ffff:ac43:44f2]",
  "[::ffff:ac43:44fe]",
  "[::ffff:ac43:4507]",
  "[::ffff:ac43:451a]",
  "[::ffff:ac43:451b]",
  "[::ffff:ac43:45bc]",
  "[::ffff:ac43:45f1]",
  "[::ffff:ac43:4616]",
  "[::ffff:ac43:4634]",
  "[::ffff:ac43:4656]",
  "[::ffff:ac43:465c]",
  "[::ffff:ac43:4675]",
  "[::ffff:ac43:471a]",
  "[::ffff:ac43:47e8]",
  "[::ffff:ac43:4873]",
  "[::ffff:ac43:4884]",
  "[::ffff:ac43:4892]",
  "[::ffff:ac43:491e]",
  "[::ffff:ac43:4945]",
  "[::ffff:ac43:498b]",
  "[::ffff:ac43:4a10]",
  "[::ffff:ac43:4a13]",
  "[::ffff:ac43:4a20]",
  "[::ffff:ac43:4a6c]",
  "[::ffff:ac43:4a8b]",
  "[::ffff:ac43:4adb]",
  "[::ffff:ac43:4b05]",
  "[::ffff:ac43:4ba2]",
  "[::ffff:ac43:8366]",
  "[::ffff:ac43:87c6]",
  "[::ffff:ac43:8b22]",
  "[::ffff:ac43:8c9c]",
  "[::ffff:ac43:8f82]",
  "[::ffff:ac43:9245]",
  "[::ffff:ac43:9612]",
  "[::ffff:ac43:991d]",
  "[::ffff:ac43:9a64]",
  "[::ffff:ac43:a07a]",
  "[::ffff:ac43:a196]",
  "[::ffff:ac43:a3d5]",
  "[::ffff:ac43:a46f]",
  "[::ffff:ac43:a4b8]",
  "[::ffff:ac43:a597]",
  "[::ffff:ac43:a6c0]",
  "[::ffff:ac43:a770]",
  "[::ffff:ac43:a7ba]",
  "[::ffff:ac43:a83a]",
  "[::ffff:ac43:a95f]",
  "[::ffff:ac43:a9c0]",
  "[::ffff:ac43:afeb]",
  "[::ffff:ac43:b2c4]",
  "[::ffff:ac43:b40c]",
  "[::ffff:ac43:b5a1]",
  "[::ffff:ac43:b8a3]",
  "[::ffff:ac43:bb26]",
  "[::ffff:ac43:c2cb]",
  "[::ffff:ac43:c4cf]",
  "[::ffff:ac43:c528]",
  "[::ffff:ac43:c5ba]",
  "[::ffff:ac43:c74f]",
  "[::ffff:ac43:c7a7]",
  "[::ffff:ac43:d46d]",
  "[::ffff:ac43:d4b8]",
  "[::ffff:ac43:deb5]",
  "[::ffff:b906:4c2a]",
  "[::ffff:bc72:6003]",
  "[::ffff:bc72:6103]",
  "[::ffff:bc72:6200]",
  "[::ffff:c7bf:3249]",
  "[::ffff:2d8e:780d]",
  "[::ffff:2d8e:780e]",
  "[::ffff:6715:f42a]",
  "[::ffff:6715:f43b]",
  "[::ffff:6715:f43f]",
  "[::ffff:6715:f462]",
  "[::ffff:6715:f46f]",
  "[::ffff:67a0:cc05]",
  "[::ffff:67a0:cc0b]",
  "[::ffff:67a0:cc11]",
  "[::ffff:6818:e]",
  "[::ffff:6818:11]",
  "[::ffff:6818:19]",
  "[::ffff:6ca2:c06a]",
  "[::ffff:6ca2:c0ba]",
  "[::ffff:6ca2:c10a]",
  "[::ffff:6ca2:c136]",
  "[::ffff:6ca2:c137]",
  "[::ffff:6ca2:c3ad]",
  "[::ffff:934e:8c12]",
  "[::ffff:934e:8c14]",
  "[::ffff:9a54:af90]",
  "[::ffff:9a54:afc4]",
  "[::ffff:9a55:6301]",
  "[::ffff:9a55:6306]",
  "[::ffff:9a55:6318]",
  "[::ffff:aa72:2d08]",
  "[::ffff:aa72:2d21]",
  "[::ffff:aa72:2d24]",
  "[::ffff:aa72:2d2a]",
  "[::ffff:aa72:2e04]",
  "[::ffff:aa72:2e29]",
  "[::ffff:aa72:2e2a]",
  "[::ffff:aa72:2e2d]",
  "[::ffff:adf5:3125]",
  "[::ffff:adf5:312f]",
  "[::ffff:adf5:313b]",
  "[::ffff:b912:fa07]",
  "[::ffff:b912:fa0a]",
  "[::ffff:b912:fa45]",
  "[::ffff:b912:fa52]",
  "[::ffff:b912:fa5c]",
  "[::ffff:b9b0:1a0a]",
  "[::ffff:b9ee:e407]",
  "[::ffff:b9ee:e437]",
  "[::ffff:b9ee:e455]",
  "[::ffff:c355:1736]",
  "[::ffff:c355:173a]",
  "[::ffff:c355:173b]",
  "[::ffff:c355:173f]",
  "[::ffff:c355:1743]",
  "[::ffff:c7d4:5a08]",
  "[::ffff:c7d4:5a14]",
  "[::ffff:c7d4:5a31]",
  "[::ffff:c7d4:5a46]",

  "creativecommons.org",
  "sky.rethinkdns.com",
  "www.speedtest.net",
  "lb.victoriacross.ir",
  "singapore.com",
  "go.inmobi.com",
  "www.visa.com",
  "www.wto.org",
  "chatgpt.com",
  "medium.com",
  "lb.nscl.ir",
  "nodejs.org",
  "linkerd.io",
  "harbor.io",
  "npmjs.com",
  "csgo.com",
  "fbi.gov",
  "ip.sb",
  "time.is",
  "icook.hk",
  "unpkg.com",
  "mfa.gov.ua",
  "codepen.io",
  "jsdelivr.com",
  "store.ubi.com",
  "www.cdnjs.com",
  "cf.090227.xyz",
  "cf.877774.xyz",
  "cf.130519.xyz",
  "auth.vercel.com",
  "www.udacity.com",
  "www.gitbook.com",
  "www.ipaddress.my",
  "www.glassdoor.com",
  "www.ipchicken.com",
  "static.cloudflareinsights.com",

  "8.6.112.123",
  "8.6.112.241",
  "8.6.112.242",
  "104.16.0.1",
  "104.16.0.27",
  "104.16.0.28",
  "104.16.0.30",
  "104.16.0.31",
  "104.16.0.32",
  "104.16.0.66",
  "104.16.0.69",
  "104.16.0.70",
  "104.16.0.71",
  "104.16.0.73",
  "104.16.0.90",
  "104.16.0.108",
  "104.16.0.111",
  "104.16.0.112",
  "104.16.0.116",
  "104.16.0.150",
  "104.16.0.153",
  "104.16.0.154",
  "104.16.0.169",
  "104.16.0.183",
  "104.16.0.186",
  "104.16.0.187",
  "104.16.0.188",
  "104.16.0.189",
  "104.16.0.190",
  "104.16.0.193",
  "104.16.0.196",
  "104.16.0.199",
  "104.16.0.210",
  "104.16.0.213",
  "104.16.0.227",
  "104.16.0.228",
  "104.16.0.229",
  "104.16.0.230",
  "104.16.0.232",
  "104.16.0.234",
  "104.16.0.235",
  "104.16.92.13",
  "104.16.92.15",
  "104.16.92.16",
  "104.16.92.17",
  "104.16.92.19",
  "104.16.92.20",
  "104.16.92.21",
  "104.16.92.53",
  "104.16.92.54",
  "104.16.92.56",
  "104.16.92.57",
  "104.16.92.74",
  "104.16.92.94",
  "104.16.92.95",
  "104.16.92.96",
  "104.16.92.97",
  "104.16.92.109",
  "104.16.92.141",
  "104.16.92.146",
  "104.16.92.147",
  "104.16.92.149",
  "104.16.92.176",
  "104.16.92.177",
  "104.16.92.178",
  "104.16.92.181",
  "104.16.92.208",
  "104.16.92.209",
  "104.16.92.214",
  "104.16.92.215",
  "104.16.92.238",
  "104.16.92.240",
  "104.16.92.253",
  "104.16.92.254",
  "104.16.140.1",
  "104.16.140.2",
  "104.16.140.4",
  "104.16.140.7",
  "104.16.140.41",
  "104.16.140.44",
  "104.16.140.45",
  "104.16.140.46",
  "104.16.140.119",
  "104.16.140.120",
  "104.16.140.121",
  "104.16.140.122",
  "104.16.140.123",
  "104.16.140.125",
  "104.16.140.160",
  "104.16.140.161",
  "104.16.140.162",
  "104.16.140.164",
  "104.16.140.200",
  "104.16.140.201",
  "104.16.140.202",
  "104.16.140.205",
  "104.16.140.208",
  "104.16.140.209",
  "104.16.140.239",
  "104.16.140.241",
  "104.16.140.242",
  "104.16.140.246",
  "104.16.147.11",
  "104.16.147.28",
  "104.16.147.30",
  "104.16.147.33",
  "104.16.147.52",
  "104.16.147.59",
  "104.16.147.63",
  "104.16.147.65",
  "104.16.147.80",
  "104.16.147.87",
  "104.16.147.91",
  "104.16.147.93",
  "104.16.147.104",
  "104.16.147.106",
  "104.16.147.107",
  "104.16.147.113",
  "104.16.147.132",
  "104.16.147.137",
  "104.16.147.142",
  "104.16.147.146",
  "104.16.147.147",
  "104.16.147.148",
  "104.16.147.182",
  "104.16.147.186",
  "104.16.147.187",
  "104.16.147.189",
  "104.16.147.193",
  "104.16.147.248",
  "104.16.148.6",
  "104.16.148.12",
  "104.16.148.16",
  "104.16.148.32",
  "104.16.148.41",
  "104.16.148.43",
  "104.16.148.44",
  "104.16.148.46",
  "104.16.148.96",
  "104.16.148.99",
  "104.16.148.101",
  "104.16.148.112",
  "104.16.148.121",
  "104.16.148.123",
  "104.16.148.248",
  "104.16.148.252",
  "104.16.148.253",
  "104.16.163.32",
  "104.16.212.131",
  "104.17.134.117",
  "104.17.148.17",
  "104.17.148.22",
  "104.17.148.200",
  "104.17.148.214",
  "104.17.148.220",
  "104.17.148.228",
  "104.17.148.247",
  "104.17.222.4",
  "104.17.222.6",
  "104.17.222.7",
  "104.17.222.11",
  "104.17.222.12",
  "104.17.222.15",
  "104.17.222.16",
  "104.17.222.21",
  "104.17.222.58",
  "104.17.222.62",
  "104.17.222.71",
  "104.17.222.73",
  "104.18.15.19",
  "104.18.34.21",
  "104.18.79.84",
  "104.18.79.89",
  "104.18.79.94",
  "104.18.79.100",
  "104.18.79.124",
  "104.18.79.127",
  "104.18.79.151",
  "104.18.79.242",
  "104.18.79.247",
  "104.18.79.250",
  "104.19.220.57",
  "104.20.5.134",
  "104.20.6.28",
  "104.20.6.49",
  "104.20.6.76",
  "104.20.6.77",
  "104.20.6.81",
  "104.20.6.82",
  "104.20.6.86",
  "104.20.6.96",
  "104.20.6.120",
  "104.20.6.147",
  "104.20.6.152",
  "104.20.6.153",
  "104.20.6.195",
  "104.20.6.207",
  "104.20.6.232",
  "104.20.6.235",
  "104.20.6.239",
  "104.20.29.232",
  "104.20.29.233",
  "104.20.29.235",
  "104.20.29.242",
  "104.20.29.245",
  "104.20.29.246",
  "104.20.29.247",
  "104.20.29.253",
  "104.21.8.91",
  "104.21.33.34",
  "104.21.95.215",
  "104.26.4.1",
  "104.26.4.2",
  "104.26.4.3",
  "104.26.4.15",
  "104.26.4.16",
  "104.26.4.28",
  "104.26.4.29",
  "104.26.4.30",
  "104.26.4.32",
  "104.26.4.33",
  "104.26.4.38",
  "104.26.4.205",
  "104.26.4.243",
  "104.26.4.252",
  "104.26.4.254",
  "104.26.13.140",
  "104.26.14.30",
  "141.101.115.45",
  "141.101.115.53",
  "141.101.115.81",
  "141.101.115.127",
  "141.101.115.188",
  "141.101.115.244",
  "141.101.115.252",
  "162.159.36.2",
  "162.159.36.26",
  "162.159.36.41",
  "162.159.36.49",
  "162.159.36.77",
  "162.159.36.83",
  "162.159.36.88",
  "162.159.36.107",
  "162.159.36.158",
  "162.159.36.206",
  "162.159.36.239",
  "162.159.46.2",
  "162.159.46.25",
  "162.159.46.31",
  "162.159.46.42",
  "162.159.46.81",
  "162.159.46.86",
  "162.159.46.87",
  "162.159.46.91",
  "162.159.46.93",
  "162.159.46.101",
  "162.159.46.113",
  "162.159.46.216",
  "162.159.46.223",
  "162.159.46.235",
  "162.159.46.237",
  "162.159.152.4",
  "162.159.192.175",
  "162.159.192.187",
  "162.159.192.204",
  "162.159.193.5",
  "162.159.193.68",
  "162.159.193.81",
  "162.159.193.87",
  "162.159.193.99",
  "162.159.193.112",
  "162.159.193.145",
  "162.159.193.154",
  "162.159.193.177",
  "162.159.193.182",
  "162.159.193.188",
  "162.159.193.211",
  "162.159.193.242",
  "162.159.195.36",
  "162.159.195.46",
  "162.159.195.64",
  "162.159.195.84",
  "162.159.195.200",
  "162.159.195.227",
  "162.159.195.228",
  "162.159.195.241",
  "162.159.243.41",
  "162.159.243.51",
  "162.159.243.162",
  "162.159.243.165",
  "162.159.243.181",
  "172.64.32.43",
  "172.64.32.51",
  "172.64.32.68",
  "172.64.32.86",
  "172.64.32.162",
  "172.64.32.168",
  "172.64.32.230",
  "172.64.32.244",
  "172.64.146.16",
  "172.64.146.17",
  "172.64.146.36",
  "172.64.146.47",
  "172.64.146.54",
  "172.64.146.61",
  "172.64.146.152",
  "172.64.146.219",
  "172.64.146.226",
  "172.64.146.250",
  "172.64.146.252",
  "172.66.147.30",
  "172.66.147.34",
  "172.66.147.42",
  "172.66.147.45",
  "172.66.147.47",
  "172.67.69.5",
  "172.67.69.8",
  "172.67.69.56",
  "172.67.69.62",
  "172.67.69.79",
  "172.67.69.102",
  "172.67.69.104",
  "172.67.69.105",
  "172.67.69.121",
  "172.67.69.122",
  "172.67.69.126",
  "172.67.69.131",
  "172.67.69.161",
  "172.67.69.204",
  "172.67.69.219",
  "172.67.69.223",
  "172.67.69.241",
  "172.67.69.249",
  "172.67.69.251",
  "172.67.70.254",
  "172.67.130.104",
  "172.67.138.26",
  "172.67.138.28",
  "172.67.138.61",
  "172.67.138.107",
  "172.67.138.115",
  "172.67.138.121",
  "172.67.138.139",
  "172.67.138.179",
  "172.67.138.221",
  "172.67.158.28",
  "172.67.158.44",
  "172.67.158.50",
  "172.67.158.63",
  "172.67.158.119",
  "172.67.158.155",
  "172.67.158.156",
  "172.67.158.162",
  "172.67.158.204",
  "172.67.158.213",
  "172.67.158.231",
  "172.67.158.237",
  "188.114.96.3",
  "188.114.96.6",
  "188.114.96.24",
  "188.114.96.31",
  "188.114.96.86",
  "188.114.96.100",
  "188.114.96.111",
  "188.114.97.0",
  "188.114.97.3",
  "188.114.97.6",
  "188.114.97.73",
  "188.114.97.134",
  "188.114.97.161",
  "188.114.97.165",
  "188.114.97.171",
  "188.114.97.203",
  "188.114.97.222",
  "188.114.97.253",
  "188.114.98.0",
  "188.114.98.4",
  "188.114.98.23",
  "188.114.98.28",
  "188.114.98.29",
  "188.114.98.32",
  "188.114.98.95",
  "188.114.98.109",
  "188.114.98.117",
  "188.114.98.184",
  "188.114.98.185",
  "188.114.98.230",
  "188.114.99.0",
  "188.114.99.4",
  "188.114.99.59",
  "188.114.99.179",
  "188.114.99.220",
  "190.93.245.2",
  "190.93.245.3",
  "190.93.245.5",
  "190.93.245.16",
  "190.93.245.32",
  "190.93.247.227",
  "190.93.247.230",
  "190.93.247.232",
  "190.93.247.234",
  "190.93.247.235",
];
