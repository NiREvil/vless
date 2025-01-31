/**
 * - this function handles HTTP requests by fetching data from specified repositories,
 * - processing the data, and returning a JSON response,
 * - it filters and collects unique IPv4/IPv6 addresses from the cloudflare ip source's,
 * - along with associated domain and protocol version information.
 * - exclusively for use in Harmony 3rd ip sources "https://github.com/NiREvil/Harmony".
 */

async function handleRequest(request) {
  const repositories = [
    {
      url: "https://raw.githubusercontent.com/NiREvil/vless/refs/heads/main/Cloudflare-IPs.json", // 1st cf clean ip source
      type: "type2",
    },
    {
      url: "https://raw.githubusercontent.com/NiREvil/Harmony/refs/heads/main/cf-clean.json", // 2nd one
      type: "type1",
    },
  ];

  const seenIPv4 = new Set();
  const resultData = [];

  for (const repo of repositories) {
    const response = await fetch(repo.url); // Fetch data from the repository URL
    const json = await response.json(); // Parse the response as JSON

    if (repo.type === "type1") {
      const ipv4data = json.ipv4.filter((item) => item.ip !== null); // Filter out null IPv4 entries
      ipv4data.forEach((item) => {
        if (!seenIPv4.has(item.ip)) {
          seenIPv4.add(item.ip); // Add the IPv4 address to the set of seen addresses
          resultData.push({
            domain: item.domain || "", // Add the domain if present
            iPv4: item.ip || "", // Add the IPv4 address
            iPv6: item.ipv6 || "", // Add the IPv6 address if present
            protocol_version: item.protocol_version || "TLSv1.3", // Add the protocol version
          });
        }
      });
    } else if (repo.type === "type2") {
      const Ipv4Data = json.ipv4.filter((item) => item.ip);
      Ipv4Data.forEach((item) => {
        if (!seenIPv4.has(item.ip)) {
          seenIPv4.add(item.ip);
          resultData.push({
            domain: "", // No domain information for type2
            ipv4: item.ip || "",
            ipv6: "", // No IPv6 information for type2
            protocol_version: "TLSv1.3",
          });
        }
      });
    }
  }

  const result = JSON.stringify({ data: resultData }, null, 2); // Convert the result data to a JSON string

  return new Response(result, {
    headers: { "content-type": "text/plain" }, // Return the response with the appropriate headers
  });
}

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request)); // Handle the fetch event
});
