// Quick check for new Vercel deployments — visit /api/health in browser
export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    chat: {
      groqKeySet: Boolean(process.env.GROQ_API_KEY),
      groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
    },
    supabase: {
      urlSet: Boolean(process.env.SUPABASE_URL),
      anonKeySet: Boolean(process.env.SUPABASE_ANON_KEY)
    }
  });
}
