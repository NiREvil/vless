import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');

const resultsPath = path.join(projectRoot, 'all_working_proxies.txt');
const outputPath = path.join(projectRoot, 'sub', 'ProxyIP-Daily.md');
const outputDir = path.dirname(outputPath);

try {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let proxies = [];
  if (fs.existsSync(resultsPath)) {
    const rawContent = fs.readFileSync(resultsPath, 'utf-8');
    if (rawContent.trim() !== '') {
      proxies = rawContent
        .split(/\r?\n/)
        .filter(line => line.trim() !== '')
        .map(line => JSON.parse(line));
    }
  }

  let markdownContent = `## Active proxies (Port 443)\n\n`;
  markdownContent += `*Last updated on: ${new Date().toUTCString()}*\n`;
  markdownContent += `*Total working proxies found: ${proxies.length}*\n\n`;

  if (proxies.length > 0) {
    markdownContent += `| Proxy IP | Location | ISP / Organization |\n`;
    markdownContent += `|----------|----------|--------------------|\n`;

    proxies.sort((a, b) => (a.ip || '').localeCompare(b.ip || ''));

    proxies.forEach(proxy => {
      const ip = proxy.ip || 'N/A';
      const location = `${proxy.city || 'N/A'}, ${proxy.country || 'N/A'}`;
      const isp = proxy.as || 'N/A';

      markdownContent += `| \`${ip}\` | ${location} | ${isp} |\n`;
    });
  } else {
    markdownContent += `No working proxies were found in this run.\n`;
  }

  fs.writeFileSync(outputPath, markdownContent);
  console.log(
    `Successfully generated ${path.basename(outputPath)} with ${proxies.length} proxies.`,
  );
} catch (error) {
  console.error('An error occurred in generate-markdown.js:', error);
  process.exit(1);
}
