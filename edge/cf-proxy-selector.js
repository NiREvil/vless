/**
 * Cloudflare Worker Backend Proxy & Health Checker
 *
 * - Proxies incoming HTTP requests to a randomized list of Cloudflare-backed domains.
 * - Parses optional environment variables (`HOST`, `PATH`, `CODE`) for customization.
 * - Performs a fast health check on candidate backends with a timeout.
 * - Forwards the original request with all headers and body intact upon finding a healthy backend.
 * - Sets the correct `Host` header to prevent SNI/Host routing errors.
 * - Returns a 404 response if all backend domains fail the health check.
 * - More details: https://diana-cl.github.io/Diana-Cl/topics/cf-backend-selector
 */

// Default list of Cloudflare-proxied backend domains
const DEFAULT_BACKENDS = [
  "ip.sb",
  "fbi.gov",
  "time.is",
  "csgo.com",
  "icook.hk",
  "harbor.io",
  "npmjs.com",
  "unpkg.com",
  "lb.nscl.ir",
  "www.gov.ua",
  "linkerd.io",
  "medium.com",
  "www.wto.org",
  "chatgpt.com",
  "jsdelivr.com",
  "singapore.com",
  "go.inmobi.com",
  "www.cdnjs.com",
  "auth.vercel.com",
  "chat.openai.com",
  "www.udacity.com",
  "www.gitbook.com",
  "www.ipaddress.my",
  "www.glassdoor.com",
  "www.ipchicken.com",
  "www.speedtest.net",
  "sky.rethinkdns.com",
  "creativecommons.org",
  "yakamoz.victoriacross.ir",
  "static.cloudflareinsights.com",
];

/**
 * Parses a string containing space-, comma-, or newline-separated domains.
 *
 * @param {string|undefined} envHost - Environment variable input.
 * @returns {string[]|null} Array of parsed hostnames or null if invalid.
 */
function parseHostEnv(envHost) {
  if (!envHost) return null;
  return envHost
    .replace(/[ |"'\r\n]+/g, ",")
    .split(",")
    .filter(Boolean);
}

/**
 * Executes a fetch request wrapped in an AbortController timeout.
 *
 * @param {string|Request} resource - Target resource URL.
 * @param {Object} options - Fetch options extending RequestInit with a `timeout` property.
 * @returns {Promise<Response>} Fetch response.
 */
async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 1618, ...fetchOptions } = options;
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(resource, {
      ...fetchOptions,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timerId);
  }
}

export default {
  /**
   * Main Cloudflare Worker fetch handler.
   */
  async fetch(request, env, ctx) {
    const originalUrl = new URL(request.url);
    const targetPath = originalUrl.pathname;
    const targetSearch = originalUrl.search;

    // Load custom backends from env or fall back to default pool
    const backendDomains = parseHostEnv(env.HOST) || [...DEFAULT_BACKENDS];

    // Sanitize health check test path
    const testPath = env.PATH ? (env.PATH.startsWith("/") ? env.PATH : "/" + env.PATH) : "/";
    const expectedCode = parseInt(env.CODE || "200", 10);

    // Create a mutable copy of backends to safely pull from during retries
    const pool = [...backendDomains];

    while (pool.length > 0) {
      // Select and remove a random domain from the pool
      const randomIndex = Math.floor(Math.random() * pool.length);
      const selectedHost = pool.splice(randomIndex, 1)[0];

      // Construct health check URL
      const testUrl = new URL(testPath, `https://${selectedHost}`);

      try {
        // Perform fast health check via GET request
        const response = await fetchWithTimeout(testUrl.toString(), {
          method: "GET",
          timeout: 1618,
          headers: {
            "User-Agent": "Cloudflare-Worker-HealthCheck/1.0",
          },
        });

        if (response.status === expectedCode) {
          console.log(`Using backend: ${selectedHost}`);

          // Reconstruct target URL for the actual proxied request
          const finalUrl = new URL(originalUrl.href);
          finalUrl.hostname = selectedHost;
          finalUrl.pathname = targetPath;
          finalUrl.search = targetSearch;

          // Prepare final request preserving original body, method, and headers
          const proxyRequest = new Request(finalUrl.toString(), request);

          // Ensure Host header matches target domain to prevent routing failure
          proxyRequest.headers.set("Host", selectedHost);

          return await fetch(proxyRequest);
        } else {
          console.log(`Failed backend (Status ${response.status}): ${selectedHost}`);
        }
      } catch (error) {
        console.log(`Failed backend (Timeout/Error): ${selectedHost}`);
      }
    }

    // Fallback response if all backends fail
    return new Response("All backends are unavailable!", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  },
};
