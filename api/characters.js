export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Parse body safely
  let chapters = [];
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    // Accept { chapters: [...] } or { text: "..." }
    if (body?.chapters && Array.isArray(body.chapters)) {
      chapters = body.chapters.filter(c => c && String(c).trim().length > 20);
    } else if (body?.text) {
      chapters = [String(body.text).trim()];
    }
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON body: ' + err.message });
  }

  if (chapters.length === 0) {
    return res.status(400).json({ error: 'No valid chapter text provided.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured in Vercel.' });
  }

  const chaptersText = chapters.map((ch, i) => `CHAPTER ${i + 1}:\n${ch}`).join('\n\n---\n\n');

  const systemPrompt = `You are a professional fiction editor specializing in mystery and thriller character analysis.

Analyze the provided chapter(s) and return ONLY a valid JSON object matching this exact structure:

{
  "characters": [
    {
      "name": "character full name",
      "role": "protagonist/antagonist/supporting/mentioned",
      "chapters_present": [1],
      "traits": ["trait1", "trait2", "trait3"],
      "dialogue_style": "brief description of how they speak",
      "inconsistencies": [
        { "title": "short label", "detail": "specific inconsistency referencing actual text" }
      ],
      "arc_notes": "brief note on character development",
      "status": "Consistent/Minor Issues/Needs Attention"
    }
  ],
  "overall_consistency": "Strong/Good/Fair/Weak",
  "relationship_notes": [
    { "characters": "Character A & Character B", "note": "observation about their dynamic" }
  ],
  "missing_characters": "note any characters who disappear without explanation, or None",
  "top_priority": "the single most important character issue to fix"
}

Rules:
- Identify ALL named characters, even minor ones.
- For inconsistencies, quote or closely paraphrase the contradicting moments.
- Return JSON only — no markdown, no explanation.`;

  try {
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: chaptersText }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      })
    });

    const groqData = await groqResponse.json();

    if (!groqResponse.ok) {
      return res.status(groqResponse.status || 500).json({
        error: 'Groq API error: ' + (groqData?.error?.message || JSON.stringify(groqData))
      });
    }

    const raw = groqData?.choices?.[0]?.message?.content;
    if (!raw) return res.status(500).json({ error: 'Groq returned empty response.', groq_response: groqData });

    let result;
    try {
      result = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (err) {
      return res.status(500).json({
        error: 'Could not parse Groq response as JSON: ' + err.message,
        raw: typeof raw === 'string' ? raw.slice(0, 500) : raw
      });
    }

    return res.status(200).json(result);

  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
