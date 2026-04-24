import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcxhucgarmmvwdgqgdxb.supabase.co';
const supabaseKey = 'sb_publishable_F-ClcxM7_GSuDHfIgxTTvg_SB2q73_b';

async function fixPaths() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data, error } = await supabase.from('site_content').select('*');
  if (error) {
    console.error('Error fetching:', error);
    return;
  }

  const categories = data.find(d => d.key === 'categories');
  if (categories && categories.content) {
    const fixedContent = JSON.parse(JSON.stringify(categories.content).replace(/"img":"\//g, '"img":"'));
    const { error: updateError } = await supabase.from('site_content').upsert({ key: 'categories', content: fixedContent });
    if (updateError) console.error('Error updating categories:', updateError);
    else console.log('Categories paths fixed in Supabase');
  }
}

fixPaths();
