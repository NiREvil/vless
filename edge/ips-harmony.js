/**
 * Harmony - VLESS Subscription Generator for Cloudflare Workers
 * - Last Update: Mon, November 11, 2025, 04:20 UTC.
 * - https://github.com/NiREvil/Harmony
 * 
 * This worker builds a V2Ray subscription link with the ability to automatically add 
 * Cloudflare clean IPs to your VLESS configurations.
 * 
 * HOW IT WORKS:
 * 1. Create one VLESS config using any method/tool you prefer
 * 2. Extract the UUID and hostname from your config
 * 3. Replace the values in USER_SETTINGS object:
 *    - UUID in line 32
 *    - Hostname in each group's "host" parameter (lines 55, 69, 83)
 *    - SNI in each group's "sni" parameter (lines 56 70, 84)
 * 4. Deploy this worker and use the worker URL as your subscription link
 * 5. Every time you click "Update" in your client, fresh clean IPs are automatically injected
 * 
 * FEATURES:
 * - Generates 30 VLESS configs (10 per group by default, customizable via ipCount line 35.)
 * - Supports both TLS and non-TLS configurations
 * - Auto-fetches clean Cloudflare IPs from multiple sources
 * - Fake subscription info for client compatibility
 * - Randomizable paths and SNI for better censorship resistance
 * 
 * We are all REvil
 */

// ——— USER CONFIGURATION SECTION ———
const USER_SETTINGS = {
  // Your UUID - Replace with your own UUID
  uuid: "2210f3f0-513d-4d17-9ce2-c094d2f54580",

  // Number of configs (IPs) per group
  ipCount: 10,

  // Early Data settings (optional) - Advanced feature for performance optimization
  ed: "2560",
  eh: "Sec-WebSocket-Protocol",

   // ——— Configuration Groups ———
  /** 
   * - You can add, remove, or modify groups as needed
   * - Each group can have different settings for hosts, ports, TLS, etc.
   * 
   * Available Clean IP Source options:
   *   - "static": Uses manually defined IPs from the staticIPs array
   *   - "dynamic1": Fetches IPs from NiREvil's GitHub repository
   *   - "dynamic2": Fetches IPs from strawberry API
   */
  groups: [
    {
      // ——— Group 1: TLS Configuration ———
      name: "| HAЯMOИY ᵀᴸˢ |",
      host: "index.forexample.workers.dev",
      sni: "index.forexample.workers.dev",
      path: "/random:16", // Path with 16 random characters
      tls: true,
      allowInsecure: true,
      ports: ["443", "8443", "2053", "2083", "2087", "2096"], // Standard cloudflare TLS ports
      alpn: "http/1.1", // Application-layer protocol negotiation (websocket only support http/1.1)
      fp: ["chrome"], // Client fingerprint (currently only chrome works reliably)
      dataSource: "static", // Use static IPs
      randomizeSni: true // Set to true to randomize SNI character casing
    },
    {
      // ——— Group 2: Non-TLS Configuration (TCP), ONLY Workers, No pages.dev ———
      name: "| HAЯMOИY ᵀᶜᴾ |",
      host: "index.forexample.workers.dev",
      sni: "", // Must be empty for non-TLS
      path: "/random:16",
      tls: false,
      allowInsecure: false,
      ports: ["80", "8080", "8880", "2052", "2082", "2086", "2095"], // Standard cloudflare HTTP ports
      alpn: "", // Must be empty for non-TLS
      fp: ["chrome"],
      dataSource: "dynamic1", // Use the first IP source
      randomizeSni: false
    },
    {
      // ——— Group 3: Alternative TLS Configuration ———
      name: "| HAЯMOИY ᴱᴹˢ |",
      host: "index.forexample.workers.dev",
      sni: "index.forexample.workers.dev",
      path: "/random:12?ed=2048", // Fixed path value optimized for xray core
      tls: true,
      allowInsecure: true,
      ports: ["443", "8443", "2053"],
      alpn: "http/1.1",
      fp: ["chrome"],
      dataSource: "dynamic2", // Use the second IP source
      randomizeSni: true
    }
  ]
};

 // ——— IP DATA SOURCES ———
/**
 * Static IP list - Manually defined IPs and domains
 * You can add or remove IPs as needed
 */
const staticIPs = [
  '[::ffff:be5d:f6f1]',
  '[::ffff:5fb3:83ef]',
  '[::ffff:8d0:1652]',
  '[::ffff:8d0:1925]',
  '[::ffff:8d0:aa9]',
  '[::ffff:c629:df08]',
  '[::ffff:c629:c411]',
  '[::ffff:6812:c8dc]',
  '[::ffff:4044:c001]',
  '[::ffff:42eb:c8fd]',
  '[::ffff:a29f:2023]',
  '[::ffff:6813:13b]',
  '[::ffff:c629:c7a6]',
  '[::ffff:8d65:7159]',
  '[::ffff:6814:e7d2]',
  '[::ffff:adf5:3a22]',
  '[::ffff:681f:1041]',
  '[::ffff:681f:106d]',
  '[::ffff:6815:d34a]',
  '[::ffff:54f:5972]',
  '[::ffff:d34:54aa]',
  '[::ffff:de1:4e1b]',
  '[::ffff:34d8:8222]',
  '[::ffff:40ff:dcc3]',
  '[::ffff:4109:426f]',
  '[::ffff:6810:31f]',
  '[::ffff:6810:631]',
  '[::ffff:6810:1512]',
  '[::ffff:6810:2b61]',
  '[::ffff:6810:2eb6]',
  '[::ffff:6810:3530]',
  '[::ffff:6810:3734]',
  '[::ffff:6810:3b36]',
  '[::ffff:6810:4425]',
  '[::ffff:6810:5c53]',
  '[::ffff:6810:640d]',
  '[::ffff:6810:650c]',
  '[::ffff:6810:6957]',
  '[::ffff:6810:7666]',
  '[::ffff:6810:7961]',
  '[::ffff:6810:7a5b]',
  '[::ffff:6810:85e5]',
  '[::ffff:6810:8d34]',
  '[::ffff:6810:9a47]',
  '[::ffff:6810:9b24]',
  '[::ffff:6810:ae38]',
  '[::ffff:6810:b02c]',
  '[::ffff:6810:b2be]',
  '[::ffff:6810:b44f]',
  '[::ffff:6810:b50f]',
  '[::ffff:6810:b52d]',
  '[::ffff:6810:bcad]',
  '[::ffff:6810:c019]',
  '[::ffff:6810:c1e2]',
  '[::ffff:6810:d047]',
  '[::ffff:6810:df6b]',
  '[::ffff:6810:e20a]',
  '[::ffff:6810:e233]',
  '[::ffff:6810:e248]',
  '[::ffff:6810:e25b]',
  '[::ffff:6810:ed29]',
  '[::ffff:6810:ef41]',
  '[::ffff:6810:f51c]',
  '[::ffff:6811:2069]',
  '[::ffff:6811:324a]',
  '[::ffff:6811:4a5b]',
  '[::ffff:6811:5137]',
  '[::ffff:6811:5559]',
  '[::ffff:6811:5833]',
  '[::ffff:6811:5a33]',
  '[::ffff:6811:5a6d]',
  '[::ffff:6811:5d2f]',
  '[::ffff:6811:600d]',
  '[::ffff:6811:6205]',
  '[::ffff:6811:6e0c]',
  '[::ffff:6811:71bc]',
  '[::ffff:6811:7233]',
  '[::ffff:6811:7d12]',
  '[::ffff:6811:8560]',
  '[::ffff:6811:8cba]',
  '[::ffff:6811:a32f]',
  '[::ffff:6811:b742]',
  '[::ffff:6811:bc66]',
  '[::ffff:6811:c439]',
  '[::ffff:6811:d451]',
  '[::ffff:6811:d90f]',
  '[::ffff:6811:e94f]',
  '[::ffff:6812:2]',
  '[::ffff:6812:24]',
  '[::ffff:6812:b5]',
  '[::ffff:6812:132]',
  '[::ffff:6812:199]',
  '[::ffff:6812:19a]',
  '[::ffff:6812:1a9]',
  '[::ffff:6812:245]',
  '[::ffff:6812:275]',
  '[::ffff:6812:277]',
  '[::ffff:6812:39d]',
  '[::ffff:6812:429]',
  '[::ffff:6812:42b]',
  '[::ffff:6812:49e]',
  '[::ffff:6812:5b6]',
  '[::ffff:6812:637]',
  '[::ffff:6812:668]',
  '[::ffff:6812:6e4]',
  '[::ffff:6812:724]',
  '[::ffff:6812:735]',
  '[::ffff:6812:772]',
  '[::ffff:6812:7b7]',
  '[::ffff:6812:7eb]',
  '[::ffff:6812:80d]',
  '[::ffff:6812:880]',
  '[::ffff:6812:8d1]',
  '[::ffff:6812:8f9]',
  '[::ffff:6812:90a]',
  '[::ffff:6812:914]',
  '[::ffff:6812:965]',
  '[::ffff:6812:986]',
  '[::ffff:6812:996]',
  '[::ffff:6812:9f1]',
  '[::ffff:6812:a07]',
  '[::ffff:6812:b27]',
  '[::ffff:6812:b3f]',
  '[::ffff:6812:b80]',
  '[::ffff:6812:b88]',
  '[::ffff:6812:b95]',
  '[::ffff:6812:c5c]',
  '[::ffff:6812:c96]',
  '[::ffff:6812:cd4]',
  '[::ffff:6812:cd9]',
  '[::ffff:6812:d3c]',
  '[::ffff:6812:f10]',
  '[::ffff:6812:f3c]',
  '[::ffff:6812:f72]',
  '[::ffff:6812:fe5]',
  '[::ffff:6812:101c]',
  '[::ffff:6812:10b0]',
  '[::ffff:6812:10d2]',
  '[::ffff:6812:118c]',
  '[::ffff:6812:11b5]',
  '[::ffff:6812:11bd]',
  '[::ffff:6812:11f3]',
  '[::ffff:6812:124f]',
  '[::ffff:6812:1285]',
  '[::ffff:6812:12b3]',
  '[::ffff:6812:12da]',
  '[::ffff:6812:12de]',
  '[::ffff:6812:143e]',
  '[::ffff:6812:154e]',
  '[::ffff:6812:1562]',
  '[::ffff:6812:1598]',
  '[::ffff:6812:15e4]',
  '[::ffff:6812:16d0]',
  '[::ffff:6812:1734]',
  '[::ffff:6812:1836]',
  '[::ffff:6812:1880]',
  '[::ffff:6812:1987]',
  '[::ffff:6812:1997]',
  '[::ffff:6812:1af8]',
  '[::ffff:6812:1bbd]',
  '[::ffff:6812:1bc0]',
  '[::ffff:6812:1bc8]',
  '[::ffff:6812:1c6d]',
  '[::ffff:6812:1c70]',
  '[::ffff:6812:1cd1]',
  '[::ffff:6812:1cdb]',
  '[::ffff:6812:1dad]',
  '[::ffff:6812:1dd5]',
  '[::ffff:6812:1e4c]',
  '[::ffff:6812:1e9d]',
  '[::ffff:6812:1ee1]',
  '[::ffff:6812:1fdd]',
  '[::ffff:6812:2199]',
  '[::ffff:6812:21f5]',
  '[::ffff:6812:2231]',
  '[::ffff:6812:287a]',
  '[::ffff:6812:46d6]',
  '[::ffff:6812:5aed]',
  '[::ffff:6812:5f48]',
  '[::ffff:6812:685b]',
  '[::ffff:6812:6894]',
  '[::ffff:6812:7164]',
  '[::ffff:6812:9b3e]',
  '[::ffff:6812:9d42]',
  '[::ffff:6812:af15]',
  '[::ffff:6812:b663]',
  '[::ffff:6812:b950]',
  '[::ffff:6812:ba0b]',
  '[::ffff:6812:ba53]',
  '[::ffff:6812:bde4]',
  '[::ffff:6812:c63e]',
  '[::ffff:6812:fc52]',
  '[::ffff:6813:8c39]',
  '[::ffff:6813:af3d]',
  '[::ffff:6813:ba10]',
  '[::ffff:6813:d625]',
  '[::ffff:6813:dd26]',
  '[::ffff:6813:ea29]',
  '[::ffff:6813:ef75]',
  '[::ffff:6814:15e]',
  '[::ffff:6814:241]',
  '[::ffff:6814:ada]',
  '[::ffff:6814:1119]',
  '[::ffff:6814:1128]',
  '[::ffff:6814:172e]',
  '[::ffff:6814:1b43]',
  '[::ffff:6814:26f2]',
  '[::ffff:6814:2ea1]',
  '[::ffff:6814:3cf1]',
  '[::ffff:6814:448f]',
  '[::ffff:6814:7574]',
  '[::ffff:6814:be2a]',
  '[::ffff:6814:c046]',
  '[::ffff:6814:e546]',
  '[::ffff:6815:186]',
  '[::ffff:6815:1a1]',
  '[::ffff:6815:47b]',
  '[::ffff:6815:4aa]',
  '[::ffff:6815:818]',
  '[::ffff:6815:83b]',
  '[::ffff:6815:873]',
  '[::ffff:6815:1598]',
  '[::ffff:6815:1777]',
  '[::ffff:6815:1cfa]',
  '[::ffff:6815:1d14]',
  '[::ffff:6815:1d4a]',
  '[::ffff:6815:1d56]',
  '[::ffff:6815:1de0]',
  '[::ffff:6815:226e]',
  '[::ffff:6815:23a0]',
  '[::ffff:6815:23bb]',
  '[::ffff:6815:24a5]',
  '[::ffff:6815:2706]',
  '[::ffff:6815:2a65]',
  '[::ffff:6815:2b0d]',
  '[::ffff:6815:2b12]',
  '[::ffff:6815:2d66]',
  '[::ffff:6815:2de2]',
  '[::ffff:6815:2fad]',
  '[::ffff:6815:30ec]',
  '[::ffff:6815:3197]',
  '[::ffff:6815:32ef]',
  '[::ffff:6815:36ee]',
  '[::ffff:6815:3874]',
  '[::ffff:6815:3914]',
  '[::ffff:6815:39c9]',
  '[::ffff:6815:3adc]',
  '[::ffff:6815:3c7d]',
  '[::ffff:6815:3cad]',
  '[::ffff:6815:3d4c]',
  '[::ffff:6815:3d61]',
  '[::ffff:6815:3e4b]',
  '[::ffff:6815:41b1]',
  '[::ffff:6815:4507]',
  '[::ffff:6815:45a4]',
  '[::ffff:6815:472f]',
  '[::ffff:6815:473d]',
  '[::ffff:6815:4bbf]',
  '[::ffff:6815:530c]',
  '[::ffff:6815:5760]',
  '[::ffff:6815:5afc]',
  '[::ffff:6815:5b86]',
  '[::ffff:6815:5bfa]',
  '[::ffff:6815:5cf1]',
  '[::ffff:6815:5db3]',
  '[::ffff:6815:5e1e]',
  '[::ffff:6815:5f1d]',
  '[::ffff:6815:5f69]',
  '[::ffff:6815:5f9c]',
  '[::ffff:6815:6041]',
  '[::ffff:6815:e97f]',
  '[::ffff:6815:e986]',
  '[::ffff:6815:e9b3]',
  '[::ffff:6815:ea0a]',
  '[::ffff:6815:ea3b]',
  '[::ffff:6815:ea50]',
  '[::ffff:6815:ea79]',
  '[::ffff:6815:ea9d]',
  '[::ffff:6815:eb31]',
  '[::ffff:6815:eb4c]',
  '[::ffff:6815:eb53]',
  '[::ffff:6815:eb73]',
  '[::ffff:6815:eb9a]',
  '[::ffff:6815:ebab]',
  '[::ffff:6816:131]',
  '[::ffff:6816:172]',
  '[::ffff:6816:32b]',
  '[::ffff:6816:6a9]',
  '[::ffff:6816:839]',
  '[::ffff:6816:8a1]',
  '[::ffff:6816:aa2]',
  '[::ffff:6816:c59]',
  '[::ffff:6816:de6]',
  '[::ffff:6816:f39]',
  '[::ffff:6816:10e0]',
  '[::ffff:6816:13ae]',
  '[::ffff:6816:1870]',
  '[::ffff:6816:1d50]',
  '[::ffff:6816:234f]',
  '[::ffff:6816:29d8]',
  '[::ffff:6816:2b66]',
  '[::ffff:6816:2b8b]',
  '[::ffff:6816:33d1]',
  '[::ffff:6816:3563]',
  '[::ffff:6816:38d8]',
  '[::ffff:6816:3a60]',
  '[::ffff:6816:3aad]',
  '[::ffff:6816:3d4d]',
  '[::ffff:6816:3d88]',
  '[::ffff:6816:3f4e]',
  '[::ffff:6816:42a7]',
  '[::ffff:6816:43de]',
  '[::ffff:6816:4442]',
  '[::ffff:6816:4475]',
  '[::ffff:6816:4645]',
  '[::ffff:6816:486f]',
  '[::ffff:6816:4d72]',
  '[::ffff:6816:4d8e]',
  '[::ffff:6816:4dad]',
  '[::ffff:6816:4dd7]',
  '[::ffff:6817:8b11]',
  '[::ffff:681a:1b]',
  '[::ffff:681a:78]',
  '[::ffff:681a:97]',
  '[::ffff:681a:be]',
  '[::ffff:681a:c6]',
  '[::ffff:681a:108]',
  '[::ffff:681a:125]',
  '[::ffff:681a:140]',
  '[::ffff:681a:164]',
  '[::ffff:681a:182]',
  '[::ffff:681a:18f]',
  '[::ffff:681a:192]',
  '[::ffff:681a:19b]',
  '[::ffff:681a:1cc]',
  '[::ffff:681a:1e5]',
  '[::ffff:681a:1f2]',
  '[::ffff:681a:205]',
  '[::ffff:681a:221]',
  '[::ffff:681a:2ee]',
  '[::ffff:681a:2ef]',
  '[::ffff:681a:343]',
  '[::ffff:681a:344]',
  '[::ffff:681a:389]',
  '[::ffff:681a:3ba]',
  '[::ffff:681a:413]',
  '[::ffff:681a:45c]',
  '[::ffff:681a:485]',
  '[::ffff:681a:49a]',
  '[::ffff:681a:4b3]',
  '[::ffff:681a:4b7]',
  '[::ffff:681a:4ee]',
  '[::ffff:681a:603]',
  '[::ffff:681a:60a]',
  '[::ffff:681a:623]',
  '[::ffff:681a:625]',
  '[::ffff:681a:6eb]',
  '[::ffff:681a:6ed]',
  '[::ffff:681a:73b]',
  '[::ffff:681a:75f]',
  '[::ffff:681a:796]',
  '[::ffff:681a:79c]',
  '[::ffff:681a:7ca]',
  '[::ffff:681a:815]',
  '[::ffff:681a:83e]',
  '[::ffff:681a:896]',
  '[::ffff:681a:89e]',
  '[::ffff:681a:8a0]',
  '[::ffff:681a:8e1]',
  '[::ffff:681a:8f6]',
  '[::ffff:681a:909]',
  '[::ffff:681a:915]',
  '[::ffff:681a:917]',
  '[::ffff:681a:95b]',
  '[::ffff:681a:965]',
  '[::ffff:681a:971]',
  '[::ffff:681a:a04]',
  '[::ffff:681a:a31]',
  '[::ffff:681a:a5b]',
  '[::ffff:681a:b27]',
  '[::ffff:681a:b30]',
  '[::ffff:681a:b93]',
  '[::ffff:681a:bb0]',
  '[::ffff:681a:c2b]',
  '[::ffff:681a:c32]',
  '[::ffff:681a:c8e]',
  '[::ffff:681a:cad]',
  '[::ffff:681a:d11]',
  '[::ffff:681a:d31]',
  '[::ffff:681a:d36]',
  '[::ffff:681a:d9e]',
  '[::ffff:681a:dd1]',
  '[::ffff:681a:e02]',
  '[::ffff:681a:e1c]',
  '[::ffff:681a:e31]',
  '[::ffff:681a:e3b]',
  '[::ffff:681a:f46]',
  '[::ffff:681a:f50]',
  '[::ffff:681a:f55]',
  '[::ffff:681a:fb0]',
  '[::ffff:681a:fb6]',
  '[::ffff:681b:cb59]',
  '[::ffff:681b:cc59]',
  '[::ffff:681b:ce57]',
  '[::ffff:681b:cf5c]',
  '[::ffff:681f:1003]',
  '[::ffff:681f:1007]',
  '[::ffff:681f:1009]',
  '[::ffff:681f:100a]',
  '[::ffff:681f:100b]',
  '[::ffff:681f:1076]',
  '[::ffff:681f:1078]',
  '[::ffff:681f:107c]',
  '[::ffff:8d65:79ee]',
  '[::ffff:a29f:8035]',
  '[::ffff:a29f:803d]',
  '[::ffff:a29f:8040]',
  '[::ffff:a29f:80e9]',
  '[::ffff:a29f:8129]',
  '[::ffff:a29f:8135]',
  '[::ffff:a29f:8143]',
  '[::ffff:a29f:815b]',
  '[::ffff:a29f:8223]',
  '[::ffff:a29f:86e9]',
  '[::ffff:a29f:872a]',
  '[::ffff:a29f:880b]',
  '[::ffff:a29f:883f]',
  '[::ffff:a29f:8942]',
  '[::ffff:a29f:8946]',
  '[::ffff:a29f:9904]',
  '[::ffff:ac40:6c25]',
  '[::ffff:ac40:8225]',
  '[::ffff:ac40:9178]',
  '[::ffff:ac40:937b]',
  '[::ffff:ac40:97ea]',
  '[::ffff:ac40:99cd]',
  '[::ffff:ac40:9a18]',
  '[::ffff:ac40:9ae5]',
  '[::ffff:ac40:a504]',
  '[::ffff:ac40:a627]',
  '[::ffff:ac40:aa0f]',
  '[::ffff:ac40:c616]',
  '[::ffff:ac41:4032]',
  '[::ffff:ac41:f8d5]',
  '[::ffff:ac42:2839]',
  '[::ffff:ac42:28a5]',
  '[::ffff:ac42:28cb]',
  '[::ffff:ac42:28e6]',
  '[::ffff:ac42:28ea]',
  '[::ffff:ac42:28fd]',
  '[::ffff:ac42:2915]',
  '[::ffff:ac42:292d]',
  '[::ffff:ac42:2afa]',
  '[::ffff:ac42:2bac]',
  '[::ffff:ac42:2baf]',
  '[::ffff:ac42:2bee]',
  '[::ffff:ac42:2cc6]',
  '[::ffff:ac43:697]',
  '[::ffff:ac43:751]',
  '[::ffff:ac43:87f]',
  '[::ffff:ac43:896]',
  '[::ffff:ac43:8d1]',
  '[::ffff:ac43:964]',
  '[::ffff:ac43:9df]',
  '[::ffff:ac43:c22]',
  '[::ffff:ac43:c4b]',
  '[::ffff:ac43:c8c]',
  '[::ffff:ac43:dee]',
  '[::ffff:ac43:eba]',
  '[::ffff:ac43:faf]',
  '[::ffff:ac43:128e]',
  '[::ffff:ac43:1638]',
  '[::ffff:ac43:1649]',
  '[::ffff:ac43:19c9]',
  '[::ffff:ac43:19e5]',
  '[::ffff:ac43:19f0]',
  '[::ffff:ac43:1af2]',
  '[::ffff:ac43:1bd5]',
  '[::ffff:ac43:1dda]',
  '[::ffff:ac43:1e94]',
  '[::ffff:ac43:1eaa]',
  '[::ffff:ac43:204e]',
  '[::ffff:ac43:223a]',
  '[::ffff:ac43:271a]',
  '[::ffff:ac43:28b6]',
  '[::ffff:ac43:2908]',
  '[::ffff:ac43:2b37]',
  '[::ffff:ac43:2b3a]',
  '[::ffff:ac43:4417]',
  '[::ffff:ac43:44a4]',
  '[::ffff:ac43:44b2]',
  '[::ffff:ac43:44e2]',
  '[::ffff:ac43:44f2]',
  '[::ffff:ac43:44fe]',
  '[::ffff:ac43:4507]',
  '[::ffff:ac43:451a]',
  '[::ffff:ac43:451b]',
  '[::ffff:ac43:45bc]',
  '[::ffff:ac43:45f1]',
  '[::ffff:ac43:4616]',
  '[::ffff:ac43:4634]',
  '[::ffff:ac43:4656]',
  '[::ffff:ac43:465c]',
  '[::ffff:ac43:4675]',
  '[::ffff:ac43:471a]',
  '[::ffff:ac43:47e8]',
  '[::ffff:ac43:4873]',
  '[::ffff:ac43:4884]',
  '[::ffff:ac43:4892]',
  '[::ffff:ac43:491e]',
  '[::ffff:ac43:4945]',
  '[::ffff:ac43:498b]',
  '[::ffff:ac43:4a10]',
  '[::ffff:ac43:4a13]',
  '[::ffff:ac43:4a20]',
  '[::ffff:ac43:4a6c]',
  '[::ffff:ac43:4a8b]',
  '[::ffff:ac43:4adb]',
  '[::ffff:ac43:4b05]',
  '[::ffff:ac43:4ba2]',
  '[::ffff:ac43:8366]',
  '[::ffff:ac43:87c6]',
  '[::ffff:ac43:8b22]',
  '[::ffff:ac43:8c9c]',
  '[::ffff:ac43:8f82]',
  '[::ffff:ac43:9245]',
  '[::ffff:ac43:9612]',
  '[::ffff:ac43:991d]',
  '[::ffff:ac43:9a64]',
  '[::ffff:ac43:a07a]',
  '[::ffff:ac43:a196]',
  '[::ffff:ac43:a3d5]',
  '[::ffff:ac43:a46f]',
  '[::ffff:ac43:a4b8]',
  '[::ffff:ac43:a597]',
  '[::ffff:ac43:a6c0]',
  '[::ffff:ac43:a770]',
  '[::ffff:ac43:a7ba]',
  '[::ffff:ac43:a83a]',
  '[::ffff:ac43:a95f]',
  '[::ffff:ac43:a9c0]',
  '[::ffff:ac43:afeb]',
  '[::ffff:ac43:b2c4]',
  '[::ffff:ac43:b40c]',
  '[::ffff:ac43:b5a1]',
  '[::ffff:ac43:b8a3]',
  '[::ffff:ac43:bb26]',
  '[::ffff:ac43:c2cb]',
  '[::ffff:ac43:c4cf]',
  '[::ffff:ac43:c528]',
  '[::ffff:ac43:c5ba]',
  '[::ffff:ac43:c74f]',
  '[::ffff:ac43:c7a7]',
  '[::ffff:ac43:d46d]',
  '[::ffff:ac43:d4b8]',
  '[::ffff:ac43:deb5]',
  '[::ffff:b906:4c2a]',
  '[::ffff:bc72:6003]',
  '[::ffff:bc72:6103]',
  '[::ffff:bc72:6200]',
  '[::ffff:c7bf:3249]',
  '[::ffff:2d8e:780d]',
  '[::ffff:2d8e:780e]',
  '[::ffff:6715:f42a]',
  '[::ffff:6715:f43b]',
  '[::ffff:6715:f43f]',
  '[::ffff:6715:f462]',
  '[::ffff:6715:f46f]',
  '[::ffff:67a0:cc05]',
  '[::ffff:67a0:cc0b]',
  '[::ffff:67a0:cc11]',
  '[::ffff:6818:e]',
  '[::ffff:6818:11]',
  '[::ffff:6818:19]',
  '[::ffff:6ca2:c06a]',
  '[::ffff:6ca2:c0ba]',
  '[::ffff:6ca2:c10a]',
  '[::ffff:6ca2:c136]',
  '[::ffff:6ca2:c137]',
  '[::ffff:6ca2:c3ad]',
  '[::ffff:934e:8c12]',
  '[::ffff:934e:8c14]',
  '[::ffff:9a54:af90]',
  '[::ffff:9a54:afc4]',
  '[::ffff:9a55:6301]',
  '[::ffff:9a55:6306]',
  '[::ffff:9a55:6318]',
  '[::ffff:aa72:2d08]',
  '[::ffff:aa72:2d21]',
  '[::ffff:aa72:2d24]',
  '[::ffff:aa72:2d2a]',
  '[::ffff:aa72:2e04]',
  '[::ffff:aa72:2e29]',
  '[::ffff:aa72:2e2a]',
  '[::ffff:aa72:2e2d]',
  '[::ffff:adf5:3125]',
  '[::ffff:adf5:312f]',
  '[::ffff:adf5:313b]',
  '[::ffff:b912:fa07]',
  '[::ffff:b912:fa0a]',
  '[::ffff:b912:fa45]',
  '[::ffff:b912:fa52]',
  '[::ffff:b912:fa5c]',
  '[::ffff:b9b0:1a0a]',
  '[::ffff:b9ee:e407]',
  '[::ffff:b9ee:e437]',
  '[::ffff:b9ee:e455]',
  '[::ffff:c355:1736]',
  '[::ffff:c355:173a]',
  '[::ffff:c355:173b]',
  '[::ffff:c355:173f]',
  '[::ffff:c355:1743]',
  '[::ffff:c7d4:5a08]',
  '[::ffff:c7d4:5a14]',
  '[::ffff:c7d4:5a31]',
  '[::ffff:c7d4:5a46]',

  'creativecommons.org',
  'sky.rethinkdns.com',
  'www.speedtest.net',
  'cfip.xxxxxxxx.tk',
  'cfip.1323123.xyz',
  'www.cdnjs.com',
  'singapore.com',
  'go.inmobi.com',
  'cf.090227.xyz',
  'www.visa.com',
  'www.wto.org',
  'lb.nscl.ir',
  'cdnjs.com',
  'csgo.com',
  'zula.ir',
  'fbi.gov',
  'time.is',
  'icook.hk',
  '172.64.95.71',
  '198.41.209.210',
  '141.101.120.246',
  '141.101.120.187',
  '162.159.128.242',
  '198.41.209.120',
  '104.17.166.122',
  '104.18.69.233',
  '104.16.101.86',
  '104.18.111.51',
  '104.19.62.62',
  '172.67.95.79',
  '172.67.147.96',
  '172.67.68.78',
  '141.101.114.156',
  '172.64.87.213',
  '104.18.149.118',
  '198.41.222.205',
  '104.16.142.201',
  '104.18.198.8',
  '104.17.40.88',
  '172.67.213.29',
  '172.67.118.230',
  '172.67.143.45',
  '172.64.84.254',
  '172.64.95.154',
  '198.41.208.9',
  '198.41.209.180',
  '172.64.88.85',
  '162.159.251.118',
  '198.41.208.231',
  '104.18.67.197',
  '104.19.119.159',
  '104.17.232.95',
  '104.18.97.99',
  '104.16.2.214',
  '172.67.136.223',
  '172.67.218.87',
  '172.67.160.139',
  '172.67.77.89',
  '172.64.94.220',
  '198.41.209.202',
  '104.17.198.92',
  '104.18.150.71',
  '104.19.194.247',
  '104.16.216.245',
  '104.19.10.166',
  '162.159.160.207',
  '172.67.77.71',
  '172.67.242.60',
  '172.67.159.73',
  '172.64.91.10',
  '198.41.209.149',
  '198.41.209.71',
  '198.41.208.119',
  '162.159.46.91',
  '198.41.223.141',
  '104.19.76.235',
  '104.17.51.67',
  '162.159.236.238',
  '190.93.244.160',
  '172.67.233.243',
  '172.67.156.199',
  '162.159.136.4',
  '172.67.85.5',
  '172.64.80.0',
  '104.16.10.137',
  '104.19.37.137',
  '104.17.30.128',
  '104.19.202.206',
  '172.67.230.25',
  '172.67.100.38',
  '162.159.253.29',
  '172.67.177.195',
  '162.159.153.219',
  '104.18.240.250',
  '162.159.46.235',
  '104.16.220.241',
  '104.17.44.95',
  '104.17.62.168',
  '172.67.104.222',
  '172.67.107.11',
  '172.67.129.49',
  '172.67.96.109',
  '172.67.152.198',
  '104.19.123.25',
  '104.19.59.13',
  '104.19.150.205',
  '104.16.70.248',
  '104.19.160.88',
  '172.67.112.255',
  '172.67.83.17',
  '172.67.107.239',
  '162.159.192.61',
  '172.67.75.253',
  '198.41.208.202',
  '198.41.209.100',
  '104.17.89.249',
  '104.18.252.190',
  '172.64.80.139',
  '104.16.107.178',
  '104.19.47.115',
  '172.67.81.232',
  '172.67.101.45',
  '172.67.84.9',
  '172.67.104.160',
  '172.67.80.46',
  '198.41.208.133',
  '162.159.251.118',
  '162.159.248.151',
  '162.159.241.246',
  '198.41.208.155',
  '104.17.166.89',
  '104.16.101.86',
  '104.17.83.101',
  '104.18.94.92',
  '104.18.92.16',
  '172.67.111.151',
  '162.159.240.58',
  '172.67.140.210',
  '172.67.204.218',
  '141.101.120.173',
  '198.41.209.149',
  '198.41.209.202',
  '198.41.209.100',
  '198.41.208.133',
  '162.159.241.246',
  '104.18.97.145',
  '104.17.187.58',
  '104.16.190.213',
  '198.41.211.223',
  '104.18.13.44',
  '172.67.179.77',
  '172.67.165.145',
  '172.64.72.202',
  '172.67.230.145',
  '141.101.115.151',
  '141.101.121.104',
  '172.64.89.84',
  '198.41.208.186',
  '198.41.209.192',
  '104.19.104.246',
  '141.101.120.147',
  '104.17.218.30',
  '104.19.10.163',
  '198.41.208.176',
  '104.18.202.108',
  '162.159.134.101',
  '172.67.250.209',
  '172.67.207.35',
  '172.64.100.216',
  '172.67.219.103',
  '198.41.208.176',
  '198.41.209.0',
  '172.64.94.9',
  '162.159.248.151',
  '141.101.115.46',
  '104.17.158.150',
  '172.67.134.226',
  '141.101.121.104',
  '172.64.89.84',
  '198.41.208.186',
  '198.41.209.192',
  '104.19.104.246',
  '141.101.120.147',
  '104.17.218.30',
  '104.19.10.163',
  '198.41.208.176',
  '104.18.202.108',
  '162.159.134.101',
  '172.67.250.209',
  '172.67.207.35',
  '172.64.100.216',
  '172.67.219.103',
  '198.41.208.176',
  '198.41.209.0',
  '172.64.94.9',
  '162.159.248.151',
  '141.101.115.46',
  '104.17.158.150',
  '172.67.134.226',
  '104.16.126.178',
  '162.159.255.101',
  '104.24.177.69',
  '172.67.164.46',
  '172.67.132.179',
  '162.159.237.238',
  '172.67.146.28',
  '172.67.116.63',
];

// Dynamic IP source URLs
const ipSourceURLs = {
  // Cloudflare clean IPs are sourced from the NiREvil GitHub repository, updated every 3 hours.
  dynamic1: "https://raw.githubusercontent.com/NiREvil/vless/refs/heads/main/Cloudflare-IPs.json",
  dynamic2: "https://strawberry.victoriacross.ir"
};

 // ——— CAKE SUBSCRIPTION INFO SETTINGS ———
/**
 * These values create fake usage statistics for subscription clients
 * Customize these values to display desired traffic and expiry information
 */
const CAKE_INFO = {
  total_TB: 382, // Total traffic quota in Terabytes
  base_GB: 88000, // Base usage that's always shown (in Gigabytes)
  daily_growth_GB: 250, // Daily traffic growth (in Gigabytes) - simulates gradual usage
  expire_date: "2028-04-20" // Subscription expiry date (YYYY-MM-DD)
};

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

 // ——— MAIN REQUEST HANDLER ———
/**
 * Generates VLESS configurations and returns them as a base64-encoded subscription
 * @param {Request} _request - The incoming HTTP request
 * @returns {Promise<Response>} - Response containing base64-encoded VLESS links
 */
async function handleRequest(_request) {
  const url = new URL(_request.url);
  const subNameParam = url.searchParams.get('name');
  const subNameHash = url.hash ? decodeURIComponent(url.hash.substring(1)) : null;
  const profileTitle = subNameParam || subNameHash || "Harmony";
  const configsList = [];

  try {
    // Fetch dynamic IP lists from external sources
    const [ipv4listRE1, ipv4listRE2] = await Promise.all([
      fetch(ipSourceURLs.dynamic1)
        .then((res) => res.json())
        .catch(() => ({ ipv4: [] })),
      fetch(ipSourceURLs.dynamic2)
        .then((res) => res.json())
        .catch(() => ({ data: [] }))
    ]);

    // Extract IP addresses from responses
    const ipListRE1 = (ipv4listRE1.ipv4 || [])
      .map((/** @type {{ ip: any; }} */ ipData) => ipData.ip)
      .filter((/** @type {any} */ ip) => ip);
    const ipListRE2 = (ipv4listRE2.data || [])
      .map((/** @type {{ ipv4: any; }} */ item) => item.ipv4)
      .filter((/** @type {any} */ ip) => ip);

    // Prepare IP data sources with shuffled, deduplicated lists
    const ipDataSources = {
      static: shuffleArray([...new Set(staticIPs)]),
      dynamic1: shuffleArray([...new Set(ipListRE1)]),
      dynamic2: shuffleArray([...new Set(ipListRE2)])
    };

    // Generate configurations based on defined groups
    for (const group of USER_SETTINGS.groups) {
      const ipList = ipDataSources[group.dataSource] || [];
      const uniqueIPs = new Set();

      for (const ip of ipList) {
        if (uniqueIPs.size >= USER_SETTINGS.ipCount) break;
        if (!uniqueIPs.has(ip)) {
          const vlessUrl = createVlessLink(ip, group, USER_SETTINGS);
          configsList.push(vlessUrl);
          uniqueIPs.add(ip);
        }
      }
    }

    // Generate fake subscription info headers
    const subInfo = generateCakeSubscriptionInfo();

    // Return base64-encoded configuration list with subscription headers
    const headers = {
      "Content-Type": "text/plain; charset=utf-8",
      "Profile-Update-Interval": "6", // Client should update every 6 hours
      "Subscription-Userinfo": subInfo, // Cake usage statistics
    };

    if (profileTitle) {
      headers["Profile-Title"] = profileTitle;
    }

    return new Response(btoa(configsList.join("\n")), {
      status: 200,
      headers: headers
    });
  } catch (error) {
    // Error handling - return empty config list on failure
    return new Response(btoa("# Error generating configurations"), {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8"
      }
    });
  }
}

 // ——— VLESS LINK GENERATION ———
/**
 * Creates a VLESS link based on group settings
 * @param {string} ip - The IP address or domain to use
 * @param {Object} group - Group configuration object
 * @param {Object} settings - Global user settings
 * @returns {string} - Complete VLESS URL
 */
function createVlessLink(ip, group, settings) {
  // Select random port and fingerprint from group lists
  const randomPort = group.ports[Math.floor(Math.random() * group.ports.length)];
  const randomFp = group.fp[Math.floor(Math.random() * group.fp.length)];

  // Process path: replace "random:N" with N random characters
  let finalPath = group.path;
  if (finalPath.includes("random:")) {
    try {
      const length = parseInt(finalPath.match(/random:(\d+)/)?.[1] || "10");
      const randomString = generateRandomPath(length);
      finalPath = finalPath.replace(/random:\d+/, randomString);
    } catch (e) {
      // On error, keep original path
    }
  }

  // Build query parameters for VLESS URL
  const queryParams = new URLSearchParams({
    path: finalPath,
    encryption: "none",
    type: "ws", // WebSocket transport
    host: group.host,
    fp: randomFp,
    ed: settings.ed,
    eh: settings.eh
  });

  // Apply TLS-specific settings if enabled
  if (group.tls) {
    queryParams.set("security", "tls");

    // Handle SNI (Server Name Indication)
    let sniValue = group.sni || group.host;

    // Randomize SNI casing if enabled (helps bypass some filtering)
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
  }
  // For non-TLS: security and sni parameters are automatically omitted
  const ps = encodeURIComponent(group.name);
  return `vless://${settings.uuid}@${ip}:${randomPort}?${queryParams.toString()}#${ps}`;
}

 // ——— UTILITY FUNCTIONS ———
/**
 * Generates a random alphanumeric string for path obfuscation
 * @param {number} length - Desired length of random string
 * @returns {string} - Random string
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
 * @param {string} str - Input string (e.g., SNI domain)
 * @returns {string} - String with randomized casing
 */
function randomizeCase(str) {
  let result = "";
  for (let i = 0; i < str.length; i++) {
    // 50% chance to uppercase each character
    result += Math.random() < 0.5 ? str[i].toUpperCase() : str[i].toLowerCase();
  }
  return result;
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} - Shuffled array
 */
function shuffleArray(array) {
  const shuffled = array.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generates fake subscription information header
 * Creates dynamic usage statistics that change throughout the day
 * @returns {string} - Formatted subscription info string
 */
function generateCakeSubscriptionInfo() {
  const GB_in_bytes = 1024 * 1024 * 1024;
  const TB_in_bytes = 1024 * GB_in_bytes;

  const total_bytes = CAKE_INFO.total_TB * TB_in_bytes;
  const base_bytes = CAKE_INFO.base_GB * GB_in_bytes;

  // Calculate dynamic usage based on current hour of day
  const now = new Date();
  const hours_passed = now.getHours() + now.getMinutes() / 60;
  const daily_growth_bytes = (hours_passed / 24) * (CAKE_INFO.daily_growth_GB * GB_in_bytes);

  // Split usage between upload and download
  const total_used = base_bytes + daily_growth_bytes;
  const cake_download = total_used / 2;
  const cake_upload = total_used / 2;

  // Convert expiry date to Unix timestamp
  const expire_timestamp = Math.floor(new Date(CAKE_INFO.expire_date).getTime() / 1000);

  // Return formatted subscription info string
  return `upload=${Math.round(cake_upload)}; download=${Math.round(cake_download)}; total=${total_bytes}; expire=${expire_timestamp}`;
}
