/**
 * Сервис для работы с данными через GitHub API
 */

const REPO_OWNER = 'pepsicolausagpt';
const REPO_NAME = 'ustoydv';
const DB_PATH = 'public/data/db.json';
const UPLOADS_PATH = 'public/images/uploads';

/**
 * Получение токена из localStorage
 */
export const getGithubToken = () => {
  return localStorage.getItem('github_token');
};

/**
 * Сохранение токена
 */
export const setGithubToken = (token) => {
  if (token) {
    localStorage.setItem('github_token', token);
  } else {
    localStorage.removeItem('github_token');
  }
};

/**
 * Загрузка данных (чтение db.json)
 */
export const fetchDb = async () => {
  try {
    // Пытаемся загрузить с cache-busting, чтобы всегда видеть свежие данные
    const response = await fetch(`${window.location.origin}${window.location.pathname.replace(/\/$/, '')}/data/db.json?t=${Date.now()}`);
    if (!response.ok) throw new Error('Ошибка загрузки db.json');
    return await response.json();
  } catch (err) {
    console.error('Fetch DB error:', err);
    throw err;
  }
};

/**
 * Получение актуального SHA файла (без кеширования)
 */
const fetchCurrentSha = async (url, token) => {
  const resp = await fetch(`${url}?ref=main&t=${Date.now()}`, {
    headers: {
      'Authorization': `token ${token}`,
      'Cache-Control': 'no-cache, no-store',
      'Pragma': 'no-cache',
      'If-None-Match': '',
    }
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  return data.sha;
};

/**
 * Сохранение данных в GitHub
 */
export const saveToGithub = async (content) => {
  const token = getGithubToken();
  if (!token) throw new Error('GitHub Token не найден. Пожалуйста, авторизуйтесь.');

  const path = DB_PATH;
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));

  const attempt = async () => {
    const sha = await fetchCurrentSha(url, token);

    const updateResponse = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Update data: ${new Date().toLocaleString()}`,
        content: encoded,
        sha: sha,
        branch: 'main'
      })
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(errorData.message || 'Ошибка сохранения в GitHub');
    }
    return await updateResponse.json();
  };

  try {
    return await attempt();
  } catch (err) {
    if (err.message && err.message.includes('does not match')) {
      return await attempt();
    }
    throw err;
  }
};

/**
 * Загрузка изображения в GitHub
 */
export const uploadImageToGithub = async (file) => {
  const token = getGithubToken();
  if (!token) throw new Error('GitHub Token не найден');

  const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
  const path = `${UPLOADS_PATH}/${fileName}`;
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;

  // Читаем файл как base64
  const reader = new FileReader();
  const base64Promise = new Promise((resolve, reject) => {
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
  });
  reader.readAsDataURL(file);
  const base64Content = await base64Promise;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Upload image: ${fileName}`,
      content: base64Content,
      branch: 'main'
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Ошибка загрузки изображения');
  }

  const result = await response.json();
  
  // Возвращаем путь, который будет работать на GitHub Pages
  // Используем относительный путь для гибкости
  return `images/uploads/${fileName}`;
};

/**
 * Проверка валидности токена
 */
export const validateGithubToken = async (token) => {
  const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`, {
    headers: { 'Authorization': `token ${token}` }
  });
  return response.ok;
};
