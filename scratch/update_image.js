import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcxhucgarmmvwdgqgdxb.supabase.co';
const supabaseAnonKey = 'sb_publishable_F-ClcxM7_GSuDHfIgxTTvg_SB2q73_b';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateImage() {
  const { data: catData } = await supabase.from('site_content').select('*').eq('key', 'categories').single();
  
  if (catData) {
    const content = catData.content;
    const firewood = content.find(c => c.id === 'firewood');
    if (firewood) {
      firewood.img = '/item_gorbyl_new.png';
      const { error } = await supabase.from('site_content').update({ content }).eq('key', 'categories');
      if (error) console.error('Error updating Supabase:', error);
      else console.log('Successfully updated image in Supabase!');
    }
  }
}

updateImage();
