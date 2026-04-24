import React, { useState, useEffect } from 'react';
import {
  categoriesParams,
  PHONE_PRIMARY, PHONE_PRIMARY_DISPLAY,
  PHONE_SECONDARY, PHONE_SECONDARY_DISPLAY,
  EMAIL, MAX_LINK
} from './data/categories.js';
import {
  priceSections,
  PRICE_DATE,
  PRICE_DELIVERY_ZONE,
  PRICE_DELIVERY_NOTES
} from './data/priceTable.js';
import { supabase } from './lib/supabase.js';
import AdminPanel from './components/AdminPanel.jsx';

/* ─── Helpers ─────────────────────────────────────────────── */
const SvgIcon = ({ path, size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
);

const PHONE_ICON = 'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z';
const MSG_ICON  = 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z';
const BACK_ICON = 'M19 12H5M12 19l-7-7 7-7';
const TABLE_ICON = 'M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18';

const handleImgError = (e) => { e.target.style.opacity = '0'; };

/* ─── Header ──────────────────────────────────────────────── */
const Header = ({ onLogoClick, onPriceClick }) => (
  <header>
    <div className="logo-text" onClick={onLogoClick} style={{ cursor: 'pointer' }}>
      Устрой<span>ДВ</span>.РФ
    </div>
    <nav className="nav-links">
      <a href="#catalog">Каталог</a>
      <a href="#contacts">Контакты</a>
      <a href="#price" onClick={(e) => { e.preventDefault(); onPriceClick(); }}
        className="nav-price-link">Прайс</a>
    </nav>
    <div className="header-contacts">
      <div className="contact-phones">
        <a href={`tel:${PHONE_PRIMARY}`}>
          <SvgIcon path={PHONE_ICON} />{PHONE_PRIMARY_DISPLAY}
        </a>
        <a href={`tel:${PHONE_SECONDARY}`}>
          <SvgIcon path={PHONE_ICON} />{PHONE_SECONDARY_DISPLAY}
        </a>
      </div>
      <div className="contact-details">
        <span>г. Хабаровск</span>
        <span>Пн-Сб 8:00–17:00</span>
        <span>Самовывоз | Доставка</span>
      </div>
    </div>
  </header>
);

/* ─── Footer ──────────────────────────────────────────────── */
const Footer = () => (
  <footer className="footer">
    <div className="container footer-content">
      <p className="disclaimer">
        Все цены на сайте приведены как справочная информация. Цены могут быть изменены в любое время.
        Для получения подробной информации просьба обращаться на электронную почту{' '}
        <a href={`mailto:${EMAIL}`}>{EMAIL}</a> или по телефону{' '}
        <a href={`tel:${PHONE_PRIMARY}`}>{PHONE_PRIMARY_DISPLAY}</a>,{' '}
        <a href={`tel:${PHONE_SECONDARY}`}>{PHONE_SECONDARY_DISPLAY}</a>.
      </p>
      <div className="footer-bottom">
        <span>© 2026 УстройДВ.РФ</span>
        <a href="#" className="back-to-top"
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          Наверх ↑
        </a>
      </div>
    </div>
  </footer>
);

/* ─── PriceView ───────────────────────────────────────────── */
const PriceView = ({ onBack, priceData }) => {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const sectionsToRender = priceData && priceData.length > 0 ? priceData : priceSections;

  return (
    <div className="price-view container">
      <button className="btn-back" onClick={onBack}>
        <SvgIcon path={BACK_ICON} /> Назад на главную
      </button>

      <div className="price-view-header">
        <h1>Прайс-лист</h1>
        <span className="price-date-badge">от {PRICE_DATE} г.</span>
      </div>

      <div className="price-info-block">
        <p>{PRICE_DELIVERY_ZONE}</p>
        <div className="price-delivery-notes">
          {PRICE_DELIVERY_NOTES.map((note, i) => (
            <p key={i} className="price-delivery-note">• {note}</p>
          ))}
        </div>
      </div>

      {sectionsToRender.map(section => (
        <div key={section.id} className="price-section">
          <h2 className="price-section-title">{section.title}</h2>
          <div className="price-table-wrapper">
            <table className="price-table">
              <thead>
                <tr>
                  <th className="pt-name-col">Наименование</th>
                  <th className="pt-price-col">{section.unitCol}</th>
                  {section.bagCol && <th className="pt-bag-col">{section.bagCol}</th>}
                  <th className="pt-note-col">Примечание</th>
                </tr>
              </thead>
              <tbody>
                {section.rows.map((row, idx) => (
                  <React.Fragment key={row.id}>
                    <tr className={idx % 2 === 0 ? '' : 'pt-row-alt'}>
                      <td className="pt-name">
                        {row.name}
                        {row.hasSubTable && (
                          <button 
                            className={`expand-btn ${expandedRows[row.id] ? 'expanded' : ''}`}
                            onClick={() => toggleRow(row.id)}
                          >
                            {expandedRows[row.id] ? 'Свернуть цены' : 'Показать все размеры'}
                          </button>
                        )}
                      </td>
                      <td className="pt-price">
                        <span className={row.price === 'уточнить' || row.price === '—'
                          ? 'pt-price-na' : 'pt-price-val'}>
                          {row.price}
                        </span>
                        {row.price !== '—' && row.price !== 'уточнить' && (
                          <span className="pt-unit"> {row.unit}</span>
                        )}
                      </td>
                      {section.bagCol && (
                        <td className="pt-bag">
                          {row.bag && row.bag !== '—' ? row.bag : <span className="pt-price-na">—</span>}
                        </td>
                      )}
                      <td className="pt-note">{row.note || ''}</td>
                    </tr>
                    {row.hasSubTable && expandedRows[row.id] && (
                      <tr className="sub-table-row">
                        <td colSpan={section.bagCol ? 4 : 3}>
                          <div className="sub-table-container">
                            <table className="sub-table">
                              <thead>
                                <tr>
                                  {row.subTableHeaders.map((h, i) => <th key={i}>{h}</th>)}
                                </tr>
                              </thead>
                              <tbody>
                                {row.subTableRows.map((sr, i) => (
                                  sr.isHeader ? (
                                    <tr key={i} className="sub-table-header-row">
                                      <td colSpan={row.subTableHeaders.length}>{sr.name}</td>
                                    </tr>
                                  ) : (
                                    <tr key={i}>
                                      <td>{sr.name}</td>
                                      {sr.values.map((v, j) => <td key={j}>{v}</td>)}
                                    </tr>
                                  )
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {section.footnote && (
            <p className="price-section-footnote">* {section.footnote}</p>
          )}
        </div>
      ))}

      <div className="cd-cta-block" style={{ marginTop: '60px' }}>
        <h2>Нужна консультация?</h2>
        <p>Свяжитесь с нами по телефону или в мессенджере — поможем рассчитать стоимость доставки.</p>
        <a href={MAX_LINK} target="_blank" rel="noreferrer" className="btn-primary max-large-btn">
          <SvgIcon path={MSG_ICON} />
          НАПИСАТЬ В MAX
        </a>
      </div>
    </div>
  );
};

/* ─── ContactsSection ────────────────────────────────────── */
const MAP_ICON    = 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 10m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0';
const CLOCK_ICON  = 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 6v6l4 2';
const MAIL_ICON   = 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6';
const TRUCK_ICON  = 'M1 3h15v13H1z M16 8h4l3 3v5h-7V8z M5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z M18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z';
const FACTORY_ICON= 'M2 20h20v2H2v-2z M6 6v6l4-3v3l4-3v3l4-3V2H6v4z';

const ContactsSection = () => (
  <section className="contacts-section container" id="contacts">
    <h2 className="section-title section-title--center">Контакты</h2>

    <div className="contacts-grid">

      {/* ── Левая колонка ──────────── */}
      <div className="contacts-left">

        {/* Телефоны */}
        <div className="contact-card">
          <div className="contact-card-icon"><SvgIcon path={PHONE_ICON} /></div>
          <div>
            <div className="contact-card-label">Звонки и заказы</div>
            <a href={`tel:${PHONE_PRIMARY}`} className="contact-phone-big">{PHONE_PRIMARY_DISPLAY}</a>
            <a href={`tel:${PHONE_SECONDARY}`} className="contact-phone-big">{PHONE_SECONDARY_DISPLAY}</a>
          </div>
        </div>

        {/* Email */}
        <div className="contact-card">
          <div className="contact-card-icon"><SvgIcon path={MAIL_ICON} /></div>
          <div>
            <div className="contact-card-label">Электронная почта</div>
            <a href={`mailto:${EMAIL}`} className="contact-link">{EMAIL}</a>
          </div>
        </div>

        {/* Часы работы */}
        <div className="contact-card">
          <div className="contact-card-icon"><SvgIcon path={CLOCK_ICON} /></div>
          <div>
            <div className="contact-card-label">Режим работы</div>
            <p className="contact-info">Пн–Сб: 8:00 — 17:00</p>
            <p className="contact-info-sub">Воскресенье — выходной</p>
          </div>
        </div>

        {/* Адреса */}
        <div className="contact-card">
          <div className="contact-card-icon"><SvgIcon path={MAP_ICON} /></div>
          <div>
            <div className="contact-card-label">Фактический адрес (склад)</div>
            <p className="contact-info">г. Хабаровск, п. Березовка,</p>
            <p className="contact-info">Федоровское шоссе, 8/1</p>
            <a
              href="https://yandex.ru/maps/76/khabarovsk/house/fyodorovskoye_shosse_8_1/ZUoDaAZjTE0GWEJua2J0d3hnYQs=/?ll=135.135857%2C48.564251&z=18.45"
              target="_blank" rel="noreferrer"
              className="contact-link contact-link-map">
              → Открыть на карте
            </a>
          </div>
        </div>

        {/* Доставка */}
        <div className="contact-card">
          <div className="contact-card-icon"><SvgIcon path={TRUCK_ICON} /></div>
          <div>
            <div className="contact-card-label">Самовывоз и доставка</div>
            <p className="contact-info">Самовывоз с нашего склада</p>
            <p className="contact-info">Доставка по Хабаровску и краю</p>
          </div>
        </div>

        {/* MAX */}
        <a href={MAX_LINK} target="_blank" rel="noreferrer" className="btn-primary contact-max-btn">
          <SvgIcon path={MSG_ICON} />
          Написать в MAX
        </a>
      </div>

      {/* ── Правая колонка — карта ── */}
      <div className="contacts-right">
        <div className="contacts-map-wrapper">
          <iframe
            title="Схема проезда"
            src="https://yandex.ru/map-widget/v1/?um=constructor%3A857c810fecec206f92bec2baa3de4c700c589a322008d5be4c279782707b281b&amp;source=constructor"
            width="100%"
            height="100%"
            frameBorder="0"
            allowFullScreen
            className="contacts-map-iframe"
          />
        </div>

        {/* Реквизиты */}
        <details className="requisites-card">
          <summary className="requisites-title">
            <SvgIcon path={FACTORY_ICON} size={18} />
            Реквизиты компании
          </summary>
          <div className="requisites-body">
            <div className="req-row"><span>Наименование</span><strong>ИП Закраевский Е.Н.</strong></div>
            <div className="req-row"><span>Юр. адрес</span><strong>680022, г. Хабаровск, ул. Беломорская, 65</strong></div>
            <div className="req-row"><span>ОГРНИП</span><strong>308272217900010</strong></div>
            <div className="req-row"><span>ИНН</span><strong>272510066450</strong></div>
            <div className="req-row"><span>р/с</span><strong>40802810670000004066</strong></div>
            <div className="req-row"><span>Банк</span><strong>ПАО Сбербанк</strong></div>
            <div className="req-row"><span>к/с</span><strong>30101810600000000608</strong></div>
            <div className="req-row"><span>БИК</span><strong>040813608</strong></div>
          </div>
        </details>
      </div>
    </div>
  </section>
);

const features = [
  {
    id: 'production',
    title: 'Собственное производство',
    desc: 'Мы не перекупы. Пилорама работает без выходных, обеспечивая стабильное качество и объемы.',
    icon: 'M5 18H3c-1.1 0-2-.9-2-2V9c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v7c0 1.1-.9 2-2 2h-2 M14 9h5c1.1 0 2 .9 2 2v5l-2.5 2'
  },
  {
    id: 'delivery',
    title: 'Попутная Доставка',
    desc: 'Доставляем пиломатериалы и сыпучие грузы собственными самосвалами по всему Хабаровску.',
    icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4'
  },
  {
    id: 'range',
    title: 'Для любых задач',
    desc: 'От горбыля для топки до первосортного бруса для строительства дома.',
    icon: 'M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'
  }
];

const HomeView = ({ categories, onSelectCategory, onPriceClick }) => {
  const primaryCat    = categories.find(c => c.isPrimary);
  const secondaryCats = categories.filter(c => !c.isPrimary);

  return (
    <>
      <section className="hero">
        <img src="/bg_hero_lumber.png" alt="Производство пиломатериалов" className="hero-bg" onError={handleImgError} />
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>ПРОИЗВОДСТВО ПИЛОМАТЕРИАЛОВ<br />В ХАБАРОВСКЕ</h1>
          <p>Собственная пилорама: доска, брус, горбыль и опилки. А также услуги по доставке сыпучих материалов и аренде спецтехники.</p>
          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => onSelectCategory(primaryCat)}>
              Каталог пиломатериалов
            </button>
            <button className="btn-outline" onClick={onPriceClick}>
              <SvgIcon path={TABLE_ICON} size={18} />
              Прайс-лист
            </button>
          </div>
        </div>
      </section>

      <section className="catalog-section container" id="catalog">
        <div className="featured-card" onClick={() => onSelectCategory(primaryCat)}>
          <div className="fc-image">
            <img src={primaryCat.img} alt={primaryCat.title} onError={handleImgError} />
          </div>
          <div className="fc-content">
            <h2>{primaryCat.title}</h2>
            <p>{primaryCat.desc}</p>
            <button className="card-btn">СМОТРЕТЬ КАТАЛОГ</button>
          </div>
        </div>

        <h2 className="section-title section-title--secondary section-title--center" id="services">Дополнительные Услуги</h2>
        <div className="grid">
          {secondaryCats.map(cat => (
            <div key={cat.id} className="card" onClick={() => onSelectCategory(cat)}>
              <img src={cat.img} alt={cat.title} className="card-img" onError={handleImgError} />
              <h3 className="card-title">{cat.title}</h3>
              <p className="card-desc">{cat.desc}</p>
              <button className="card-btn">открыть</button>
            </div>
          ))}
        </div>
      </section>

      <section className="features-section container" id="features">
        <h2 className="section-title section-title--center">Почему Нас Рекомендуют</h2>
        <div className="features-grid">
          {features.map(feat => (
            <div key={feat.id} className="feature-item">
              <div className="feature-icon-wrapper">
                <SvgIcon path={feat.icon} />
              </div>
              <h3 className="feature-title">{feat.title}</h3>
              <p className="feature-desc">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <ContactsSection />
    </>
  );
};

/* ─── CategoryDetail ──────────────────────────────────────── */
const CategoryDetail = ({ category, onBack }) => {
  useEffect(() => { window.scrollTo(0, 0); }, [category]);

  return (
    <div className="category-detail-view container">
      <button className="btn-back" onClick={onBack}>
        <SvgIcon path={BACK_ICON} /> Назад на главную
      </button>

      <div className="cd-header">
        <div className="cd-image-wrapper">
          <img src={category.img} alt={category.title} className="cd-image" onError={handleImgError} />
        </div>
        <div className="cd-info">
          <h1>{category.title}</h1>
          <p>{category.desc}</p>
          <div className="cd-highlight">
            Звоните для оформления заказа: <br />
            <strong>{PHONE_PRIMARY_DISPLAY}</strong>
          </div>
        </div>
      </div>

      <div className="cd-price-section">
        <h2>Каталог и Цены</h2>
        {category.priceNote && (
          <p className="cd-price-note">{category.priceNote}</p>
        )}
        <div className="price-list-vertical">
          {category.prices.map(item => (
            <div key={item.id} className="price-list-item">
              <img
                src={item.img || category.img}
                alt={item.name}
                className="price-thumb"
                onError={handleImgError}
              />
              <div className="price-details">
                <h3>{item.name}</h3>
                {item.desc && <p>{item.desc}</p>}
              </div>
              <div className="price-val">{item.price}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="cd-cta-block">
        <h2>Готовы сделать заказ?</h2>
        <p>Свяжитесь с нами через мессенджер MAX для быстрого оформления счёта и согласования доставки.</p>
        <a href={MAX_LINK} target="_blank" rel="noreferrer" className="btn-primary max-large-btn">
          <SvgIcon path={MSG_ICON} />
          НАПИСАТЬ В MAX
        </a>
      </div>
    </div>
  );
};

/* ─── App (Router) ────────────────────────────────────────── */
const App = () => {
  const [activeCategory, setActiveCategory] = useState(null);
  const [showPrice, setShowPrice]           = useState(false);
  const [showAdmin, setShowAdmin]           = useState(false);
  const [siteCategories, setSiteCategories] = useState(categoriesParams);
  const [sitePrices, setSitePrices]         = useState(priceSections);

  useEffect(() => {
    const fetchSiteData = async () => {
      const { data, error } = await supabase.from('site_content').select('*');
      if (data && !error) {
        const cat = data.find(d => d.key === 'categories');
        const prc = data.find(d => d.key === 'prices');
        if (cat && cat.content) setSiteCategories(cat.content);
        if (prc && prc.content) setSitePrices(prc.content);
      }
    };
    fetchSiteData();
  }, []);

  /* Синхронизация состояния с хэшем */
  useEffect(() => {
    const handleHash = () => {
      const h = window.location.hash;
      if (h === '#admin') {
        setShowAdmin(true);
        setShowPrice(false);
        setActiveCategory(null);
      } else if (h === '#price') {
        setShowPrice(true);
        setShowAdmin(false);
        setActiveCategory(null);
      } else if (h.startsWith('#category-')) {
        setShowPrice(false);
        setShowAdmin(false);
        // Find category from dynamic data
        const catId = h.replace('#category-', '');
        const found = siteCategories.find(c => c.id === catId);
        if (found) setActiveCategory(found);
      } else {
        setActiveCategory(null);
        setShowPrice(false);
        setShowAdmin(false);
      }
    };
    window.addEventListener('hashchange', handleHash);
    // Call once on load
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, [siteCategories]);

  const handleSelectCategory = (cat) => {
    setActiveCategory(cat);
    setShowPrice(false);
    setShowAdmin(false);
    window.location.hash = `category-${cat.id}`;
  };

  const handleShowPrice = () => {
    setShowPrice(true);
    setActiveCategory(null);
    setShowAdmin(false);
    window.location.hash = 'price';
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setActiveCategory(null);
    setShowPrice(false);
    setShowAdmin(false);
    history.replaceState(null, '', ' ');
  };

  const handleLogoClick = () => {
    setActiveCategory(null);
    setShowPrice(false);
    setShowAdmin(false);
    history.replaceState(null, '', ' ');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (showAdmin) {
    return <AdminPanel onExit={() => { window.location.hash = ''; setShowAdmin(false); }} />;
  }

  const isHome = !activeCategory && !showPrice && !showAdmin;

  return (
    <>
      <Header onLogoClick={handleLogoClick} onPriceClick={handleShowPrice} />

      {showPrice ? (
        <PriceView onBack={handleBack} priceData={sitePrices} />
      ) : activeCategory ? (
        <CategoryDetail category={activeCategory} onBack={handleBack} />
      ) : (
        <HomeView
          categories={siteCategories}
          onSelectCategory={handleSelectCategory}
          onPriceClick={handleShowPrice}
        />
      )}

      <Footer />

      {isHome && (
        <a href={MAX_LINK} target="_blank" rel="noreferrer" className="max-widget">
          <SvgIcon path={MSG_ICON} />
          Написать в MAX
        </a>
      )}
    </>
  );
};

export default App;
