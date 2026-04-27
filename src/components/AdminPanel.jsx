import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { categoriesParams as defaultCategories } from '../data/categories';
import { priceSections as defaultPriceSections } from '../data/priceTable';

export default function AdminPanel({ onExit }) {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [categoriesData, setCategoriesData] = useState(null);
  const [pricesData, setPricesData] = useState(null);
  const [priceHeader, setPriceHeader] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmDeletePrice, setConfirmDeletePrice] = useState(null);

  const DEFAULT_HEADER = {
    date: '20.03.2026',
    zone: 'Цены указаны с доставкой в радиусе 10 км от склада г. Хабаровск, п. Березовка, Федоровское шоссе 8/1',
    zone2: '( Тополево, Малый и Большой Аэропорт, Матвеевка, Заозерное, Федоровка, Воноградовка, Мечуринское, Воронеж 1,2,3, Нагорное, Полярная, Северный, Кировский, Автовокзал, Карла Маркса, Выборгская)',
    notes: [
      'Доставка сыпучих материалов от 1,5 до 7 тонн * Галкино, Черная речка, Ровное, Сергеевка +500 руб.',
      'Доставка сыпучих материалов от 1,5 до 7 тонн * Николаевка, Тельмана, Приамурский, Владимировка, Князе-Волконское, Дружба +1000 руб.',
    ]
  };

  const deleteTimerRef = useRef(null);
  const deletePriceTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      if (deletePriceTimerRef.current) clearTimeout(deletePriceTimerRef.current);
    };
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchData();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchData();
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password: password.trim() 
      });
      if (error) {
        setError(error.message);
        console.error('Login error:', error);
      }
    } catch (err) {
      setError('Произошла непредвиденная ошибка при входе');
      console.error('Unexpected login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('site_content').select('*');
    if (error) {
      setError(error.message);
    } else {
      const cat = data.find(d => d.key === 'categories');
      const prc = data.find(d => d.key === 'prices');
      const hdr = data.find(d => d.key === 'price_header');
      
      if (cat && cat.content) {
        const sanitized = JSON.parse(JSON.stringify(cat.content).replace(/"img":"\//g, '"img":"'));
        setCategoriesData(sanitized);
      }
      
      if (prc && prc.content) {
        // Умное слияние для админки
        const mergedPrices = defaultPriceSections.map(defaultSection => {
          const dbSection = prc.content.find(s => s.id === defaultSection.id);
          if (!dbSection) return defaultSection;

          const mergedRows = defaultSection.rows.map(defaultRow => {
            const dbRow = dbSection.rows.find(r => r.id === defaultRow.id || r.name === defaultRow.name);
            if (!dbRow) return defaultRow;

            // Сливаем данные строки, сохраняя структуру кода
            return {
              ...defaultRow,
              ...dbRow,
              // Для вложенных таблиц (доски/брус) сливаем подстроки
              rows: defaultRow.rows ? defaultRow.rows.map(defaultSubRow => {
                const dbSubRow = dbRow.rows?.find(sr => sr.n === defaultSubRow.n || sr.name === defaultSubRow.name);
                return dbSubRow ? { ...defaultSubRow, ...dbSubRow } : defaultSubRow;
              }) : undefined,
              // Для матриц доставки сохраняем 2D массив, если он есть
              delivery: Array.isArray(dbRow.delivery) ? dbRow.delivery : defaultRow.delivery
            };
          });

          return {
            ...defaultSection,
            ...dbSection,
            rows: mergedRows
          };
        });
        setPricesData(mergedPrices);
      } else {
        setPricesData(defaultPriceSections);
      }
      
      setPriceHeader(hdr?.content || DEFAULT_HEADER);
    }
    setLoading(false);
  };

  const handleInitialize = async () => {
    setLoading(true);
    await supabase.from('site_content').upsert({ key: 'categories', content: defaultCategories }, { onConflict: 'key' });
    await supabase.from('site_content').upsert({ key: 'prices', content: defaultPriceSections }, { onConflict: 'key' });
    await supabase.from('site_content').upsert({ key: 'price_header', content: DEFAULT_HEADER }, { onConflict: 'key' });
    await fetchData();
    setLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    const { data: catData, error: catError } = await supabase.from('site_content').upsert({ key: 'categories', content: categoriesData }, { onConflict: 'key' }).select();
    const { data: prcData, error: prcError } = await supabase.from('site_content').upsert({ key: 'prices', content: pricesData }, { onConflict: 'key' }).select();
    const { data: hdrData, error: hdrError } = await supabase.from('site_content').upsert({ key: 'price_header', content: priceHeader }, { onConflict: 'key' }).select();

    if (catError || prcError || hdrError || !catData?.length || !prcData?.length || !hdrData?.length) {
      console.error('Save error details:', { catError, prcError, hdrError, catData, prcData, hdrData });
      const errMsg = catError?.message || prcError?.message || hdrError?.message || 'База данных отклонила сохранение (проверьте права доступа)';
      setSaveMessage('Ошибка: ' + errMsg);
    } else {
      setSaveMessage('Изменения успешно сохранены на сайте!');
      setTimeout(() => setSaveMessage(''), 3000);
    }
    setIsSaving(false);
  };

  const updateHeaderNote = (idx, value) => {
    setPriceHeader(prev => {
      const notes = [...prev.notes];
      notes[idx] = value;
      return { ...prev, notes };
    });
  };

  const addHeaderNote = () => {
    setPriceHeader(prev => ({ ...prev, notes: [...prev.notes, ''] }));
  };

  const removeHeaderNote = (idx) => {
    setPriceHeader(prev => {
      const notes = prev.notes.filter((_, i) => i !== idx);
      return { ...prev, notes };
    });
  };

  const updateCategoryItem = (catIdx, itemIdx, field, value) => {
    setCategoriesData(prev => {
      const newData = [...prev];
      newData[catIdx] = { ...newData[catIdx], prices: [...newData[catIdx].prices] };
      newData[catIdx].prices[itemIdx] = { ...newData[catIdx].prices[itemIdx], [field]: value };
      return newData;
    });
  };

  const updateCategoryField = (catIdx, field, value) => {
    setCategoriesData(prev => {
      const newData = [...prev];
      newData[catIdx] = { ...newData[catIdx], [field]: value };
      return newData;
    });
  };

  const removeCategoryItem = (catIdx, itemIdx) => {
    if (confirmDelete && confirmDelete.catIdx === catIdx && confirmDelete.itemIdx === itemIdx) {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      setCategoriesData(prev => {
        const newData = [...prev];
        newData[catIdx] = { ...newData[catIdx], prices: [...newData[catIdx].prices] };
        newData[catIdx].prices.splice(itemIdx, 1);
        return newData;
      });
      setConfirmDelete(null);
    } else {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      setConfirmDelete({ catIdx, itemIdx });
      deleteTimerRef.current = setTimeout(() => setConfirmDelete(null), 4000);
    }
  };

  const addCategoryItem = (catIdx) => {
    setCategoriesData(prev => {
      const newData = [...prev];
      newData[catIdx] = { ...newData[catIdx], prices: [...newData[catIdx].prices] };
      newData[catIdx].prices.push({
        id: `item-${Date.now()}`,
        name: 'Новое название',
        desc: '',
        price: '0 руб',
        img: 'cat_truck.png'
      });
      return newData;
    });
  };

  const uploadImage = async (file, catIdx, itemIdx) => {
    if (!file) return;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `catalog/${fileName}`;

    setLoading(true);
    const { error } = await supabase.storage.from('site-images').upload(filePath, file);
    
    if (error) {
      alert('Ошибка загрузки: ' + error.message);
      setLoading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('site-images').getPublicUrl(filePath);
    
    if (itemIdx !== null && itemIdx !== undefined) {
      updateCategoryItem(catIdx, itemIdx, 'img', publicUrl);
    } else {
      updateCategoryField(catIdx, 'img', publicUrl);
    }
    setLoading(false);
  };

  const updatePriceTableRow = (sectionIndex, rowIndex, field, value) => {
    setPricesData(prev => {
      const newData = [...prev];
      newData[sectionIndex] = { ...newData[sectionIndex], rows: [...newData[sectionIndex].rows] };
      newData[sectionIndex].rows[rowIndex] = { ...newData[sectionIndex].rows[rowIndex], [field]: value };
      return newData;
    });
  };

  const updateDeliveryPrice = (secIdx, rowIdx, weightIdx, volIdx, value) => {
    setPricesData(prev => {
      const newData = [...prev];
      const section = { ...newData[secIdx] };
      const rows = [...section.rows];
      const row = { ...rows[rowIdx] };
      
      // Инициализируем матрицу доставки, если её нет
      let delivery = row.delivery ? [...row.delivery] : null;
      if (!delivery) {
        const defaultSec = defaultPriceSections.find(s => s.id === section.id);
        const defaultRow = defaultSec?.rows.find(r => r.name === row.name);
        delivery = defaultRow?.delivery ? JSON.parse(JSON.stringify(defaultRow.delivery)) : [];
      }

      if (delivery[weightIdx]) {
        delivery[weightIdx] = [...delivery[weightIdx]];
        delivery[weightIdx][volIdx] = value;
      }
      
      row.delivery = delivery;
      rows[rowIdx] = row;
      section.rows = rows;
      newData[secIdx] = section;
      return newData;
    });
  };

  const updateDeliveryHeader = (secIdx, type, idx, value) => {
    setPricesData(prev => {
      const newData = [...prev];
      const section = { ...newData[secIdx] };
      if (type === 'weight') {
        const weights = section.deliveryWeights ? [...section.deliveryWeights] : [...(defaultPriceSections.find(s => s.id === section.id)?.deliveryWeights || [])];
        weights[idx] = value;
        section.deliveryWeights = weights;
      } else {
        const volumes = section.deliveryVolumes ? [...section.deliveryVolumes] : [...(defaultPriceSections.find(s => s.id === section.id)?.deliveryVolumes || [])];
        volumes[idx] = value;
        section.deliveryVolumes = volumes;
      }
      newData[secIdx] = section;
      return newData;
    });
  };

  const updateComplexTableRow = (secIdx, rowIdx, subRowIdx, field, value) => {
    setPricesData(prev => {
      const newData = [...prev];
      const section = { ...newData[secIdx] };
      const rows = [...section.rows];
      const row = { ...rows[rowIdx] };
      
      // Инициализируем вложенные строки, если их нет
      let subRows = row.rows ? [...row.rows] : null;
      if (!subRows) {
        const defaultSec = defaultPriceSections.find(s => s.id === section.id);
        const defaultRow = defaultSec?.rows.find(r => r.id === row.id || r.name === row.name);
        subRows = defaultRow?.rows ? JSON.parse(JSON.stringify(defaultRow.rows)) : [];
      }

      if (subRows[subRowIdx]) {
        subRows[subRowIdx] = { ...subRows[subRowIdx], [field]: value };
      }
      
      row.rows = subRows;
      rows[rowIdx] = row;
      section.rows = rows;
      newData[secIdx] = section;
      return newData;
    });
  };

  const removePriceTableRow = (secIdx, rowIdx) => {
    if (confirmDeletePrice && confirmDeletePrice.secIdx === secIdx && confirmDeletePrice.rowIdx === rowIdx) {
      if (deletePriceTimerRef.current) clearTimeout(deletePriceTimerRef.current);
      setPricesData(prev => {
        const newData = [...prev];
        newData[secIdx] = { ...newData[secIdx], rows: [...newData[secIdx].rows] };
        newData[secIdx].rows.splice(rowIdx, 1);
        return newData;
      });
      setConfirmDeletePrice(null);
    } else {
      if (deletePriceTimerRef.current) clearTimeout(deletePriceTimerRef.current);
      setConfirmDeletePrice({ secIdx, rowIdx });
      deletePriceTimerRef.current = setTimeout(() => setConfirmDeletePrice(null), 4000);
    }
  };

  const addPriceTableRow = (secIdx) => {
    setPricesData(prev => {
      const newData = [...prev];
      newData[secIdx] = { ...newData[secIdx], rows: [...newData[secIdx].rows] };
      newData[secIdx].rows.push({
        id: `price-${Date.now()}`,
        name: 'Новая позиция',
        price: '0',
        unit: 'шт.',
        note: ''
      });
      return newData;
    });
  };

  if (!session) {
    return (
      <div style={{ maxWidth: '400px', margin: '100px auto', padding: '40px', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: '24px', textAlign: 'center' }}>Вход в Админку</h2>
        {error && <p style={{ color: 'red', marginBottom: '16px' }}>{error}</p>}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />
          <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} required
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />
          <button type="submit" disabled={loading} style={{ padding: '12px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        <button onClick={onExit} style={{ marginTop: '20px', width: '100%', padding: '12px', background: 'transparent', border: '1px solid #ccc', borderRadius: '8px', cursor: 'pointer' }}>
          Вернуться на сайт
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1>Панель Управления Сайтом</h1>
        <div>
          <button onClick={onExit} style={{ marginRight: '16px', padding: '10px 20px', cursor: 'pointer' }}>Вернуться на сайт</button>
          <button onClick={handleLogout} style={{ padding: '10px 20px', cursor: 'pointer' }}>Выйти</button>
        </div>
      </div>

      {!categoriesData && !pricesData ? (
        <div style={{ padding: '40px', background: '#fff', borderRadius: '16px', textAlign: 'center' }}>
          <h2>База данных пуста</h2>
          <p>Нажмите кнопку ниже, чтобы загрузить текущие данные сайта в базу.</p>
          <button onClick={handleInitialize} disabled={loading} style={{ marginTop: '20px', padding: '12px 24px', background: '#007BFF', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            {loading ? 'Инициализация...' : 'Инициализировать базу данных'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          <div style={{ position: 'sticky', top: 0, background: '#f8fafc', padding: '20px 0', zIndex: 100, borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <button onClick={handleSave} disabled={isSaving} style={{ padding: '14px 32px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
                {isSaving ? 'Сохранение...' : 'Сохранить изменения на сайте'}
              </button>
              {saveMessage && <span style={{ marginLeft: '16px', color: saveMessage.includes('Ошибка') ? 'red' : 'green', fontWeight: 'bold' }}>{saveMessage}</span>}
            </div>
          </div>

          <section style={{ background: '#fff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h2 style={{ marginBottom: '8px' }}>1. Шапка Прайса</h2>
            <p style={{ color: '#666', marginBottom: '24px', fontSize: '14px' }}>
              Здесь вы можете изменить дату обновления прайс-листа и текстовую информацию о зонах доставки, которая отображается в самом верху страницы «Прайс».
            </p>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#555', marginBottom: '6px' }}>Дата прайса</label>
              <input type="text" value={priceHeader?.date || ''} onChange={e => setPriceHeader(prev => ({ ...prev, date: e.target.value }))} style={{ width: '260px', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#555', marginBottom: '6px' }}>Текст зоны доставки</label>
              <textarea value={priceHeader?.zone || ''} onChange={e => setPriceHeader(prev => ({ ...prev, zone: e.target.value }))} rows={3} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#555', marginBottom: '6px' }}>Дополнительный текст зоны</label>
              <textarea value={priceHeader?.zone2 || ''} onChange={e => setPriceHeader(prev => ({ ...prev, zone2: e.target.value }))} rows={3} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#555', marginBottom: '10px' }}>Строки примечаний</label>
              {priceHeader?.notes?.map((note, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input type="text" value={note} onChange={e => updateHeaderNote(idx, e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
                  <button onClick={() => removeHeaderNote(idx)} style={{ padding: '6px 12px', background: '#fee2e2', color: '#b00020', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>✕</button>
                </div>
              ))}
              <button onClick={addHeaderNote} style={{ marginTop: '8px', padding: '8px 20px', background: 'transparent', border: '2px dashed #ccc', borderRadius: '8px', cursor: 'pointer' }}>+ Добавить примечание</button>
            </div>
          </section>

          <section style={{ background: '#fff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h2 style={{ marginBottom: '8px' }}>2. Каталог продукции</h2>
            <p style={{ color: '#666', marginBottom: '24px', fontSize: '14px' }}>
              В этом разделе меняются карточки товаров, которые клиент видит при переходе в конкретную категорию (например, «Уголь» или «Пиломатериалы»). Вы можете менять названия, цены и загружать фотографии.
            </p>
            {categoriesData?.map((cat, catIdx) => (
              <div key={cat.id} style={{ marginBottom: '40px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
                <h3>{cat.title}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {cat.prices.map((item, itemIdx) => (
                    <div key={item.id} style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px' }}>
                      <input type="text" value={item.name} onChange={(e) => updateCategoryItem(catIdx, itemIdx, 'name', e.target.value)} style={{ width: '100%', marginBottom: '8px', fontWeight: 'bold' }} />
                      <input type="text" value={item.price} onChange={(e) => updateCategoryItem(catIdx, itemIdx, 'price', e.target.value)} style={{ width: '100%', marginBottom: '8px' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {item.img && <img src={item.img} alt="preview" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />}
                        <input type="file" onChange={(e) => uploadImage(e.target.files[0], catIdx, itemIdx)} style={{ fontSize: '11px' }} />
                      </div>
                      <button onClick={() => removeCategoryItem(catIdx, itemIdx)} style={{ marginTop: '8px', width: '100%', background: '#fee2e2', color: '#b00020', border: 'none', padding: '4px', cursor: 'pointer' }}>Удалить</button>
                    </div>
                  ))}
                  <button onClick={() => addCategoryItem(catIdx)} style={{ border: '2px dashed #ccc', borderRadius: '8px', cursor: 'pointer', height: '100px' }}>+ Добавить</button>
                </div>
              </div>
            ))}
          </section>

          <section style={{ background: '#fff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h2 style={{ marginBottom: '8px' }}>3. Полный Прайс-лист (Таблицы)</h2>
            <p style={{ color: '#666', marginBottom: '24px', fontSize: '14px' }}>
              Здесь редактируются детальные таблицы с ценами, которые открываются по кнопке «Прайс-лист». Вы можете менять значения в каждой ячейке таблицы, добавлять новые строки или удалять старые.
            </p>
            {pricesData?.map((section, secIdx) => {
              const isDelivery = section.type === 'delivery' || ['materials', 'soil', 'coal', 'firewood'].includes(section.id);
              
              if (isDelivery) {
                const weights = section.deliveryWeights || (defaultPriceSections.find(s => s.id === section.id)?.deliveryWeights) || [];
                const volumes = section.deliveryVolumes || (defaultPriceSections.find(s => s.id === section.id)?.deliveryVolumes) || [];
                const hasVolumes = volumes && volumes.length > 0;
                const hasPriceCol = !!section.priceColLabel;
                const hasBagCol = !!section.bagColLabel;

                return (
                  <div key={section.id} style={{ marginBottom: '40px', padding: '20px', border: '1px solid #eee', borderRadius: '12px', background: '#fcfcfc' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>{section.title}</h3>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '15px' }}>
                      Режим: Доставка ({weights.length} колонок) + Базовые цены
                    </div>
                    
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ borderCollapse: 'collapse', fontSize: '11px', width: '100%', background: '#fff' }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9' }}>
                            <th style={{ border: '1px solid #cbd5e1', padding: '6px' }} rowSpan={hasVolumes ? 2 : 1}>Наименование</th>
                            {hasPriceCol && <th style={{ border: '1px solid #cbd5e1', padding: '6px', background: '#fff9c4' }} rowSpan={hasVolumes ? 2 : 1}>{section.priceColLabel}</th>}
                            {hasBagCol && <th style={{ border: '1px solid #cbd5e1', padding: '6px', background: '#e0f2fe' }} rowSpan={hasVolumes ? 2 : 1}>{section.bagColLabel}</th>}
                            
                            <th style={{ border: '1px solid #cbd5e1', padding: '4px', background: '#f8fafc' }} colSpan={weights.length}>Отпускная цена с доставкой, руб.</th>
                          </tr>
                          <tr>
                            {weights.map((w, wi) => (
                              <th key={wi} style={{ border: '1px solid #cbd5e1', padding: '4px', background: '#f1f5f9' }}>
                                <input 
                                  value={w} 
                                  onChange={(e) => updateDeliveryHeader(secIdx, 'weight', wi, e.target.value)}
                                  style={{ width: '50px', fontSize: '10px', textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: '3px' }}
                                />
                              </th>
                            ))}
                          </tr>
                          {hasVolumes && (
                            <tr style={{ background: '#f8fafc' }}>
                              {/* Пустые ячейки для выравнивания под наименованием и ценами */}
                              <th style={{ border: '1px solid #cbd5e1' }}></th>
                              {hasPriceCol && <th style={{ border: '1px solid #cbd5e1' }}></th>}
                              {hasBagCol && <th style={{ border: '1px solid #cbd5e1' }}></th>}
                              
                              {volumes.map((v, vi) => (
                                <th key={vi} style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
                                  <input 
                                    value={v} 
                                    onChange={(e) => updateDeliveryHeader(secIdx, 'volume', vi, e.target.value)}
                                    style={{ width: '50px', fontSize: '10px', textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: '3px' }}
                                  />
                                </th>
                              ))}
                            </tr>
                          )}
                        </thead>
                        <tbody>
                          {section.rows.map((row, ri) => {
                            const deliveryData = Array.isArray(row.delivery) ? row.delivery : [];
                            return (
                              <tr key={ri}>
                                <td style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 'bold' }}>
                                  <input 
                                    value={row.name} 
                                    onChange={(e) => updatePriceTableRow(secIdx, ri, 'name', e.target.value)}
                                    style={{ width: '100%', border: 'none', background: 'transparent', fontWeight: 'bold', fontSize: '11px' }}
                                  />
                                </td>
                                {hasPriceCol && (
                                  <td style={{ border: '1px solid #cbd5e1', padding: '4px', background: '#fffde7' }}>
                                    <input 
                                      value={row.price || ''} 
                                      onChange={(e) => updatePriceTableRow(secIdx, ri, 'price', e.target.value)}
                                      style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'center', fontSize: '11px' }}
                                    />
                                  </td>
                                )}
                                {hasBagCol && (
                                  <td style={{ border: '1px solid #cbd5e1', padding: '4px', background: '#f0f9ff' }}>
                                    <input 
                                      value={row.bag || ''} 
                                      onChange={(e) => updatePriceTableRow(secIdx, ri, 'bag', e.target.value)}
                                      style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'center', fontSize: '11px' }}
                                    />
                                  </td>
                                )}
                                {weights.map((_, wi) => (
                                  <td key={wi} style={{ border: '1px solid #cbd5e1', padding: '0' }}>
                                    <input 
                                      value={deliveryData[wi] || ''}
                                      onChange={(e) => {
                                        const newDelivery = [...deliveryData];
                                        while(newDelivery.length < weights.length) newDelivery.push('');
                                        newDelivery[wi] = e.target.value;
                                        updatePriceTableRow(secIdx, ri, 'delivery', newDelivery);
                                      }}
                                      style={{ border: 'none', padding: '8px', fontSize: '10px', width: '100%', textAlign: 'center' }}
                                    />
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }

              return (
                <div key={section.id} style={{ marginBottom: '40px', padding: '20px', border: '1px solid #eee', borderRadius: '12px' }}>
                  <h3 style={{ margin: '0 0 15px 0' }}>{section.title}</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #ccc', fontSize: '12px' }}>Наименование</th>
                        <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #ccc', width: '100px', fontSize: '12px' }}>Цена</th>
                        <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #ccc', width: '80px', fontSize: '12px' }}>Ед. изм.</th>
                        <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #ccc', fontSize: '12px' }}>Примечание</th>
                        <th style={{ width: '60px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.rows.map((row, ri) => {
                        // Принудительно проверяем на "сложность" для пиломатериалов
                        const hasComplex = row.hasComplexTable || ['doska', 'brus', 'brusok'].includes(row.id);
                        const subRows = row.rows || (defaultPriceSections.find(s => s.id === section.id)?.rows.find(r => r.id === row.id)?.rows) || [];

                        return (
                          <React.Fragment key={row.id || ri}>
                            <tr style={{ background: hasComplex ? '#f1f5f9' : 'transparent' }}>
                              <td style={{ borderBottom: '1px solid #eee' }}>
                                <input 
                                  value={row.name} 
                                  onChange={(e) => updatePriceTableRow(secIdx, ri, 'name', e.target.value)} 
                                  style={{ width: '100%', padding: '4px', border: '1px solid #eee', fontWeight: hasComplex ? 'bold' : 'normal' }} 
                                />
                              </td>
                              <td style={{ borderBottom: '1px solid #eee' }}>
                                <input 
                                  value={row.price} 
                                  onChange={(e) => updatePriceTableRow(secIdx, ri, 'price', e.target.value)} 
                                  style={{ width: '100%', padding: '4px', border: '1px solid #eee', color: hasComplex ? '#999' : '#000' }} 
                                />
                              </td>
                              <td style={{ borderBottom: '1px solid #eee' }}>
                                <input 
                                  value={row.unit} 
                                  onChange={(e) => updatePriceTableRow(secIdx, ri, 'unit', e.target.value)} 
                                  style={{ width: '100%', padding: '4px', border: '1px solid #eee', color: hasComplex ? '#999' : '#000' }} 
                                />
                              </td>
                              <td style={{ borderBottom: '1px solid #eee' }}>
                                <input 
                                  value={row.note} 
                                  onChange={(e) => updatePriceTableRow(secIdx, ri, 'note', e.target.value)} 
                                  style={{ width: '100%', padding: '4px', border: '1px solid #eee', color: hasComplex ? '#999' : '#000' }} 
                                />
                              </td>
                              <td style={{ borderBottom: '1px solid #eee' }}>
                                <button onClick={() => removePriceTableRow(secIdx, ri)} style={{ padding: '4px 8px', background: '#fee2e2', color: '#b00020', border: 'none', borderRadius: '4px' }}>✕</button>
                              </td>
                            </tr>
                            {hasComplex && (
                              <tr>
                                <td colSpan={5} style={{ padding: '10px 15px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                  <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', color: '#1e293b' }}>
                                    📋 Детальный прайс для «{row.name}» (Размеры / Цены Ель и Лиственница):
                                  </div>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', fontSize: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                    <thead>
                                      <tr style={{ background: '#f1f5f9' }}>
                                        <th style={{ border: '1px solid #cbd5e1', padding: '4px' }}>№</th>
                                        <th style={{ border: '1px solid #cbd5e1', padding: '4px' }}>Наименование (размер)</th>
                                        <th style={{ border: '1px solid #cbd5e1', padding: '4px' }}>Шт в м3</th>
                                        <th style={{ border: '1px solid #cbd5e1', padding: '4px', background: '#ecfdf5' }}>Ель м3</th>
                                        <th style={{ border: '1px solid #cbd5e1', padding: '4px', background: '#ecfdf5' }}>Ель шт</th>
                                        <th style={{ border: '1px solid #cbd5e1', padding: '4px', background: '#fef2f2' }}>Лист. м3</th>
                                        <th style={{ border: '1px solid #cbd5e1', padding: '4px', background: '#fef2f2' }}>Лист. шт</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {subRows.map((sr, sri) => (
                                        <tr key={sri} style={{ background: sr.isGroup ? '#f8fafc' : 'transparent' }}>
                                          {sr.isGroup ? (
                                            <td colSpan={7} style={{ border: '1px solid #eee', padding: '4px', fontWeight: 'bold', textAlign: 'center' }}>
                                              <input value={sr.label || ''} onChange={(e) => updateComplexTableRow(secIdx, ri, sri, 'label', e.target.value)} style={{ width: '100%', border: 'none', textAlign: 'center', background: 'transparent', fontWeight: 'bold' }} />
                                            </td>
                                          ) : (
                                            <>
                                              <td style={{ border: '1px solid #eee' }}><input value={sr.n || ''} onChange={(e) => updateComplexTableRow(secIdx, ri, sri, 'n', e.target.value)} style={{ width: '100%', border: 'none', textAlign: 'center' }} /></td>
                                              <td style={{ border: '1px solid #eee' }}><input value={sr.name || ''} onChange={(e) => updateComplexTableRow(secIdx, ri, sri, 'name', e.target.value)} style={{ width: '100%', border: 'none' }} /></td>
                                              <td style={{ border: '1px solid #eee' }}><input value={sr.count || ''} onChange={(e) => updateComplexTableRow(secIdx, ri, sri, 'count', e.target.value)} style={{ width: '100%', border: 'none', textAlign: 'center' }} /></td>
                                              <td style={{ border: '1px solid #eee', background: '#f0fdf4' }}><input value={sr.s_m3 || ''} onChange={(e) => updateComplexTableRow(secIdx, ri, sri, 's_m3', e.target.value)} style={{ width: '100%', border: 'none', textAlign: 'center', background: 'transparent' }} /></td>
                                              <td style={{ border: '1px solid #eee', background: '#f0fdf4' }}><input value={sr.s_p || ''} onChange={(e) => updateComplexTableRow(secIdx, ri, sri, 's_p', e.target.value)} style={{ width: '100%', border: 'none', textAlign: 'center', background: 'transparent' }} /></td>
                                              <td style={{ border: '1px solid #eee', background: '#fef2f2' }}><input value={sr.l_m3 || ''} onChange={(e) => updateComplexTableRow(secIdx, ri, sri, 'l_m3', e.target.value)} style={{ width: '100%', border: 'none', textAlign: 'center', background: 'transparent' }} /></td>
                                              <td style={{ border: '1px solid #eee', background: '#fef2f2' }}><input value={sr.l_p || ''} onChange={(e) => updateComplexTableRow(secIdx, ri, sri, 'l_p', e.target.value)} style={{ width: '100%', border: 'none', textAlign: 'center', background: 'transparent' }} /></td>
                                            </>
                                          )}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                  <button onClick={() => addPriceTableRow(secIdx)} style={{ marginTop: '10px', width: '100%', padding: '8px', border: '1px dashed #ccc', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '12px' }}>+ Добавить позицию</button>
                </div>
              );
            })}
          </section>
        </div>
      )}
    </div>
  );
}
