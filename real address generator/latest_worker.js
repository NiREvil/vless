/**
 * Last update: Saturday, 1 February 2025, 11:59 PM
 * - Real fake address generator.
 * - There are no specific instructions; simply copy and paste it into the Cloudflare worker and hit the deploy button.
 * We are all REvil
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country') || getRandomCountry();
  let address, name, gender, phone, timezone, picture;

  for (let i = 0; i < 100; i++) {
    const location = getRandomLocationInCountry(country);
    const apiUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&zoom=18&addressdetails=1`;

    const response = await fetch(apiUrl, {
      headers: { 'User-Agent': 'Cloudflare Worker' },
    });
    const data = await response.json();

    if (
      data &&
      data.address &&
      data.address.house_number &&
      data.address.road &&
      (data.address.city || data.address.town)
    ) {
      address = formatAddress(data.address, country);
      break;
    }
  }

  if (!address) {
    return new Response('Failed to retrieve detailed address, please refresh', { status: 500 });
  }

  const userData = await fetch('https://randomuser.me/api/');
  const userJson = await userData.json();
  if (userJson?.results?.length > 0) {
    const user = userJson.results[0];
    name = `${user.name.first} ${user.name.last}`;
    gender = user.gender.charAt(0).toUpperCase() + user.gender.slice(1);
    phone = getRandomPhoneNumber(country);
    timezone = user.location.timezone;
    picture = user.picture.large;
  } else {
    name = getRandomName();
    gender = 'Unknown';
    phone = getRandomPhoneNumber(country);
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Real Address Generator</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    :root {
      --primary: #2c3e50;
      --secondary: #3498db;
      --background: #f8f9fa;
    }

    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, var(--background) 0%, #e9ecef 100%);
      color: var(--primary);
    }

    .container {
      max-width: 800px;
      margin: 2rem auto;
      padding: 2rem;
      background: white;
      border-radius: 1rem;
      box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.1);
    }

    .profile-header {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .profile-photo {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid var(--secondary);
    }

    .user-info {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .user-name {
      font-size: 1.8rem;
      margin: 0 0 0.5rem;
      color: var(--primary);
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin: 1.5rem 0;
    }

    .detail-item {
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 0.5rem;
      transition: transform 0.2s;
      cursor: pointer;
      border-left: 4px solid var(--secondary);
    }

    .detail-item:hover {
      transform: translateY(-2px);
    }

    .timezone {
      font-size: 0.9em;
      color: #666;
      margin-top: 0.5rem;
    }

    .button-group {
      display: flex;
      gap: 1rem;
      margin: 2rem 0;
      flex-wrap: wrap;
    }

    .btn {
      padding: 0.8rem 1.5rem;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }

    .btn-primary {
      background: var(--secondary);
      color: white;
    }

    .btn-primary:hover {
      background: #2980b9;
    }

    .btn-secondary {
      background: #e9ecef;
      color: var(--primary);
    }

    .btn-secondary:hover {
      background: #dee2e6;
    }

    .map {
      width: 100%;
      height: 400px;
      border: 0;
      border-radius: 0.5rem;
      margin-top: 2rem;
    }

    .footer {
      text-align: center;
      padding: 2rem;
      color: #888;
      line-height: 1.6;
    }

    .footer a {
      color: var(--secondary);
      text-decoration: none;
      font-weight: 600;
    }

    .footer a:hover {
      text-decoration: underline;
    }

    .copied {
      position: fixed;
      top: 1rem;
      right: 1rem;
      background: #27ae60;
      color: white;
      padding: 0.8rem 1.5rem;
      border-radius: 0.5rem;
      display: none;
      box-shadow: 0 0.25rem 0.5rem rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="profile-header">
      <img src="${picture}" class="profile-photo" alt="Profile picture">
      <div class="user-info">
        <h1 class="user-name">${name}</h1>
        <div class="gender">${gender}</div>
        <div class="timezone">
          ${timezone.description} (UTC${timezone.offset})
        </div>
      </div>
    </div>

    <div class="detail-grid">
      <div class="detail-item" onclick="copyToClipboard('${phone.replace(/[()\s-]/g, '')}')">
        <div class="detail-label">Phone</div>
        <div class="detail-value">${phone}</div>
      </div>
      
      <div class="detail-item" onclick="copyToClipboard('${address}')">
        <div class="detail-label">Address</div>
        <div class="detail-value">${address}</div>
      </div>
    </div>

    <div class="button-group">
      <button class="btn btn-primary" onclick="window.location.reload()">Generate New</button>
      <select class="btn btn-secondary" id="country" onchange="changeCountry(this.value)">
        ${getCountryOptions(country)}
      </select>
    </div>

    <iframe class="map" src="https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed"></iframe>
  </div>

  <div class="footer">
      <div class="footer">
      <div>© 2025 <a href="https://www.legislation.gov.au/C1968A00063/latest/text" target="_blank">Diana</a>, All Rights Reserved</div>
      <div>Supported by <a href="https://github.com/NiREvil/" target="_blank">REvil</a></div>
  </div>

  <div class="copied" id="copied">Copied to clipboard!</div>

  <script>
    function copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        const copied = document.getElementById('copied')
        copied.style.display = 'block'
        setTimeout(() => copied.style.display = 'none', 2000)
      })
    }

    function changeCountry(country) {
      window.location.href = \`?country=\${country}\`
    }
  </script>
</body>
</html>
`;

  return new Response(html, { headers: { 'content-type': 'text/html;charset=UTF-8' } });
}

function getRandomLocationInCountry(country) {
  const countryCoordinates = {
    US: [
      { lat: 37.7749, lng: -122.4194 },
      { lat: 34.0522, lng: -118.2437 },
    ],
    UK: [
      { lat: 51.5074, lng: -0.1278 },
      { lat: 53.4808, lng: -2.2426 },
    ],
    FR: [
      { lat: 48.8566, lng: 2.3522 },
      { lat: 45.764, lng: 4.8357 },
    ],
    DE: [
      { lat: 52.52, lng: 13.405 },
      { lat: 48.1351, lng: 11.582 },
    ],
    CN: [
      { lat: 39.9042, lng: 116.4074 },
      { lat: 31.2304, lng: 121.4737 },
    ],
    JP: [
      { lat: 35.6895, lng: 139.6917 },
      { lat: 34.6937, lng: 135.5023 },
    ],
    IN: [
      { lat: 28.6139, lng: 77.209 },
      { lat: 19.076, lng: 72.8777 },
    ],
    AU: [
      { lat: -33.8688, lng: 151.2093 },
      { lat: -37.8136, lng: 144.9631 },
    ],
    BR: [
      { lat: -23.5505, lng: -46.6333 },
      { lat: -22.9068, lng: -43.1729 },
    ],
    CA: [
      { lat: 43.65107, lng: -79.347015 },
      { lat: 45.50169, lng: -73.567253 },
    ],
    RU: [
      { lat: 55.7558, lng: 37.6173 },
      { lat: 59.9343, lng: 30.3351 },
    ],
    ZA: [
      { lat: -33.9249, lng: 18.4241 },
      { lat: -26.2041, lng: 28.0473 },
    ],
    MX: [
      { lat: 19.4326, lng: -99.1332 },
      { lat: 20.6597, lng: -103.3496 },
    ],
    KR: [
      { lat: 37.5665, lng: 126.978 },
      { lat: 35.1796, lng: 129.0756 },
    ],
    IT: [
      { lat: 41.9028, lng: 12.4964 },
      { lat: 45.4642, lng: 9.19 },
    ],
    ES: [
      { lat: 40.4168, lng: -3.7038 },
      { lat: 41.3851, lng: 2.1734 },
    ],
    TR: [
      { lat: 41.0082, lng: 28.9784 },
      { lat: 39.9334, lng: 32.8597 },
    ],
    SA: [
      { lat: 24.7136, lng: 46.6753 },
      { lat: 21.3891, lng: 39.8579 },
    ],
    AR: [
      { lat: -34.6037, lng: -58.3816 },
      { lat: -31.4201, lng: -64.1888 },
    ],
    EG: [
      { lat: 30.0444, lng: 31.2357 },
      { lat: 31.2156, lng: 29.9553 },
    ],
    NG: [
      { lat: 6.5244, lng: 3.3792 },
      { lat: 9.0579, lng: 7.4951 },
    ],
    ID: [
      { lat: -6.2088, lng: 106.8456 },
      { lat: -7.7956, lng: 110.3695 },
    ],
  };
  const coordsArray = countryCoordinates[country];
  const randomCity = coordsArray[Math.floor(Math.random() * coordsArray.length)];
  const lat = randomCity.lat + (Math.random() - 0.5) * 0.1;
  const lng = randomCity.lng + (Math.random() - 0.5) * 0.1;
  return { lat, lng };
}

function formatAddress(address, country) {
  return `${address.house_number} ${address.road}, ${address.city || address.town || address.village}, ${address.postcode || ''}, ${country}`;
}

function getRandomPhoneNumber(country) {
  const phoneFormats = {
    US: () => {
      const areaCode = Math.floor(200 + Math.random() * 800)
        .toString()
        .padStart(3, '0');
      const exchangeCode = Math.floor(200 + Math.random() * 800)
        .toString()
        .padStart(3, '0');
      const lineNumber = Math.floor(1000 + Math.random() * 9000)
        .toString()
        .padStart(4, '0');
      return `+1 (${areaCode}) ${exchangeCode}-${lineNumber}`;
    },
    UK: () => {
      const areaCode = Math.floor(1000 + Math.random() * 9000).toString();
      const lineNumber = Math.floor(100000 + Math.random() * 900000).toString();
      return `+44 ${areaCode} ${lineNumber}`;
    },
    FR: () => {
      const digit = Math.floor(1 + Math.random() * 8);
      const number = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
      return `+33 ${digit} ${number}`;
    },
    DE: () => {
      const areaCode = Math.floor(100 + Math.random() * 900).toString();
      const number = Array.from({ length: 7 }, () => Math.floor(Math.random() * 10)).join('');
      return `+49 ${areaCode} ${number}`;
    },
    CN: () => {
      const prefix = Math.floor(130 + Math.random() * 60).toString();
      const number = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
      return `+86 ${prefix} ${number}`;
    },
    JP: () => {
      const areaCode = Math.floor(10 + Math.random() * 90).toString();
      const number = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
      return `+81 ${areaCode} ${number}`;
    },
    IN: () => {
      const prefix = Math.floor(700 + Math.random() * 100).toString();
      const number = Array.from({ length: 7 }, () => Math.floor(Math.random() * 10)).join('');
      return `+91 ${prefix} ${number}`;
    },
    AU: () => {
      const areaCode = Math.floor(2 + Math.random() * 8).toString();
      const number = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
      return `+61 ${areaCode} ${number}`;
    },
    BR: () => {
      const areaCode = Math.floor(10 + Math.random() * 90).toString();
      const number = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
      return `+55 ${areaCode} ${number}`;
    },
    CA: () => {
      const areaCode = Math.floor(200 + Math.random() * 800)
        .toString()
        .padStart(3, '0');
      const exchangeCode = Math.floor(200 + Math.random() * 800)
        .toString()
        .padStart(3, '0');
      const lineNumber = Math.floor(1000 + Math.random() * 9000)
        .toString()
        .padStart(4, '0');
      return `+1 (${areaCode}) ${exchangeCode}-${lineNumber}`;
    },
    RU: () => {
      const areaCode = Math.floor(100 + Math.random() * 900).toString();
      const number = Array.from({ length: 7 }, () => Math.floor(Math.random() * 10)).join('');
      return `+7 ${areaCode} ${number}`;
    },
    ZA: () => {
      const areaCode = Math.floor(10 + Math.random() * 90).toString();
      const number = Array.from({ length: 7 }, () => Math.floor(Math.random() * 10)).join('');
      return `+27 ${areaCode} ${number}`;
    },
    MX: () => {
      const areaCode = Math.floor(10 + Math.random() * 90).toString();
      const number = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
      return `+52 ${areaCode} ${number}`;
    },
    KR: () => {
      const areaCode = Math.floor(10 + Math.random() * 90).toString();
      const number = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
      return `+82 ${areaCode} ${number}`;
    },
    IT: () => {
      const areaCode = Math.floor(10 + Math.random() * 90).toString();
      const number = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
      return `+39 ${areaCode} ${number}`;
    },
    ES: () => {
      const areaCode = Math.floor(10 + Math.random() * 90).toString();
      const number = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
      return `+34 ${areaCode} ${number}`;
    },
    TR: () => {
      const areaCode = Math.floor(200 + Math.random() * 800)
        .toString()
        .padStart(3, '0');
      const number = Array.from({ length: 7 }, () => Math.floor(Math.random() * 10)).join('');
      return `+90 ${areaCode} ${number}`;
    },
    SA: () => {
      const areaCode = Math.floor(10 + Math.random() * 90).toString();
      const number = Array.from({ length: 7 }, () => Math.floor(Math.random() * 10)).join('');
      return `+966 ${areaCode} ${number}`;
    },
    AR: () => {
      const areaCode = Math.floor(10 + Math.random() * 90).toString();
      const number = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
      return `+54 ${areaCode} ${number}`;
    },
    EG: () => {
      const areaCode = Math.floor(10 + Math.random() * 90).toString();
      const number = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
      return `+20 ${areaCode} ${number}`;
    },
    NG: () => {
      const areaCode = Math.floor(10 + Math.random() * 90).toString();
      const number = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
      return `+234 ${areaCode} ${number}`;
    },
    ID: () => {
      const areaCode = Math.floor(10 + Math.random() * 90).toString();
      const number = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
      return `+62 ${areaCode} ${number}`;
    },
  };
  return phoneFormats[country]();
}

function getRandomCountry() {
  const countries = [
    'US',
    'UK',
    'FR',
    'DE',
    'CN',
    'JP',
    'IN',
    'AU',
    'BR',
    'CA',
    'RU',
    'ZA',
    'MX',
    'KR',
    'IT',
    'ES',
    'TR',
    'SA',
    'AR',
    'EG',
    'NG',
    'ID',
  ];
  return countries[Math.floor(Math.random() * countries.length)];
}

function getCountryOptions(selectedCountry) {
  const countries = [
    { name: 'United States', code: 'US' },
    { name: 'United Kingdom', code: 'UK' },
    { name: 'France', code: 'FR' },
    { name: 'Germany', code: 'DE' },
    { name: 'China', code: 'CN' },
    { name: 'Japan', code: 'JP' },
    { name: 'India', code: 'IN' },
    { name: 'Australia', code: 'AU' },
    { name: 'Brazil', code: 'BR' },
    { name: 'Canada', code: 'CA' },
    { name: 'Russia', code: 'RU' },
    { name: 'South Africa', code: 'ZA' },
    { name: 'Mexico', code: 'MX' },
    { name: 'South Korea', code: 'KR' },
    { name: 'Italy', code: 'IT' },
    { name: 'Spain', code: 'ES' },
    { name: 'Turkey', code: 'TR' },
    { name: 'Saudi Arabia', code: 'SA' },
    { name: 'Argentina', code: 'AR' },
    { name: 'Egypt', code: 'EG' },
    { name: 'Nigeria', code: 'NG' },
    { name: 'Indonesia', code: 'ID' },
  ];
  return countries
    .map(
      ({ name, code }) =>
        `<option value="${code}" ${code === selectedCountry ? 'selected' : ''}>${name}</option>`,
    )
    .join('');
}
