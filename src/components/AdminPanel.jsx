import React, { useState, useEffect, useRef } from 'react';
import { 
  fetchDb, 
  saveToGithub, 
  uploadImageToGithub, 
  getGithubToken, 
  setGithubToken,
  validateGithubToken 
} from '../lib/githubData';
import { categoriesParams as defaultCategories } from '../data/categories';
import { priceSections as defaultPriceSections } from '../data/priceTable';

const ADMIN_PASS_HASH = '9f2147ca22b6db2eecfecafd915d76d3e4f92a514fdca437797d2d1165483ace';

function verifyPassword(pass) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pass);
  return crypto.subtle.digest('SHA-256', data).then(buf => {
    const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    return hash === ADMIN_PASS_HASH;
  });
}

export default function AdminPanel({ onExit }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [githubToken, setGithubTokenState] = useState(getGithubToken() || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [categoriesData, setCategoriesData] = useState(null);
  const [pricesData, setPricesData] = useState(null);
  const [priceHeader, setPriceHeader] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmDeletePrice, setConfirmDeletePrice] = useState(null);
  const [showTokenSettings, setShowTokenSettings] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);

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

  // Проверка токена при загрузке
  useEffect(() => {
    if (githubToken) {
      validateGithubToken(githubToken).then(setTokenValid);
    }
  }, [githubToken]);



  const handleLogin = async (e) => {
    e.preventDefault();
    const isValid = await verifyPassword(password);
    if (isValid) {
      setIsLoggedIn(true);
      fetchData();
    } else {
      setError('Неверный пароль');
    }
  };

  const handleTokenSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const isValid = await validateGithubToken(githubToken);
    if (isValid) {
      setGithubToken(githubToken);
      setTokenValid(true);
      setShowTokenSettings(false);
      setSaveMessage('Токен успешно сохранен!');
      setTimeout(() => setSaveMessage(''), 3000);
    } else {
      setError('Невалидный GitHub Token. Проверьте права доступа.');
    }
    setLoading(false);
  };

  const mergePricesWithDefaults = (dbPrices) => {
    if (!dbPrices || !Array.isArray(dbPrices)) return defaultPriceSections;
    return defaultPriceSections.map(defaultSec => {
      const dbSec = dbPrices.find(s => s.id === defaultSec.id);
      if (!dbSec) return defaultSec;

      const dbHasRows = Array.isArray(dbSec.rows);

      const mergedRows = defaultSec.rows
        .map(defaultRow => {
          const dbRow = dbSec.rows?.find(r => r.id === defaultRow.id);
          if (!dbRow) {
            if (dbHasRows) return null;
            return defaultRow;
          }
          return {
            ...defaultRow,
            ...dbRow,
            complexHeaders: dbRow.complexHeaders || defaultRow.complexHeaders,
            complexSubHeaders: dbRow.complexSubHeaders || defaultRow.complexSubHeaders,
            hasComplexTable: dbRow.hasComplexTable !== undefined ? dbRow.hasComplexTable : defaultRow.hasComplexTable
          };
        })
        .filter(Boolean);

      if (dbHasRows) {
        const defaultRowIds = new Set(defaultSec.rows.map(r => r.id));
        const newRows = dbSec.rows.filter(r => r.id && !defaultRowIds.has(r.id));
        mergedRows.push(...newRows);
      }

      return { ...defaultSec, ...dbSec, rows: mergedRows };
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await fetchDb();
      if (data) {
        setCategoriesData(data.categories || defaultCategories);
        setPricesData(mergePricesWithDefaults(data.prices));
        setPriceHeader(data.price_header || DEFAULT_HEADER);
      }
    } catch (err) {
      setError('Ошибка загрузки данных из GitHub. Проверьте соединение.');
      setCategoriesData(defaultCategories);
      setPricesData(defaultPriceSections);
      setPriceHeader(DEFAULT_HEADER);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!tokenValid) {
      setShowTokenSettings(true);
      setError('Для сохранения необходим GitHub Token');
      return;
    }

    setIsSaving(true);
    setSaveMessage('');
    
    try {
      const content = {
        categories: categoriesData,
        prices: pricesData,
        price_header: priceHeader
      };
      
      await saveToGithub(content);
      setSaveMessage('Изменения сохранены и отправлены на GitHub!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      console.error('Save error:', err);
      setSaveMessage('Ошибка: ' + err.message);
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
        img: 'cat_truck.jpg'
      });
      return newData;
    });
  };

  const uploadImage = async (file, catIdx, itemIdx) => {
    if (!file) return;
    if (!tokenValid) {
      setShowTokenSettings(true);
      alert('Для загрузки фото нужен GitHub Token');
      return;
    }

    setLoading(true);
    try {
      const publicUrl = await uploadImageToGithub(file);
      
      if (itemIdx !== null && itemIdx !== undefined) {
        updateCategoryItem(catIdx, itemIdx, 'img', publicUrl);
      } else {
        updateCategoryField(catIdx, 'img', publicUrl);
      }
    } catch (err) {
      alert('Ошибка загрузки: ' + err.message);
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
      const section = newData[secIdx];
      const existingRows = section.rows || [];
      const isDelivery = section.type === 'delivery' || ['materials', 'soil', 'coal', 'firewood'].includes(section.id);
      let newRow;
      if (isDelivery) {
        const colCount = (section.deliveryWeights || []).length;
        newRow = {
          id: `price-${Date.now()}`,
          name: 'Новая позиция',
          price: '-',
          bag: '-',
          delivery: Array(colCount).fill('-')
        };
      } else {
        newRow = {
          id: `price-${Date.now()}`,
          name: 'Новая позиция',
          price: '0',
          unit: 'шт.',
          note: ''
        };
      }
      newData[secIdx] = { ...section, rows: [...existingRows, newRow] };
      return newData;
    });
  };

  const updateFootnote = (secIdx, fnIdx, value) => {
    setPricesData(prev => {
      const newData = [...prev];
      const section = { ...newData[secIdx] };
      const footnotes = [...(section.footnotes || [])];
      footnotes[fnIdx] = value;
      section.footnotes = footnotes;
      newData[secIdx] = section;
      return newData;
    });
  };

  const addFootnote = (secIdx) => {
    setPricesData(prev => {
      const newData = [...prev];
      const section = { ...newData[secIdx] };
      section.footnotes = [...(section.footnotes || []), ''];
      newData[secIdx] = section;
      return newData;
    });
  };

  const removeFootnote = (secIdx, fnIdx) => {
    setPricesData(prev => {
      const newData = [...prev];
      const section = { ...newData[secIdx] };
      section.footnotes = (section.footnotes || []).filter((_, i) => i !== fnIdx);
      newData[secIdx] = section;
      return newData;
    });
  };

  const updateComplexSubRow = (secIdx, rowIdx, subIdx, field, value) => {
    setPricesData(prev => {
      const newData = [...prev];
      const section = { ...newData[secIdx], rows: [...newData[secIdx].rows] };
      const row = { ...section.rows[rowIdx], rows: [...section.rows[rowIdx].rows] };
      row.rows[subIdx] = { ...row.rows[subIdx], [field]: value };
      section.rows[rowIdx] = row;
      newData[secIdx] = section;
      return newData;
    });
  };

  const updateSimpleRowField = (secIdx, rowIdx, field, value) => {
    setPricesData(prev => {
      const newData = [...prev];
      newData[secIdx] = { ...newData[secIdx], rows: [...newData[secIdx].rows] };
      newData[secIdx].rows[rowIdx] = { ...newData[secIdx].rows[rowIdx], [field]: value };
      return newData;
    });
  };

  const addSimpleRow = (secIdx) => {
    setPricesData(prev => {
      const newData = [...prev];
      newData[secIdx] = { ...newData[secIdx], rows: [...newData[secIdx].rows] };
      newData[secIdx].rows.push({
        id: `simple-${Date.now()}`,
        name: 'Новая услуга',
        price: '0',
        unit: 'руб',
        note: ''
      });
      return newData;
    });
  };

  const removeSimpleRow = (secIdx, rowIdx) => {
    setPricesData(prev => {
      const newData = [...prev];
      newData[secIdx] = { ...newData[secIdx], rows: [...newData[secIdx].rows] };
      newData[secIdx].rows.splice(rowIdx, 1);
      return newData;
    });
  };

  if (!isLoggedIn) {
    return (
      <div style={{ maxWidth: '400px', margin: '100px auto', padding: '40px', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: '24px', textAlign: 'center' }}>Вход в Админку</h2>
        {error && <p style={{ color: 'red', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>{error}</p>}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input type="password" placeholder="Пароль администратора" value={password} onChange={e => setPassword(e.target.value)} required
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />
          <button type="submit" style={{ padding: '12px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            Войти
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
        <h1>Панель Управления (GitHub CMS)</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowTokenSettings(!showTokenSettings)} style={{ padding: '8px 16px', background: tokenValid ? '#e2e8f0' : '#fee2e2', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
            {tokenValid ? '⚙️ GitHub Token: OK' : '⚠️ Настроить Токен'}
          </button>
          <button onClick={() => setIsLoggedIn(false)} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Выход</button>
        </div>
      </div>

      {showTokenSettings && (
        <div style={{ marginBottom: '30px', padding: '24px', background: '#fff', borderRadius: '16px', border: '2px solid #FF6B00' }}>
          <h3>Настройка доступа к GitHub</h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
            Для сохранения изменений и загрузки фото необходим персональный токен GitHub с правами <b>repo</b>.
          </p>
          <form onSubmit={handleTokenSubmit} style={{ display: 'flex', gap: '12px' }}>
            <input 
              type="password" 
              placeholder="ghp_xxxxxxxxxxxx" 
              value={githubToken} 
              onChange={e => setGithubTokenState(e.target.value)} 
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
            />
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              {loading ? 'Проверка...' : 'Сохранить Токен'}
            </button>
          </form>
          <p style={{ marginTop: '12px', fontSize: '12px' }}>
            <a href="https://github.com/settings/tokens/new?scopes=repo&description=UstroyDV%20CMS" target="_blank" rel="noreferrer" style={{ color: '#FF6B00' }}>Создать токен (откроется в новой вкладке)</a>
          </p>
        </div>
      )}

      {loading && !categoriesData ? (
        <div style={{ padding: '100px', textAlign: 'center' }}>
          <div className="admin-loader"></div>
          <p>Загрузка данных...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          <div style={{ position: 'sticky', top: 0, background: '#f8fafc', padding: '16px 24px', zIndex: 100, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button onClick={handleSave} disabled={isSaving} style={{ padding: '12px 24px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                {isSaving ? 'Сохранение в GitHub...' : 'ОПУБЛИКОВАТЬ ИЗМЕНЕНИЯ'}
              </button>
              {saveMessage && <span style={{ color: saveMessage.includes('Ошибка') ? '#dc2626' : '#16a34a', fontWeight: 'bold' }}>{saveMessage}</span>}
            </div>
            <span style={{ fontSize: '12px', color: '#64748b' }}>База данных: GitHub (public/data/db.json)</span>
          </div>

          {/* 1. Шапка Прайса */}
          <section style={{ background: '#fff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ marginBottom: '8px' }}>1. Шапка Прайса</h2>
                <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>Дата и зоны доставки.</p>
              </div>
              <button onClick={() => setPriceHeader(DEFAULT_HEADER)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Восстановить текст</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Дата прайса</label>
                <input type="text" value={priceHeader?.date || ''} onChange={e => setPriceHeader(prev => ({ ...prev, date: e.target.value }))} style={{ width: '200px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Основная зона</label>
                <textarea value={priceHeader?.zone || ''} onChange={e => setPriceHeader(prev => ({ ...prev, zone: e.target.value }))} rows={2} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Доп. зона</label>
                <textarea value={priceHeader?.zone2 || ''} onChange={e => setPriceHeader(prev => ({ ...prev, zone2: e.target.value }))} rows={2} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Примечания</label>
                {priceHeader?.notes?.map((note, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input type="text" value={note} onChange={e => updateHeaderNote(idx, e.target.value)} style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                    <button onClick={() => removeHeaderNote(idx)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
                  </div>
                ))}
                <button onClick={addHeaderNote} style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px dashed #ccc', borderRadius: '4px', cursor: 'pointer' }}>+ Добавить</button>
              </div>
            </div>
          </section>

          {/* 1.5. Настройка разделов */}
          <section style={{ background: '#fff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h2 style={{ marginBottom: '24px' }}>1.5. Настройка разделов (Услуг)</h2>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>Здесь можно изменить заголовки и описания основных разделов, а также временно скрыть их с сайта.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {categoriesData?.map((cat, idx) => (
                <div key={cat.id} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 100px', gap: '16px', alignItems: 'start', padding: '16px', border: '1px solid #eee', borderRadius: '8px', background: cat.enabled === false ? '#fff1f2' : '#fcfcfc' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Заголовок ({cat.id})</label>
                    <input type="text" value={cat.title || ''} onChange={e => updateCategoryField(idx, 'title', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Описание на главной</label>
                    <textarea value={cat.desc || ''} onChange={e => updateCategoryField(idx, 'desc', e.target.value)} rows={2} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Активен</label>
                    <input type="checkbox" checked={cat.enabled !== false} onChange={e => updateCategoryField(idx, 'enabled', e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                    <div style={{ fontSize: '10px', marginTop: '4px', color: cat.enabled === false ? '#be123c' : '#15803d' }}>
                      {cat.enabled === false ? 'Скрыт' : 'Виден'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 2. Каталог */}
          <section style={{ background: '#fff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h2 style={{ marginBottom: '24px' }}>2. Каталог продукции</h2>
            {categoriesData?.map((cat, catIdx) => (
              <div key={cat.id} style={{ marginBottom: '40px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
                <h3 style={{ color: '#FF6B00' }}>{cat.title}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {cat.prices.map((item, itemIdx) => (
                    <div key={item.id} style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', background: '#fafafa' }}>
                      <input type="text" value={item.name} onChange={(e) => updateCategoryItem(catIdx, itemIdx, 'name', e.target.value)} style={{ width: '100%', marginBottom: '8px', fontWeight: 'bold', border: '1px solid #ddd', padding: '4px' }} />
                      <input type="text" value={item.price} onChange={(e) => updateCategoryItem(catIdx, itemIdx, 'price', e.target.value)} style={{ width: '100%', marginBottom: '8px', border: '1px solid #ddd', padding: '4px' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        {item.img && <img src={item.img.startsWith('http') ? item.img : `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/public/${item.img}`} alt="preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />}
                        <input type="file" accept="image/*" onChange={(e) => uploadImage(e.target.files[0], catIdx, itemIdx)} style={{ fontSize: '11px' }} />
                      </div>
                      <button onClick={() => removeCategoryItem(catIdx, itemIdx)} style={{ width: '100%', background: '#fee2e2', color: '#b00020', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                        {confirmDelete?.catIdx === catIdx && confirmDelete?.itemIdx === itemIdx ? 'Точно удалить?' : 'Удалить'}
                      </button>
                    </div>
                  ))}
                  <button onClick={() => addCategoryItem(catIdx)} style={{ border: '2px dashed #ccc', borderRadius: '8px', cursor: 'pointer', height: '100px', background: 'none', color: '#666' }}>+ Добавить товар</button>
                </div>
              </div>
            ))}
          </section>

          {/* 3. Таблицы Прайса */}
          <section style={{ background: '#fff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h2 style={{ marginBottom: '24px' }}>3. Таблицы Прайс-листа</h2>
            {pricesData?.map((section, secIdx) => {
              const isDelivery = section.type === 'delivery' || ['materials', 'soil', 'coal', 'firewood'].includes(section.id);
              if (isDelivery) {
                const weights = section.deliveryWeights || [];
                return (
                  <div key={section.id} style={{ marginBottom: '30px', padding: '20px', border: '1px solid #eee', borderRadius: '12px' }}>
                    <h4 style={{ margin: '0 0 12px 0' }}>{section.title}</h4>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9' }}>
                            <th style={{ border: '1px solid #cbd5e1', padding: '6px' }}>Наименование</th>
                            <th style={{ border: '1px solid #cbd5e1', padding: '6px', minWidth: '80px' }}>{section.priceColLabel || 'Цена самовывозом'}</th>
                            <th style={{ border: '1px solid #cbd5e1', padding: '6px', minWidth: '70px' }}>{section.bagColLabel || 'Мешок'}</th>
                            {weights.map((w, wi) => (
                              <th key={wi} style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
                                <input value={w} onChange={(e) => updateDeliveryHeader(secIdx, 'weight', wi, e.target.value)} style={{ width: '40px', fontSize: '10px', textAlign: 'center' }} />
                              </th>
                            ))}
                            <th style={{ width: '40px' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {(section.rows || []).map((row, ri) => (
                            <tr key={ri}>
                              <td style={{ border: '1px solid #cbd5e1', padding: '4px' }}>
                                <input value={row.name || ''} onChange={(e) => updatePriceTableRow(secIdx, ri, 'name', e.target.value)} style={{ width: '100%', border: 'none', fontSize: '11px' }} />
                              </td>
                              <td style={{ border: '1px solid #cbd5e1', padding: '0' }}>
                                <input
                                  value={row.price ?? ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updatePriceTableRow(secIdx, ri, 'price', val === '' ? '-' : isNaN(val) ? val : Number(val));
                                  }}
                                  style={{ width: '100%', border: 'none', textAlign: 'center', padding: '6px', fontSize: '11px' }}
                                />
                              </td>
                              <td style={{ border: '1px solid #cbd5e1', padding: '0' }}>
                                <input
                                  value={row.bag ?? ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updatePriceTableRow(secIdx, ri, 'bag', val === '' ? '-' : isNaN(val) ? val : Number(val));
                                  }}
                                  style={{ width: '100%', border: 'none', textAlign: 'center', padding: '6px', fontSize: '11px' }}
                                />
                              </td>
                              {weights.map((_, wi) => (
                                <td key={wi} style={{ border: '1px solid #cbd5e1', padding: '0' }}>
                                  <input 
                                    value={row.delivery?.[wi] || ''} 
                                    onChange={(e) => {
                                      const newDel = [...(row.delivery || [])];
                                      newDel[wi] = e.target.value;
                                      updatePriceTableRow(secIdx, ri, 'delivery', newDel);
                                    }}
                                    style={{ width: '100%', border: 'none', textAlign: 'center', padding: '6px' }}
                                  />
                                </td>
                              ))}
                              <td style={{ border: '1px solid #cbd5e1', textAlign: 'center' }}>
                                <button onClick={() => removePriceTableRow(secIdx, ri)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button onClick={() => addPriceTableRow(secIdx)} style={{ marginTop: '10px', padding: '4px 12px', fontSize: '11px', cursor: 'pointer', border: '1px dashed #ccc', borderRadius: '4px', background: 'none' }}>+ Добавить строку</button>
                    </div>
                    {/* Примечания (footnotes) */}
                    <div style={{ marginTop: '16px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#666' }}>Примечания к таблице</label>
                      {(section.footnotes || []).map((fn, fnIdx) => (
                        <div key={fnIdx} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                          <input
                            type="text"
                            value={fn}
                            onChange={(e) => updateFootnote(secIdx, fnIdx, e.target.value)}
                            style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '11px' }}
                          />
                          <button onClick={() => removeFootnote(secIdx, fnIdx)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px' }}>✕</button>
                        </div>
                      ))}
                      <button onClick={() => addFootnote(secIdx)} style={{ padding: '4px 12px', fontSize: '11px', cursor: 'pointer', border: '1px dashed #ccc', borderRadius: '4px', background: 'none' }}>+ Добавить примечание</button>
                    </div>
                  </div>
                );
              }
              return (
                <div key={section.id} style={{ marginBottom: '30px', padding: '20px', border: '1px solid #eee', borderRadius: '12px' }}>
                  <h4 style={{ margin: '0 0 12px 0' }}>{section.title}</h4>
                  {section.rows.map((row, ri) => {
                    if (row.hasComplexTable && row.rows) {
                      return (
                        <div key={row.id || ri} style={{ marginBottom: '20px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                            <strong style={{ fontSize: '13px' }}>{row.name}</strong>
                            <input value={row.price || ''} onChange={(e) => updateSimpleRowField(secIdx, ri, 'price', e.target.value)} style={{ width: '100px', fontSize: '11px', padding: '4px', border: '1px solid #ddd', borderRadius: '4px' }} />
                            <span style={{ fontSize: '11px', color: '#666' }}>{row.unit}</span>
                          </div>
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                              <thead>
                                <tr style={{ background: '#e2e8f0' }}>
                                  <th style={{ border: '1px solid #cbd5e1', padding: '4px', width: '30px' }}>№</th>
                                  <th style={{ border: '1px solid #cbd5e1', padding: '4px' }}>Наименование</th>
                                  <th style={{ border: '1px solid #cbd5e1', padding: '4px', width: '50px' }}>Кол-во</th>
                                  <th style={{ border: '1px solid #cbd5e1', padding: '4px', width: '70px' }}>Ель м³</th>
                                  <th style={{ border: '1px solid #cbd5e1', padding: '4px', width: '60px' }}>Ель шт.</th>
                                  <th style={{ border: '1px solid #cbd5e1', padding: '4px', width: '70px' }}>Лист. м³</th>
                                  <th style={{ border: '1px solid #cbd5e1', padding: '4px', width: '60px' }}>Лист. шт.</th>
                                </tr>
                              </thead>
                              <tbody>
                                {row.rows.map((sub, si) => {
                                  if (sub.isGroup) {
                                    return (
                                      <tr key={si} style={{ background: '#FF6B00', color: '#fff' }}>
                                        <td colSpan={7} style={{ border: '1px solid #cbd5e1', padding: '4px', fontWeight: 'bold', textAlign: 'center' }}>
                                          <input value={sub.label} onChange={(e) => updateComplexSubRow(secIdx, ri, si, 'label', e.target.value)} style={{ width: '60px', textAlign: 'center', border: 'none', background: 'transparent', color: '#fff', fontWeight: 'bold' }} />
                                        </td>
                                      </tr>
                                    );
                                  }
                                  return (
                                    <tr key={si}>
                                      <td style={{ border: '1px solid #cbd5e1', padding: '2px', textAlign: 'center' }}>{sub.n}</td>
                                      <td style={{ border: '1px solid #cbd5e1', padding: '0' }}>
                                        <input value={sub.name} onChange={(e) => updateComplexSubRow(secIdx, ri, si, 'name', e.target.value)} style={{ width: '100%', border: 'none', fontSize: '11px', padding: '4px' }} />
                                      </td>
                                      <td style={{ border: '1px solid #cbd5e1', padding: '0' }}>
                                        <input value={sub.count || ''} onChange={(e) => updateComplexSubRow(secIdx, ri, si, 'count', e.target.value)} style={{ width: '100%', border: 'none', textAlign: 'center', fontSize: '11px', padding: '4px' }} />
                                      </td>
                                      <td style={{ border: '1px solid #cbd5e1', padding: '0' }}>
                                        <input value={sub.s_m3 || ''} onChange={(e) => updateComplexSubRow(secIdx, ri, si, 's_m3', e.target.value)} style={{ width: '100%', border: 'none', textAlign: 'center', fontSize: '11px', padding: '4px' }} />
                                      </td>
                                      <td style={{ border: '1px solid #cbd5e1', padding: '0' }}>
                                        <input value={sub.s_p || ''} onChange={(e) => updateComplexSubRow(secIdx, ri, si, 's_p', e.target.value)} style={{ width: '100%', border: 'none', textAlign: 'center', fontSize: '11px', padding: '4px' }} />
                                      </td>
                                      <td style={{ border: '1px solid #cbd5e1', padding: '0' }}>
                                        <input value={sub.l_m3 || ''} onChange={(e) => updateComplexSubRow(secIdx, ri, si, 'l_m3', e.target.value)} style={{ width: '100%', border: 'none', textAlign: 'center', fontSize: '11px', padding: '4px' }} />
                                      </td>
                                      <td style={{ border: '1px solid #cbd5e1', padding: '0' }}>
                                        <input value={sub.l_p || ''} onChange={(e) => updateComplexSubRow(secIdx, ri, si, 'l_p', e.target.value)} style={{ width: '100%', border: 'none', textAlign: 'center', fontSize: '11px', padding: '4px' }} />
                                      </td>
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
                      <div key={row.id || ri} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 1fr 30px', gap: '8px', alignItems: 'center', marginBottom: '8px', padding: '8px', background: '#fafafa', borderRadius: '6px' }}>
                        <input value={row.name} onChange={(e) => updateSimpleRowField(secIdx, ri, 'name', e.target.value)} style={{ border: '1px solid #ddd', padding: '6px', borderRadius: '4px', fontSize: '12px' }} />
                        <input value={row.price || ''} onChange={(e) => updateSimpleRowField(secIdx, ri, 'price', e.target.value)} style={{ border: '1px solid #ddd', padding: '6px', borderRadius: '4px', fontSize: '12px', textAlign: 'center' }} />
                        <input value={row.unit || ''} onChange={(e) => updateSimpleRowField(secIdx, ri, 'unit', e.target.value)} style={{ border: '1px solid #ddd', padding: '6px', borderRadius: '4px', fontSize: '12px' }} />
                        <input value={row.note || ''} onChange={(e) => updateSimpleRowField(secIdx, ri, 'note', e.target.value)} placeholder="Примечание" style={{ border: '1px solid #ddd', padding: '6px', borderRadius: '4px', fontSize: '12px' }} />
                        <button onClick={() => removeSimpleRow(secIdx, ri)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
                      </div>
                    );
                  })}
                  <button onClick={() => addSimpleRow(secIdx)} style={{ marginTop: '10px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer', border: '1px dashed #ccc', borderRadius: '4px', background: 'none' }}>+ Добавить строку</button>
                  {/* Примечания (footnotes) */}
                  {((section.footnotes && section.footnotes.length > 0) || true) && (
                    <div style={{ marginTop: '16px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#666' }}>Примечания к таблице</label>
                      {(section.footnotes || []).map((fn, fnIdx) => (
                        <div key={fnIdx} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                          <input
                            type="text"
                            value={fn}
                            onChange={(e) => updateFootnote(secIdx, fnIdx, e.target.value)}
                            style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '11px' }}
                          />
                          <button onClick={() => removeFootnote(secIdx, fnIdx)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px' }}>✕</button>
                        </div>
                      ))}
                      <button onClick={() => addFootnote(secIdx)} style={{ padding: '4px 12px', fontSize: '11px', cursor: 'pointer', border: '1px dashed #ccc', borderRadius: '4px', background: 'none' }}>+ Добавить примечание</button>
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        </div>
      )}
      
      <div style={{ marginTop: '40px', padding: '20px', borderTop: '1px solid #eee', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
        CMS v2.0 | Режим: GitHub API | Репозиторий: {REPO_OWNER}/{REPO_NAME}
      </div>
    </div>
  );
}

const REPO_OWNER = 'pepsicolausagpt';
const REPO_NAME = 'ustoydv';
