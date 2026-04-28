import React, { useEffect } from 'react';
import SvgIcon, { MSG_ICON, BACK_ICON, handleImgError } from './SvgIcon';
import { PHONE_PRIMARY_DISPLAY, MAX_LINK } from '../data/categories';

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

export default CategoryDetail;
