import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mcxhucgarmmvwdgqgdxb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_F-ClcxM7_GSuDHfIgxTTvg_SB2q73_b';

// Получаем URL прокси из localStorage или используем системный по умолчанию
const DEFAULT_PROXY_URL = 'https://script.google.com/macros/s/AKfycbzENk9aNITI9xK_M6Q_rZb0RdOv9tTWkQq5jK-VyHPDTYSnfZBeQivvboNVq60g1N4SEw/exec';
const PROXY_URL = typeof window !== 'undefined' ? (localStorage.getItem('supabase_proxy') || DEFAULT_PROXY_URL) : DEFAULT_PROXY_URL;

/**
 * Кастомный fetch для перенаправления запросов через Google Apps Script Proxy.
 * Это необходимо для обхода блокировок Supabase в некоторых сетях.
 */
const customFetch = async (url, options = {}) => {
  if (!PROXY_URL) return fetch(url, options);

  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname + urlObj.search;
    
    // Извлекаем токен из заголовков для передачи в параметре (как ждет скрипт)
    let token = '';
    if (options.headers) {
      const auth = options.headers['Authorization'] || options.headers['authorization'];
      if (auth && auth.startsWith('Bearer ')) {
        token = auth.substring(7);
      }
    }

    // Формируем URL прокси
    const proxyUrl = new URL(PROXY_URL);
    proxyUrl.searchParams.set('path', path);
    if (token) {
      proxyUrl.searchParams.set('token', token);
    }

    // Выполняем запрос через прокси
    return fetch(proxyUrl.toString(), options);
  } catch (err) {
    console.error('Proxy Fetch Error:', err);
    return fetch(url, options);
  }
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    fetch: customFetch
  }
});

/**
 * Утилита для установки прокси и обновления приложения
 */
export const setSupabaseProxy = (url) => {
  if (url && url.trim()) {
    localStorage.setItem('supabase_proxy', url.trim());
  } else {
    localStorage.removeItem('supabase_proxy');
  }
  window.location.reload();
};
