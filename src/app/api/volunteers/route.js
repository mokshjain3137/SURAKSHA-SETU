import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src/data/volunteers.json');

function readVolunteersFromFile() {
  try {
    if (!fs.existsSync(dataFilePath)) {
      fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
      fs.writeFileSync(dataFilePath, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading volunteers database:', err);
    return [];
  }
}

function writeVolunteersToFile(volunteers) {
  try {
    fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
    fs.writeFileSync(dataFilePath, JSON.stringify(volunteers, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing volunteers database:', err);
    return false;
  }
}

export async function GET() {
  const volunteers = readVolunteersFromFile();
  return Response.json(volunteers);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const current = readVolunteersFromFile();
    const incoming = Array.isArray(body) ? body : [body];

    let savedRecord = null;
    for (const vol of incoming) {
      if (!vol || !vol.name) continue;
      const existingIndex = current.findIndex(
        v => v.id === vol.id || (v.name && vol.name && v.name.toLowerCase() === vol.name.toLowerCase())
      );
      if (existingIndex !== -1) {
        current[existingIndex] = { ...current[existingIndex], ...vol, id: current[existingIndex].id };
        savedRecord = current[existingIndex];
      } else {
        const newVol = { ...vol, id: vol.id || Date.now() };
        current.unshift(newVol);
        savedRecord = newVol;
      }
    }

    const ok = writeVolunteersToFile(current);
    if (!ok) {
      return Response.json({ error: 'Database write failed' }, { status: 500 });
    }

    return Response.json({ success: true, volunteer: savedRecord, volunteers: current });
  } catch (err) {
    console.error('POST volunteer error:', err);
    return Response.json({ error: 'Invalid volunteer payload' }, { status: 400 });
  }
}
