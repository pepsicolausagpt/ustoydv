import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcxhucgarmmvwdgqgdxb.supabase.co';
const supabaseAnonKey = 'sb_publishable_F-ClcxM7_GSuDHfIgxTTvg_SB2q73_b';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testWrite() {
  console.log('Testing write without login...');
  const { error: err1 } = await supabase.from('site_content').upsert({ key: 'test_key', content: { test: true } }, { onConflict: 'key' });
  if (err1) console.log('Write without login failed (Expected):', err1.message);
  else console.log('Write without login SUCCESS (Unexpected!)');

  console.log('\nLogging in...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@ustroydv.ru',
    password: 'password' // I don't know the real password, but I can check if the error is different
  });

  if (authError) {
    console.log('Login failed:', authError.message);
    return;
  }

  console.log('Login success. Testing write with login...');
  const { error: err2 } = await supabase.from('site_content').upsert({ key: 'test_key', content: { test: true } }, { onConflict: 'key' });
  if (err2) console.log('Write WITH login failed:', err2.message);
  else console.log('Write WITH login SUCCESS!');
}

testWrite();
