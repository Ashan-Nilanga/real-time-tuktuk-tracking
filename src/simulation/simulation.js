

const API_BASE = process.env.API_URL || 'http://localhost:3000';

const PROVINCE_COORDS = {
  1: { latMin: 6.7, latMax: 7.2, lngMin: 79.8, lngMax: 80.2 },   // Western
  2: { latMin: 7.1, latMax: 7.6, lngMin: 80.4, lngMax: 80.8 },   // Central
  3: { latMin: 5.9, latMax: 6.4, lngMin: 80.0, lngMax: 81.0 },   // Southern
  4: { latMin: 9.0, latMax: 9.8, lngMin: 79.8, lngMax: 80.5 },   // Northern
  5: { latMin: 7.0, latMax: 8.5, lngMin: 81.0, lngMax: 81.9 },   // Eastern
  6: { latMin: 7.3, latMax: 8.0, lngMin: 79.7, lngMax: 80.3 },   // North Western
  7: { latMin: 7.8, latMax: 8.6, lngMin: 80.2, lngMax: 80.8 },   // North Central
  8: { latMin: 6.5, latMax: 7.2, lngMin: 80.8, lngMax: 81.3 },   // Uva
  9: { latMin: 6.5, latMax: 7.2, lngMin: 80.2, lngMax: 80.7 }    // Sabaragamuwa
};

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

async function loginDevice(deviceNum) {
  const username = `device_device-${String(deviceNum).padStart(3, '0')}`;
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: 'admin123' })
    });
    const data = await response.json();
    return data.data?.token || null;
  } catch {
    return null;
  }
}

async function sendPing(token, deviceId, lat, lng) {
  const speed = Math.random() < 0.2 ? 0 : Math.round(rand(5, 60) * 10) / 10;
  const accuracy = Math.round(rand(3, 25) * 10) / 10;

  try {
    await fetch(`${API_BASE}/api/location/ping`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        deviceId,
        latitude: lat,
        longitude: lng,
        speed,
        accuracy,
        timestamp: new Date().toISOString()
      })
    });
  } catch (err) {
  }
}

async function main() {
  console.log(' TukTuk GPS Simulator Starting...');
  console.log(` API: ${API_BASE}\n`);

  const DEVICE_COUNT = 210;
  const devices = [];

  console.log(` Logging in ${DEVICE_COUNT} devices...`);
  for (let i = 1; i <= DEVICE_COUNT; i++) {
    const token = await loginDevice(i);
    if (token) {
      const provinceId = ((i - 1) % 9) + 1;
      const coords = PROVINCE_COORDS[provinceId];
      devices.push({
        num: i,
        token,
        deviceId: `DEVICE-${String(i).padStart(3, '0')}`,
        lat: rand(coords.latMin, coords.latMax),
        lng: rand(coords.lngMin, coords.lngMax),
        coords
      });
    }
    if (i % 50 === 0) console.log(`   Logged in ${i}/${DEVICE_COUNT}...`);
  }

  console.log(`\n${devices.length} devices authenticated`);
  console.log('Sending location pings every 5 seconds...\n');

  setInterval(async () => {
    const batch = devices.slice(0, 20);
    const randomDevices = batch.sort(() => Math.random() - 0.5);

    for (const device of randomDevices) {
      const isStationary = Math.random() < 0.2;
      if (!isStationary) {
        device.lat += rand(-0.005, 0.005);
        device.lng += rand(-0.005, 0.005);
        device.lat = Math.max(device.coords.latMin, Math.min(device.coords.latMax, device.lat));
        device.lng = Math.max(device.coords.lngMin, Math.min(device.coords.lngMax, device.lng));
      }

      await sendPing(device.token, device.deviceId, device.lat, device.lng);
    }

    devices.push(devices.shift());

    console.log(`Sent ${randomDevices.length} pings at ${new Date().toLocaleTimeString()}`);
  }, 5000);
}

main().catch(console.error);