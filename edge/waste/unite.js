/**
 * Last update: Tuesday, 28 April 2025, 11:59 PM
 * This script fetches multiple subscription configuration files from predefined URLs, decodes their base64 content,
 * combines the decoded configurations into a single string, and encodes the result back into base64 format.
 * The combined base64 string is returned as the response to incoming HTTP requests.
 *
 * Key Features:
 * - Fetches configuration files from multiple URLs concurrently using `Promise.all`.
 * - Handles errors during fetch and base64 decoding gracefully, skipping invalid or inaccessible URLs.
 * - Responds with the processed base64 string, including appropriate HTTP headers for CORS and caching.
 *
 * Usage:
 * This script is designed to run as an HTTP request handler in environments like Cloudflare Workers or similar platforms.
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const subscriptionUrls = [
    'https://raw.githubusercontent.com/mahsanet/MahsaFreeConfig/main/mtn/sub_1.txt',
    'https://raw.githubusercontent.com/mahsanet/MahsaFreeConfig/main/mtn/sub_2.txt',
    'https://raw.githubusercontent.com/mahsanet/MahsaFreeConfig/main/mtn/sub_3.txt',
    'https://raw.githubusercontent.com/mahsanet/MahsaFreeConfig/main/mtn/sub_4.txt',
    'https://raw.githubusercontent.com/mahsanet/MahsaFreeConfig/main/mci/sub_1.txt',
    'https://raw.githubusercontent.com/mahsanet/MahsaFreeConfig/main/mci/sub_2.txt',
    'https://raw.githubusercontent.com/mahsanet/MahsaFreeConfig/main/mci/sub_3.txt',
    'https://raw.githubusercontent.com/mahsanet/MahsaFreeConfig/main/mci/sub_4.txt',
    'https://raw.githubusercontent.com/soroushmirzaei/telegram-configs-collector/main/countries/tr/mixed',
  ];

  try {
    const responses = await Promise.all(
      subscriptionUrls.map(url =>
        fetch(url)
          .then(response => response.text())
          .catch(error => ''),
      ),
    );

    let combinedConfigs = '';
    for (let base64Content of responses) {
      if (base64Content) {
        try {
          const decodedContent = atob(base64Content.trim());
          if (decodedContent) {
            combinedConfigs += decodedContent + '\n';
          }
        } catch (e) {
          console.error('Error decoding base64:', e);
        }
      }
    }

    const finalBase64 = btoa(combinedConfigs.trim());

    return new Response(finalBase64, {
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
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
}
