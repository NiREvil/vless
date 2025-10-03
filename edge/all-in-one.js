addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
  })
  
  async function handleRequest(request) {
    const subscriptionUrls = [ 
        'https://raw.githubusercontent.com/Rayan-Config/C-Sub/refs/heads/main/configs/proxy.txt',
        'https://raw.githubusercontent.com/arshiacomplus/robinhood-v1-v2-v3ray/refs/heads/main/conf.txt',
        'https://raw.githubusercontent.com/mahdibland/ShadowsocksAggregator/master/Eternity.txt',
        'https://raw.githubusercontent.com/NiREvil/vless/main/sub/SSTime',
        'https://raw.githubusercontent.com/arshiacomplus/v2rayExtractor/refs/heads/main/vless.html'
    ]
  
    try {
        const fetchWithTimeout = async (url, timeout = 15000) => {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), timeout)
            
            try {
                const response = await fetch(url, { 
                    signal: controller.signal,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'text/plain,*/*',
                        'Cache-Control': 'no-cache'
                    }
                })
                clearTimeout(timeoutId)
                
                if (!response.ok) {
                    console.log(`${url} returned status: ${response.status}`)
                    return { content: '', error: `HTTP ${response.status}`, url }
                }
                
                const content = await response.text()
                return { content, error: null, url }
            } catch (error) {
                clearTimeout(timeoutId)
                console.error(`Error fetching ${url}:`, error.message)
                return { content: '', error: error.message, url }
            }
        }
  
        const responses = await Promise.all(
            subscriptionUrls.map(url => fetchWithTimeout(url))
        )
  
        let debugInfo = '=== DEBUG INFO ===\n'
        let combinedConfigs = ''
        
        for (let i = 0; i < responses.length; i++) {
            const { content, error, url } = responses[i]
            
            debugInfo += `\nURL ${i+1}: ${url}\n`
            debugInfo += `Status: ${error ? 'ERROR - ' + error : 'SUCCESS'}\n`
            debugInfo += `Content Length: ${content.length} characters\n`
            
            if (content && content.trim()) {
                // Checking whether the content is base64 or not.
                const trimmedContent = content.trim()
                let decodedContent = ''
                let isBase64Content = false
                
                try {
                    // Testing if it is base64.
                    if (trimmedContent.length % 4 === 0 && /^[A-Za-z0-9+/]*={0,2}$/.test(trimmedContent)) {
                        // To decode base64 with UTF-8 support.
                        const decoded = decodeURIComponent(escape(atob(trimmedContent)))
                        if (decoded && decoded.length > 0) {
                            decodedContent = decoded
                            isBase64Content = true
                        }
                    }
                } catch (e) {
                    // If it was not base64 or had UTF-8 error.
                }
                
                if (!isBase64Content) {
                    // The content is plain text.
                    decodedContent = trimmedContent
                }
                
                debugInfo += `Format: ${isBase64Content ? 'BASE64' : 'PLAIN TEXT'}\n`
                debugInfo += `Decoded Length: ${decodedContent.length} characters\n`
                debugInfo += `Lines Count: ${decodedContent.split('\n').length}\n`
                debugInfo += `First 200 chars: ${decodedContent.substring(0, 200)}...\n`
                
                if (decodedContent) {
                    combinedConfigs += decodedContent + '\n'
                }
            } else {
                debugInfo += `Content: EMPTY\n`
            }
            debugInfo += '---\n'
        }
  
        // Remove blank and duplicate lines.
        const lines = combinedConfigs.split('\n')
        const nonEmptyLines = lines.filter(line => line.trim().length > 0)
        const uniqueLines = [...new Set(nonEmptyLines)]
        const finalContent = uniqueLines.join('\n')
        
        debugInfo += `\n=== FINAL RESULT ===\n`
        debugInfo += `Total unique configs: ${uniqueLines.length}\n`
        debugInfo += `Final content length: ${finalContent.length} characters\n`
  
        // If the URL has ?debug=1, return debug information.
        const url = new URL(request.url)
        if (url.searchParams.get('debug') === '1') {
            return new Response(debugInfo, {
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Access-Control-Allow-Origin': '*'
                }
            })
        }
  
        // Return the final result as base64 with UTF-8 support.
        const finalBase64 = btoa(unescape(encodeURIComponent(finalContent)))
  
        return new Response(finalBase64, {
            headers: {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'X-Total-Configs': uniqueLines.length.toString(),
                'X-Content-Length': finalContent.length.toString()
            }
        })
  
    } catch (error) {
        console.error('Main error:', error)
        return new Response('Error: ' + error.message, {
            status: 500,
            headers: {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': '*'
            }
        })
    }
  }
