import { pool } from '../config/db.js';
import bcrypt from 'bcrypt';

async function seed() {
  // Provinces
  const provinces = [
    "Western","Central","Southern","Northern",
    "Eastern","North Western","North Central",
    "Uva","Sabaragamuwa"
  ];

  for (let p of provinces) {
    await pool.query('INSERT INTO provinces(name) VALUES($1)', [p]);
  }

  // Admin user
  const password = await bcrypt.hash("admin123", 10);

  await pool.query(
    `INSERT INTO users(username,password,role)
     VALUES($1,$2,$3)`,
    ["admin", password, "ADMIN"]
  );

  console.log("Seed complete");
}


async function generateVehicles() {
  for (let i = 1; i <= 200; i++) {
    const id = `TTK-${i}`;
    const plate = `WP-${Math.floor(1000 + Math.random() * 9000)}`;
    const device = `DEVICE-${i}`;
    const districtId = Math.floor(Math.random() * 25) + 1;

    await pool.query(
      `INSERT INTO vehicles (id, plate_number, device_id, district_id)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (id) DO NOTHING`,
      [id, plate, device, districtId]
    );
  }

  console.log("200 Vehicles Generated");
  process.exit();
}

generateVehicles();

// seed();