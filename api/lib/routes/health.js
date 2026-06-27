export async function handleHealth(req, res) {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  const model = process.env.AI_MODEL || 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free';
  const result = {
    ok: true,
    node: process.version,
    chat: {
      apiKeySet: Boolean(apiKey),
      apiKeyLength: apiKey ? apiKey.length : 0,
      model
    },
    supabase: {
      urlSet: Boolean(process.env.SUPABASE_URL),
      anonKeySet: Boolean(process.env.SUPABASE_ANON_KEY)
    },
    aiTest: null
  };

  if (req.query?.test === 'ai') {
    if (!apiKey) {
      result.ok = false;
      result.aiTest = { ok: false, error: 'OPENROUTER_API_KEY is not set on this deployment' };
      return res.status(503).json(result);
    }

    try {
      const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.SITE_URL || 'https://carlot.vercel.app',
          'X-Title': 'Auto Mart of Flowood'
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Say OK' }],
          max_tokens: 5
        })
      });

      const body = await aiRes.json().catch(() => ({}));

      if (!aiRes.ok) {
        result.ok = false;
        result.aiTest = {
          ok: false,
          status: aiRes.status,
          error: body?.error?.message || body?.error || 'OpenRouter request failed'
        };
        return res.status(502).json(result);
      }

      result.aiTest = {
        ok: true,
        reply: body?.choices?.[0]?.message?.content?.trim() || '(empty)'
      };
    } catch (e) {
      result.ok = false;
      result.aiTest = { ok: false, error: e.message };
      return res.status(500).json(result);
    }
  }

  return res.status(200).json(result);
}
