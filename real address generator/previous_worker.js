/**
 * Real Address Generator – Cloudflare Worker
 * Last update: 2026-07-18
 *
 * Changes:
 * - Modernized to ES Modules, Performance & Bugfixes.
 * - Harmonized backend processing with RandomUser API response payload.
 * - Fixed unescaped backticks and template literals inside the HTML string.
 * - Kept minimal and robust structure for reliable address generation.
 */

const MAX_NOMINATIM_ATTEMPTS = 10;
const NOMINATIM_USER_AGENT = "DianaCl/1.1 (Cloudflare Worker; contact=NiREvil@proton.me)";

const COUNTRY_DATA = {
  US: {
    name: "United States",
    coords: [
      { lat: 37.7749, lng: -122.4194 },
      { lat: 34.0522, lng: -118.2437 },
    ],
    phonePrefix: "+1",
    phoneFormat: () => `(${rand(200, 999)}) ${rand(200, 999)}-${rand(1000, 9999)}`,
  },
  UK: {
    name: "United Kingdom",
    coords: [
      { lat: 51.5074, lng: -0.1278 },
      { lat: 53.4808, lng: -2.2426 },
    ],
    phonePrefix: "+44",
    phoneFormat: () => `${rand(1000, 9999)} ${rand(100000, 999999)}`,
  },
  FR: {
    name: "France",
    coords: [
      { lat: 48.8566, lng: 2.3522 },
      { lat: 45.764, lng: 4.8357 },
    ],
    phonePrefix: "+33",
    phoneFormat: () => `${rand(1, 9)} ${randDigits(8)}`,
  },
  DE: {
    name: "Germany",
    coords: [
      { lat: 52.52, lng: 13.405 },
      { lat: 48.1351, lng: 11.582 },
    ],
    phonePrefix: "+49",
    phoneFormat: () => `${rand(100, 999)} ${randDigits(7)}`,
  },
  CN: {
    name: "China",
    coords: [
      { lat: 39.9042, lng: 116.4074 },
      { lat: 31.2304, lng: 121.4737 },
    ],
    phonePrefix: "+86",
    phoneFormat: () => `${rand(130, 189)} ${randDigits(8)}`,
  },
  JP: {
    name: "Japan",
    coords: [
      { lat: 35.6895, lng: 139.6917 },
      { lat: 34.6937, lng: 135.5023 },
    ],
    phonePrefix: "+81",
    phoneFormat: () => `${rand(10, 99)} ${randDigits(8)}`,
  },
  IN: {
    name: "India",
    coords: [
      { lat: 28.6139, lng: 77.209 },
      { lat: 19.076, lng: 72.8777 },
    ],
    phonePrefix: "+91",
    phoneFormat: () => `${rand(700, 999)} ${randDigits(7)}`,
  },
  AU: {
    name: "Australia",
    coords: [
      { lat: -33.8688, lng: 151.2093 },
      { lat: -37.8136, lng: 144.9631 },
    ],
    phonePrefix: "+61",
    phoneFormat: () => `${rand(2, 9)} ${randDigits(8)}`,
  },
  BR: {
    name: "Brazil",
    coords: [
      { lat: -23.5505, lng: -46.6333 },
      { lat: -22.9068, lng: -43.1729 },
    ],
    phonePrefix: "+55",
    phoneFormat: () => `${rand(10, 99)} ${randDigits(8)}`,
  },
  CA: {
    name: "Canada",
    coords: [
      { lat: 43.65107, lng: -79.347015 },
      { lat: 45.50169, lng: -73.567253 },
    ],
    phonePrefix: "+1",
    phoneFormat: () => `(${rand(200, 999)}) ${rand(200, 999)}-${rand(1000, 9999)}`,
  },
  RU: {
    name: "Russia",
    coords: [
      { lat: 55.7558, lng: 37.6173 },
      { lat: 59.9343, lng: 30.3351 },
    ],
    phonePrefix: "+7",
    phoneFormat: () => `${rand(100, 999)} ${randDigits(7)}`,
  },
  ZA: {
    name: "South Africa",
    coords: [
      { lat: -33.9249, lng: 18.4241 },
      { lat: -26.2041, lng: 28.0473 },
    ],
    phonePrefix: "+27",
    phoneFormat: () => `${rand(10, 99)} ${randDigits(7)}`,
  },
  MX: {
    name: "Mexico",
    coords: [
      { lat: 19.4326, lng: -99.1332 },
      { lat: 20.6597, lng: -103.3496 },
    ],
    phonePrefix: "+52",
    phoneFormat: () => `${rand(10, 99)} ${randDigits(8)}`,
  },
  KR: {
    name: "South Korea",
    coords: [
      { lat: 37.5665, lng: 126.978 },
      { lat: 35.1796, lng: 129.0756 },
    ],
    phonePrefix: "+82",
    phoneFormat: () => `${rand(10, 99)} ${randDigits(8)}`,
  },
  IT: {
    name: "Italy",
    coords: [
      { lat: 41.9028, lng: 12.4964 },
      { lat: 45.4642, lng: 9.19 },
    ],
    phonePrefix: "+39",
    phoneFormat: () => `${rand(10, 99)} ${randDigits(8)}`,
  },
  ES: {
    name: "Spain",
    coords: [
      { lat: 40.4168, lng: -3.7038 },
      { lat: 41.3851, lng: 2.1734 },
    ],
    phonePrefix: "+34",
    phoneFormat: () => `${rand(10, 99)} ${randDigits(8)}`,
  },
  TR: {
    name: "Turkey",
    coords: [
      { lat: 41.0082, lng: 28.9784 },
      { lat: 39.9334, lng: 32.8597 },
    ],
    phonePrefix: "+90",
    phoneFormat: () => `${rand(200, 599)} ${randDigits(7)}`,
  },
  SA: {
    name: "Saudi Arabia",
    coords: [
      { lat: 24.7136, lng: 46.6753 },
      { lat: 21.3891, lng: 39.8579 },
    ],
    phonePrefix: "+966",
    phoneFormat: () => `5${rand(0, 9)} ${randDigits(7)}`,
  },
  AR: {
    name: "Argentina",
    coords: [
      { lat: -34.6037, lng: -58.3816 },
      { lat: -31.4201, lng: -64.1888 },
    ],
    phonePrefix: "+54",
    phoneFormat: () => `9 ${rand(11, 38)} ${randDigits(8)}`,
  },
  EG: {
    name: "Egypt",
    coords: [
      { lat: 30.0444, lng: 31.2357 },
      { lat: 31.2156, lng: 29.9553 },
    ],
    phonePrefix: "+20",
    phoneFormat: () => `1${rand(0, 2)}${rand(0, 9)} ${randDigits(8)}`,
  },
  NG: {
    name: "Nigeria",
    coords: [
      { lat: 6.5244, lng: 3.3792 },
      { lat: 9.0579, lng: 7.4951 },
    ],
    phonePrefix: "+234",
    phoneFormat: () => `${rand(7, 9)}0${rand(1, 9)} ${randDigits(7)}`,
  },
  ID: {
    name: "Indonesia",
    coords: [
      { lat: -6.2088, lng: 106.8456 },
      { lat: -7.7956, lng: 110.3695 },
    ],
    phonePrefix: "+62",
    phoneFormat: () => `8${rand(1, 9)}${rand(0, 9)} ${randDigits(8)}`,
  },
};

const SUPPORTED_COUNTRIES = Object.keys(COUNTRY_DATA);

/**
 * @param {number} min
 * @param {number} max
 */
function rand(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

/**
 * @param {number} count
 */
function randDigits(count) {
  let digits = "";
  for (let i = 0; i < count; i++) {
    digits += Math.floor(Math.random() * 10);
  }
  return digits;
}

/**
 * @param {string | number} country
 */
function getRandomLocationInCountry(country) {
  const countryInfo = COUNTRY_DATA[country];
  if (!countryInfo) return null;

  const coordsArray = countryInfo.coords;
  const randomCity = coordsArray[Math.floor(Math.random() * coordsArray.length)];
  const lat = randomCity.lat + (Math.random() - 0.5) * 0.15;
  const lng = randomCity.lng + (Math.random() - 0.5) * 0.15;
  return { lat, lng };
}

/**
 * @param {{ road: string; house_number: string; city: any; town: any; village: any; suburb: any; postcode: string; }} address
 * @param {string | number} country
 */
function formatAddress(address, country) {
  const road = address.road || "";
  const houseNumber = address.house_number || "";
  const city = address.city || address.town || address.village || address.suburb || "";
  const postcode = address.postcode || "";
  const countryName = COUNTRY_DATA[country]?.name || country;

  let formatted = `${houseNumber} ${road}`.trim();
  if (city) formatted += `, ${city}`;
  if (postcode) formatted += `, ${postcode}`;
  formatted += `, ${countryName}`;

  return formatted
    .replace(/^,\s*|\s*,\s*$/g, "")
    .replace(/\s\s+/g, " ")
    .trim();
}

/**
 * @param {string} country
 */
function getRandomPhoneNumber(country) {
  const countryInfo = COUNTRY_DATA[country];
  if (!countryInfo || !countryInfo.phoneFormat) {
    return `+${rand(1, 999)} ${randDigits(9)}`;
  }
  return `${countryInfo.phonePrefix} ${countryInfo.phoneFormat()}`;
}

function getRandomCountry() {
  return SUPPORTED_COUNTRIES[Math.floor(Math.random() * SUPPORTED_COUNTRIES.length)];
}

/**
 * @param {string} selectedCountry
 */
function getCountryOptions(selectedCountry) {
  return SUPPORTED_COUNTRIES.map((code) => {
    const name = COUNTRY_DATA[code].name;
    return `<option value="${code}" ${code === selectedCountry ? "selected" : ""}>${name}</option>`;
  }).join("");
}

function getRandomName() {
  const firstNames = ["Alex", "Jamie", "Chris", "Sam", "Taylor", "Jordan"];
  const lastNames = ["Smith", "Jones", "Williams", "Brown", "Davis", "Miller"];
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

/**
 * @param {string} country
 */
async function findAddress(country) {
  for (let i = 0; i < MAX_NOMINATIM_ATTEMPTS; i++) {
    const location = getRandomLocationInCountry(country);
    if (!location) continue;

    const apiUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&zoom=18&addressdetails=1`;

    try {
      const response = await fetch(apiUrl, {
        headers: { "User-Agent": NOMINATIM_USER_AGENT },
      });

      if (!response.ok) {
        console.error(
          `Nominatim API error: ${response.status} ${response.statusText} for ${apiUrl}`,
        );
        continue;
      }

      const data = await response.json();

      if (
        data &&
        data.address &&
        data.address.road &&
        (data.address.city || data.address.town || data.address.village || data.address.suburb)
      ) {
        return formatAddress(data.address, country);
      }
    } catch (error) {
      console.error(`Error fetching or parsing Nominatim data (Attempt ${i + 1}):`, error);
    }
  }
  console.error(
    `Failed to find a valid address for country ${country} after ${MAX_NOMINATIM_ATTEMPTS} attempts.`,
  );
  return null;
}

export default {
  /**
   * @param {any} request
   * @param {any} env
   * @param {any} ctx
   */
  async fetch(request, env, ctx) {
    return handleRequest(request);
  },
};

/**
 * @param {{ url: string | URL; }} request
 */
async function handleRequest(request) {
  const { searchParams } = new URL(request.url);
  let country = searchParams.get("country")?.toUpperCase();

  if (!country || !SUPPORTED_COUNTRIES.includes(country)) {
    country = getRandomCountry();
  }

  const addressPromise = findAddress(country);
  const userDataPromise = fetch("https://randomuser.me/api/?nat=" + country.toLowerCase());

  const [addressResult, userDataResponse] = await Promise.all([addressPromise, userDataPromise]);

  const address = addressResult;
  if (!address) {
    return new Response(
      `<html><body>
      <h1>Address Generation Failed</h1>
      <p>Sorry, we couldn't find a suitable address for ${COUNTRY_DATA[country]?.name || country} after several attempts.</p>
      <button onclick="window.location.reload()">Try Again</button>
      <p><a href="?">Try a random country</a></p>
      </body></html>`,
      { status: 500, headers: { "content-type": "text/html;charset=UTF-8" } },
    );
  }

  let name,
    gender,
    timezone = { description: "N/A", offset: "" },
    picture = "https://via.placeholder.com/120/cccccc/888888?text=No+Image";

  try {
    if (userDataResponse && userDataResponse.ok) {
      const userJson = await userDataResponse.json();
      if (userJson?.results?.length > 0) {
        const user = userJson.results[0];
        name = `${user.name?.first || ""} ${user.name?.last || ""}`.trim();
        gender = user.gender
          ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1)
          : "Unknown";
        if (user.location?.timezone) {
          timezone = {
            description: user.location.timezone.description || "Unknown Timezone",
            offset: user.location.timezone.offset || "",
          };
        }
        picture = user.picture?.large || picture;
      }
    } else if (userDataResponse) {
      console.error(
        `RandomUser API error: ${userDataResponse.status} ${userDataResponse.statusText}`,
      );
    }
  } catch (error) {
    console.error("Error fetching or parsing randomuser.me data:", error);
  }

  if (!name) name = getRandomName();
  if (!gender) gender = "Unknown";

  const phone = getRandomPhoneNumber(country);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Real Fake Address Generator</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Generates realistic fake addresses and user profiles for testing purposes.">
  <style>
    :root {
      --primary: #2c3e50;
      --secondary: #3498db;
      --accent: #e74c3c;
      --background-start: #f8f9fa;
      --background-end: #e9ecef;
      --card-bg: white;
      --text-color: #34495e;
      --muted-color: #7f8c8d;
      --border-color: #dee2e6;
      --shadow-color: rgba(0,0,0,0.08);
      --button-hover: #2980b9;
      --copy-button-bg: #ecf0f1;
      --copy-button-hover-bg: #bdc3c7;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, var(--background-start) 0%, var(--background-end) 100%);
      color: var(--text-color);
      line-height: 1.6;
    }

    .container {
      max-width: 700px;
      margin: 2rem auto;
      padding: 2rem;
      background: var(--card-bg);
      border-radius: 12px;
      box-shadow: 0 8px 25px var(--shadow-color);
    }

    .profile-header {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .profile-photo {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid var(--secondary);
      flex-shrink: 0;
    }

    .user-info {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-size: 1.75rem;
      margin: 0 0 0.25rem;
      color: var(--primary);
      font-weight: 600;
    }

    .gender, .timezone {
      font-size: 0.95em;
      color: var(--muted-color);
    }
    .timezone { margin-top: 0.2rem; }

    .detail-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
      margin: 1.5rem 0;
    }

    .detail-item {
      padding: 1rem 1.2rem;
      background: var(--background-start);
      border-radius: 8px;
      border-left: 4px solid var(--secondary);
      position: relative;
      transition: box-shadow 0.2s ease-in-out;
    }
    .detail-item:hover {
       box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    }

    .detail-label {
      font-weight: 600;
      color: var(--primary);
      margin-bottom: 0.3rem;
      font-size: 0.9em;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .detail-value {
      font-size: 1em;
      color: var(--text-color);
      word-wrap: break-word;
    }

    .copy-button {
      position: absolute;
      top: 0.8rem;
      right: 0.8rem;
      background: var(--copy-button-bg);
      color: var(--primary);
      border: none;
      border-radius: 5px;
      padding: 0.3rem 0.7rem;
      cursor: pointer;
      font-size: 0.8em;
      font-weight: 600;
      opacity: 0;
      transition: opacity 0.2s, background-color 0.2s;
      visibility: hidden;
    }

    .detail-item:hover .copy-button {
      opacity: 1;
      visibility: visible;
    }
    .copy-button:hover {
      background: var(--copy-button-hover-bg);
    }

    .button-group {
      display: flex;
      gap: 1rem;
      margin: 2rem 0;
      flex-wrap: wrap;
    }

    .btn {
      padding: 0.7rem 1.3rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.95em;
      transition: all 0.2s ease;
      text-align: center;
    }

    .btn-primary {
      background: var(--secondary);
      color: white;
    }
    .btn-primary:hover {
      background: var(--button-hover);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
    }

    .btn-secondary {
      background: var(--background-end);
      color: var(--primary);
      border: 1px solid var(--border-color);
    }
    .btn-secondary:hover {
      background: #d5dbdf;
    }

    select.btn {
      appearance: none;
      background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%232c3e50%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E');
      background-repeat: no-repeat;
      background-position: right .9rem center;
      background-size: .65em auto;
      padding-right: 2.5rem;
    }

    .map-container {
        margin-top: 2rem;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 10px var(--shadow-color);
        border: 1px solid var(--border-color);
    }
    .map {
      width: 100%;
      height: 350px;
      border: 0;
      display: block;
    }

    .footer {
      text-align: center;
      padding: 2rem 1rem;
      margin-top: 2rem;
      color: var(--muted-color);
      font-size: 0.9em;
      line-height: 1.6;
    }
    .footer a {
      color: var(--secondary);
      text-decoration: none;
      font-weight: 500;
    }
    .footer a:hover {
      text-decoration: underline;
      color: var(--button-hover);
    }

    .copied-feedback {
      position: fixed;
      bottom: 1.5rem;
      left: 50%;
      transform: translateX(-50%);
      background: #2ecc71;
      color: white;
      padding: 0.8rem 1.5rem;
      border-radius: 6px;
      display: none;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      z-index: 1000;
      font-size: 0.95em;
    }

    @media (max-width: 600px) {
      .container {
        margin: 1rem;
        padding: 1.5rem;
      }
      .profile-header {
        flex-direction: column;
        align-items: flex-start;
        text-align: left;
      }
      .user-info {
         align-items: flex-start;
      }
      .button-group {
        flex-direction: column;
      }
      .btn {
        width: 100%;
        box-sizing: border-box;
      }
      select.btn {
         width: 100%;
      }
      .map {
         height: 300px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="profile-header">
      <img src="${picture}" class="profile-photo" alt="Generated profile picture">
      <div class="user-info">
        <h1 class="user-name">${name || "Name Not Found"}</h1>
        <div class="gender">${gender}</div>
        <div class="timezone" title="${timezone.description || ""}">
          ${timezone.description} ${timezone.offset ? `(UTC${timezone.offset})` : ""}
        </div>
      </div>
    </div>

    <div class="detail-grid">
      <div class="detail-item">
        <div class="detail-label">Phone</div>
        <div class="detail-value">${phone}</div>
        <button class="copy-button" aria-label="Copy phone number" onclick="copyToClipboard('${phone.replace(/[()\s-]/g, "")}', this)">Copy</button>
      </div>

      <div class="detail-item">
        <div class="detail-label">Address</div>
        <div class="detail-value">${address}</div>
         <button class="copy-button" aria-label="Copy address" onclick="copyToClipboard('${address.replace(/'/g, "\\'")}', this)">Copy</button>
      </div>
    </div>

    <div class="button-group">
      <button class="btn btn-primary" onclick="window.location.reload()">Generate New</button>
      <select class="btn btn-secondary" id="country" onchange="changeCountry(this.value)">
        ${getCountryOptions(country)}
      </select>
    </div>

    <div class="map-container">
        <iframe
            class="map"
            loading="lazy"
            src="https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed&z=15">
        </iframe>
    </div>
  </div>

  <div class="footer">
      <div>© <span id="copyright-year"></span>
          <strong><a href="https://github.com/NiREvil/vless" target="_blank">Dìana</a></strong> — Freedom to Dream
      </div>
  </div>
  <div class="copied-feedback" id="copied-feedback">Copied!</div>

  <script>
    function copyToClipboard(text, buttonElement) {
      if (!navigator.clipboard) {
        try {
          const textArea = document.createElement("textarea");
          textArea.value = text;
          textArea.style.position = "fixed";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          showCopiedMessage(buttonElement);
        } catch (err) {
          console.error('Fallback: Oops, unable to copy', err);
          alert('Could not copy text.');
        }
        return;
      }
      navigator.clipboard.writeText(text).then(() => {
        showCopiedMessage(buttonElement);
      }).catch(err => {
        console.error('Async: Could not copy text: ', err);
        alert('Could not copy text.');
      });
    }

    function showCopiedMessage(buttonElement) {
        const feedback = document.getElementById('copied-feedback');
        feedback.style.display = 'block';

        const originalText = buttonElement.textContent;
        buttonElement.textContent = 'Copied!';
        buttonElement.disabled = true;

        setTimeout(() => {
            feedback.style.display = 'none';
            buttonElement.textContent = originalText;
            buttonElement.disabled = false;
        }, 2000);
    }

    function changeCountry(countryCode) {
      window.location.href = "?country=" + countryCode;
    }

    document.getElementById('copyright-year').textContent = new Date().getFullYear();

    function updateSelectArrowColor() {
        const selectElement = document.getElementById('country');
        if (selectElement) {
            const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim().substring(1);
            const svgArrow = "url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23" + primaryColor + "%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')";
            selectElement.style.backgroundImage = svgArrow;
        }
    }
    window.addEventListener('load', updateSelectArrowColor);
  </script>
</body>
</html>
`;

  return new Response(html, { headers: { "content-type": "text/html;charset=UTF-8" } });
}
