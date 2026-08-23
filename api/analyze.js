export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed'
    });
  }

  // ------------------------------------------------------------
  // READ REQUEST BODY
  // ------------------------------------------------------------

  let text = '';

  try {
    const body =
      typeof req.body === 'string'
        ? JSON.parse(req.body)
        : req.body;

    text = body?.text ? String(body.text).trim() : '';
  } catch (err) {
    return res.status(400).json({
      error: 'Invalid JSON body: ' + err.message
    });
  }

  if (!text || text.length < 20) {
    return res.status(400).json({
      error: 'Text too short — paste at least a paragraph.'
    });
  }

  // ------------------------------------------------------------
  // GROQ API KEY
  // ------------------------------------------------------------

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'GROQ_API_KEY is not configured in Vercel.'
    });
  }

  // ------------------------------------------------------------
  // SYSTEM PROMPT
  // ------------------------------------------------------------

  const systemPrompt = `
You are a professional fiction editor specializing in mystery,
thriller, detective fiction, crime fiction, and narrative analysis.

Analyze the provided manuscript carefully.

Return ONLY a valid JSON object matching this exact structure:

{
  "overall": "2-3 sentence overall assessment",

  "scores": {
    "plot": "Strong/Good/Fair/Weak",
    "characters": "Strong/Good/Fair/Weak",
    "tension": "Strong/Good/Fair/Weak",
    "pacing": "Strong/Good/Fair/Weak"
  },

  "plot_holes": [
    {
      "title": "short label",
      "detail": "specific explanation based on the actual text"
    }
  ],

  "character_issues": [
    {
      "title": "short label",
      "detail": "specific explanation based on the actual text"
    }
  ],

  "tension_suggestions": [
    {
      "title": "short label",
      "detail": "specific constructive suggestion"
    }
  ],

  "pacing_notes": [
    {
      "title": "short label",
      "detail": "specific observation based on the actual text"
    }
  ],

  "strengths": [
    {
      "title": "short label",
      "detail": "specific strength found in the actual text"
    }
  ]
}

Rules:

- Each array must contain 2-4 items when the manuscript provides enough material.
- Reference actual events, characters, clues, dialogue, chronology,
  or other details from the supplied manuscript.
- Do not invent evidence.
- Do not assume information that is not present.
- Be specific and constructive.
- Distinguish genuine contradictions from intentional ambiguity.
- Analyze the writing as a mystery/thriller rather than simply summarizing it.
- Return JSON only.
`;

  // ------------------------------------------------------------
  // CALL GROQ
  // ------------------------------------------------------------

  try {
    const groqResponse = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },

        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',

          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: text
            }
          ],

          temperature: 0.4,
          max_tokens: 4000,

          response_format: {
            type: 'json_object'
          }
        })
      }
    );

    // ----------------------------------------------------------
    // READ GROQ RESPONSE
    // ----------------------------------------------------------

    const groqData = await groqResponse.json();

    if (!groqResponse.ok) {
      console.error('Groq API error:', groqData);

      return res.status(groqResponse.status || 500).json({
        error:
          'Groq API error: ' +
          (
            groqData?.error?.message ||
            JSON.stringify(groqData)
          )
      });
    }

    // ----------------------------------------------------------
    // EXTRACT MODEL RESPONSE
    // ----------------------------------------------------------

    const raw =
      groqData?.choices?.[0]?.message?.content;

    if (!raw) {
      return res.status(500).json({
        error: 'Groq returned an empty response.',
        groq_response: groqData
      });
    }

    // ----------------------------------------------------------
    // PARSE JSON
    // ----------------------------------------------------------

    let result;

    try {
      result =
        typeof raw === 'string'
          ? JSON.parse(raw)
          : raw;
    } catch (err) {
      console.error('Groq JSON parse error:', err);
      console.error('Raw response:', raw);

      return res.status(500).json({
        error:
          'Could not parse Groq response as JSON: ' +
          err.message,

        raw:
          typeof raw === 'string'
            ? raw.slice(0, 500)
            : raw
      });
    }

    // ----------------------------------------------------------
    // RETURN RESULT TO analyse.js
    // ------------------------------------------------------------

    return res.status(200).json(result);

  } catch (err) {
    console.error('Analyze server error:', err);

    return res.status(500).json({
      error: 'Server error: ' + err.message
    });
  }
}
