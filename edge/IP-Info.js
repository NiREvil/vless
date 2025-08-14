/**
 * Cloudflare Worker — Request intelligence JSON API
 *
 * Purpose:
 *   Returns a structured JSON snapshot of the incoming request that blends
 *   headers, Cloudflare edge signals, lightweight device detection, and a
 *   simple risk assessment to help you understand “who’s knocking” at your edge.
 *   For testing and seeing the response: "https://ipt.victoriacross.workers.dev"
 *
 * What it does:
 *   - "Country flag:" Builds a Unicode flag emoji from a two-letter country code.
 *   - "Connection type:" Heuristically classifies network orgs as VPN/Proxy, Hosting/Datacenter,
 *     Mobile/Cellular, ISP/Residential, or Unknown.
 *   - "User-Agent analysis:" Infers "device", "OS", and "browser" with simple pattern checks.
 *   - "Risk assessment:" Produces a "riskScore", "riskLevel", and "riskFactors" based on signals
 *     like missing headers, very low RTT, or VPN/proxy hints.
 *   - "Headers snapshot:" Normalizes common HTTP and Cloudflare-specific headers for quick inspection.
 *   - "CORS-friendly JSON:" Responds with application/json and permissive CORS for easy consumption.
 *
 * Response structure (high level):
 *   - "ip, userAgent, method, url, protocol, host, referer"
 *   - "cf:" {
 *       asn, asOrganization, city, region, regionCode, postalCode, metroCode,
 *       country, countryName, continent, latitude, longitude, timezone,
 *       colo, clientTcpRtt, httpProtocol, requestPriority, tlsCipher, tlsVersion,
 *       botManagement, clientAcceptEncoding, edgeRequestKeepAliveStatus, threat, isEUCountry,
 *       countryFlag, connectionType
 *     }
 *   - "device:" { device, os, browser }
 *   - "security:" { riskScore, riskLevel, riskFactors[] }
 *   - "headers:" {
 *       acceptLanguage, acceptEncoding, accept, dnt, upgradeInsecureRequests,
 *       secFetchSite, secFetchMode, secFetchUser, secFetchDest,
 *       cfRay, cfVisitor, cfIpCountry
 *     }
 *   - "isBot, isMobile, isVPN, timestamp, timestampUnix"
 *
 * Usage:
 *   - "Deploy as a Cloudflare Worker." It responds to GET/HEAD/POST/OPTIONS with JSON.
 *   - "Consume from apps or dashboards" to debug traffic, enrich logs, or gate flows.
 *
 * Notes:
 *   - "Heuristics are best-effort." Expect false positives/negatives; tune patterns to your traffic.
 *   - "Privacy:" Be mindful of storing IPs and derived attributes; apply your org’s data policies.
 *   - "Extensibility:" Add org-specific VPN/hosting patterns, stricter UA parsing, or scoring weights.
 */


async function handleRequest(request) {
  const headers = request.headers;
  const url = new URL(request.url);

  // Helper function to get country flag
  function getCountryFlag(countryCode) {
    if (!countryCode || countryCode.length !== 2) return null;
    return countryCode.split('').map(char => 
      String.fromCodePoint(127397 + char.charCodeAt())
    ).join('');
  }

  // Enhanced connection type detection
  function getConnectionType(asOrganization, asn) {
    if (!asOrganization) return 'Unknown';
    const org = asOrganization.toLowerCase();
    
    // Common VPN/Proxy ASNs and patterns
    const vpnPatterns = ['private customer', 'vpn', 'proxy', 'privacy', 'anonymous'];
    const hostingPatterns = ['hosting', 'server', 'cloud', 'datacenter', 'digital ocean', 'amazon', 'google', 'microsoft'];
    const mobilePatterns = ['mobile', 'cellular', 'wireless', 'telecom'];
    const ispPatterns = ['broadband', 'cable', 'fiber', 'fibre', 'internet', 'communications'];
    
    if (vpnPatterns.some(pattern => org.includes(pattern))) return 'VPN/Proxy';
    if (hostingPatterns.some(pattern => org.includes(pattern))) return 'Hosting/Datacenter';
    if (mobilePatterns.some(pattern => org.includes(pattern))) return 'Mobile/Cellular';
    if (ispPatterns.some(pattern => org.includes(pattern))) return 'ISP/Residential';
    
    return 'Unknown';
  }

  // Device detection from User Agent
  function analyzeUserAgent(userAgent) {
    if (!userAgent) return {};
    
    const ua = userAgent.toLowerCase();
    let device = 'Unknown';
    let os = 'Unknown';
    let browser = 'Unknown';
    
    // Device detection
    if (ua.includes('mobile')) device = 'Mobile';
    else if (ua.includes('tablet')) device = 'Tablet';
    else device = 'Desktop';
    
    // OS detection
    if (ua.includes('android')) os = 'Android';
    else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
    else if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    
    // Browser detection
    if (ua.includes('chrome') && !ua.includes('edge')) browser = 'Chrome';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
    else if (ua.includes('edge')) browser = 'Edge';
    
    return { device, os, browser };
  }

  // Risk assessment
  function assessRisk(cf, headers, userAgent) {
    let riskScore = 0;
    let riskFactors = [];
    
    // VPN/Proxy detection
    if (cf?.asOrganization?.toLowerCase().includes('private customer')) {
      riskScore += 30;
      riskFactors.push('Possible VPN/Proxy');
    }
    
    // No User Agent
    if (!userAgent) {
      riskScore += 50;
      riskFactors.push('Missing User Agent');
    }
    
    // Suspicious headers
    if (!headers.get('Accept-Language')) {
      riskScore += 20;
      riskFactors.push('Missing Accept-Language');
    }
    
    // Very low RTT (might indicate datacenter)
    if (cf?.clientTcpRtt && cf.clientTcpRtt < 5) {
      riskScore += 10;
      riskFactors.push('Very low latency');
    }
    
    // Missing common headers
    if (!headers.get('Accept')) {
      riskScore += 25;
      riskFactors.push('Missing Accept header');
    }
    
    let riskLevel = 'Low';
    if (riskScore >= 70) riskLevel = 'High';
    else if (riskScore >= 40) riskLevel = 'Medium';
    
    return { riskScore, riskLevel, riskFactors };
  }

  const userAgentAnalysis = analyzeUserAgent(headers.get('User-Agent'));
  const riskAssessment = assessRisk(request.cf, headers, headers.get('User-Agent'));

  const data = {
    // Basic Info
    ip: headers.get('CF-Connecting-IP') || headers.get('X-Forwarded-For') || null,
    userAgent: headers.get('User-Agent') || null,
    
    // Request Info
    method: request.method,
    url: request.url,
    protocol: url.protocol,
    host: headers.get('Host') || null,
    referer: headers.get('Referer') || null,
    
    // Geo Information
    cf: {
      // Network Info
      asn: request.cf?.asn || null,
      asOrganization: request.cf?.asOrganization || null,
      
      // Location Info
      city: request.cf?.city || null,
      region: request.cf?.region || null,
      regionCode: request.cf?.regionCode || null,
      postalCode: request.cf?.postalCode || null,
      metroCode: request.cf?.metroCode || null,
      country: request.cf?.country || null,
      countryName: request.cf?.countryName || request.cf?.country || null,
      continent: request.cf?.continent || null,
      latitude: request.cf?.latitude || null,
      longitude: request.cf?.longitude || null,
      timezone: request.cf?.timezone || null,
      
      // Technical Info
      colo: request.cf?.colo || null,
      clientTcpRtt: request.cf?.clientTcpRtt || null,
      httpProtocol: request.cf?.httpProtocol || null,
      requestPriority: request.cf?.requestPriority || null,
      tlsCipher: request.cf?.tlsCipher || null,
      tlsVersion: request.cf?.tlsVersion || null,
      
      // Security & Bot Detection
      botManagement: request.cf?.botManagement || null,
      clientAcceptEncoding: request.cf?.clientAcceptEncoding || null,
      edgeRequestKeepAliveStatus: request.cf?.edgeRequestKeepAliveStatus || null,
      threat: request.cf?.threat || null,
      isEUCountry: request.cf?.isEUCountry || null,
      
      // Enhanced custom fields
      countryFlag: getCountryFlag(request.cf?.country),
      connectionType: getConnectionType(request.cf?.asOrganization, request.cf?.asn),
    },
    
    // Device Analysis
    device: userAgentAnalysis,
    
    // Risk Assessment
    security: riskAssessment,
    
    // Headers Analysis
    headers: {
      acceptLanguage: headers.get('Accept-Language') || null,
      acceptEncoding: headers.get('Accept-Encoding') || null,
      accept: headers.get('Accept') || null,
      dnt: headers.get('DNT') || null,
      upgradeInsecureRequests: headers.get('Upgrade-Insecure-Requests') || null,
      secFetchSite: headers.get('Sec-Fetch-Site') || null,
      secFetchMode: headers.get('Sec-Fetch-Mode') || null,
      secFetchUser: headers.get('Sec-Fetch-User') || null,
      secFetchDest: headers.get('Sec-Fetch-Dest') || null,
      
      // Cloudflare specific
      cfRay: headers.get('CF-RAY') || null,
      cfVisitor: headers.get('CF-Visitor') || null,
      cfIpCountry: headers.get('CF-IPCountry') || null,
    },
    
    // Additional Info
    isBot: !!(request.cf?.botManagement?.score),
    isMobile: userAgentAnalysis.device === 'Mobile',
    isVPN: getConnectionType(request.cf?.asOrganization).includes('VPN'),
    
    // Timestamps
    timestamp: new Date().toISOString(),
    timestampUnix: Math.floor(Date.now() / 1000),
  };

  return new Response(JSON.stringify(data, null, 2), {
    headers: { 
      'content-type': 'application/json;charset=UTF-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
