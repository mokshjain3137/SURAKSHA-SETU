import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src/data/anti-spam.json');

const DEFAULT_ANTI_SPAM = {
  blockedNumbers: [
    "+919999999999",
    "+919876500000"
  ],
  spamKeywords: [
    "lottery",
    "prize",
    "promo",
    "free cash",
    "subscribe",
    "congratulations",
    "click here",
    "win money"
  ],
  rateLimitEnabled: true,
  rateLimitWindowSeconds: 30
};

export function readAntiSpamConfig() {
  try {
    if (!fs.existsSync(dataFilePath)) {
      fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
      fs.writeFileSync(dataFilePath, JSON.stringify(DEFAULT_ANTI_SPAM, null, 2));
      return DEFAULT_ANTI_SPAM;
    }
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading anti-spam config:', err);
    return DEFAULT_ANTI_SPAM;
  }
}

export function writeAntiSpamConfig(config) {
  try {
    fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
    fs.writeFileSync(dataFilePath, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing anti-spam config:', err);
    return false;
  }
}

export async function GET() {
  const config = readAntiSpamConfig();
  return Response.json(config);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const current = readAntiSpamConfig();

    if (body.action === 'addNumber' && body.number) {
      const cleanNum = String(body.number).trim();
      if (!current.blockedNumbers.includes(cleanNum)) {
        current.blockedNumbers.push(cleanNum);
      }
    } else if (body.action === 'removeNumber' && body.number) {
      current.blockedNumbers = current.blockedNumbers.filter(n => n !== body.number.trim());
    } else if (body.action === 'addKeyword' && body.keyword) {
      const cleanKw = String(body.keyword).trim().toLowerCase();
      if (!current.spamKeywords.includes(cleanKw)) {
        current.spamKeywords.push(cleanKw);
      }
    } else if (body.action === 'removeKeyword' && body.keyword) {
      const target = body.keyword.trim().toLowerCase();
      current.spamKeywords = current.spamKeywords.filter(k => k.toLowerCase() !== target);
    } else if (body.action === 'updateSettings') {
      if (typeof body.rateLimitEnabled === 'boolean') {
        current.rateLimitEnabled = body.rateLimitEnabled;
      }
      if (typeof body.rateLimitWindowSeconds === 'number') {
        current.rateLimitWindowSeconds = Math.max(5, body.rateLimitWindowSeconds);
      }
    } else if (body.blockedNumbers || body.spamKeywords) {
      // Full object update
      if (Array.isArray(body.blockedNumbers)) current.blockedNumbers = body.blockedNumbers;
      if (Array.isArray(body.spamKeywords)) current.spamKeywords = body.spamKeywords;
      if (typeof body.rateLimitEnabled === 'boolean') current.rateLimitEnabled = body.rateLimitEnabled;
      if (typeof body.rateLimitWindowSeconds === 'number') current.rateLimitWindowSeconds = body.rateLimitWindowSeconds;
    }

    const ok = writeAntiSpamConfig(current);
    if (!ok) {
      return Response.json({ error: 'Failed to write anti-spam configuration' }, { status: 500 });
    }

    return Response.json({ success: true, config: current });
  } catch (err) {
    console.error('Anti-spam API error:', err);
    return Response.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
