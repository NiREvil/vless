// Default DNS over HTTPS address
const defaultdoh = 'https://cloudflare-dns.com/dns-query';

// Security headers
const csp =
  "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';";
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': csp,
};

// Regex for extracting session token from cookies
const sessionTokenRegex = /sessionToken=([^;]+)/;

// Fetch event listener
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

// Main request handler
async function handleRequest(request) {
  const url = new URL(request.url);
  const sessionToken = getSessionToken(request.headers.get('cookie'));
  // @ts-ignore
  const storedSessionToken = await SETTINGS.get('sessionToken');

  // Route handling
  if (url.pathname === '/dns-query') {
    return handleDnsQuery(request);
  } else if (url.pathname === '/set-doh-address' && request.method === 'POST') {
    return handleSetDohAddress(request);
  } else if (url.pathname === '/reset-doh-address' && request.method === 'POST') {
    return handleResetDohAddress();
  } else if (url.pathname === '/set-password' && request.method === 'GET') {
    return handleGetSetPassword(url);
  } else if (url.pathname === '/set-password' && request.method === 'POST') {
    return handlePostSetPassword(request);
  } else if (url.pathname === '/change-password' && request.method === 'GET') {
    return handleGetChangePassword(url, sessionToken, storedSessionToken);
  } else if (url.pathname === '/change-password' && request.method === 'POST') {
    return handlePostChangePassword(request, sessionToken, storedSessionToken);
  } else if (url.pathname === '/login' && request.method === 'GET') {
    return handleGetLogin(url, sessionToken, storedSessionToken);
  } else if (url.pathname === '/login' && request.method === 'POST') {
    return handlePostLogin(request, sessionToken, storedSessionToken);
  } else if (url.pathname === '/logout' && request.method === 'POST') {
    return handleLogout();
  } else if (url.pathname === '/') {
    return handleRoot(url, sessionToken, storedSessionToken);
  } else {
    return new Response(notFoundHtml, {
      headers: {
        'Content-Type': 'text/html',
        ...securityHeaders,
      },
      status: 404,
    });
  }
}

// Helper functions

async function handleDnsQuery(request) {
  const dohaddress = await getDohAddress();
  const dnsQuery = await request.text();
  const dnsResponse = await fetch(dohaddress, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/dns-message',
    },
    body: dnsQuery,
  });

  return new Response(dnsResponse.body, {
    headers: {
      'Content-Type': 'application/dns-message',
      ...securityHeaders,
    },
  });
}

async function handleSetDohAddress(request) {
  try {
    const { dohaddress } = await request.json();
    if (!isValidUrl(dohaddress)) {
      return new Response('Invalid DNS over HTTPS Address', {
        status: 400,
        headers: securityHeaders,
      });
    }
    // @ts-ignore
    await SETTINGS.put('dohaddress', dohaddress);
    return new Response('DNS over HTTPS Address saved!', { status: 200, headers: securityHeaders });
  } catch (error) {
    return new Response('Failed to save DNS over HTTPS Address', {
      status: 500,
      headers: securityHeaders,
    });
  }
}

async function handleResetDohAddress() {
  try {
    // @ts-ignore
    await SETTINGS.put('dohaddress', defaultdoh);
    return new Response('DNS over HTTPS Address reset to default!', {
      status: 200,
      headers: securityHeaders,
    });
  } catch (error) {
    return new Response('Failed to reset DNS over HTTPS Address', {
      status: 500,
      headers: securityHeaders,
    });
  }
}

async function handleGetSetPassword(url) {
  const storedPassword = await SETTINGS.get('password');
  if (storedPassword) {
    const origin = `${url.protocol}//${url.host}`;
    return Response.redirect(`${origin}/`, 302);
  }
  return new Response(setPasswordHtml, {
    headers: {
      'Content-Type': 'text/html',
      ...securityHeaders,
    },
  });
}

async function handlePostSetPassword(request) {
  const storedPassword = await SETTINGS.get('password');
  if (storedPassword) {
    return new Response('Password already set', { status: 400, headers: securityHeaders });
  }
  try {
    const { password, confirmPassword } = await request.json();
    if (password !== confirmPassword) {
      return new Response('Passwords do not match', { status: 400, headers: securityHeaders });
    }
    // @ts-ignore
    await SETTINGS.put('password', password);
    return new Response('Password set!', { status: 200, headers: securityHeaders });
  } catch (error) {
    return new Response('Failed to set password', { status: 500, headers: securityHeaders });
  }
}

async function handleGetChangePassword(url, sessionToken, storedSessionToken) {
  if (!sessionToken || sessionToken !== storedSessionToken) {
    const origin = `${url.protocol}//${url.host}`;
    return Response.redirect(`${origin}/login`, 302);
  }
  return new Response(changePasswordHtml, {
    headers: {
      'Content-Type': 'text/html',
      ...securityHeaders,
    },
  });
}

async function handlePostChangePassword(request, sessionToken, storedSessionToken) {
  if (!sessionToken || sessionToken !== storedSessionToken) {
    const origin = `${url.protocol}//${url.host}`;
    return Response.redirect(`${origin}/login`, 302);
  }
  try {
    const { currentPassword, newPassword, confirmNewPassword } = await request.json();
    const storedPassword = await SETTINGS.get('password');
    if (currentPassword !== storedPassword) {
      return new Response('Current password is incorrect', {
        status: 400,
        headers: securityHeaders,
      });
    }
    if (newPassword !== confirmNewPassword) {
      return new Response('New passwords do not match', { status: 400, headers: securityHeaders });
    }
    // @ts-ignore
    await SETTINGS.put('password', newPassword);
    return new Response('Password changed!', { status: 200, headers: securityHeaders });
  } catch (error) {
    return new Response('Failed to change password', { status: 500, headers: securityHeaders });
  }
}

async function handleGetLogin(url, sessionToken, storedSessionToken) {
  const storedPassword = await SETTINGS.get('password');
  if (!storedPassword) {
    return Response.redirect(`${url.protocol}//${url.host}/set-password`, 302);
  }
  if (sessionToken && sessionToken === storedSessionToken) {
    const origin = `${url.protocol}//${url.host}`;
    return Response.redirect(`${origin}/`, 302);
  }
  return new Response(loginHtml, {
    headers: {
      'Content-Type': 'text/html',
      ...securityHeaders,
    },
  });
}

async function handlePostLogin(request, sessionToken, storedSessionToken) {
  if (sessionToken && sessionToken === storedSessionToken) {
    const origin = `${request.url.protocol}//${request.url.host}`;
    return Response.redirect(`${origin}/`, 302);
  }
  try {
    const { password } = await request.json();
    const storedPassword = await SETTINGS.get('password');
    if (password === storedPassword) {
      const newSessionToken = generateSessionToken();
      // @ts-ignore
      await SETTINGS.put('sessionToken', newSessionToken);
      return new Response('Login successful', {
        status: 200,
        headers: {
          'Set-Cookie': `sessionToken=${newSessionToken}; Path=/; HttpOnly; Secure; SameSite=Strict`,
          ...securityHeaders,
        },
      });
    } else {
      return new Response('Invalid password', { status: 401, headers: securityHeaders });
    }
  } catch (error) {
    return new Response('Failed to login', { status: 500, headers: securityHeaders });
  }
}

async function handleLogout() {
  try {
    // @ts-ignore
    await SETTINGS.delete('sessionToken');
    return new Response('Logout successful', {
      status: 200,
      headers: {
        'Set-Cookie': 'sessionToken=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
        ...securityHeaders,
      },
    });
  } catch (error) {
    return new Response('Failed to logout', { status: 500, headers: securityHeaders });
  }
}

async function handleRoot(url, sessionToken, storedSessionToken) {
  const storedPassword = await SETTINGS.get('password');
  if (!storedPassword) {
    return new Response(setPasswordHtml, {
      headers: {
        'Content-Type': 'text/html',
        ...securityHeaders,
      },
    });
  } else if (!sessionToken || sessionToken !== storedSessionToken) {
    const origin = `${url.protocol}//${url.host}`;
    return Response.redirect(`${origin}/login`, 302);
  }
  const currentdohaddress = await getDohAddress();
  const origin = `${url.protocol}//${url.host}`;
  const htmlContent = html
    .replace('{{dohaddress}}', currentdohaddress)
    .replace('{{origin}}', origin);
  return new Response(htmlContent, {
    headers: {
      'Content-Type': 'text/html',
      ...securityHeaders,
    },
  });
}

async function getDohAddress() {
  try {
    // @ts-ignore
    const dohaddress = await SETTINGS.get('dohaddress');
    return dohaddress || defaultdoh;
  } catch (error) {
    return defaultdoh;
  }
}

function getSessionToken(cookie) {
  return cookie?.match(sessionTokenRegex)?.[1];
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function generateSessionToken() {
  return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
}

const setPasswordHtml = `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Set Password</title>
  <style>
      * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    :root {
      --background: #010409;
      --container-bg: #0D1117;
      --input-bg: #262C36;
      --border-color: #3D444D;
      --text-primary: #F0F6FC;
      --text-secondary: #7A8189;
      --button-primary: #1F6FEB;
      --button-hover: #4088F1;
      --button-secondary: #262C36;
      --button-secondary-hover: #363f4d;
      --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
    }
    
    body {
      font-family: var(--font-family);
      background-color: var(--background);
      color: var(--text-primary);
      mmargin-top: 10px;
      padding: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      line-height: 1.5;
    }
    
    .container, .panel-container {
      background-color: var(--container-bg);
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
      width: 100%;
      max-width: 500px;
      margin: 0 auto;
      text-align: center;
      border: 1px solid var(--border-color);
    }
    
    h1 {
      margin-bottom: 24px;
      font-weight: 600;
      font-size: 1.5rem;
      letter-spacing: -0.025em;
    }
    
    form {
      margin-bottom: 24px;
    }
    
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      font-size: 0.9rem;
      color: var(--text-secondary);
      text-align: left;
    }
    
    input[type="password"] {
      width: calc(100% - 24px);
      padding: 12px;
      margin-bottom: 16px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background-color: var(--input-bg);
      color: var(--text-primary);
      font-family: var(--font-family);
      font-size: 0.95rem;
      transition: border-color 0.2s ease-in-out;
    }
    
    input[type="password"]:focus {
      outline: none;
      border-color: var(--button-primary);
    }
    
    button {
      padding: 12px 20px;
      background-color: var(--button-primary);
      color: var(--text-primary);
      border: none;
      border-radius: 8px;
      cursor: pointer;
      width: 100%;
      max-width: 200px;
      margin: 12px auto;
      font-weight: 500;
      font-size: 0.95rem;
      transition: background-color 0.2s ease-in-out;
    }
    
    button:hover {
      background-color: var(--button-hover);
    }
    
    .message {
      margin-top: 20px;
      color: #ff4d4f;
      font-size: 0.9rem;
    }
    
    .message.success {
      color: #52c41a;
    }
    
    @media (max-width: 768px) {
      .container {
        padding: 20px;
        margin: 12px;
      }
      
      h1 {
        font-size: 1.4rem;
      }
      
      input[type="password"] {
        padding: 10px;
      }
      
      button {
        padding: 10px 16px;
        font-size: 0.9rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Set Password</h1>
    <form id="passwordForm">
      <label for="password">Password:</label>
      <input type="password" id="password" name="password" required>
      <label for="confirmPassword">Confirm Password:</label>
      <input type="password" id="confirmPassword" name="confirmPassword" required>
      <button type="submit">Set Password</button>
    </form>
    <div class="message" id="message"></div>
  </div>

  <script>
    document.getElementById('passwordForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const response = await fetch('/set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password, confirmPassword }),
      });

      const message = document.getElementById('message');
      if (response.ok) {
        message.textContent = 'Password set!';
        message.className = 'message success';
        window.location.href = '/login';
      } else if (response.status === 400) {
        const errorText = await response.text();
        message.textContent = errorText;
        message.className = 'message';
        document.getElementById('password').value = ''; 
        document.getElementById('confirmPassword').value = ''; 
      } else {
        message.textContent = 'Failed to set password';
        message.className = 'message';
        document.getElementById('password').value = ''; 
        document.getElementById('confirmPassword').value = ''; 
      }
    });
  </script>
</body>
</html>
`;

// Login HTML
const loginHtml = `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login</title>
  <style>
      * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    :root {
      --background: #010409;
      --container-bg: #0D1117;
      --input-bg: #262C36;
      --border-color: #3D444D;
      --text-primary: #F0F6FC;
      --text-secondary: #7A8189;
      --button-primary: #1F6FEB;
      --button-hover: #4088F1;
      --button-secondary: #262C36;
      --button-secondary-hover: #363f4d;
      --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
    }
    
    body {
      font-family: var(--font-family);
      background-color: var(--background);
      color: var(--text-primary);
      mmargin-top: 10px;
      padding: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      line-height: 1.5;
    }
    
    .container, .panel-container {
      background-color: var(--container-bg);
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
      width: 100%;
      max-width: 500px;
      margin: 0 auto;
      text-align: center;
      border: 1px solid var(--border-color);
    }
    
    h1 {
      margin-bottom: 24px;
      font-weight: 600;
      font-size: 1.5rem;
      letter-spacing: -0.025em;
    }
    
    form {
      margin-bottom: 24px;
    }
    
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      font-size: 0.9rem;
      color: var(--text-secondary);
      text-align: left;
    }
    
    input[type="password"] {
      width: calc(100% - 24px);
      padding: 12px;
      margin-bottom: 16px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background-color: var(--input-bg);
      color: var(--text-primary);
      font-family: var(--font-family);
      font-size: 0.95rem;
      transition: border-color 0.2s ease-in-out;
    }
    
    input[type="password"]:focus {
      outline: none;
      border-color: var(--button-primary);
    }
    
    button {
      padding: 12px 20px;
      background-color: var(--button-primary);
      color: var(--text-primary);
      border: none;
      border-radius: 8px;
      cursor: pointer;
      width: 100%;
      max-width: 200px;
      margin: 12px auto;
      font-weight: 500;
      font-size: 0.95rem;
      transition: background-color 0.2s ease-in-out;
    }
    
    button:hover {
      background-color: var(--button-hover);
    }
    
    .message {
      margin-top: 20px;
      color: #ff4d4f;
      font-size: 0.9rem;
    }
    
    @media (max-width: 768px) {
      .container {
        padding: 20px;
        margin: 12px;
      }
      
      h1 {
        font-size: 1.4rem;
      }
      
      input[type="password"] {
        padding: 10px;
      }
      
      button {
        padding: 10px 16px;
        font-size: 0.9rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Login</h1>
    <form id="loginForm">
      <label for="password">Password:</label>
      <input type="password" id="password" name="password" required>
      <button type="submit">Login</button>
    </form>
    <div class="message" id="message"></div>
  </div>

  <script>
    document.getElementById('loginForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const password = document.getElementById('password').value;
      const response = await fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const message = document.getElementById('message');
      if (response.ok) {
        message.textContent = 'Login successful';
        message.style.color = '#1F6FEB';
        window.location.href = '/';
      } else {
        message.textContent = 'Invalid password';
        document.getElementById('password').value = ''; // Clear the input field
      }
    });
  </script>
</body>
</html>
`;

// Change Password HTML
const changePasswordHtml = `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Change Password</title>
  <style>
      * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    :root {
      --background: #010409;
      --container-bg: #0D1117;
      --input-bg: #262C36;
      --border-color: #3D444D;
      --text-primary: #F0F6FC;
      --text-secondary: #7A8189;
      --button-primary: #1F6FEB;
      --button-hover: #4088F1;
      --button-secondary: #262C36;
      --button-secondary-hover: #363f4d;
      --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
    }
    
    body {
      font-family: var(--font-family);
      background-color: var(--background);
      color: var(--text-primary);
      mmargin-top: 10px;
      padding: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      line-height: 1.5;
    }
    
    .container, .panel-container {
      background-color: var(--container-bg);
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
      width: 100%;
      max-width: 500px;
      margin: 0 auto;
      text-align: center;
      border: 1px solid var(--border-color);
    }
    
    h1 {
      margin-bottom: 24px;
      font-weight: 600;
      font-size: 1.5rem;
      letter-spacing: -0.025em;
    }
    
    form {
      margin-bottom: 24px;
    }
    
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      font-size: 0.9rem;
      color: var(--text-secondary);
      text-align: left;
    }
    
    input[type="password"] {
      width: calc(100% - 24px);
      padding: 12px;
      margin-bottom: 16px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background-color: var(--input-bg);
      color: var(--text-primary);
      font-family: var(--font-family);
      font-size: 0.95rem;
      transition: border-color 0.2s ease-in-out;
    }
    
    input[type="password"]:focus {
      outline: none;
      border-color: var(--button-primary);
    }
    
    button {
      padding: 12px 20px;
      background-color: var(--button-primary);
      color: var(--text-primary);
      border: none;
      border-radius: 8px;
      cursor: pointer;
      width: 100%;
      max-width: 200px;
      margin: 12px auto;
      font-weight: 500;
      font-size: 0.95rem;
      transition: background-color 0.2s ease-in-out;
    }
    
    button:hover {
      background-color: var(--button-hover);
    }
    
    .message {
      margin-top: 20px;
      color: #ff4d4f;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Change Password</h1>
    <form id="changePasswordForm">
      <label for="currentPassword">Current Password:</label>
      <input type="password" id="currentPassword" name="currentPassword" required>
      <label for="newPassword">New Password:</label>
      <input type="password" id="newPassword" name="newPassword" required>
      <label for="confirmNewPassword">Confirm New Password:</label>
      <input type="password" id="confirmNewPassword" name="confirmNewPassword" required>
      <button type="submit">Change Password</button>
    </form>
    <div class="message" id="message"></div>
  </div>

  <script>
    document.getElementById('changePasswordForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const currentPassword = document.getElementById('currentPassword').value;
      const newPassword = document.getElementById('newPassword').value;
      const confirmNewPassword = document.getElementById('confirmNewPassword').value;
      const response = await fetch('/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
      });

      const message = document.getElementById('message');
      if (response.ok) {
        message.textContent = 'Password changed!';
        message.style.color = '#1F6FEB';
        window.location.href = '/';
      } else {
        message.textContent = 'Failed to change password';
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmNewPassword').value = '';
      }
    });
  </script>
</body>
</html>
`;

// Main Application HTML
const html = `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Azadi DNS Panel</title>
  <style>
      * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    :root {
      --background: #010409;
      --container-bg: #0D1117;
      --input-bg: #262C36;
      --border-color: #3D444D;
      --text-primary: #F0F6FC;
      --text-secondary: #7A8189;
      --button-primary: #1F6FEB;
      --button-hover: #4088F1;
      --button-secondary: #262C36;
      --button-secondary-hover: #363f4d;
      --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
      --font-family-sans: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
    }
    
    body {
      font-family: var(--font-family);
      background-color: var(--background);
      color: var(--text-primary);
      mmargin-top: 10px;
      padding: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      line-height: 1.5;
    }
    
    .container, .panel-container {
      background-color: var(--container-bg);
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
      width: 100%;
      max-width: 500px;
      margin: 0 auto;
      text-align: center;
      border: 1px solid var(--border-color);
    }
    
    .panel-container {
      margin-top: 26px;
      display: flex;
      justify-content: center;
      gap: 12px;
    }
    
    h1 {
      margin-bottom: 20px;
      font-weight: 600;
      font-size: 1.5rem;
      letter-spacing: -0.025em;
    }
    
    form {
      margin-bottom: 20px;
    }
    
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: bold;
      font-size: 0.9rem;
      color: var(--text-secondary);
      text-align: left;
    }
    
    input[type="text"] {
      width: calc(100% - 24px);
      padding: 12px;
      margin-bottom: 16px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background-color: var(--input-bg);
      color: var(--text-primary);
      font-family: var(--font-family-sans);
      font-size: 0.98rem;
      transition: border-color 0.2s ease-in-out;
    }
    
    input[type="text"]:focus {
      outline: none;
      border-color: var(--button-primary);
    }
    
    button {
      padding: 12px 20px;
      background-color: var(--button-secondary);
      color: var(--text-primary);
      border: none;
      border-radius: 8px;
      cursor: pointer;
      width: 100%;
      max-width: 200px;
      margin: 12px auto;
      font-weight: 500;
      font-size: 0.95rem;
      transition: background-color 0.2s ease-in-out;
    }
    
    #copyazadidoh, button[type="submit"] {
      background-color: var(--button-primary);
    }
    
    #copyazadidoh:hover, button[type="submit"]:hover {
      background-color: var(--button-hover);
    }
    
    button:hover {
      background-color: var(--button-secondary-hover);
    }
    
    .alert {
      position: absolute;
      left: 50px;
      top: 20px;
      margin: 20px
      transform: translateX(-50%);
      padding: 12px 20px;
      background-color: var(--container-bg);
      color: var(--text-primary);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
      z-index: 1000;
      display: none;
      border: 1px solid var(--border-color);
    }
    
    .footer { 
      text-align: center;        
      font-family: ui-serif, Georgia, Cambria; 
      font-size: 0.9em;
      color: #EAEAE8;     
      margin-top: 10px;    
    }
    
    .footer a {
      color: #0969DA;  
      text-decoration: none;  
    }
    
    .footer a:hover {
      text-decoration: underline; 
    }
      
    
    @media (max-width: 768px) {
      .container, .panel-container {
        padding: 20px;
        margin: 12px;
      }

      /* Scrollbar Styling */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }

        ::-webkit-scrollbar-track {
            background: #262626;
            border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
            background: #404040;
            border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: #525252;
        }
      
      h1 {
        font-size: 1.4rem;
      }
      
      input[type="text"] {
        padding: 10px;
      }
      
      button {
        padding: 12px 20px;
        font-size: 0.9rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Azadi DNS Panel</h1>
    <form id="dohForm">
      <label for="dohaddress">DNS over HTTPS Address:</label>
      <input type="text" id="dohaddress" name="dohaddress" value="{{dohaddress}}" required>
      <button type="submit">Save</button>
      <button type="button" id="resetButton">Reset to Default</button>
    </form>
    <label for="azadidoh">Azadi DoH:</label>
    <input type="text" id="azadidoh" name="azadidoh" value="{{origin}}/dns-query" readonly>
    <button id="copyazadidoh">Copy</button>
  </div>
  <div class="panel-container">
    <button id="changePasswordButton">Change Password</button>
    <button id="logoutButton">Logout</button>
  </div>
  <div class="footer">
  <p>
    Credits: <a href="https://github.com/AzadiAzadiAzadi/AzadiDNSPanel" target="_blank">Azadi</a> - Revised by <a href="https://github.com/NiREvil/vless" target="_blank">Diana</a>
  </p>
</div>
  <div id="alert" class="alert"></div>

  <script>
    // Function to show alerts
    function showAlert(message, duration = 3000) {
      const alert = document.getElementById('alert');
      alert.textContent = message;
      alert.style.display = 'block';
      
      setTimeout(() => {
        alert.style.display = 'none';
      }, duration);
    }
    
    document.getElementById('dohForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const dohaddress = document.getElementById('dohaddress').value;
      const response = await fetch('/set-doh-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dohaddress }),
      });

      if (response.ok) {
        showAlert('DNS over HTTPS Address saved!');
      } else {
        showAlert('Failed to save DNS over HTTPS Address');
      }
    });

    document.getElementById('copyazadidoh').addEventListener('click', () => {
      const azadidoh = document.getElementById('azadidoh');
      azadidoh.select();
      document.execCommand('copy');
      showAlert('DoH copied to clipboard!');
    });

    document.getElementById('resetButton').addEventListener('click', async () => {
      const response = await fetch('/reset-doh-address', {
        method: 'POST',
      });

      if (response.ok) {
        showAlert('DNS over HTTPS Address reset to default!');
        document.getElementById('dohaddress').value = '${defaultdoh}';
      } else {
        showAlert('Failed to reset DNS over HTTPS Address');
      }
    });

    document.getElementById('changePasswordButton').addEventListener('click', () => {
      window.location.href = '/change-password';
    });

    document.getElementById('logoutButton').addEventListener('click', async () => {
      const response = await fetch('/logout', {
        method: 'POST',
      });

      if (response.ok) {
        // Clear the browser history and replace the current state with the login page
        history.replaceState(null, '', '/login');
        window.location.href = '/login';
      } else {
        showAlert('Failed to logout');
      }
    });
  </script>
</body>
</html>
`;

const errorHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
      background-color: #010409;
      color: #F0F6FC;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }
    .container {
      background-color: #0D1117;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
      width: 100%;
      max-width: 400px;
      text-align: center;
    }
    h1 {
      margin-bottom: 24px;
    }
    p {
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Error</h1>
    <p>KV namespace does not exist. Please configure it, KV value is "SETTINGS".</p>
  </div>
</body>
</html>
`;

const notFoundHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Not Found</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
      background-color: #010409;
      color: #F0F6FC;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }
    .container {
      background-color: #0D1117;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
      width: 100%;
      max-width: 400px;
      text-align: center;
    }
    h1 {
      margin-bottom: 24px;
    }
    p {
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Not Found</h1>
    <p>The page you are looking for does not exist.</p>
  </div>
</body>
</html>
`;
