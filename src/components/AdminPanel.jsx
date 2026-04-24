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
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmDeletePrice, setConfirmDeletePrice] = useState(null);

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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
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
      if (cat) setCategoriesData(cat.content);
      if (prc) setPricesData(prc.content);
    }
    setLoading(false);
  };

  const handleInitialize = async () => {
    setLoading(true);
    // Upsert categories
    await supabase.from('site_content').upsert({ key: 'categories', content: defaultCategories }, { onConflict: 'key' });
    // Upsert prices
    await supabase.from('site_content').upsert({ key: 'prices', content: defaultPriceSections }, { onConflict: 'key' });
    await fetchData();
    setLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    const { error: catError } = await supabase.from('site_content').upsert({ key: 'categories', content: categoriesData }, { onConflict: 'key' });
    const { error: prcError } = await supabase.from('site_content').upsert({ key: 'prices', content: pricesData }, { onConflict: 'key' });
    
    if (catError || prcError) {
      setSaveMessage('Ошибка при сохранении!');
    } else {
      setSaveMessage('Изменения успешно сохранены на сайте!');
      setTimeout(() => setSaveMessage(''), 3000);
    }
    setIsSaving(false);
  };

  const updateCategoryItem = (catIdx, itemIdx, field, value) => {
    setCategoriesData(prev => {
      const newData = [...prev];
      newData[catIdx] = { ...newData[catIdx], prices: [...newData[catIdx].prices] };
      newData[catIdx].prices[itemIdx] = { ...newData[catIdx].prices[itemIdx], [field]: value };
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
        img: '/cat_truck.png'
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
    const { data, error } = await supabase.storage.from('site-images').upload(filePath, file);
    
    if (error) {
      alert('Ошибка загрузки: ' + error.message);
      setLoading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('site-images').getPublicUrl(filePath);
    
    updateCategoryItem(catIdx, itemIdx, 'img', publicUrl);
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
        bag: '—',
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
            <h2 style={{ marginBottom: '24px' }}>Редактирование Каталога (Главная страница)</h2>
            {categoriesData?.map((cat, catIdx) => (
              <div key={cat.id} style={{ marginBottom: '32px' }}>
                <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '8px', color: '#333' }}>{cat.title}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginTop: '16px' }}>
                  {cat.prices.map((item, itemIdx) => (
                    <div key={item.id} style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', position: 'relative' }}>
                      <button 
                        onClick={() => removeCategoryItem(catIdx, itemIdx)}
                        style={{ 
                          position: 'absolute', top: '8px', right: '8px', 
                          background: confirmDelete?.catIdx === catIdx && confirmDelete?.itemIdx === itemIdx ? '#8b0000' : 'red', 
                          color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px', fontSize: '12px',
                          fontWeight: confirmDelete?.catIdx === catIdx && confirmDelete?.itemIdx === itemIdx ? 'bold' : 'normal'
                        }}
                      >
                        {confirmDelete?.catIdx === catIdx && confirmDelete?.itemIdx === itemIdx ? 'Точно удалить?' : 'Удалить'}
                      </button>
                      
                      <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>Название</div>
                      <input 
                        type="text" 
                        value={item.name} 
                        onChange={(e) => updateCategoryItem(catIdx, itemIdx, 'name', e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '12px', fontWeight: 'bold' }}
                      />

                      <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>Описание</div>
                      <input 
                        type="text" 
                        value={item.desc || ''} 
                        onChange={(e) => updateCategoryItem(catIdx, itemIdx, 'desc', e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '12px' }}
                      />

                      <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>Цена</div>
                      <input 
                        type="text" 
                        value={item.price} 
                        onChange={(e) => updateCategoryItem(catIdx, itemIdx, 'price', e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '12px' }}
                      />

                      <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>Фото товара</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {item.img && <img src={item.img} alt="preview" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ccc' }} />}
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => uploadImage(e.target.files[0], catIdx, itemIdx)}
                          disabled={loading}
                          style={{ fontSize: '12px' }}
                        />
                      </div>
                    </div>
                  ))}
                  
                  <div 
                    onClick={() => addCategoryItem(catIdx)}
                    style={{ border: '2px dashed #ccc', padding: '16px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#666', fontWeight: 'bold', minHeight: '150px' }}
                  >
                    + Добавить услугу/товар
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section style={{ background: '#fff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h2 style={{ marginBottom: '24px' }}>Редактирование Прайс-листа</h2>
            {pricesData?.map((section, secIdx) => (
              <div key={section.id} style={{ marginBottom: '32px' }}>
                <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '8px', color: '#333' }}>{section.title}</h3>
                <table style={{ width: '100%', marginTop: '16px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ccc' }}>Наименование</th>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ccc', width: '100px' }}>Цена</th>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ccc', width: '80px' }}>Ед. изм.</th>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ccc', width: '100px' }}>Мешок</th>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ccc' }}>Примечание</th>
                      <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ccc', width: '100px' }}>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.rows.map((row, rowIdx) => (
                      <tr key={row.id}>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                          <input 
                            type="text" 
                            value={row.name} 
                            onChange={(e) => updatePriceTableRow(secIdx, rowIdx, 'name', e.target.value)}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontWeight: 'bold' }}
                          />
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                          <input 
                            type="text" 
                            value={row.price} 
                            onChange={(e) => updatePriceTableRow(secIdx, rowIdx, 'price', e.target.value)}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                          />
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                           <input 
                            type="text" 
                            value={row.unit || ''} 
                            onChange={(e) => updatePriceTableRow(secIdx, rowIdx, 'unit', e.target.value)}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                          />
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                           <input 
                            type="text" 
                            value={row.bag || ''} 
                            placeholder="—"
                            onChange={(e) => updatePriceTableRow(secIdx, rowIdx, 'bag', e.target.value)}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                          />
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                           <input 
                            type="text" 
                            value={row.note || ''} 
                            onChange={(e) => updatePriceTableRow(secIdx, rowIdx, 'note', e.target.value)}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                          />
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                          <button 
                            onClick={() => removePriceTableRow(secIdx, rowIdx)}
                            style={{ 
                              background: confirmDeletePrice?.secIdx === secIdx && confirmDeletePrice?.rowIdx === rowIdx ? '#8b0000' : 'red', 
                              color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '6px 12px', fontSize: '12px',
                              fontWeight: confirmDeletePrice?.secIdx === secIdx && confirmDeletePrice?.rowIdx === rowIdx ? 'bold' : 'normal',
                              width: '100%'
                            }}
                          >
                            {confirmDeletePrice?.secIdx === secIdx && confirmDeletePrice?.rowIdx === rowIdx ? 'Точно?' : 'Удалить'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <button
                    onClick={() => addPriceTableRow(secIdx)}
                    style={{ padding: '8px 24px', background: 'transparent', border: '2px dashed #ccc', borderRadius: '8px', cursor: 'pointer', color: '#666', fontWeight: 'bold', width: '100%' }}
                  >
                    + Добавить позицию в этот раздел
                  </button>
                </div>
              </div>
            ))}
          </section>
        </div>
      )}
    </div>
  );
}
