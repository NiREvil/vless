/**
 * Last update: Wednesday, 12 March 2025, 11:59 PM
 * - This code retrieves v2ray sub-links data from multiple links in base64 format and
 * - Filter out any failed responses
 * - Decodes the base64 content to UTF-8 format
 * - merges them
 * - Return the merged configuration in UTF-8
 * - Output of this code code: https://mix-and-decodebase64.xcs.workers.dev
 * - we are all REvil
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const subscriptionLinks = [
    // sources: https://github.com/soroushmirzaei/telegram-configs-collector
    'https://raw.githubusercontent.com/soroushmirzaei/telegram-configs-collector/refs/heads/main/protocols/hysteria',
    'https://raw.githubusercontent.com/soroushmirzaei/telegram-configs-collector/refs/heads/main/countries/tr/mixed',
    'https://raw.githubusercontent.com/soroushmirzaei/telegram-configs-collector/refs/heads/main/protocols/juicity',
    'https://raw.githubusercontent.com/soroushmirzaei/telegram-configs-collector/refs/heads/main/protocols/tuic',
    'https://raw.githubusercontent.com/soroushmirzaei/telegram-configs-collector/refs/heads/main/countries/tr/mixed',
  ];

  try {
    // Fetch data from all subscription links concurrently
    const responses = await Promise.all(
      subscriptionLinks.map(async link => {
        try {
          const response = await fetch(link);
          return response;
        } catch (error) {
          console.error('Error fetching data from link:', link, error);
          // You can return a default value or handle the error differently here
          return null;
        }
      }),
    );

    // Filter out any failed responses (if error handling was implemented in the map)
    const successfulResponses = responses.filter(response => response);

    if (!successfulResponses.length) {
      // Handle the case where all fetches failed
      return new Response('Failed to fetch any subscription links.', {
        status: 500,
      });
    }

    // Extract the base64 content from successful responses
    const contents = await Promise.all(
      successfulResponses.map(async response => {
        try {
          const content = await response.text();
          return content;
        } catch (error) {
          console.error('Error parsing response text:', error);
          // You can return a default value or handle the error differently here
          return '';
        }
      }),
    );

    // Decode base64 content to UTF-8
    const decodedConfigs = contents.map(content => atob(content));

    // Merge the decoded configs
    const mergedConfig = decodedConfigs.join('\n\n');

    // Return the merged configuration in UTF-8 format
    return new Response(mergedConfig, {
      headers: {
        'Content-Type': 'text/plain; charset=UTF-8',
      },
    });
  } catch (error) {
    console.error('Unhandled error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
