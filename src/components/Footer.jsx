import React from 'react';
import {
  PHONE_PRIMARY, PHONE_PRIMARY_DISPLAY,
  PHONE_SECONDARY, PHONE_SECONDARY_DISPLAY,
  EMAIL
} from '../data/categories';

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

export default Footer;
