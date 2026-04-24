import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcxhucgarmmvwdgqgdxb.supabase.co';
const supabaseAnonKey = 'sb_publishable_F-ClcxM7_GSuDHfIgxTTvg_SB2q73_b';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
