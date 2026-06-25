// Visit /api/health — add ?test=groq to ping Groq with your key
export default async function handler(req, res) {
  const groqKey = process.env.GROQ_API_KEY?.trim();
  const result = {
    ok: true,
    node: process.version,
    chat: {
      groqKeySet: Boolean(groqKey),
      groqKeyLength: groqKey ? groqKey.length : 0,
      groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
    },
    supabase: {
      urlSet: Boolean(process.env.SUPABASE_URL),
      anonKeySet: Boolean(process.env.SUPABASE_ANON_KEY)
    },
    groqTest: null
  };

  if (req.query?.test === 'groq') {
    if (!groqKey) {
      result.ok = false;
      result.groqTest = { ok: false, error: 'GROQ_API_KEY is not set on this deployment' };
      return res.status(503).json(result);
    }

    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: 'Say OK' }],
          max_tokens: 5
        })
      });

      const body = await groqRes.json().catch(() => ({}));

      if (!groqRes.ok) {
        result.ok = false;
        result.groqTest = {
          ok: false,
          status: groqRes.status,
          error: body?.error?.message || body?.error || 'Groq request failed'
        };
        return res.status(502).json(result);
      }

      result.groqTest = {
        ok: true,
        reply: body?.choices?.[0]?.message?.content?.trim() || '(empty)'
      };
    } catch (e) {
      result.ok = false;
      result.groqTest = { ok: false, error: e.message };
      return res.status(500).json(result);
    }
  }

  return res.status(200).json(result);
}
