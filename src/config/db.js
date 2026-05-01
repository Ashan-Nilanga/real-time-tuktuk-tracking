import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});


export async function initDB() {
  const client = await pool.connect();
  try {
    await client.query('CREATE SCHEMA IF NOT EXISTS tuktuk');

    // Provinces
    await client.query(`
      CREATE TABLE IF NOT EXISTS tuktuk.provinces (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        code VARCHAR(10) NOT NULL UNIQUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Districts
    await client.query(`
      CREATE TABLE IF NOT EXISTS tuktuk.districts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        province_id INTEGER NOT NULL REFERENCES tuktuk.provinces(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(name, province_id)
      )
    `);

    // Police Stations
    await client.query(`
      CREATE TABLE IF NOT EXISTS tuktuk.police_stations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        district_id INTEGER NOT NULL REFERENCES tuktuk.districts(id) ON DELETE CASCADE,
        address VARCHAR(500),
        phone VARCHAR(20),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Users
    await client.query(`
      CREATE TABLE IF NOT EXISTS tuktuk.users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(30) NOT NULL CHECK (role IN ('SUPER_ADMIN','PROVINCIAL_ADMIN','STATION_OFFICER','DEVICE')),
        assigned_province_id INTEGER REFERENCES tuktuk.provinces(id),
        assigned_district_id INTEGER REFERENCES tuktuk.districts(id),
        assigned_station_id INTEGER REFERENCES tuktuk.police_stations(id),
        assigned_vehicle_id INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Vehicles
    await client.query(`
      CREATE TABLE IF NOT EXISTS tuktuk.vehicles (
        id SERIAL PRIMARY KEY,
        registration_number VARCHAR(50) NOT NULL UNIQUE,
        driver_name VARCHAR(200) NOT NULL,
        device_id VARCHAR(100) NOT NULL UNIQUE,
        province_id INTEGER NOT NULL REFERENCES tuktuk.provinces(id),
        district_id INTEGER NOT NULL REFERENCES tuktuk.districts(id),
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
        last_latitude DOUBLE PRECISION,
        last_longitude DOUBLE PRECISION,
        last_speed DOUBLE PRECISION,
        last_ping_at TIMESTAMPTZ,
        registered_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'tuktuk' AND table_name = 'users' AND column_name = 'assigned_vehicle_id'
        ) THEN
          ALTER TABLE tuktuk.users ADD COLUMN assigned_vehicle_id INTEGER;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'fk_users_vehicle'
          AND table_schema = 'tuktuk'
        ) THEN
          ALTER TABLE tuktuk.users
            ADD CONSTRAINT fk_users_vehicle
            FOREIGN KEY (assigned_vehicle_id) REFERENCES tuktuk.vehicles(id);
        END IF;
      END $$;
    `);

    // Location Pings
    await client.query(`
      CREATE TABLE IF NOT EXISTS tuktuk.location_pings (
        id SERIAL PRIMARY KEY,
        vehicle_id INTEGER NOT NULL REFERENCES tuktuk.vehicles(id) ON DELETE CASCADE,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        speed DOUBLE PRECISION,
        accuracy DOUBLE PRECISION,
        province_id INTEGER REFERENCES tuktuk.provinces(id),
        district_id INTEGER REFERENCES tuktuk.districts(id),
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_location_pings_vehicle_time
        ON tuktuk.location_pings (vehicle_id, timestamp DESC)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_location_pings_province_time
        ON tuktuk.location_pings (province_id, timestamp DESC)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_location_pings_district_time
        ON tuktuk.location_pings (district_id, timestamp DESC)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_vehicles_province
        ON tuktuk.vehicles (province_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_vehicles_district
        ON tuktuk.vehicles (district_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_vehicles_status
        ON tuktuk.vehicles (status)
    `);

    console.log('Database schema and tables initialized');
  } catch (err) {
    console.error('Database initialization failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}