/**
 * Cloudflare Worker to Merged Subscription URLs
 */

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // Define an array of subscription URLs
  const subscriptionUrls = [
      // NiREvil
      'https://raw.githubusercontent.com/NiREvil/vless/main/sub/freedom',
      'https://walker.nirevil.ir/sub/211484ca-3fe6-487b-bb3b-ab06a76c4079?app=singbox/',
      'https://harmony.nirevil.ir/',
      'https://arcane.nirevil.ir/',
      'https://raw.githubusercontent.com/mahdibland/ShadowsocksAggregator/master/Eternity.txt',
      'https://raw.githubusercontent.com/NiREvil/vless/main/sub/hz',
      'https://raw.githubusercontent.com/yebekhe/TVC/main/subscriptions/xray/base64/reality',
      'https://raw.githubusercontent.com/yebekhe/TVC/main/lite/subscriptions/xray/base64/vless',
      // Add more URLs as needed
  ];

  // Fetch data from all URLs concurrently and store in an array
  const validResponses = await Promise.all(
      subscriptionUrls.map(async (url) => {
          const response = await fetch(url);
          if (response.status === 200) {
              return response.text();
          }
          return null; // Ignore failed requests
      })
  );

  // Filter out null values (failed requests) and merge the responses
  const mergedData = validResponses.filter(Boolean).join('\r\n');

  // Create a response with the merged data
  return new Response(mergedData, {
      status: 200,
  });
}
