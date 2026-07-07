export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { chapters } = req.body;

  if (!chapters || !Array.isArray(chapters) || chapters.length < 1) {
    return res.status(400).json({ error: 'At least one chapter is required.' });
  }

  const validChapters = chapters.filter(c => c && c.trim().split(/\s+/).length >= 30);
  if (validChapters.length === 0) {
    return res.status(400).json({ error: 'Each chapter needs at least 30 words.' });
  }

  const systemPrompt = `You are a professional fiction editor specializing in character consistency analysis for mystery and thriller novels. Analyze the provided chapter(s) and return ONLY a valid JSON object with this exact structure — no markdown, no explanation, just raw JSON:

{
  "characters": [
    {
      "name": "character name",
      "role": "protagonist/antagonist/supporting/mentioned",
      "chapters_present": [1, 2],
      "traits": ["trait1", "trait2", "trait3"],
      "dialogue_style": "brief description of how they speak",
      "inconsistencies": [
        {"title": "short label", "detail": "specific inconsistency referencing actual text and chapter"}
      ],
      "arc_notes": "brief note on character development or lack thereof",
      "status": "Consistent/Minor Issues/Needs Attention"
    }
  ],
  "overall_consistency": "Strong/Good/Fair/Weak",
  "relationship_notes": [
    {"characters": "Character A & Character B", "note": "observation about their dynamic"}
  ],
  "missing_characters": "note any characters mentioned early who disappear without explanation, or 'None'",
  "top_priority": "the single most important character issue to fix"
}

Identify ALL named characters, even minor ones. For inconsistencies, be very specific — quote or closely paraphrase the contradicting moments. If only one chapter is provided, note what can be assessed vs what requires more chapters.`;

  const chaptersText = validChapters.map((ch, i) => `CHAPTER ${i + 1}:\n${ch}`).join('\n\n---\n\n');

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 2000,
        temperature: 0.3,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: chaptersText }
        ]
      })
    });

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);
    return res.status(200).json(result);

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Something went wrong.' });
  }
}
