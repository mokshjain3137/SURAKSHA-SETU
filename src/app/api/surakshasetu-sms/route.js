import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function getAntiSpamConfig() {
  try {
    const configPath = path.join(process.cwd(), 'src/data/anti-spam.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (err) {
    console.error('Error loading anti-spam config in SMS route:', err);
  }
  return { blockedNumbers: [], spamKeywords: [], rateLimitEnabled: false, rateLimitWindowSeconds: 30 };
}

function normalizePhone(num) {
  if (!num) return '';
  return String(num).replace(/[^0-9]/g, '');
}

export async function GET(request) {
  const webhookUrl = process.env.NEXT_PUBLIC_SURAKSHASETU_WEBHOOK_URL;

  if (!webhookUrl) {
    return Response.json(
      { error: 'NEXT_PUBLIC_SURAKSHASETU_WEBHOOK_URL environment variable is not configured' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(webhookUrl, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      return Response.json(
        { error: `Upstream webhook responded with status ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    let rows = Array.isArray(data) ? data : [];

    // Apply anti-spam and guardrails
    const spamConfig = getAntiSpamConfig();
    const blockedNormalized = (spamConfig.blockedNumbers || []).map(normalizePhone).filter(Boolean);
    const keywords = (spamConfig.spamKeywords || []).map(k => String(k).toLowerCase().trim()).filter(Boolean);

    // Track sender timestamps for rate-limiting
    const seenSenders = new Map();

    const processedRows = rows.map((row) => {
      const fromRaw = row.FROM || row.from || '';
      const messageRaw = row['RAW MESSAGE'] || row.rawMessage || row.message || '';
      const fromNormalized = normalizePhone(fromRaw);
      const messageLower = String(messageRaw).toLowerCase();

      let isSpam = false;
      let spamReason = null;

      // Check blocked numbers
      if (fromNormalized && blockedNormalized.some(b => fromNormalized.endsWith(b) || b.endsWith(fromNormalized))) {
        isSpam = true;
        spamReason = 'Blocked Sender Phone Number';
      }

      // Check spam keywords
      if (!isSpam && keywords.length > 0) {
        for (const kw of keywords) {
          if (messageLower.includes(kw)) {
            isSpam = true;
            spamReason = `Spam Keyword Match: "${kw}"`;
            break;
          }
        }
      }

      // Check rate-limiting / duplicate suppression
      if (spamConfig.rateLimitEnabled && fromNormalized) {
        const rowTime = row.TIMESTAMP ? new Date(row.TIMESTAMP).getTime() : Date.now();
        if (seenSenders.has(fromNormalized)) {
          const lastTime = seenSenders.get(fromNormalized);
          const diffSeconds = Math.abs(rowTime - lastTime) / 1000;
          if (diffSeconds < (spamConfig.rateLimitWindowSeconds || 30)) {
            isSpam = true;
            spamReason = `Rate-Limited (Cooldown: ${spamConfig.rateLimitWindowSeconds}s)`;
          }
        }
        seenSenders.set(fromNormalized, rowTime);
      }

      return {
        ...row,
        isSpam,
        ...(spamReason ? { spamReason } : {})
      };
    });

    // Support ?filterSpam=true parameter if client wishes to omit spam entirely
    const { searchParams } = new URL(request.url);
    const filterSpam = searchParams.get('filterSpam') === 'true';
    const finalRows = filterSpam ? processedRows.filter(r => !r.isSpam) : processedRows;

    return Response.json(finalRows, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    console.error('Error fetching SurakshaSetu SMS data:', error);
    return Response.json(
      {
        error: 'Failed to fetch SurakshaSetu SMS alerts from upstream webhook',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 502 }
    );
  }
}
