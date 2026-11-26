import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src/data/telemetry.json');

// In-memory telemetry cache for sub-millisecond local response
let memoryTelemetry = null;
let lastMemoryUpdate = 0;

const DEFAULT_TELEMETRY = {
  temperature: 27.5,
  humidity: 63.0,
  water_level: 120.0,
  seismic: 0.05,
  rain_level: 0,
  latitude: 12.3275,
  longitude: 76.6133,
  status: "Normal Operational Baseline",
  created_at: new Date().toISOString()
};

function readTelemetry() {
  try {
    if (!fs.existsSync(dataFilePath)) {
      fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
      fs.writeFileSync(dataFilePath, JSON.stringify(DEFAULT_TELEMETRY, null, 2));
      return DEFAULT_TELEMETRY;
    }
    const raw = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading telemetry file:', err);
    return DEFAULT_TELEMETRY;
  }
}

function writeTelemetry(data) {
  try {
    fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving telemetry file:', err);
    return false;
  }
}

// GET: Returns current real-time hardware telemetry (instant local cache + Supabase fallback)
export async function GET() {
  const now = Date.now();

  // 1. If we have fresh in-memory telemetry from the local ESP32 (within last 8 seconds), return INSTANTLY (0.1ms)
  if (memoryTelemetry && (now - lastMemoryUpdate < 8000)) {
    return Response.json(memoryTelemetry);
  }

  // 2. Check local file if memory is cold
  const localFile = readTelemetry();
  if (localFile && localFile.created_at) {
    const fileAge = now - new Date(localFile.created_at).getTime();
    if (fileAge < 8000) {
      memoryTelemetry = localFile;
      lastMemoryUpdate = new Date(localFile.created_at).getTime();
      return Response.json(localFile);
    }
  }

  // 3. Fallback to Supabase Cloud if local ESP32 stream is quiet/offline
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseKey) {
    try {
      const restEndpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/sensor_logs?select=*&order=created_at.desc&limit=1`;
      const res = await fetch(restEndpoint, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        cache: 'no-store'
      });
      if (res.ok) {
        const rows = await res.json();
        if (rows && rows.length > 0 && rows[0]) {
          memoryTelemetry = rows[0];
          lastMemoryUpdate = Date.now();
          return Response.json(rows[0]);
        }
      }
    } catch (e) {
      console.error('Failed to fetch from Supabase in /api/telemetry:', e.message);
    }
  }

  return Response.json(localFile || DEFAULT_TELEMETRY);
}

// POST: Accepts hardware telemetry directly from ESP32 or demo triggers (sub-millisecond ingest)
export async function POST(request) {
  try {
    const body = await request.json();

    const updated = {
      ...body,
      created_at: new Date().toISOString(),
      status: body.status || "Live Hardware Sync"
    };

    // Update in-memory cache instantly
    memoryTelemetry = updated;
    lastMemoryUpdate = Date.now();

    // Persist to local JSON file asynchronously
    writeTelemetry(updated);

    // Asynchronously mirror into Supabase Cloud sensor_logs without blocking the ESP32
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      const restEndpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/sensor_logs`;
      fetch(restEndpoint, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          temperature: updated.temperature,
          humidity: updated.humidity,
          water_level: updated.water_level,
          seismic: updated.seismic,
          rain_level: updated.rain_level,
          soil_moisture: updated.soil_moisture,
          baro_pressure: updated.baro_pressure,
          altitude: updated.altitude,
          air_quality: updated.air_quality,
          wind_speed: updated.wind_speed,
          wind_direction: updated.wind_direction,
          status: updated.status
        })
      }).catch(e => console.error('Supabase auto-mirror error:', e.message));
    }

    return Response.json({
      success: true,
      message: "Telemetry updated successfully",
      telemetry: updated
    });
  } catch (err) {
    console.error('POST telemetry error:', err);
    return Response.json({ error: 'Invalid telemetry structure' }, { status: 400 });
  }
}
