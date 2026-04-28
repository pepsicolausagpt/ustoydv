import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mcxhucgarmmvwdgqgdxb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_F-ClcxM7_GSuDHfIgxTTvg_SB2q73_b';

// Ссылка на ваш Google Script Proxy (теперь используется только если включен режим прокси)
const DEFAULT_PROXY_URL = 'https://script.google.com/macros/s/AKfycbwAlKxDIShPTiubJbp-2jcHcADb_XkcSqRLmvMMGOajxzcHbcSPoSiU6R54WW-7cfWiwQ/exec';

// Прокси активен только если:
// 1. Пользователь сохранил свой URL в localStorage
// 2. В URL страницы есть флаг ?proxy=true (для тестирования)
const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
const PROXY_URL = typeof window !== 'undefined' 
  ? (localStorage.getItem('supabase_proxy') || DEFAULT_PROXY_URL) 
  : null;

if (PROXY_URL) {
  console.log('Supabase Proxy Active:', PROXY_URL);
}

/**
 * Кастомный fetch для перенаправления запросов через Google Apps Script Proxy.
 */
const customFetch = async (url, options = {}) => {
  if (!PROXY_URL) return fetch(url, options);

  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname + urlObj.search;
    
    let token = '';
    let apiKey = SUPABASE_ANON_KEY;
    let prefer = '';

    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        const lowerKey = key.toLowerCase();
        if (lowerKey === 'authorization' && value.startsWith('Bearer ')) {
          token = value.substring(7);
        } else if (lowerKey === 'apikey') {
          apiKey = value;
        } else if (lowerKey === 'prefer') {
          prefer = value;
        }
      });
    }

    const proxyUrl = new URL(PROXY_URL);
    proxyUrl.searchParams.set('path', path);
    proxyUrl.searchParams.set('method', options.method || 'GET');
    proxyUrl.searchParams.set('apiKey', apiKey);
    if (token) proxyUrl.searchParams.set('token', token);
    if (prefer) proxyUrl.searchParams.set('prefer', prefer);

    const proxyOptions = {
      method: 'POST', // Always use POST to the proxy to avoid GET length limits and handle bodies
      body: options.body
    };

    if (options.body) {
      proxyOptions.headers = {
        'Content-Type': 'text/plain', // Simple request to avoid CORS preflight
      };
    }

    const response = await fetch(proxyUrl.toString(), proxyOptions);
    
    // GAS might return a 200 even for errors, so we'll just return the response as is
    // and let supabase-js handle the status code in the body if the proxy is transparent.
    return response;
  } catch (err) {
    console.error('Proxy Fetch Error:', err);
    // If proxy fails, try direct fetch as fallback (might be blocked, but better than nothing)
    return fetch(url, options);
  }
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    fetch: customFetch
  }
});

/**
 * Тестирование соединения через прокси
 */
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('site_content').select('key').limit(1);
    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

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
