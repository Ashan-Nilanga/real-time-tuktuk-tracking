import dotenv from 'dotenv';
dotenv.config();

import pkg from 'pg';
import bcrypt from 'bcrypt';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const SALT_ROUNDS = 10;

const PROVINCES = [
  { name: 'Western', code: 'WP' },
  { name: 'Central', code: 'CP' },
  { name: 'Southern', code: 'SP' },
  { name: 'Northern', code: 'NP' },
  { name: 'Eastern', code: 'EP' },
  { name: 'North Western', code: 'NWP' },
  { name: 'North Central', code: 'NCP' },
  { name: 'Uva', code: 'UP' },
  { name: 'Sabaragamuwa', code: 'SGP' }
];

const DISTRICTS = {
  'Western': ['Colombo', 'Gampaha', 'Kalutara'],
  'Central': ['Kandy', 'Matale', 'Nuwara Eliya'],
  'Southern': ['Galle', 'Matara', 'Hambantota'],
  'Northern': ['Jaffna', 'Kilinochchi', 'Mannar', 'Mullaitivu', 'Vavuniya'],
  'Eastern': ['Trincomalee', 'Batticaloa', 'Ampara'],
  'North Western': ['Kurunegala', 'Puttalam'],
  'North Central': ['Anuradhapura', 'Polonnaruwa'],
  'Uva': ['Badulla', 'Monaragala'],
  'Sabaragamuwa': ['Ratnapura', 'Kegalle']
};

const POLICE_STATIONS = [
  { name: 'Colombo Fort Police Station', district: 'Colombo' },
  { name: 'Pettah Police Station', district: 'Colombo' },
  { name: 'Bambalapitiya Police Station', district: 'Colombo' },
  { name: 'Negombo Police Station', district: 'Gampaha' },
  { name: 'Kaduwela Police Station', district: 'Colombo' },
  { name: 'Kalutara North Police Station', district: 'Kalutara' },
  { name: 'Kandy Police Station', district: 'Kandy' },
  { name: 'Peradeniya Police Station', district: 'Kandy' },
  { name: 'Matale Police Station', district: 'Matale' },
  { name: 'Nuwara Eliya Police Station', district: 'Nuwara Eliya' },
  { name: 'Galle Police Station', district: 'Galle' },
  { name: 'Matara Police Station', district: 'Matara' },
  { name: 'Hambantota Police Station', district: 'Hambantota' },
  { name: 'Jaffna Police Station', district: 'Jaffna' },
  { name: 'Trincomalee Police Station', district: 'Trincomalee' },
  { name: 'Batticaloa Police Station', district: 'Batticaloa' },
  { name: 'Kurunegala Police Station', district: 'Kurunegala' },
  { name: 'Anuradhapura Police Station', district: 'Anuradhapura' },
  { name: 'Badulla Police Station', district: 'Badulla' },
  { name: 'Ratnapura Police Station', district: 'Ratnapura' },
  { name: 'Kegalle Police Station', district: 'Kegalle' },
  { name: 'Puttalam Police Station', district: 'Puttalam' }
];

const PROVINCE_COORDS = {
  'Western': { latMin: 6.7, latMax: 7.2, lngMin: 79.8, lngMax: 80.2 },
  'Central': { latMin: 7.1, latMax: 7.6, lngMin: 80.4, lngMax: 80.8 },
  'Southern': { latMin: 5.9, latMax: 6.4, lngMin: 80.0, lngMax: 81.0 },
  'Northern': { latMin: 9.0, latMax: 9.8, lngMin: 79.8, lngMax: 80.5 },
  'Eastern': { latMin: 7.0, latMax: 8.5, lngMin: 81.0, lngMax: 81.9 },
  'North Western': { latMin: 7.3, latMax: 8.0, lngMin: 79.7, lngMax: 80.3 },
  'North Central': { latMin: 7.8, latMax: 8.6, lngMin: 80.2, lngMax: 80.8 },
  'Uva': { latMin: 6.5, latMax: 7.2, lngMin: 80.8, lngMax: 81.3 },
  'Sabaragamuwa': { latMin: 6.5, latMax: 7.2, lngMin: 80.2, lngMax: 80.7 }
};

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRegNumber(provinceCode, index) {
  const num = String(index).padStart(4, '0');
  return `${provinceCode} CAB-${num}`;
}

async function seed() {
  const client = await pool.connect();

  try {
    console.log('Starting database seed...\n');

    await client.query('CREATE SCHEMA IF NOT EXISTS tuktuk');

    await client.query(`
      CREATE TABLE IF NOT EXISTS tuktuk.provinces (
        id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE,
        code VARCHAR(10) NOT NULL UNIQUE, created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS tuktuk.districts (
        id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL,
        province_id INTEGER NOT NULL REFERENCES tuktuk.provinces(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(name, province_id)
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS tuktuk.police_stations (
        id SERIAL PRIMARY KEY, name VARCHAR(200) NOT NULL,
        district_id INTEGER NOT NULL REFERENCES tuktuk.districts(id) ON DELETE CASCADE,
        address VARCHAR(500), phone VARCHAR(20), created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS tuktuk.users (
        id SERIAL PRIMARY KEY, username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(30) NOT NULL CHECK (role IN ('SUPER_ADMIN','PROVINCIAL_ADMIN','STATION_OFFICER','DEVICE')),
        assigned_province_id INTEGER, assigned_district_id INTEGER,
        assigned_station_id INTEGER, assigned_vehicle_id INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS tuktuk.vehicles (
        id SERIAL PRIMARY KEY, registration_number VARCHAR(50) NOT NULL UNIQUE,
        driver_name VARCHAR(200) NOT NULL, device_id VARCHAR(100) NOT NULL UNIQUE,
        province_id INTEGER NOT NULL REFERENCES tuktuk.provinces(id),
        district_id INTEGER NOT NULL REFERENCES tuktuk.districts(id),
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
        last_latitude DOUBLE PRECISION, last_longitude DOUBLE PRECISION,
        last_speed DOUBLE PRECISION, last_ping_at TIMESTAMPTZ,
        registered_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS tuktuk.location_pings (
        id SERIAL PRIMARY KEY, vehicle_id INTEGER NOT NULL REFERENCES tuktuk.vehicles(id) ON DELETE CASCADE,
        latitude DOUBLE PRECISION NOT NULL, longitude DOUBLE PRECISION NOT NULL,
        speed DOUBLE PRECISION, accuracy DOUBLE PRECISION,
        province_id INTEGER REFERENCES tuktuk.provinces(id),
        district_id INTEGER REFERENCES tuktuk.districts(id),
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query('CREATE INDEX IF NOT EXISTS idx_lp_vt ON tuktuk.location_pings (vehicle_id, timestamp DESC)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_lp_pt ON tuktuk.location_pings (province_id, timestamp DESC)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_lp_dt ON tuktuk.location_pings (district_id, timestamp DESC)');

    await client.query('DELETE FROM tuktuk.location_pings');
    await client.query('DELETE FROM tuktuk.users');
    await client.query('DELETE FROM tuktuk.vehicles');
    await client.query('DELETE FROM tuktuk.police_stations');
    await client.query('DELETE FROM tuktuk.districts');
    await client.query('DELETE FROM tuktuk.provinces');

    // Reset sequences
    await client.query("SELECT setval('tuktuk.provinces_id_seq', 1, false)");
    await client.query("SELECT setval('tuktuk.districts_id_seq', 1, false)");
    await client.query("SELECT setval('tuktuk.police_stations_id_seq', 1, false)");
    await client.query("SELECT setval('tuktuk.users_id_seq', 1, false)");
    await client.query("SELECT setval('tuktuk.vehicles_id_seq', 1, false)");
    await client.query("SELECT setval('tuktuk.location_pings_id_seq', 1, false)");

    const provinceMap = {};
    for (const p of PROVINCES) {
      const result = await client.query(
        'INSERT INTO tuktuk.provinces (name, code) VALUES ($1, $2) RETURNING id',
        [p.name, p.code]
      );
      provinceMap[p.name] = result.rows[0].id;
    }
    console.log(`Seeded ${PROVINCES.length} provinces`);

    // ─── 2. Seed Districts ──────────────────────────────────
    const districtMap = {};
    let districtCount = 0;
    for (const [provinceName, districts] of Object.entries(DISTRICTS)) {
      for (const districtName of districts) {
        const result = await client.query(
          'INSERT INTO tuktuk.districts (name, province_id) VALUES ($1, $2) RETURNING id',
          [districtName, provinceMap[provinceName]]
        );
        districtMap[districtName] = { id: result.rows[0].id, provinceId: provinceMap[provinceName], provinceName };
        districtCount++;
      }
    }
    console.log(`Seeded ${districtCount} districts`);

    // ─── 3. Seed Police Stations ────────────────────────────
    const stationMap = {};
    for (const station of POLICE_STATIONS) {
      const districtInfo = districtMap[station.district];
      const result = await client.query(
        'INSERT INTO tuktuk.police_stations (name, district_id, address) VALUES ($1, $2, $3) RETURNING id',
        [station.name, districtInfo.id, `${station.district} area, Sri Lanka`]
      );
      stationMap[station.name] = { id: result.rows[0].id, districtId: districtInfo.id };
    }
    console.log(`Seeded ${POLICE_STATIONS.length} police stations`);

    // ─── 4. Seed Users ──────────────────────────────────────
    const passwordHash = await bcrypt.hash('admin123', SALT_ROUNDS);
    let userCount = 0;

    // SUPER_ADMIN
    await client.query(
      `INSERT INTO tuktuk.users (username, password, role) VALUES ($1, $2, $3)`,
      ['superadmin', passwordHash, 'SUPER_ADMIN']
    );
    userCount++;

    for (const p of PROVINCES) {
      const slug = p.name.toLowerCase().replace(/\s+/g, '_');
      await client.query(
        `INSERT INTO tuktuk.users (username, password, role, assigned_province_id) VALUES ($1, $2, $3, $4)`,
        [`provincial_${slug}`, passwordHash, 'PROVINCIAL_ADMIN', provinceMap[p.name]]
      );
      userCount++;
    }

    for (const station of POLICE_STATIONS) {
      const slug = station.name.replace(/ Police Station/i, '').toLowerCase().replace(/\s+/g, '_');
      const stInfo = stationMap[station.name];
      const distInfo = districtMap[station.district];
      await client.query(
        `INSERT INTO tuktuk.users (username, password, role, assigned_province_id, assigned_district_id, assigned_station_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [`officer_${slug}`, passwordHash, 'STATION_OFFICER', distInfo.provinceId, distInfo.id, stInfo.id]
      );
      userCount++;
    }
    console.log(`Seeded ${userCount} users`);

    const SRI_LANKAN_NAMES = [
      'Kasun Perera', 'Nuwan Silva', 'Chaminda Fernando', 'Ruwan Jayawardena', 'Sampath Bandara',
      'Dinesh Kumara', 'Pradeep Wickramasinghe', 'Lahiru Rajapaksa', 'Thilina Gunasekara', 'Nimal Dissanayake',
      'Ajith Senanayake', 'Suresh Mendis', 'Kamal Herath', 'Roshan Abeysekara', 'Sanjeewa Liyanage',
      'Tharanga Weerasinghe', 'Dimuthu Pathirana', 'Saman Rathnayake', 'Anura Gamage', 'Chathura Ekanayake'
    ];

    const vehicleIds = [];
    const vehicleProvinceMap = {};
    let vehicleIndex = 0;

    const allDistricts = Object.entries(DISTRICTS).flatMap(([prov, dists]) =>
      dists.map(d => ({ district: d, province: prov }))
    );

    for (let i = 0; i < 210; i++) {
      const loc = allDistricts[i % allDistricts.length];
      const provCode = PROVINCES.find(p => p.name === loc.province).code;
      const regNum = generateRegNumber(provCode, i + 1);
      const driverName = SRI_LANKAN_NAMES[i % SRI_LANKAN_NAMES.length];
      const deviceId = `DEVICE-${String(i + 1).padStart(3, '0')}`;
      const status = Math.random() > 0.1 ? 'active' : 'inactive';

      const result = await client.query(
        `INSERT INTO tuktuk.vehicles (registration_number, driver_name, device_id, province_id, district_id, status)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [regNum, driverName, deviceId, provinceMap[loc.province], districtMap[loc.district].id, status]
      );
      vehicleIds.push(result.rows[0].id);
      vehicleProvinceMap[result.rows[0].id] = loc.province;
      vehicleIndex++;
    }
    console.log(`Seeded ${vehicleIndex} vehicles`);

    let deviceUserCount = 0;
    for (let i = 0; i < vehicleIds.length; i++) {
      const deviceId = `DEVICE-${String(i + 1).padStart(3, '0')}`;
      await client.query(
        `INSERT INTO tuktuk.users (username, password, role, assigned_vehicle_id)
         VALUES ($1, $2, $3, $4)`,
        [`device_${deviceId.toLowerCase()}`, passwordHash, 'DEVICE', vehicleIds[i]]
      );
      deviceUserCount++;
    }
    console.log(`Seeded ${deviceUserCount} DEVICE users`);

    console.log('Generating location pings (this may take a minute)...');
    const now = new Date();
    let pingCount = 0;
    const BATCH_SIZE = 500;
    let pingBatch = [];

    for (const vId of vehicleIds) {
      const province = vehicleProvinceMap[vId];
      const coords = PROVINCE_COORDS[province];
      const pInfo = { provinceId: provinceMap[province] };

      const vResult = await client.query('SELECT district_id FROM tuktuk.vehicles WHERE id = $1', [vId]);
      const districtId = vResult.rows[0].district_id;

      let baseLat = rand(coords.latMin, coords.latMax);
      let baseLng = rand(coords.lngMin, coords.lngMax);

      let lastLat = baseLat;
      let lastLng = baseLng;
      let lastSpeed = 0;
      let lastTime = null;

      for (let day = 6; day >= 0; day--) {
        const pingsPerDay = randInt(5, 20);

        for (let p = 0; p < pingsPerDay; p++) {
          const date = new Date(now);
          date.setDate(date.getDate() - day);
          date.setHours(randInt(5, 22), randInt(0, 59), randInt(0, 59));

          const isStationary = Math.random() < 0.2;
          let lat, lng, speed;

          if (isStationary) {
            lat = lastLat + rand(-0.0005, 0.0005);
            lng = lastLng + rand(-0.0005, 0.0005);
            speed = 0;
          } else {
            lat = lastLat + rand(-0.015, 0.015);
            lng = lastLng + rand(-0.015, 0.015);
            speed = Math.round(rand(5, 60) * 10) / 10;
          }

          lat = Math.max(coords.latMin, Math.min(coords.latMax, lat));
          lng = Math.max(coords.lngMin, Math.min(coords.lngMax, lng));

          const accuracy = Math.round(rand(3, 25) * 10) / 10;

          pingBatch.push({
            vehicleId: vId, lat, lng, speed, accuracy,
            provinceId: pInfo.provinceId, districtId, timestamp: date.toISOString()
          });

          lastLat = lat;
          lastLng = lng;
          lastSpeed = speed;
          lastTime = date;
          pingCount++;

          if (pingBatch.length >= BATCH_SIZE) {
            await insertPingBatch(client, pingBatch);
            pingBatch = [];
          }
        }
      }

      if (lastTime) {
        await client.query(
          `UPDATE tuktuk.vehicles SET last_latitude = $1, last_longitude = $2, last_speed = $3, last_ping_at = $4 WHERE id = $5`,
          [lastLat, lastLng, lastSpeed, lastTime.toISOString(), vId]
        );
      }
    }

    if (pingBatch.length > 0) {
      await insertPingBatch(client, pingBatch);
    }
    console.log(`Seeded ${pingCount} location pings across 7 days`);

    console.log('\n Database seed completed successfully!');
    console.log('\n Login credentials (all passwords: admin123):');
    console.log('   SUPER_ADMIN:      superadmin');
    console.log('   PROVINCIAL_ADMIN: provincial_western (and others)');
    console.log('   STATION_OFFICER:  officer_colombo_fort (and others)');
    console.log('   DEVICE:           device_device-001 (and others)');

  } catch (err) {
    console.error(' Seed failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}


async function insertPingBatch(client, batch) {
  if (batch.length === 0) return;

  const values = [];
  const placeholders = [];

  batch.forEach((p, i) => {
    const base = i * 7;
    placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`);
    values.push(p.vehicleId, p.lat, p.lng, p.speed, p.accuracy, p.provinceId, p.districtId);
  });


  const values2 = [];
  const placeholders2 = [];
  batch.forEach((p, i) => {
    const base = i * 8;
    placeholders2.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`);
    values2.push(p.vehicleId, p.lat, p.lng, p.speed, p.accuracy, p.provinceId, p.districtId, p.timestamp);
  });

  await client.query(
    `INSERT INTO tuktuk.location_pings (vehicle_id, latitude, longitude, speed, accuracy, province_id, district_id, timestamp)
     VALUES ${placeholders2.join(', ')}`,
    values2
  );
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});