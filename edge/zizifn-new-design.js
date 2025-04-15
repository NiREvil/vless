/* - New design for zizifn
 * - Mocha mousse color style
 * - https://www.pantone.com/color-of-the-year/2025
 * - https://github.com/NiREvil/zizifn
 * - Replace in line 535
 */
function getDianaConfig(userCode, hostName) {
  const protocol = decodeSecure(ENCODED.PROTOCOL);
  const networkType = decodeSecure(ENCODED.NETWORK);

  const baseUrl = `${protocol}://${userCode}@${hostName}:443`;
  const commonParams =
    `encryption=none&host=${hostName}&type=${networkType}` + `&security=tls&sni=${hostName}`;

  // Configuration for Sing-Box core clients
  const freedomConfig =
    `${baseUrl}?path=/api/v4&eh=Sec-WebSocket-Protocol` +
    `&ed=2560&${commonParams}&fp=chrome&alpn=h3#${hostName}`;

  // Configuration for Xray core clients
  const dreamConfig =
    `${baseUrl}?path=/api/v2?ed=2048&${commonParams}` +
    `&fp=randomized&alpn=h2,http/1.1#${hostName}`;

  // URL for Clash Meta subscription import
  const clashMetaFullUrl = `clash://install-config?url=${encodeURIComponent(
    `https://sub.victoriacross.ir/sub/clash-meta?url=${encodeURIComponent(freedomConfig)}&remote_config=&udp=true&ss_uot=false&show_host=false&forced_ws0rtt=false`,
  )}`; // for using v2ray to clash-meta converter visit here: https://sub.victoriacross.ir/

  // HTML content
  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Proxy Configuration</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      :root {
        /* Mocha Mousse Palette - Lighter Version */
        --mocha-50: #f9f6f3;
        --mocha-100: #f2ebe5;
        --mocha-200: #e8dfd8;
        --mocha-300: #d6c7bc;
        --mocha-400: #c1a58b; /* Mocha Mousse */
        --mocha-500: #9a826c;
        --mocha-600: #7d6a58;
        --mocha-700: #5d4a40;
        --mocha-800: #3d332c;
        --mocha-900: #2a2420;
        --background-primary: var(--mocha-100);
        --background-secondary: var(--mocha-50);
        --background-tertiary: white;
        --border-color: var(--mocha-300);
        --border-color-hover: var(--mocha-400);
        --text-primary: var(--mocha-800);
        --text-secondary: var(--mocha-600);
        --text-accent: var(--mocha-900);
        --accent-primary: var(--mocha-400);
        --accent-primary-darker: var(--mocha-500);
        --button-text-primary: white;
        --button-text-secondary: var(--mocha-700);
        --shadow-color: rgba(0, 0, 0, 0.08);
        --shadow-color-accent: rgba(193, 165, 139, 0.2);
        --border-radius: 12px;
        --transition-speed: 0.2s;
      }

      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
          Roboto, Helvetica, Arial, sans-serif;
        font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background-color: var(--background-primary);
        color: var(--text-primary);
        line-height: 1.5;
      }

      .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 24px 16px;
      }

      .header {
        text-align: center;
        margin-bottom: 40px;
      }

      .header h1 {
        font-weight: 700;
        color: var(--text-accent);
        font-size: 28px;
        margin-bottom: 8px;
      }

      .header p {
        color: var(--text-secondary);
        font-size: 14px;
      }

      .config-card {
        background: var(--background-secondary);
        border-radius: var(--border-radius);
        padding: 24px;
        margin-bottom: 24px;
        border: 1px solid var(--border-color);
        transition: all var(--transition-speed) ease;
        box-shadow: 0 2px 8px var(--shadow-color);
      }

      .config-card:hover {
        border-color: var(--border-color-hover);
        box-shadow: 0 4px 12px var(--shadow-color-accent);
      }

      .config-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-accent);
        margin-bottom: 4px; /* Reduced margin to bring examples closer */
        padding-bottom: 12px;
        border-bottom: 1px solid var(--border-color);
      }

      /* Style for the example client names */
      .client-examples {
        font-size: 0.8rem; /* Small font size */
        font-style: italic;
        color: var(--text-secondary);
        margin-bottom: 16px; /* Space before the config content */
        margin-top: -8px; /* Pull closer to the title */
      }

      .config-content {
        position: relative;
        background: var(--background-tertiary);
        border-radius: var(--border-radius);
        padding: 16px;
        margin-bottom: 20px;
        border: 1px solid var(--border-color);
        overflow: hidden;
      }

      .config-content pre {
        overflow-x: auto;
        font-family: 'IBM Plex Mono', Consolas, monospace;
        font-size: 13px;
        font-weight: 400;
        line-height: 1.6;
        color: var(--text-primary);
        margin: 0;
        white-space: pre-wrap;
        word-break: break-all;
      }

      .attributes {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 20px;
        margin-bottom: 16px;
      }

      .attribute {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .attribute span {
        font-size: 13px;
        color: var(--text-secondary);
      }

      .attribute strong {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-accent);
        word-break: break-all;
      }

      .status-indicator {
        display: inline-flex;
        align-items: center;
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: var(--accent-primary);
        margin-right: 8px;
      }

      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 8px 16px;
        border-radius: var(--border-radius);
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        font-weight: 500;
        text-decoration: none;
        cursor: pointer;
        border: 1px solid var(--border-color);
        background-color: var(--background-tertiary);
        color: var(--button-text-secondary);
        transition: all var(--transition-speed) ease;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
        user-select: none;
        -webkit-user-select: none;
        position: relative;
        overflow: hidden;
      }

      .button:hover {
        background-color: var(--mocha-200);
        border-color: var(--border-color-hover);
        transform: translateY(-1px);
        box-shadow: 0 4px 8px var(--shadow-color);
      }

      .button:active {
        transform: translateY(0px) scale(0.98);
        box-shadow: none;
      }

      .button:focus-visible {
        outline: 2px solid var(--accent-primary);
        outline-offset: 2px;
      }

      .copy-btn {
        position: absolute;
        top: 12px;
        right: 12px;
        padding: 6px 12px;
        font-size: 12px;
        font-family: 'IBM Plex Mono', monospace;
        font-weight: 500;
      }

      .copy-btn.copied {
        background-color: var(--accent-primary);
        color: white;
        border-color: var(--accent-primary-darker);
      }

      .client-buttons {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 12px;
        margin-top: 16px;
      }

      .client-btn {
        width: 100%;
      }

      .client-icon {
        width: 20px;
        height: 20px;
        border-radius: 4px;
        background-color: var(--mocha-300);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .client-icon svg {
        width: 14px;
        height: 14px;
        fill: white;
      }

      .footer {
        text-align: center;
        margin-top: 40px;
        padding-bottom: 20px;
        color: var(--text-secondary);
        font-size: 13px;
        font-weight: 400;
      }

      .footer p {
        margin-bottom: 4px;
      }

      /* Custom scrollbar styling */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      ::-webkit-scrollbar-track {
        background: var(--background-secondary);
        border-radius: 4px;
      }

      ::-webkit-scrollbar-thumb {
        background: var(--mocha-300);
        border-radius: 4px;
        border: 2px solid var(--background-secondary);
      }

      ::-webkit-scrollbar-thumb:hover {
        background: var(--mocha-400);
      }

      * {
        scrollbar-width: thin;
        scrollbar-color: var(--mocha-300) var(--background-secondary);
      }

      @media (max-width: 768px) {
        body {
          padding: 16px 0;
        }
        .container {
          padding: 0 16px;
        }
        .header h1 {
          font-size: 24px;
        }
        .header p {
          font-size: 13px;
        }
        .config-card {
          padding: 16px;
        }
        .config-title {
          font-size: 16px;
        }
        .client-examples {
            font-size: 0.75rem; /* Slightly smaller on mobile */
        }
        .config-content pre {
          font-size: 12px;
        }
        .attributes {
          grid-template-columns: 1fr;
          gap: 16px;
        }
        .client-buttons {
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        }
        .button {
          padding: 8px 12px;
          font-size: 13px;
        }
        .copy-btn {
          top: 10px;
          right: 10px;
        }
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-thumb {
          border-width: 1px;
        }
      }

      @media (max-width: 480px) {
        .client-buttons {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>

  <body>
    <div class="container">
      <div class="header">
        <h1>VLESS Proxy Configuration</h1>
        <p>Copy the configuration or import directly into your client</p>
      </div>

      <!-- Proxy Info Card -->
      <div class="config-card">
        <div class="config-title">Proxy Information</div>
        <div class="attributes">
          <div class="attribute">
            <span>Proxy IP / Host:</span>
            <strong id="proxyIP">${proxyIP || 'Loading...'}</strong>
          </div>
          <div class="attribute">
            <span>Status:</span>
            <strong class="status-indicator">
              <span class="status-dot"></span>
              Active
            </strong>
          </div>
        </div>
      </div>

      <!-- Xray Core Clients -->
      <div class="config-card">
        <div class="config-title">Xray Core Clients</div>
        <p class="client-examples">e.g., V2rayNG, Nika|MahsaNG, Hiddify, Streisand.</p>
        <div class="config-content">
          <button
            class="button copy-btn"
            onclick="copyToClipboard(this, '${dreamConfig}')"
          >
            Copy
          </button>
          <pre>${dreamConfig}</pre>
        </div>

        <div class="client-buttons">
          <!-- Hiddify -->
          <a
            href="hiddify://install-config?url=${encodeURIComponent(freedomConfig)}"
            class="button client-btn"
          >
            <div class="client-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                />
              </svg>
            </div>
            Import to Hiddify
          </a>

          <!-- V2rayNG -->
          <a
            href="v2rayng://install-config?url=${encodeURIComponent(dreamConfig)}"
            class="button client-btn"
          >
            <div class="client-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  d="M12 2L4 5v6c0 5.5 3.5 10.7 8 12.3 4.5-1.6 8-6.8 8-12.3V5l-8-3z"
                />
              </svg>
            </div>
            Import to V2rayNG
          </a>
        </div>
      </div>

      <!-- Sing-Box Core Clients -->
      <div class="config-card">
        <div class="config-title">Sing-Box Core Clients</div>
         <p class="client-examples">e.g., NekoBox, Clash Meta, Exclave, Hiddify, Karing.</p>
        <div class="config-content">
          <button
            class="button copy-btn"
            onclick="copyToClipboard(this, '${freedomConfig}')"
          >
            Copy
          </button>
          <pre>${freedomConfig}</pre>
        </div>

        <div class="client-buttons">
          <!-- Clash Meta -->
          <a href="${clashMetaFullUrl}" class="button client-btn">
            <div class="client-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M4 4h16v16H4z" />
                <path d="M10 10h4v4H10z" fill="white" />
                <path d="M14 8H10V4h4z" fill="white" />
                <path d="M4 14h4v4H4z" fill="white" />
              </svg>
            </div>
            Import to Clash Meta
          </a>

          <!-- NekoBox -->
          <a href="${clashMetaFullUrl}" class="button client-btn">
            <div class="client-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
                />
              </svg>
            </div>
            Import to NekoBox
          </a>
        </div>
      </div>

      <div class="footer">
        <p>${new Date().getFullYear()} © REvil. All Right Reserved.</p>
        <p>Secure. Private. Fast.</p>
      </div>
    </div>

    <script>
      function copyToClipboard(button, text) {
        navigator.clipboard
          .writeText(text)
          .then(() => {
            const originalText = button.textContent;
            // Add copied class for styling
            button.classList.add('copied');
            button.textContent = 'Copied!';
            button.disabled = true; // Disable briefly

            setTimeout(() => {
              button.textContent = originalText;
              button.classList.remove('copied');
              button.disabled = false;
            }, 1500);
          })
          .catch((err) => {
            console.error('Failed to copy text: ', err);
            // Optional: Provide visual feedback for error
            const originalText = button.textContent;
            button.textContent = 'Error';
            button.style.backgroundColor = '#D32F2F'; // Example error color
            button.style.color = '#FFFFFF';
            button.style.borderColor = '#B71C1C';
            button.disabled = true;

            setTimeout(() => {
              button.textContent = originalText;
              // Reset styles carefully
              button.style.backgroundColor = '';
              button.style.color = '';
              button.style.borderColor = '';
              button.disabled = false;
            }, 1500);
          });
      }

      // Basic placeholder logic for proxy IP if not passed or resolved
      document.addEventListener('DOMContentLoaded', function () {
        const proxyIPElement = document.getElementById('proxyIP');
        // Check if the content is exactly the template literal placeholder
        // or if it's empty/undefined (adjust check as needed)
        if (
          proxyIPElement &&
          (proxyIPElement.innerText === '${proxyIP || 'Loading...'}' || !proxyIPElement.innerText.trim() || proxyIPElement.innerText === 'Loading...')
        ) {
          // Replace with a generic placeholder if the actual IP wasn't injected
          // You might want to fetch the actual IP here if possible
          proxyIPElement.innerText = 'Resolving...'; // Or keep 'Loading...' or provide a default
        }
      });
    </script>
  </body>
</html>
`;
}
