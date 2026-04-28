import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mcxhucgarmmvwdgqgdxb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_F-ClcxM7_GSuDHfIgxTTvg_SB2q73_b';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testUpdate() {
  console.log('Logging in...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@ustroydv.ru',
    password: 'ustroy'
  });

  if (authError) {
    console.error('Auth Error:', authError);
    return;
  }
  console.log('Login success');

  console.log('Testing update of price_header...');
  const { data, error } = await supabase
    .from('site_content')
    .update({ content: { date: '28.04.2026', zone: 'TEST UPDATE SUCCESS', notes: [] } })
    .eq('key', 'price_header')
    .select();

  if (error) {
    console.error('Update Error:', error);
  } else {
    console.log('Update Result:', data);
  }

  // Check again
  const { data: checkData } = await supabase.from('site_content').select('*').eq('key', 'price_header');
  console.log('Current data in DB:', JSON.stringify(checkData, null, 2));
}

testUpdate();
