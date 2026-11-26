export async function POST(req) {
  try {
    const { sensorData, lang } = await req.json();
    const languageInstruction = lang === 'kn' 
      ? 'The output summary MUST be written in Kannada language.' 
      : 'The output summary MUST be written in English.';
    
    const prompt = `As a Disaster Response AI Assistant, analyze these sensor readings and provide a 2-sentence tactical summary for the incident commander. Mention any critical threats. ${languageInstruction}
Readings: ${JSON.stringify(sensorData)}`;

    // 1. Google Gemini API (preferred)
    if (process.env.GEMINI_API_KEY) {
      try {
        const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`;
        const geminiRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2 }
          })
        });
        if (geminiRes.ok) {
          const gData = await geminiRes.json();
          const gText = gData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (gText) {
            return Response.json({ summary: gText.trim(), provider: 'google-gemini' });
          }
        }
      } catch (geminiErr) {
        console.warn("Gemini Summary Error (falling back):", geminiErr.message);
      }
    }

    // 2. Groq fallback
    if (process.env.GROQ_API_KEY) {
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3
        })
      });

      const data = await groqResponse.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return Response.json({ summary: data.choices[0].message.content.trim(), provider: 'groq' });
      }
    }

    // 3. Resilient Offline Tactical Summary
    const highAlertSensors = Object.entries(sensorData || {})
      .filter(([k, v]) => typeof v === 'object' && (v.status === 'danger' || v.status === 'warning' || v.alert))
      .map(([k]) => k);

    const offlineSummary = highAlertSensors.length > 0
      ? `Active environmental threats detected on ${highAlertSensors.join(', ')}. Incident dispatch recommended for immediate zone stabilization.`
      : `All live sensor telemetry readings are currently within safe baseline parameters. Normal continuous monitoring maintained.`;

    return Response.json({ summary: offlineSummary, provider: 'offline-tactical' });
  } catch (error) {
    console.error("AI Error:", error);
    return Response.json({ error: error.message || "AI processing failed" }, { status: 500 });
  }
}
