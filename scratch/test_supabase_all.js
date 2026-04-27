import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcxhucgarmmvwdgqgdxb.supabase.co';
const supabaseAnonKey = 'sb_publishable_F-ClcxM7_GSuDHfIgxTTvg_SB2q73_b';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  try {
    const { data, error } = await supabase.from('site_content').select('key, updated_at');
    if (error) {
      console.error('Data error:', error);
    } else {
      console.log('Current rows in site_content:');
      data.forEach(row => {
        console.log(`- Key: ${row.key}, Updated At: ${row.updated_at}`);
      });
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

test();
