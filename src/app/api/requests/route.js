import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src/data/requests.json');

function getAntiSpamConfig() {
  try {
    const configPath = path.join(process.cwd(), 'src/data/anti-spam.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (err) {
    console.error('Error loading anti-spam config in requests route:', err);
  }
  return { blockedNumbers: [], spamKeywords: [], rateLimitEnabled: false, rateLimitWindowSeconds: 30 };
}

function normalizePhone(num) {
  if (!num) return '';
  return String(num).replace(/[^0-9]/g, '');
}

// Helper to read data safely
function readRequestsFromFile() {
  try {
    if (!fs.existsSync(dataFilePath)) {
      // Create empty file if not exists
      fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
      fs.writeFileSync(dataFilePath, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading requests database:', err);
    return [];
  }
}

// Helper to write data safely
function writeRequestsToFile(requests) {
  try {
    fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
    fs.writeFileSync(dataFilePath, JSON.stringify(requests, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing requests database:', err);
    return false;
  }
}

// GET: Returns list of all requests
export async function GET() {
  const requests = readRequestsFromFile();
  return Response.json(requests);
}

// POST: Adds a new request (supports multiple or single, and handles duplicates)
export async function POST(request) {
  try {
    const body = await request.json();
    const currentRequests = readRequestsFromFile();
    const spamConfig = getAntiSpamConfig();
    const blockedNormalized = (spamConfig.blockedNumbers || []).map(normalizePhone).filter(Boolean);
    const keywords = (spamConfig.spamKeywords || []).map(k => String(k).toLowerCase().trim()).filter(Boolean);
    
    // Check if it's an array of requests (from mobile sync bridge) or a single request (from web dashboard)
    const incomingRequests = Array.isArray(body) ? body : [body];
    let addedCount = 0;
    let updatedCount = 0;

    for (const req of incomingRequests) {
      if (!req.requestId) continue;

      // Anti-spam guardrails
      const phoneNorm = normalizePhone(req.contactPhone);
      const descLower = String(req.description || '').toLowerCase();
      let isSpam = false;
      let spamReason = null;

      if (phoneNorm && blockedNormalized.some(b => phoneNorm.endsWith(b) || b.endsWith(phoneNorm))) {
        isSpam = true;
        spamReason = 'Sender phone is in blocked numbers registry';
      }

      if (!isSpam && keywords.length > 0) {
        for (const kw of keywords) {
          if (descLower.includes(kw)) {
            isSpam = true;
            spamReason = `Description contains spam keyword: "${kw}"`;
            break;
          }
        }
      }

      const reqToSave = {
        ...req,
        ...(isSpam ? { isSpam: true, spamReason } : {})
      };

      const existingIndex = currentRequests.findIndex(r => r.requestId === req.requestId);
      if (existingIndex !== -1) {
        // Update if status changes or fields are updated
        currentRequests[existingIndex] = {
          ...currentRequests[existingIndex],
          ...reqToSave
        };
        updatedCount++;
      } else {
        // Insert new request
        currentRequests.unshift(reqToSave); // add to top
        addedCount++;
      }
    }

    const success = writeRequestsToFile(currentRequests);
    if (!success) {
      return Response.json({ error: 'Database write failed' }, { status: 500 });
    }

    // Forward to Google Apps Script Webhook if configured
    const webhookUrl = process.env.NEXT_PUBLIC_SURAKSHASETU_WEBHOOK_URL;
    if (webhookUrl && addedCount > 0) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incomingRequests)
      }).catch(err => console.error("Webhook forward error:", err));
    }

    return Response.json({ 
      success: true, 
      message: `Sync successful. Added ${addedCount} new, updated ${updatedCount} records.` 
    });
  } catch (err) {
    console.error('POST request error:', err);
    return Response.json({ error: 'Invalid payload request structure' }, { status: 400 });
  }
}
