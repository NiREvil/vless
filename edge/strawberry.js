async function handleRequest(request) {
  const repositories = [
    {
      url: 'https://raw.githubusercontent.com/NiREvil/vless/refs/heads/main/Cloudflare-IPs.json',
      type: 'type2',
    },
    {
      url: 'https://raw.githubusercontent.com/NiREvil/Harmony/refs/heads/main/cf-clean.json',
      type: 'type1',
    },
  ];

  const seenIPv4 = new Set(); 
  const resultData = [];

  for (const repo of repositories) {
    const response = await fetch(repo.url);
    const json = await response.json();

    if (repo.type === 'type1') {
      const ipv4data = json.ipv4.filter(item => item.ip !== null);
      ipv4data.forEach(item => {
        if (!seenIPv4.has(item.ip)) {
          seenIPv4.add(item.ip);
          resultData.push({
            domain: item.domain || "",
            iPv4: item.ip || "",
            iPv6: item.ipv6 || "",
            protocol_version: item.protocol_version || "TLSv1.3",
          });
        }
      });
    } else if (repo.type === 'type2') {
      const Ipv4Data = json.ipv4.filter(item => item.ip);
      Ipv4Data.forEach(item => {
        if (!seenIPv4.has(item.ip)) {
          seenIPv4.add(item.ip);
          resultData.push({
            domain: "",
            ipv4: item.ip || "",
            ipv6: "",
            protocol_version: "TLSv1.3",
          });
        }
      });
    }
  }

  const result = JSON.stringify({ data: resultData }, null, 2);

  return new Response(result, {
    headers: { 'content-type': 'text/plain' },
  });
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
