import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcxhucgarmmvwdgqgdxb.supabase.co';
const supabaseAnonKey = 'sb_publishable_F-ClcxM7_GSuDHfIgxTTvg_SB2q73_b';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  try {
    console.log('Attempting login...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password'
    });
    
    if (error) {
      console.log('Auth error (expected or real):', error.message);
    } else {
      console.log('Auth success:', data);
    }
  } catch (err) {
    console.error('Fetch error during auth:', err);
  }
}

testAuth();
