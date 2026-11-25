export const dynamic = 'force-dynamic';

export async function GET() {
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
    return Response.json(Array.isArray(data) ? data : [], {
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
