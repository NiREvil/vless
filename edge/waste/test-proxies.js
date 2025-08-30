import fs from 'fs';
import path from 'path';
import net from 'net';
import https from 'https';
import http from 'http';
import { performance } from 'perf_hooks';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function testHTTPProxy(proxyHost, proxyPort, timeout = 10000) {
  return new Promise(resolve => {
    const socket = new net.Socket();
    let hasResolved = false;

    const resolveOnce = result => {
      if (hasResolved) return;
      hasResolved = true;
      resolve(result);
      socket.destroy();
    };

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      const connectRequest = `CONNECT httpbin.org:80 HTTP/1.1\r\nHost: httpbin.org:80\r\n\r\n`;
      socket.write(connectRequest);
    });

    socket.on('data', data => {
      const response = data.toString();
      if (response.includes('200') || response.includes('established')) {
        resolveOnce({ success: true, method: 'HTTP_CONNECT' });
      } else {
        resolveOnce({ success: false, method: 'HTTP_CONNECT' });
      }
    });

    socket.on('error', error => {
      resolveOnce({ success: false, method: 'HTTP_CONNECT', error: error.message });
    });

    socket.on('timeout', () => {
      resolveOnce({ success: false, method: 'HTTP_CONNECT', error: 'timeout' });
    });

    socket.connect(proxyPort, proxyHost);
  });
}

function testTCPConnection(proxyHost, proxyPort, timeout = 8000) {
  return new Promise(resolve => {
    const socket = new net.Socket();
    let hasResolved = false;

    const resolveOnce = result => {
      if (hasResolved) return;
      hasResolved = true;
      resolve(result);
      socket.destroy();
    };

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      resolveOnce({ success: true, method: 'TCP' });
    });

    socket.on('error', error => {
      resolveOnce({ success: false, method: 'TCP', error: error.message });
    });

    socket.on('timeout', () => {
      resolveOnce({ success: false, method: 'TCP', error: 'timeout' });
    });

    socket.connect(proxyPort, proxyHost);
  });
}

function testSOCKS5Proxy(proxyHost, proxyPort, timeout = 8000) {
  return new Promise(resolve => {
    const socket = new net.Socket();
    let hasResolved = false;

    const resolveOnce = result => {
      if (hasResolved) return;
      hasResolved = true;
      resolve(result);
      socket.destroy();
    };

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      const greeting = Buffer.from([0x05, 0x01, 0x00]);
      socket.write(greeting);
    });

    socket.on('data', data => {
      if (data.length >= 2 && data[0] === 0x05) {
        resolveOnce({ success: true, method: 'SOCKS5' });
      } else {
        resolveOnce({ success: false, method: 'SOCKS5' });
      }
    });

    socket.on('error', error => {
      resolveOnce({ success: false, method: 'SOCKS5', error: error.message });
    });

    socket.on('timeout', () => {
      resolveOnce({ success: false, method: 'SOCKS5', error: 'timeout' });
    });

    socket.connect(proxyPort, proxyHost);
  });
}

async function validateProxyIP(proxyHost, proxyPort) {
  const tests = [
    () => testHTTPProxy(proxyHost, proxyPort),
    () => testSOCKS5Proxy(proxyHost, proxyPort),
    () => testTCPConnection(proxyHost, proxyPort),
  ];

  for (const test of tests) {
    try {
      const result = await test();
      if (result.success) {
        return { success: true, method: result.method };
      }
    } catch (error) {
      continue;
    }
  }

  return { success: false };
}

async function getIpInfo(ip) {
  try {
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,city,as,proxy`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ProxyTester/1.0)',
        },
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!response.ok) return { status: 'fail' };
    const data = await response.json();

    await new Promise(res => setTimeout(res, 200));

    return data;
  } catch (e) {
    console.log(`Failed to get info for ${ip}: ${e.message}`);
    return { status: 'fail' };
  }
}

async function processProxiesInBatches(proxies, batchSize = 10) {
  const workingProxies = [];

  for (let i = 0; i < proxies.length; i += batchSize) {
    const batch = proxies.slice(i, i + batchSize);
    console.log(
      `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(proxies.length / batchSize)} (${batch.length} proxies)...`,
    );

    const batchPromises = batch.map(async ([ip, port]) => {
      try {
        const result = await validateProxyIP(ip, parseInt(port));
        if (result.success) {
          const info = await getIpInfo(ip);
          if (info.status === 'success') {
            return {
              ip,
              port,
              method: result.method,
              country: info.country,
              city: info.city,
              as: info.as,
              proxy: info.proxy || 'unknown',
            };
          }
        }
        return null;
      } catch (error) {
        console.log(`Error testing ${ip}:${port} - ${error.message}`);
        return null;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    const validResults = batchResults.filter(result => result !== null);
    workingProxies.push(...validResults);

    console.log(`Batch completed. Found ${validResults.length} working proxies.`);

    if (i + batchSize < proxies.length) {
      await new Promise(res => setTimeout(res, 2000));
    }
  }

  return workingProxies;
}

async function fetchNauticaProxies() {
  try {
    console.log('Fetching proxies from Nautica repository...');
    const response = await fetch(
      'https://raw.githubusercontent.com/FoolVPN-ID/Nautica/refs/heads/main/proxyList.txt',
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ProxyTester/1.0)' },
        signal: AbortSignal.timeout(15000),
      },
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const content = await response.text();
    const proxies = [];

    content.split(/\r?\n/).forEach(line => {
      const parts = line.trim().split(',');
      if (parts.length >= 2) {
        const ip = parts[0].trim();
        const port = parts[1].trim();
        if (/^\d+\.\d+\.\d+\.\d+$/.test(ip) && port === '443') {
          proxies.push([ip, port]);
        }
      }
    });

    console.log(`Found ${proxies.length} port 443 proxies from Nautica`);
    return proxies;
  } catch (error) {
    console.error('Failed to fetch Nautica proxies:', error.message);
    return [];
  }
}

async function fetchNiRevilProxies() {
  try {
    console.log('Fetching proxies from NiREvil repository...');
    const response = await fetch(
      'https://raw.githubusercontent.com/NiREvil/vless/refs/heads/main/sub/ProxyIP.md',
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ProxyTester/1.0)' },
        signal: AbortSignal.timeout(15000),
      },
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const content = await response.text();
    const proxies = [];

    const yamlBlocks = content.match(/```yaml\s*\n([^\`]+)\n```/g);
    if (yamlBlocks) {
      yamlBlocks.forEach(block => {
        const ip = block
          .replace(/```yaml\s*\n/, '')
          .replace(/\n```/, '')
          .trim();
        if (/^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
          proxies.push([ip, '443']);
        }
      });
    }

    console.log(`Found ${proxies.length} proxies from NiREvil`);
    return proxies;
  } catch (error) {
    console.error('Failed to fetch NiREvil proxies:', error.message);
    return [];
  }
}

async function main() {
  try {
    const chunkIndex = parseInt(process.env.CHUNK_INDEX, 10);
    const totalChunks = parseInt(process.env.TOTAL_CHUNKS, 10);

    const allProxySources = [];

    const proxyFilePath = path.join(__dirname, '../sub/country_proxies/02_proxies.csv');
    if (fs.existsSync(proxyFilePath)) {
      const rawContent = fs.readFileSync(proxyFilePath, 'utf-8');
      const lines = rawContent.split(/\r?\n/);

      console.log(`Processing CSV with ${lines.length} lines...`);

      for (const line of lines) {
        if (!line || line.startsWith('IP Address') || line.startsWith('﻿IP Address')) continue;

        const parts = line.trim().split(',');
        if (parts.length >= 2) {
          const ip = parts[0].trim();
          const port = parts[1].trim();

          if (ip && port === '443' && /^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
            allProxySources.push([ip, port]);
          }
        }
      }
      console.log(`Found ${allProxySources.length} proxies from local CSV`);
    }

    const nauticaProxies = await fetchNauticaProxies();
    const niRevilProxies = await fetchNiRevilProxies();

    allProxySources.push(...nauticaProxies);
    allProxySources.push(...niRevilProxies);

    const uniqueProxies = Array.from(
      new Map(allProxySources.map(([ip, port]) => [`${ip}:${port}`, [ip, port]])).values(),
    );

    console.log(`Total unique proxies from all sources: ${uniqueProxies.length}`);

    const chunkSize = Math.ceil(uniqueProxies.length / totalChunks);
    const startIndex = chunkIndex * chunkSize;
    const endIndex = Math.min(startIndex + chunkSize, uniqueProxies.length);
    const proxiesToCheck = uniqueProxies.slice(startIndex, endIndex);

    if (proxiesToCheck.length === 0) {
      console.log(`Chunk ${chunkIndex + 1}/${totalChunks} has no proxies to test. Exiting.`);
      fs.writeFileSync('working_proxies_partial.txt', '');
      return;
    }

    console.log(
      `Job ${chunkIndex + 1}/${totalChunks}: Testing ${proxiesToCheck.length} proxies on port 443 (indices ${startIndex}-${endIndex - 1})...`,
    );

    const startTime = performance.now();
    const workingProxies = await processProxiesInBatches(proxiesToCheck, 8);
    const endTime = performance.now();

    console.log(
      `Job ${chunkIndex + 1}/${totalChunks} completed in ${Math.round(endTime - startTime)}ms. Found ${workingProxies.length} working proxies.`,
    );

    if (workingProxies.length > 0) {
      const jsonOutput = workingProxies.map(p => JSON.stringify(p)).join('\n') + '\n';
      fs.writeFileSync('working_proxies_partial.txt', jsonOutput);
    } else {
      fs.writeFileSync('working_proxies_partial.txt', '');
    }

    console.log(`\n=== Chunk ${chunkIndex + 1} Summary ===`);
    console.log(`Total tested: ${proxiesToCheck.length}`);
    console.log(`Working proxies: ${workingProxies.length}`);
    console.log(
      `Success rate: ${((workingProxies.length / proxiesToCheck.length) * 100).toFixed(2)}%`,
    );
  } catch (error) {
    console.error('An unexpected error occurred in test-proxies.js:', error);
    process.exit(1);
  }
}

main();
