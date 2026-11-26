import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src/data/offline-maps.json');

function readOfflineMaps() {
  try {
    if (!fs.existsSync(dataFilePath)) {
      fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
      fs.writeFileSync(dataFilePath, JSON.stringify([], null, 2));
      return [];
    }
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading offline-maps.json:', err);
    return [];
  }
}

function writeOfflineMaps(packages) {
  try {
    fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
    fs.writeFileSync(dataFilePath, JSON.stringify(packages, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing offline-maps.json:', err);
    return false;
  }
}

export async function GET() {
  const packages = readOfflineMaps();
  return Response.json(packages);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const packages = readOfflineMaps();

    // Action: update/sync a package or add/modify
    if (body.action === 'sync') {
      const pkgIndex = packages.findIndex(p => p.id === body.id);
      if (pkgIndex !== -1) {
        packages[pkgIndex] = {
          ...packages[pkgIndex],
          status: 'synced',
          lastUpdated: new Date().toISOString(),
          version: body.version || packages[pkgIndex].version
        };
      } else {
        return Response.json({ error: 'Package not found' }, { status: 404 });
      }
    } else if (body.action === 'add' || body.package) {
      const newPkg = body.package || body;
      const existingIdx = packages.findIndex(p => p.id === newPkg.id);
      if (existingIdx !== -1) {
        packages[existingIdx] = {
          ...packages[existingIdx],
          ...newPkg,
          lastUpdated: new Date().toISOString()
        };
      } else {
        packages.push({
          id: newPkg.id || `pkg-${Date.now()}`,
          name: newPkg.name || 'Unnamed Region',
          region: newPkg.region || 'Tumkur Sector',
          bounds: newPkg.bounds || { north: 13.5, south: 13.1, east: 77.2, west: 76.9 },
          center: newPkg.center || [13.3409, 77.1010],
          minZoom: newPkg.minZoom || 10,
          maxZoom: newPkg.maxZoom || 18,
          tilesCount: newPkg.tilesCount || 10000,
          sizeMb: newPkg.sizeMb || 50,
          version: newPkg.version || '1.0.0',
          status: 'synced',
          lastUpdated: new Date().toISOString()
        });
      }
    }

    const ok = writeOfflineMaps(packages);
    if (!ok) {
      return Response.json({ error: 'Failed to write offline maps data' }, { status: 500 });
    }

    return Response.json({ success: true, packages });
  } catch (err) {
    console.error('Offline maps API error:', err);
    return Response.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
