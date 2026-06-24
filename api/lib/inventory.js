import { supabase } from './supabase.js';
import { DEMO_INVENTORY } from './demo-inventory.js';

export async function getInventory() {
  const { data, error } = await supabase
    .from('vehicles')
    .select('year, make, model, trim, price, miles, drive, engine, body, notes')
    .eq('available', true)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const realCars = data || [];
  if (realCars.length === 0) {
    return { cars: DEMO_INVENTORY, isDemo: true };
  }

  return { cars: realCars, isDemo: false };
}

export function formatInventoryForPrompt(cars, isDemo) {
  if (!cars.length) {
    return 'No vehicles currently listed. Tell customers to call (601) 939-0075 for availability.';
  }

  const header = isDemo
    ? 'SAMPLE INVENTORY (demo listings for preview — not real cars on the lot yet):'
    : 'CURRENT INVENTORY:';

  const lines = cars.map((c) => {
    const name = [c.year, c.make, c.model, c.trim].filter(Boolean).join(' ');
    const specs = [
      `$${Number(c.price).toLocaleString()}`,
      `${Number(c.miles).toLocaleString()} mi`,
      c.drive,
      c.engine,
      c.body
    ].filter(Boolean).join(' · ');
    const note = c.notes ? ` — ${c.notes}` : '';
    return `- ${name}: ${specs}${note}`;
  });

  return `${header}\n${lines.join('\n')}`;
}
