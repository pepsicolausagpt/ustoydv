import React from 'react';
import SvgIcon, { TABLE_ICON, FACTORY_ICON, TRUCK_ICON, handleImgError } from './SvgIcon';
import ContactsSection from './ContactsSection';

const CUBE_ICON = 'M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16V8zM3.27 6.96L12 12.01l8.73-5.05M12 22V12';

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
    icon: CUBE_ICON
  }
];

const HomeView = ({ categories, onSelectCategory, onPriceClick }) => {
  const primaryCat    = categories.find(c => c.isPrimary);
  const secondaryCats = categories.filter(c => !c.isPrimary && c.enabled !== false);

  return (
    <>
      <section className="hero">
        <img src="bg_hero_lumber.jpg" alt="Производство пиломатериалов" className="hero-bg" onError={handleImgError} />
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

export default HomeView;
