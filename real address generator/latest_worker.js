/**
 * Real Address Generator – Cloudflare Worker
 * Last update: 2026-07-18
 *
 * Changes:
 * - Migrated to modern ES Module export syntax for Cloudflare Workers.
 * - Harmonized backend processing with RandomUser API response payload.
 * - Refactored address field selectors to map correctly to multi-level data objects.
 * - Sanitized clipboard ingestion using URI encoding to prevent special character syntax breaks.
 * - Maintained fallback address states to guarantee zero-fault execution.
 */

export default {
  /**
   * @param {any} request
   * @param {any} env
   * @param {any} ctx
   */
  async fetch(request, env, ctx) {
    try {
      return await handleRequest(request, env, ctx);
    } catch (err) {
      const message = `Internal error: ${err?.message || "Unknown"}`;
      return new Response(message, {
        status: 500,
        headers: { "content-type": "text/plain;charset=UTF-8" },
      });
    }
  },
};

/**
 * @param {{ url: string | URL; cf: { country: any; }; }} request
 * @param {any} env
 * @param {any} ctx
 */
async function handleRequest(request, env, ctx) {
  const url = new URL(request.url);
  const { searchParams } = url;

  const cfCountry = request.cf?.country;
  const country = (searchParams.get("country") || cfCountry || getRandomCountry()).toUpperCase();

  let addressObj = {
    street: "",
    city: "",
    state: "",
    postcode: "",
    full: "",
  };
  let name = "John Doe";
  let gender = "Male";
  let phone = "";
  let timezone = { offset: "+00:00", description: "UTC" };
  let picture = "https://randomuser.me/api/portraits/men/1.jpg";

  const generatedPassword =
    Math.random().toString(36).slice(-4).toUpperCase() +
    "#" +
    Math.random().toString(36).slice(-4) +
    Math.floor(100 + Math.random() * 900);

  try {
    const userRes = await fetch(`https://randomuser.me/api/?nat=${country.toLowerCase()}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (RealAddressGen/2.0)",
      },
    });

    if (!userRes.ok) {
      console.warn(`randomuser.me returned status ${userRes.status} for country ${country}`);
    } else {
      const userJson = await userRes.json();
      if (userJson?.results?.length > 0) {
        const user = userJson.results[0];

        name = `${user.name.first} ${user.name.last}`;
        gender = user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : gender;

        phone = user.phone || getRandomPhoneNumber(country);

        timezone = {
          offset: user.location?.timezone?.offset || timezone.offset,
          description: user.location?.timezone?.description || timezone.description,
        };

        picture = user.picture?.large || picture;

        addressObj.street = `${user.location.street.number} ${user.location.street.name}`.trim();
        addressObj.city = user.location.city || addressObj.city;
        addressObj.state = user.location.state || addressObj.state;
        addressObj.postcode = String(user.location.postcode || addressObj.postcode);

        addressObj.full = [
          addressObj.street,
          addressObj.city,
          addressObj.state,
          addressObj.postcode,
          country,
        ]
          .filter(Boolean)
          .join(", ");
      }
    }
  } catch (err) {
    console.error("Error fetching randomuser.me:", err);
    if (!phone) {
      phone = getRandomPhoneNumber(country);
    }
  }

  await tryImproveAddressWithOSM(country, addressObj, ctx);

  if (!phone) {
    phone = getRandomPhoneNumber(country);
  }

  const html = renderHtml({
    country,
    name,
    gender,
    phone,
    timezone,
    picture,
    addressObj,
    generatedPassword,
  });

  return new Response(html, {
    status: 200,
    headers: { "content-type": "text/html;charset=UTF-8" },
  });
}

/**
 * @param {any} country
 * @param {{ street: any; city: any; state: any; postcode: any; full: any; }} addressObj
 * @param {any} ctx
 */
async function tryImproveAddressWithOSM(country, addressObj, ctx) {
  const maxAttempts = 3;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const location = getRandomLocationInCountry(country);
      const apiUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&zoom=18&addressdetails=1`;

      const response = await fetch(apiUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) RealAddressGen/2.0",
        },
      });

      if (!response.ok) {
        console.warn(`OSM reverse failed with status ${response.status} for ${country}`);
        continue;
      }

      const data = await response.json();

      if (data?.address) {
        const addr = data.address;

        const streetCandidate = `${addr.house_number || ""} ${addr.road || ""}`.trim();
        if (streetCandidate) {
          addressObj.street = streetCandidate;
        }

        addressObj.city =
          addr.city || addr.town || addr.village || addressObj.city || addressObj.state;
        addressObj.state = addr.state || addr.region || addressObj.state;
        addressObj.postcode = addr.postcode || addressObj.postcode;

        addressObj.full = [
          addressObj.street,
          addressObj.city,
          addressObj.state,
          addressObj.postcode,
          country,
        ]
          .filter(Boolean)
          .join(", ");

        break;
      }
    } catch (err) {
      console.error("Error calling OpenStreetMap:", err);
    }
  }
}

function renderHtml({
  country,
  name,
  gender,
  phone,
  timezone,
  picture,
  addressObj,
  generatedPassword,
}) {
  const esc = (/** @type {any} */ value) =>
    String(value || "")
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/\r?\n/g, " ");

  const fullNameEncoded = encodeURIComponent(name);
  const cleanPhoneForCopy = phone.replace(/[()\s-]/g, "");

  const streetSafe = esc(addressObj.street);
  const citySafe = esc(addressObj.city);
  const stateSafe = esc(addressObj.state);
  const fullAddressSafe = esc(addressObj.full);
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html>
<head>
  <title>Real Fake Address Generator</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      min-height: 100vh;
      background-color: #f4f6f9;
      margin: 0;
    }
    .title {
      font-size: 2.2em;
      margin: 20px 0 5px 0;
      color: #2c3e50;
      font-weight: bold;
    }
    .subtitle {
      font-size: 1.1em;
      margin-bottom: 20px;
      color: #7f8c8d;
    }
    .container {
      background: white;
      padding: 30px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
      border-radius: 12px;
      width: 90%;
      max-width: 650px;
      margin-bottom: 30px;
      box-sizing: border-box;
    }
    .profile-section {
      text-align: center;
      margin-bottom: 25px;
    }
    .profile-picture {
      width: 130px;
      height: 130px;
      border-radius: 50%;
      border: 4px solid #3498db;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .section-title {
      font-size: 0.95em;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #95a5a6;
      margin: 20px 0 10px 0;
      border-bottom: 1px solid #ecf0f1;
      padding-bottom: 5px;
    }
    .field-group {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8f9fa;
      padding: 10px 15px;
      margin-bottom: 8px;
      border-radius: 6px;
      border: 1px solid #e9ecef;
      cursor: pointer;
      transition: background 0.2s;
    }
    .field-group:hover {
      background: #edf2f7;
      border-color: #3498db;
    }
    .field-label {
      font-size: 0.85em;
      color: #7f8c8d;
      font-weight: bold;
      width: 30%;
      text-align: left;
    }
    .field-value {
      font-size: 1em;
      color: #2c3e50;
      width: 65%;
      text-align: right;
      word-break: break-all;
    }
    .action-zone {
      display: flex;
      gap: 10px;
      margin: 20px 0;
    }
    .btn {
      flex: 1;
      padding: 12px;
      border: none;
      border-radius: 6px;
      font-size: 1em;
      cursor: pointer;
      font-weight: bold;
      text-align: center;
      text-decoration: none;
      transition: background 0.2s;
    }
    .btn-primary {
      background-color: #3498db;
      color: white;
    }
    .btn-primary:hover { background-color: #2980b9; }
    .btn-secondary {
      background-color: #2ecc71;
      color: white;
    }
    .btn-secondary:hover { background-color: #27ae60; }
    .country-select {
      margin-bottom: 25px;
      text-align: center;
    }
    select {
      width: 100%;
      padding: 10px;
      border-radius: 6px;
      border: 1px solid #cccccc;
      font-size: 1em;
      background-color: white;
    }
    .map {
      width: 100%;
      height: 300px;
      border: 0;
      border-radius: 8px;
    }
    .footer {
      margin-top: auto;
      padding: 20px 0;
      font-size: 0.85em;
      color: #95a5a6;
      text-align: center;
    }
    .footer a { color: #3498db; text-decoration: none; }
    .toast {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #2c3e50;
      color: white;
      padding: 10px 20px;
      border-radius: 20px;
      font-size: 0.9em;
      display: none;
      z-index: 1000;
    }
  </style>
</head>
<body>
  <div class="title">Real Fake Address Generator</div>
  <div class="subtitle">Click any field to copy instantly</div>
  
  <div class="container">
    <div class="country-select">
      <select id="country" onchange="changeCountry(this.value)">
        ${getCountryOptions(country)}
      </select>
    </div>

    <div class="profile-section">
      <img src="${picture}" alt="Profile Picture" class="profile-picture">
    </div>

    <div class="section-title">Identity & Account</div>
    <div class="field-group" onclick="copyToClipboard('${fullNameEncoded}', 'Full Name', true)">
      <div class="field-label">Full Name</div>
      <div class="field-value">${name}</div>
    </div>

    <div class="field-group" onclick="copyToClipboard('${gender}', 'Gender')">
      <div class="field-label">Gender</div>
      <div class="field-value">${gender}</div>
    </div>
    <div class="field-group" onclick="copyToClipboard('${generatedPassword}', 'Password')">
      <div class="field-label">Suggested Pass</div>
      <div class="field-value" style="font-family: monospace; font-weight: bold; color: #e67e22;">${generatedPassword}</div>
    </div>
    <div class="field-group" onclick="copyToClipboard('${cleanPhoneForCopy}', 'Clean Phone')">
      <div class="field-label">Phone (Clean)</div>
      <div class="field-value">${phone}</div>
    </div>

    <div class="section-title">Address Breakdown</div>
    <div class="field-group" onclick="copyToClipboard('${streetSafe}', 'Street')">
      <div class="field-label">Street / Line 1</div>
      <div class="field-value">${addressObj.street || "N/A"}</div>
    </div>
    <div class="field-group" onclick="copyToClipboard('${citySafe}', 'City')">
      <div class="field-label">City</div>
      <div class="field-value">${addressObj.city || "N/A"}</div>
    </div>
    <div class="field-group" onclick="copyToClipboard('${stateSafe}', 'State')">
      <div class="field-label">State / Region</div>
      <div class="field-value">${addressObj.state || "N/A"}</div>
    </div>
    <div class="field-group" onclick="copyToClipboard('${addressObj.postcode}', 'Zip Code')">
      <div class="field-label">Zip / Postcode</div>
      <div class="field-value">${addressObj.postcode || "N/A"}</div>
    </div>
    <div class="field-group" onclick="copyToClipboard('${fullAddressSafe}', 'Full Address')">
      <div class="field-label">Full Address</div>
      <div class="field-value" style="font-size:0.9em; color:#7f8c8d;">${addressObj.full || "N/A"}</div>
    </div>
    <div class="field-group" style="cursor: default;">
      <div class="field-label">Timezone</div>
      <div class="field-value" style="font-size:0.9em;">${timezone.description} (${timezone.offset})</div>
    </div>

    <div class="action-zone">
      <button class="btn btn-primary" onclick="window.location.reload();">Generate New Data</button>
      <a class="btn btn-secondary" href="https://mail.tm" target="_blank">Open Temp Mail</a>
    </div>

    <iframe class="map" src="https://www.google.com/maps?q=${encodeURIComponent(addressObj.full)}&output=embed"></iframe>
  </div>

  <div class="footer">
    <div>© ${currentYear} <strong><a href="https://github.com/NiREvil/vless" target="_blank">Dìana</a></strong> — Real fake address generator</div>
  </div>

  <div id="toast" class="toast">Copied!</div>

  <script>
    function copyToClipboard(text, fieldName, isEncoded = false) {
      const plainText = isEncoded ? decodeURIComponent(text) : text;
      if (!navigator.clipboard) {
        const textarea = document.createElement('textarea');
        textarea.value = plainText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      } else {
        navigator.clipboard.writeText(plainText).catch(err => {
          console.error('Clipboard error:', err);
        });
      }

      const toast = document.getElementById('toast');
      toast.innerText = fieldName + ' copied!';
      toast.style.display = 'block';
      setTimeout(() => { toast.style.display = 'none'; }, 2000);
    }

    function changeCountry(country) {
      const url = new URL(window.location.href);
      url.searchParams.set('country', country);
      window.location.href = url.toString();
    }
  </script>
</body>
</html>
`;
}

/**
 * @param {string | number} country
 */
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

  const coordsArray = countryCoordinates[country] || countryCoordinates.US;
  const randomCity = coordsArray[Math.floor(Math.random() * coordsArray.length)];
  const lat = randomCity.lat + (Math.random() - 0.5) * 0.1;
  const lng = randomCity.lng + (Math.random() - 0.5) * 0.1;
  return { lat, lng };
}

/**
 * @param {string | number} country
 */
function getRandomPhoneNumber(country) {
  const phoneFormats = {
    US: () =>
      `+1 (${Math.floor(200 + Math.random() * 800)}) ${Math.floor(
        200 + Math.random() * 800,
      )}-${Math.floor(1000 + Math.random() * 9000)}`,
    UK: () =>
      `+44 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(
        100000 + Math.random() * 900000,
      )}`,
    FR: () =>
      `+33 ${Math.floor(1 + Math.random() * 8)} ${Array.from({ length: 8 }, () =>
        Math.floor(Math.random() * 10),
      ).join("")}`,
    DE: () =>
      `+49 ${Math.floor(100 + Math.random() * 900)} ${Array.from({ length: 7 }, () =>
        Math.floor(Math.random() * 10),
      ).join("")}`,
    CN: () =>
      `+86 ${Math.floor(130 + Math.random() * 60)} ${Array.from({ length: 8 }, () =>
        Math.floor(Math.random() * 10),
      ).join("")}`,
    JP: () =>
      `+81 ${Math.floor(10 + Math.random() * 90)} ${Array.from({ length: 8 }, () =>
        Math.floor(Math.random() * 10),
      ).join("")}`,
    IN: () =>
      `+91 ${Math.floor(700 + Math.random() * 100)} ${Array.from({ length: 7 }, () =>
        Math.floor(Math.random() * 10),
      ).join("")}`,
    AU: () =>
      `+61 ${Math.floor(2 + Math.random() * 8)} ${Array.from({ length: 8 }, () =>
        Math.floor(Math.random() * 10),
      ).join("")}`,
    BR: () =>
      `+55 ${Math.floor(10 + Math.random() * 90)} ${Array.from({ length: 8 }, () =>
        Math.floor(Math.random() * 10),
      ).join("")}`,
    CA: () =>
      `+1 (${Math.floor(200 + Math.random() * 800)}) ${Math.floor(
        200 + Math.random() * 800,
      )}-${Math.floor(1000 + Math.random() * 9000)}`,
    RU: () =>
      `+7 ${Math.floor(100 + Math.random() * 900)} ${Array.from({ length: 7 }, () =>
        Math.floor(Math.random() * 10),
      ).join("")}`,
    ZA: () =>
      `+27 ${Math.floor(10 + Math.random() * 90)} ${Array.from({ length: 7 }, () =>
        Math.floor(Math.random() * 10),
      ).join("")}`,
    MX: () =>
      `+52 ${Math.floor(10 + Math.random() * 90)} ${Array.from({ length: 8 }, () =>
        Math.floor(Math.random() * 10),
      ).join("")}`,
    KR: () =>
      `+82 ${Math.floor(10 + Math.random() * 90)} ${Array.from({ length: 8 }, () =>
        Math.floor(Math.random() * 10),
      ).join("")}`,
    IT: () =>
      `+39 ${Math.floor(10 + Math.random() * 90)} ${Array.from({ length: 8 }, () =>
        Math.floor(Math.random() * 10),
      ).join("")}`,
    ES: () =>
      `+34 ${Math.floor(10 + Math.random() * 90)} ${Array.from({ length: 8 }, () =>
        Math.floor(Math.random() * 10),
      ).join("")}`,
    TR: () =>
      `+90 ${Math.floor(200 + Math.random() * 800)} ${Array.from({ length: 7 }, () =>
        Math.floor(Math.random() * 10),
      ).join("")}`,
    SA: () =>
      `+966 ${Math.floor(10 + Math.random() * 90)} ${Array.from({ length: 7 }, () =>
        Math.floor(Math.random() * 10),
      ).join("")}`,
    AR: () =>
      `+54 ${Math.floor(10 + Math.random() * 90)} ${Array.from({ length: 8 }, () =>
        Math.floor(Math.random() * 10),
      ).join("")}`,
    EG: () =>
      `+20 ${Math.floor(10 + Math.random() * 90)} ${Array.from({ length: 8 }, () =>
        Math.floor(Math.random() * 10),
      ).join("")}`,
    NG: () =>
      `+234 ${Math.floor(10 + Math.random() * 90)} ${Array.from({ length: 8 }, () =>
        Math.floor(Math.random() * 10),
      ).join("")}`,
    ID: () =>
      `+62 ${Math.floor(10 + Math.random() * 90)} ${Array.from({ length: 8 }, () =>
        Math.floor(Math.random() * 10),
      ).join("")}`,
  };

  const generator = phoneFormats[country] || phoneFormats.US;
  return generator();
}

function getRandomCountry() {
  const countries = [
    "US",
    "UK",
    "FR",
    "DE",
    "CN",
    "JP",
    "IN",
    "AU",
    "BR",
    "CA",
    "RU",
    "ZA",
    "MX",
    "KR",
    "IT",
    "ES",
    "TR",
    "SA",
    "AR",
    "EG",
    "NG",
    "ID",
  ];
  return countries[Math.floor(Math.random() * countries.length)];
}

/**
 * @param {string} selectedCountry
 */
function getCountryOptions(selectedCountry) {
  const countries = [
    { name: "United States", code: "US" },
    { name: "United Kingdom", code: "UK" },
    { name: "France", code: "FR" },
    { name: "Germany", code: "DE" },
    { name: "China", code: "CN" },
    { name: "Japan", code: "JP" },
    { name: "India", code: "IN" },
    { name: "Australia", code: "AU" },
    { name: "Brazil", code: "BR" },
    { name: "Canada", code: "CA" },
    { name: "Russia", code: "RU" },
    { name: "South Africa", code: "ZA" },
    { name: "Mexico", code: "MX" },
    { name: "South Korea", code: "KR" },
    { name: "Italy", code: "IT" },
    { name: "Spain", code: "ES" },
    { name: "Turkey", code: "TR" },
    { name: "Saudi Arabia", code: "SA" },
    { name: "Argentina", code: "AR" },
    { name: "Egypt", code: "EG" },
    { name: "Nigeria", code: "NG" },
    { name: "Indonesia", code: "ID" },
  ];

  return countries
    .map(
      ({ name, code }) =>
        `<option value="${code}" ${code === selectedCountry ? "selected" : ""}>${name}</option>`,
    )
    .join("");
}
