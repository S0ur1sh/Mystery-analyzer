export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Parse body safely — Vercel sometimes passes body as string
  let text = '';
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    text = (body && body.text) ? body.text.trim() : '';
  } catch (parseErr) {
    return res.status(400).json({ error: 'Invalid JSON body: ' + parseErr.message });
  }

  if (!text || text.length < 20) {
    return res.status(400).json({ error: 'Text too short — paste at least a paragraph.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY not set in Vercel environment variables.' });
  }

  const systemPrompt = `You are a professional fiction editor specializing in mystery and thriller novels. Analyze the provided text and return ONLY a valid JSON object — no markdown, no explanation, just raw JSON:

{
  "overall": "2-3 sentence overall assessment",
  "scores": {
    "plot": "Strong/Good/Fair/Weak",
    "characters": "Strong/Good/Fair/Weak",
    "tension": "Strong/Good/Fair/Weak",
    "pacing": "Strong/Good/Fair/Weak"
  },
  "plot_holes": [{"title": "short label", "detail": "specific explanation"}],
  "character_issues": [{"title": "short label", "detail": "specific explanation"}],
  "tension_suggestions": [{"title": "short label", "detail": "specific suggestion"}],
  "pacing_notes": [{"title": "short label", "detail": "specific observation"}],
  "strengths": [{"title": "short label", "detail": "specific strength"}]
}

Each array: 2-4 items. Reference actual text. Be specific and constructive.`;

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1500,
        temperature: 0.4,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ]
      })
    });

    const groqData = await groqRes.json();

    if (!groqRes.ok) {
      return res.status(500).json({
        error: 'Groq API error: ' + (groqData.error?.message || JSON.stringify(groqData))
      });
    }

    const raw = (groqData.choices?.[0]?.message?.content || '').replace(/```json|```/g, '').trim();

    if (!raw) {
      return res.status(500).json({ error: 'Groq returned empty response.' });
    }

    let result;
    try {
      result = JSON.parse(raw);
    } catch (jsonErr) {
      return res.status(500).json({
        error: 'Could not parse Groq response as JSON: ' + jsonErr.message,
        raw: raw.slice(0, 200)
      });
    }

    return res.status(200).json(result);

  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
