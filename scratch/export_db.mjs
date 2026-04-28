import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://mcxhucgarmmvwdgqgdxb.supabase.co';
const supabaseAnonKey = 'sb_publishable_F-ClcxM7_GSuDHfIgxTTvg_SB2q73_b';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function exportData() {
  console.log('Fetching data from Supabase...');
  try {
    const { data, error } = await supabase.from('site_content').select('*');
    if (error) {
      console.error('Error fetching data:', error);
      return;
    }

    const db = {};
    data.forEach(row => {
      db[row.key] = row.content;
    });

    fs.writeFileSync('public/data/db.json', JSON.stringify(db, null, 2));
    console.log('Successfully exported to public/data/db.json');
    console.log('Summary of keys exported:', Object.keys(db).join(', '));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

exportData();
