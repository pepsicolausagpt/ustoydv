import React, { useEffect } from 'react';
import SvgIcon, { MSG_ICON, BACK_ICON } from './SvgIcon';
import { MAX_LINK } from '../data/categories';
import {
  priceSections,
  PRICE_DATE,
  PRICE_DELIVERY_ZONE,
  PRICE_DELIVERY_ZONE2,
  PRICE_DELIVERY_NOTES
} from '../data/priceTable';

const DeliveryTable = ({ section }) => {
  if (!section) return null;
  
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
            {section.deliverySubLabel && (
              <tr>
                <td colSpan={numDeliveryCols} className="pt-h-delivery-sub">
                  {section.deliverySubLabel}
                </td>
              </tr>
            )}
            {volumes.length > 0 && (
              <tr>
                {weights.map((w, i) => (
                  <td key={i} className="pt-h-weight">{w}</td>
                ))}
              </tr>
            )}
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

const SimpleTable = ({ section }) => {
  if (!section || !section.rows) return null;
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

export default PriceView;
