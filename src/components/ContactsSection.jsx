import React from 'react';
import SvgIcon, { PHONE_ICON, MSG_ICON, CLOCK_ICON, MAP_ICON, TRUCK_ICON, FACTORY_ICON } from './SvgIcon';
import {
  PHONE_PRIMARY, PHONE_PRIMARY_DISPLAY,
  PHONE_SECONDARY, PHONE_SECONDARY_DISPLAY,
  EMAIL, MAX_LINK
} from '../data/categories';

const MAIL_ICON = 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6';

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

export default ContactsSection;
