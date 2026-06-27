import { getInventory, formatInventoryForPrompt } from '../inventory.js';
import { BUSINESS, buildSystemPrompt } from '../dealership-prompt.js';

export async function handleChat(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(503).json({
      error: `Chat is not configured yet. Call ${BUSINESS.phone} for help.`,
      code: 'missing_api_key'
    });
  }

  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const last = messages[messages.length - 1];
  if (!last?.content || typeof last.content !== 'string' || last.content.length > 2000) {
    return res.status(400).json({ error: 'Invalid message' });
  }

  try {
    const { cars, isDemo } = await getInventory();
    const inventoryText = formatInventoryForPrompt(cars, isDemo);
    const systemPrompt = buildSystemPrompt(inventoryText, isDemo);

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-10)
        .map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) }))
    ];

    const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.SITE_URL || 'https://carlot.vercel.app',
        'X-Title': 'Auto Mart of Flowood'
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
        messages: apiMessages,
        max_tokens: 600,
        temperature: 0.5
      })
    });

    if (!aiRes.ok) {
      const err = await aiRes.json().catch(() => ({}));
      console.error('OpenRouter error:', err);
      return res.status(502).json({
        error: `Sorry, I had trouble answering. Please call ${BUSINESS.phone}.`,
        code: 'groq_error',
        detail: err?.error?.message || 'OpenRouter API request failed'
      });
    }

    const data = await aiRes.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(502).json({
        error: `Sorry, I had trouble answering. Please call ${BUSINESS.phone}.`
      });
    }

    return res.status(200).json({ reply, isDemo });
  } catch (e) {
    console.error('Chat error:', e);
    return res.status(500).json({
      error: `Something went wrong. Please call ${BUSINESS.phone}.`
    });
  }
}
