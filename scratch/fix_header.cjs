const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://mcxhucgarmmvwdgqgdxb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_F-ClcxM7_GSuDHfIgxTTvg_SB2q73_b';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DEFAULT_HEADER = {
  date: '28.04.2026',
  zone: 'Цены указаны с доставкой в радиусе 10 км от склада г. Хабаровск, п. Березовка, Федоровское шоссе 8/1',
  zone2: '( Тополево, Малый и Большой Аэропорт, Матвеевка, Заозерное, Федоровка, Воноградовка, Мечуринское, Воронеж 1,2,3, Нагорное, Полярная, Северный, Кировский, Автовокзал, Карла Маркса, Выборгская)',
  notes: [
    'Доставка сыпучих материалов от 1,5 до 7 тонн * Галкино, Черная речка, Ровное, Сергеевка +500 руб.',
    'Доставка сыпучих материалов от 1,5 до 7 тонн * Николаевка, Тельмана, Приамурский, Владимировка, Князе-Волконское, Дружба +1000 руб.',
  ]
};

async function fixHeader() {
  console.log('Fixing header...');
  const { data, error } = await supabase
    .from('site_content')
    .upsert({ key: 'price_header', content: DEFAULT_HEADER }, { onConflict: 'key' });

  if (error) {
    console.error('Error fixing header:', error);
  } else {
    console.log('Header fixed successfully!');
  }
}

fixHeader();
