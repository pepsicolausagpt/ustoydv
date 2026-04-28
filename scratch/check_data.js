import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mcxhucgarmmvwdgqgdxb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_F-ClcxM7_GSuDHfIgxTTvg_SB2q73_b';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkData() {
  console.log('Fetching site_content...');
  try {
    const { data, error } = await supabase.from('site_content').select('*');
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Data found:', data ? data.length : 0, 'rows');
      if (data) {
        data.forEach(row => {
          console.log(`Key: ${row.key}`);
          if (row.key === 'price_header') {
            console.log('Price Header content:', JSON.stringify(row.content, null, 2));
          }
        });
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkData();
