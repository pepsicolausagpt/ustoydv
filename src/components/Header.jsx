import React from 'react';
import SvgIcon, { PHONE_ICON } from './SvgIcon';
import {
  PHONE_PRIMARY, PHONE_PRIMARY_DISPLAY,
  PHONE_SECONDARY, PHONE_SECONDARY_DISPLAY
} from '../data/categories';

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

export default Header;
