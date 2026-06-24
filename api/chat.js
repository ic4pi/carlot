import { getInventory, formatInventoryForPrompt } from './lib/inventory.js';

const BUSINESS = {
  name: 'Auto Mart of Flowood',
  address: '11 Old Hwy 49 S, Flowood, MS 39232',
  phone: '(601) 939-0075',
  hours: 'Monday–Saturday 9am–6pm, Sunday closed',
  financing: 'Several financing options available for all credit situations, including bad credit and no credit. Call to apply.',
  mapsUrl: 'https://maps.google.com/?q=11+Old+Hwy+49+S,+Flowood,+MS+39232',
  directions: `We are at 11 Old Hwy 49 S in Flowood, MS 39232 — on Old Highway 49 South in the Jackson metro area (Rankin County). From I-55, take the Flowood / Lakeland Drive exit and head toward Old Hwy 49 S. Look for Auto Mart of Flowood on Old Hwy 49 S. Google Maps link: https://maps.google.com/?q=11+Old+Hwy+49+S,+Flowood,+MS+39232`
};

function buildSystemPrompt(inventoryText, isDemo) {
  return `You are the friendly website assistant for ${BUSINESS.name}, a small pre-owned car dealership in Flowood, Mississippi.

BUSINESS INFO:
- Address: ${BUSINESS.address}
- Phone: ${BUSINESS.phone}
- Hours: ${BUSINESS.hours}
- Financing: ${BUSINESS.financing}
- Directions: ${BUSINESS.directions}
- Every vehicle is priced up front with no haggling.

${inventoryText}

RULES:
- Be warm, concise, and helpful — 2–4 sentences unless listing multiple vehicles.
- Only recommend vehicles from the inventory list above. Never invent cars, prices, or availability.
- If inventory is empty or demo-only, say so honestly and suggest calling ${BUSINESS.phone} or visiting the lot.
- When asked for directions, how to get there, or where you are located, give the address and helpful driving context from the Directions line above. Always include the Google Maps link: ${BUSINESS.mapsUrl}
${isDemo ? '- The current listings are SAMPLE/DEMO data shown until real inventory is uploaded. If asked about a specific car, mention these are examples and they should call to confirm what is actually on the lot.' : ''}
- For test drives, trade-ins, credit applications, or exact monthly payments, direct them to call or text ${BUSINESS.phone}.
- Do not discuss topics unrelated to the dealership, vehicles, financing, or visiting the lot.`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({
      error: 'Chat is not configured yet. Call (601) 939-0075 for help.',
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

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: apiMessages,
        max_tokens: 500,
        temperature: 0.6
      })
    });

    if (!groqRes.ok) {
      const err = await groqRes.json().catch(() => ({}));
      console.error('Groq error:', err);
      return res.status(502).json({
        error: 'Sorry, I had trouble answering. Please call (601) 939-0075.'
      });
    }

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(502).json({
        error: 'Sorry, I had trouble answering. Please call (601) 939-0075.'
      });
    }

    return res.status(200).json({ reply, isDemo });
  } catch (e) {
    console.error('Chat error:', e);
    return res.status(500).json({
      error: 'Something went wrong. Please call (601) 939-0075.'
    });
  }
}
