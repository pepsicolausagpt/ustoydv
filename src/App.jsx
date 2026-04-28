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
  PRICE_DELIVERY_ZONE2,
  PRICE_DELIVERY_NOTES
} from './data/priceTable.js';
import { supabase } from './lib/supabase.js';
import AdminPanel from './components/AdminPanel.jsx';

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
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <a href="#admin" className="admin-login-link" style={{ fontSize: '12px', opacity: 0.5, textDecoration: 'none', color: 'inherit' }}>
            Вход для администратора
          </a>
          <a href="#" className="back-to-top"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            Наверх ↑
          </a>
        </div>
      </div>
    </div>
  </footer>
);

/* ─── DeliveryTable — таблица с матрицей доставки ─────────── */
const DeliveryTable = ({ section }) => {
  if (!section) return null;
  
  // Берем дефолтные значения, если в базе их нет
  const defaultSec = priceSections.find(s => s.id === section.id);
  const weights = section.deliveryWeights || defaultSec?.deliveryWeights || [];
  const volumes = section.deliveryVolumes || defaultSec?.deliveryVolumes || [];
  const numDeliveryCols = weights.length;

  if (weights.length === 0) return null;

  return (
    <div className="pt-section" id={`price-section-${section.id}`}>
      <h2 className="pt-section-title">{section.title}</h2>
      <div className="pt-scroll-wrapper">
        <table className="pt-classic">
          <thead>
            {/* Строка 1: заголовки колонок с rowspan/colspan */}
            <tr>
              <td rowSpan={section.deliverySubLabel ? 4 : (volumes.length > 0 ? 4 : 2)} className="pt-h-name">
                {section.id === 'coal' ? 'Сорт угля' :
                 section.id === 'firewood' ? 'Наименование дров*' :
                 section.id === 'soil' ? 'Наименование удобрений' :
                 'Наименование сыпучих материалов'}
              </td>
              <td rowSpan={section.deliverySubLabel ? 4 : (volumes.length > 0 ? 4 : 2)} className="pt-h-price">
                {section.priceColLabel || 'Цена'}
              </td>
              <td rowSpan={section.deliverySubLabel ? 4 : (volumes.length > 0 ? 4 : 2)} className="pt-h-bag">
                {section.bagColLabel || 'Мешок 50кг'}
              </td>
              <td colSpan={numDeliveryCols} className="pt-h-delivery-top">
                {section.deliveryLabel || 'Цена с доставкой'}
              </td>
            </tr>
            {/* Строка 2: подзаголовок (если есть) */}
            {section.deliverySubLabel && (
              <tr>
                <td colSpan={numDeliveryCols} className="pt-h-delivery-sub">
                  {section.deliverySubLabel}
                </td>
              </tr>
            )}
            {/* Строка 3: тоннаж */}
            {volumes.length > 0 && (
              <tr>
                {weights.map((w, i) => (
                  <td key={i} className="pt-h-weight">{w}</td>
                ))}
              </tr>
            )}
            {/* Строка 4: объёмы (или единственная строка весов/объёмов) */}
            <tr>
              {(volumes.length > 0 ? volumes : weights).map((v, i) => (
                <td key={i} className="pt-h-volume">{v}</td>
              ))}
            </tr>
          </thead>
          <tbody>
            {(section.rows && section.rows.length > 0 ? section.rows : (priceSections.find(s => s.id === section.id)?.rows || [])).map((row, idx) => {
              const deliveryData = row.delivery || [];
              const is2D = Array.isArray(deliveryData[0]);

              return (
                <tr key={row.id || idx} className={row.isFooterRow ? 'pt-footer-row' : (idx % 2 === 1 ? 'pt-row-odd' : '')}>
                  <td className="pt-cell-name">{row.name}</td>
                  <td className="pt-cell-center">
                    {row.price === null ? '' : row.price === '-' ? '—' : typeof row.price === 'number' ? row.price.toLocaleString('ru-RU') : row.price}
                  </td>
                  <td className="pt-cell-center">
                    {row.bag === null ? '' : row.bag === '-' ? '—' : typeof row.bag === 'number' ? row.bag.toLocaleString('ru-RU') : row.bag}
                  </td>
                  {is2D ? (
                    // Новый формат: матрица (массив массивов)
                    deliveryData.map((prices, wi) => (
                      <td key={wi} className="pt-cell-center" style={{ padding: 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          {prices.map((p, vi) => (
                            <div key={vi} style={{ 
                              padding: '8px 4px', 
                              borderBottom: vi < prices.length - 1 ? '1px solid #eee' : 'none',
                              minHeight: '34px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {p === '-' ? '—' : typeof p === 'number' ? p.toLocaleString('ru-RU') : p}
                            </div>
                          ))}
                        </div>
                      </td>
                    ))
                  ) : (
                    // Старый формат: плоский список
                    deliveryData.map((val, i) => (
                      <td key={i} className="pt-cell-center">
                        {val === '-' ? '—' : typeof val === 'number' ? val.toLocaleString('ru-RU') : val}
                      </td>
                    ))
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {section.footnotes && section.footnotes.length > 0 && (
        <div className="pt-footnotes">
          {section.footnotes.map((fn, i) => (
            <p key={i} className="pt-footnote">* {fn}</p>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── SimpleTable — простая таблица (пиломатериалы/техника) ─ */
const SimpleTable = ({ section }) => {
  if (!section || !section.rows) return null;
  // Если у первого элемента сложная таблица, скрываем основную шапку
  const firstRow = section.rows[0];
  const showMainHeader = !(firstRow?.hasComplexTable || ['doska', 'brus', 'brusok'].includes(firstRow?.id));

  return (
    <div className="pt-section" id={`price-section-${section.id}`}>
      <h2 className="pt-section-title">{section.title}</h2>
      <div className="pt-scroll-wrapper">
        <table className="pt-classic pt-simple">
          {showMainHeader && (
            <thead>
              <tr>
                <td className="pt-h-name">Наименование</td>
                <td className="pt-h-price">{section.priceColLabel || 'Цена'}</td>
                <td className="pt-h-bag">{section.unitColLabel || 'Ед. изм.'}</td>
                <td className="pt-h-note">{section.noteColLabel || 'Примечание'}</td>
              </tr>
            </thead>
          )}
          <tbody>
            {(section.rows && section.rows.length > 0 ? section.rows : (priceSections.find(s => s.id === section.id)?.rows || [])).map((row, idx) => {
              const isLumber = ['doska', 'brus', 'brusok'].includes(row.id);
              const hasComplex = row.hasComplexTable || isLumber;
              
              const defaultRow = priceSections.find(s => s.id === section.id)?.rows.find(r => r.id === row.id);
              const headers = row.complexHeaders || defaultRow?.complexHeaders || [];
              const subHeaders = row.complexSubHeaders || defaultRow?.complexSubHeaders || [];
              const subRows = row.rows || [];

              return (
                <React.Fragment key={row.id || idx}>
                  {!hasComplex && (
                    <tr className={idx % 2 === 1 ? 'pt-row-odd' : ''}>
                      <td className="pt-cell-name">
                        <div className="pt-name-with-btn">
                          <span style={{ fontWeight: 700 }}>{row.name}</span>
                        </div>
                      </td>
                      <td className="pt-cell-center">{row.price}</td>
                      <td className="pt-cell-center">{row.unit}</td>
                      <td className="pt-cell-note">{row.note}</td>
                    </tr>
                  )}
                  {hasComplex ? (
                    <tr className="pt-sub-row">
                      <td colSpan={4}>
                        <div className="pt-sub-table-wrapper" style={{ padding: '0 0 20px 0' }}>
                          <table className="pt-sub-table complex">
                            <thead>
                              <tr>
                                {headers.map((h, i) => (
                                  <td key={i} rowSpan={h.rowspan} colSpan={h.colspan}>{h.label}</td>
                                ))}
                              </tr>
                              <tr>
                                {subHeaders.filter(h => h.colspan).map((h, i) => (
                                  <td key={i} colSpan={h.colspan} style={{ textAlign: 'center' }}>{h.label}</td>
                                ))}
                              </tr>
                              <tr>
                                {subHeaders.filter(h => h.isUnit).map((h, i) => (
                                  <td key={i} style={{ textAlign: 'center' }}>{h.label}</td>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {subRows.map((sr, i) => (
                                sr.isGroup ? (
                                  <tr key={i} className="pt-sub-group-header">
                                    <td colSpan={7}>{sr.label}</td>
                                  </tr>
                                ) : (
                                  <tr key={i}>
                                    <td style={{ textAlign: 'center' }}>{sr.n}</td>
                                    <td>{sr.name}</td>
                                    <td style={{ textAlign: 'center' }}>{sr.count}</td>
                                    <td style={{ textAlign: 'center' }}>{sr.s_m3}р.</td>
                                    <td style={{ textAlign: 'center' }}>{sr.s_p}р.</td>
                                    <td style={{ textAlign: 'center' }}>{sr.l_m3}р.</td>
                                    <td style={{ textAlign: 'center' }}>{sr.l_p}р.</td>
                                  </tr>
                                )
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  ) : row.hasSubTable ? (
                    <tr className="pt-sub-row">
                      <td colSpan={4}>
                        <div className="pt-sub-table-wrapper">
                          <table className="pt-sub-table">
                            <thead>
                              <tr>
                                {row.subTableHeaders.map((h, i) => <td key={i}>{h}</td>)}
                              </tr>
                            </thead>
                            <tbody>
                              {row.subTableRows.map((sr, i) => (
                                sr.isHeader ? (
                                  <tr key={i} className="pt-sub-group-header">
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
                  ) : null}
                </React.Fragment>
              );
            })}
          </tbody>
      </table>
    </div>
      {section.footnotes && section.footnotes.length > 0 && (
        <div className="pt-footnotes">
          {section.footnotes.map((fn, i) => (
            <p key={i} className="pt-footnote">{fn}</p>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── PriceView ───────────────────────────────────────────── */
const PriceView = ({ onBack, priceData, priceHeader, initialSectionId }) => {
  useEffect(() => {
    if (initialSectionId) {
      setTimeout(() => {
        const el = document.getElementById(`price-section-${initialSectionId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, [initialSectionId]);

  const sectionsToRender = (priceData && priceData.length > 0) ? priceData : priceSections;

  const hDate  = priceHeader?.date  || PRICE_DATE;
  const hZone  = priceHeader?.zone  || PRICE_DELIVERY_ZONE;
  const hZone2 = priceHeader?.zone2 || PRICE_DELIVERY_ZONE2;
  const hNotes = Array.isArray(priceHeader?.notes) ? priceHeader.notes : (Array.isArray(PRICE_DELIVERY_NOTES) ? PRICE_DELIVERY_NOTES : []);

  return (
    <div className="price-view container">
      <button className="btn-back" onClick={onBack}>
        <SvgIcon path={BACK_ICON} /> Назад на главную
      </button>

      {/* ── Шапка прайса ── */}
      <div className="price-classic-header">
        <h1>Прайс</h1>
        <div className="price-classic-divider" />
        <p className="price-classic-date">от {hDate} г.</p>
        <p className="price-classic-zone">{hZone}</p>
        <p className="price-classic-zone">{hZone2}</p>
        {hNotes.map((note, i) => (
          <p key={i} className="price-classic-note">{note}</p>
        ))}
        <div className="price-classic-divider" />
      </div>

      {/* ── Таблицы ── */}
      <div className="price-tables-list">
        {sectionsToRender.filter(s => s && s.id).map((section, idx) => {
          try {
            const isDelivery = section.type === 'delivery' || 
                             ['materials', 'sand', 'gravel', 'soil', 'coal', 'firewood'].includes(section.id);
            if (isDelivery) {
              return <DeliveryTable key={section.id || idx} section={section} />;
            }
            return <SimpleTable key={section.id || idx} section={section} />;
          } catch (err) {
            console.error("Error rendering section:", section.id, err);
            return <div key={idx} className="error-note">Ошибка загрузки раздела {section.title}</div>;
          }
        })}
      </div>

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
      <div className="contacts-left">
        <div className="contact-card">
          <div className="contact-card-icon"><SvgIcon path={PHONE_ICON} /></div>
          <div>
            <div className="contact-card-label">Звонки и заказы</div>
            <a href={`tel:${PHONE_PRIMARY}`} className="contact-phone-big">{PHONE_PRIMARY_DISPLAY}</a>
            <a href={`tel:${PHONE_SECONDARY}`} className="contact-phone-big">{PHONE_SECONDARY_DISPLAY}</a>
          </div>
        </div>
        <div className="contact-card">
          <div className="contact-card-icon"><SvgIcon path={MAIL_ICON} /></div>
          <div>
            <div className="contact-card-label">Электронная почта</div>
            <a href={`mailto:${EMAIL}`} className="contact-link">{EMAIL}</a>
          </div>
        </div>
        <div className="contact-card">
          <div className="contact-card-icon"><SvgIcon path={CLOCK_ICON} /></div>
          <div>
            <div className="contact-card-label">Режим работы</div>
            <p className="contact-info">Пн–Сб: 8:00 — 17:00</p>
            <p className="contact-info-sub">Воскресенье — выходной</p>
          </div>
        </div>
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
        <div className="contact-card">
          <div className="contact-card-icon"><SvgIcon path={TRUCK_ICON} /></div>
          <div>
            <div className="contact-card-label">Самовывоз и доставка</div>
            <p className="contact-info">Самовывоз с нашего склада</p>
            <p className="contact-info">Доставка по Хабаровску и краю</p>
          </div>
        </div>
        <a href={MAX_LINK} target="_blank" rel="noreferrer" className="btn-primary contact-max-btn">
          <SvgIcon path={MSG_ICON} />
          Написать в MAX
        </a>
      </div>

      <div className="contacts-right">
        <div className="contacts-map-wrapper">
          <iframe
            title="Схема проезда"
            src="https://yandex.ru/map-widget/v1/?um=constructor%3A857c810fecec206f92bec2baa3de4c700c589a322008d5be4c279782707b281b&amp;source=constructor"
            width="100%"
            height="100%"
            frameBorder="0"
            allowFullScreen
            loading="lazy"
            className="contacts-map-iframe"
          />
        </div>
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
    desc: 'Собственная пилорама работает без выходных, обеспечивая стабильное качество и объемы продукции.',
    icon: FACTORY_ICON
  },
  {
    id: 'delivery',
    title: 'Попутная Доставка',
    desc: 'Доставляем пиломатериалы и сыпучие грузы собственными самосвалами по всему Хабаровску.',
    icon: TRUCK_ICON
  },
  {
    id: 'range',
    title: 'Для любых задач',
    desc: 'От горбыля для топки до первосортного бруса для строительства дома.',
    icon: 'M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16V8zM3.27 6.96L12 12.01l8.73-5.05M12 22V12'
  }
];

const HomeView = ({ categories, onSelectCategory, onPriceClick }) => {
  const primaryCat    = categories.find(c => c.isPrimary);
  const secondaryCats = categories.filter(c => !c.isPrimary);

  return (
    <>
      <section className="hero">
        <img src="bg_hero_lumber.png" alt="Производство пиломатериалов" className="hero-bg" onError={handleImgError} />
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
            <img src={primaryCat.img} alt={primaryCat.title} loading="lazy" onError={handleImgError} />
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
              <img src={cat.img} alt={cat.title} className="card-img" loading="lazy" onError={handleImgError} />
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
const CategoryDetail = ({ category, onBack, onPriceClick }) => {
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
        <h2 
          className="cd-price-title-link"
          onClick={onPriceClick}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
          title="Открыть полный прайс-лист"
        >
          Каталог и Цены <span style={{ fontSize: '0.8em', opacity: 0.7 }}>→</span>
        </h2>
        {category.priceNote && (
          <p className="cd-price-note">{category.priceNote}</p>
        )}
        <div className="price-list-vertical">
          {category.prices.map(item => (
            <div 
              key={item.id} 
              className="price-list-item" 
              onClick={() => onPriceClick(category.id)} 
              style={{ cursor: 'pointer' }}
              title={`Нажмите, чтобы увидеть цены на ${item.name} в прайс-листе`}
            >
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
  const [priceHeader, setPriceHeader]       = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState(null);

  const fetchSiteData = async () => {
    const { data, error } = await supabase.from('site_content').select('*');
    if (data && !error) {
      const cat = data.find(d => d.key === 'categories');
      const prc = data.find(d => d.key === 'prices');
      const hdr = data.find(d => d.key === 'price_header');

      if (cat && cat.content) {
        const sanitized = JSON.parse(JSON.stringify(cat.content).replace(/\"img\":\"\//g, '"img":"'));
        setSiteCategories(sanitized);
      }

      if (prc && Array.isArray(prc.content)) {
        const mergedPrices = priceSections.map(defaultSec => {
          const dbSec = prc.content.find(s => s.id === defaultSec.id);
          if (!dbSec) return defaultSec;
          
          const mergedRows = defaultSec.rows.map(defaultRow => {
            const dbRow = dbSec.rows?.find(r => r.id === defaultRow.id);
            if (!dbRow) return defaultRow;
            
            return {
              ...defaultRow,
              ...dbRow,
              complexHeaders: dbRow.complexHeaders || defaultRow.complexHeaders,
              complexSubHeaders: dbRow.complexSubHeaders || defaultRow.complexSubHeaders,
              hasComplexTable: dbRow.hasComplexTable !== undefined ? dbRow.hasComplexTable : defaultRow.hasComplexTable
            };
          });

          return { ...defaultSec, ...dbSec, rows: mergedRows };
        });
        setSitePrices(mergedPrices);
      }

      if (hdr && hdr.content) setPriceHeader(hdr.content);
    }
  };

  useEffect(() => {
    fetchSiteData();
  }, []);

  useEffect(() => {
    if (!showAdmin) {
      fetchSiteData();
    }
  }, [showAdmin]);

  const [masterAccess, setMasterAccess] = useState(false);

  // Robust initial check for secret access
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('access') === 'ustroy_access_7k2m9p_admin') {
      setMasterAccess(true);
      setShowAdmin(true);
      if (window.location.hash !== '#admin') {
        window.location.hash = 'admin';
      }
    }
  }, []);

  useEffect(() => {
    const handleHash = () => {
      const h = window.location.hash;
      const params = new URLSearchParams(window.location.search);
      const isMaster = params.get('access') === 'ustroy_access_7k2m9p_admin';

      if (h === '#admin' || isMaster || masterAccess) {
        if (isMaster) setMasterAccess(true);
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
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, [siteCategories, masterAccess]);

  const handleSelectCategory = (cat) => {
    setActiveCategory(cat);
    setShowPrice(false);
    setShowAdmin(false);
    window.location.hash = `category-${cat.id}`;
  };

  const handleShowPrice = (sectionId) => {
    setSelectedSectionId(typeof sectionId === 'string' ? sectionId : null);
    setShowPrice(true);
    setActiveCategory(null);
    setShowAdmin(false);
    window.location.hash = 'price';
    if (!sectionId) window.scrollTo(0, 0);
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
    return (
      <AdminPanel 
        masterAccess={masterAccess} 
        onExit={() => { 
          window.location.hash = ''; 
          setShowAdmin(false); 
          setMasterAccess(false);
        }} 
      />
    );
  }

  const isHome = !activeCategory && !showPrice && !showAdmin;

  return (
    <>
      <Header onLogoClick={handleLogoClick} onPriceClick={handleShowPrice} />

      <main>
        {showPrice ? (
          <PriceView 
            onBack={handleBack} 
            priceData={sitePrices} 
            priceHeader={priceHeader} 
            initialSectionId={selectedSectionId} 
          />
        ) : activeCategory ? (
          <CategoryDetail category={activeCategory} onBack={handleBack} onPriceClick={handleShowPrice} />
        ) : (
          <HomeView
            categories={siteCategories}
            onSelectCategory={handleSelectCategory}
            onPriceClick={handleShowPrice}
          />
        )}
      </main>

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
