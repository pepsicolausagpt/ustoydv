import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcxhucgarmmvwdgqgdxb.supabase.co';
const supabaseAnonKey = 'sb_publishable_F-ClcxM7_GSuDHfIgxTTvg_SB2q73_b';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  try {
    const { data, error } = await supabase.from('site_content').select('*').limit(1);
    if (error) {
      console.error('Data error:', error);
    } else {
      console.log('Data success:', data);
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

test();
