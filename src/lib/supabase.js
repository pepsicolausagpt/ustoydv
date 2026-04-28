import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mcxhucgarmmvwdgqgdxb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_F-ClcxM7_GSuDHfIgxTTvg_SB2q73_b';

// Ссылка на ваш Google Script Proxy (теперь используется только если включен режим прокси)
const DEFAULT_PROXY_URL = 'https://script.google.com/macros/s/AKfycbzENk9aNITI9xK_M6Q_rZb0RdOv9tTWkQq5jK-VyHPDTYSnfZBeQivvboNVq60g1N4SEw/exec';

// Прокси активен только если:
// 1. Пользователь сохранил свой URL в localStorage
// 2. В URL страницы есть флаг ?proxy=true (для тестирования)
const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
const PROXY_URL = typeof window !== 'undefined' ? (localStorage.getItem('supabase_proxy') || (params?.get('proxy') === 'true' ? DEFAULT_PROXY_URL : null)) : null;

/**
 * Кастомный fetch для перенаправления запросов через Google Apps Script Proxy.
 */
const customFetch = async (url, options = {}) => {
  // Если прокси не настроен, используем обычный fetch
  if (!PROXY_URL) return fetch(url, options);

  try {
    const urlObj = new URL(url);
    // Для прокси нам нужен полный путь с параметрами
    const path = urlObj.pathname + urlObj.search;
    
    let token = '';
    if (options.headers) {
      const auth = options.headers['Authorization'] || options.headers['authorization'];
      if (auth && auth.startsWith('Bearer ')) {
        token = auth.substring(7);
      }
    }

    const proxyUrl = new URL(PROXY_URL);
    proxyUrl.searchParams.set('path', path);
    if (token) {
      proxyUrl.searchParams.set('token', token);
    }

    // ВАЖНО: Google Apps Script не поддерживает OPTIONS запросы (CORS preflight).
    // Чтобы избежать ошибки, мы НЕ передаем кастомные заголовки (apikey, Authorization) в fetch.
    // Ваш скрипт Google Script сам подставит нужные заголовки при запросе к Supabase.
    const proxyOptions = {
      method: options.method || 'GET',
      // Оставляем body если это POST/PUT
      body: options.body
    };

    // Если есть тело запроса, указываем тип контента, который не триггерит OPTIONS (если возможно)
    // Но для Supabase JSON обязателен, поэтому просто надеемся на отсутствие заголовков apikey/auth
    if (options.body) {
      proxyOptions.headers = {
        'Content-Type': 'text/plain', // Используем text/plain чтобы избежать CORS preflight для JSON
      };
    }

    return fetch(proxyUrl.toString(), proxyOptions);
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
