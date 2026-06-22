// /api/vehicles.js — Next.js API route (or use as Express route)
// Requires: SUPABASE_URL and SUPABASE_ANON_KEY in .env

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {

  // ── GET: fetch all inventory ──────────────────────────
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // ── POST: add new vehicle ─────────────────────────────
  if (req.method === 'POST') {
    const { vin, year, make, model, trim, engine, drive,
            transmission, body, price, miles, notes, photos } = req.body;

    if (!vin || !price || !miles) {
      return res.status(400).json({ error: 'VIN, price, and miles are required' });
    }

    // 1. Upload photos to Supabase Storage
    const photoUrls = [];
    for (let i = 0; i < photos.length; i++) {
      const base64 = photos[i];
      const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const ext = base64.split(';')[0].split('/')[1] || 'jpg';
      const path = `${vin}/${Date.now()}-${i}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('vehicle-photos')
        .upload(path, buffer, { contentType: `image/${ext}`, upsert: true });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('vehicle-photos')
          .getPublicUrl(path);
        photoUrls.push(urlData.publicUrl);
      }
    }

    // 2. Save vehicle record
    const { data, error } = await supabase
      .from('vehicles')
      .insert([{
        vin, year, make, model, trim, engine,
        drive, transmission, body,
        price: parseFloat(price),
        miles: parseInt(miles),
        notes,
        photos: photoUrls,
        available: true
      }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  // ── DELETE: remove vehicle ────────────────────────────
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID required' });

    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
