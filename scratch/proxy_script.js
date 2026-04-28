/**
 * Google Apps Script Proxy for Supabase
 * Handles CORS and redirects requests to Supabase from regions where it might be blocked.
 */

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const SUPABASE_URL = 'https://mcxhucgarmmvwdgqgdxb.supabase.co';
  
  // Extract parameters from query string
  const path = e.parameter.path || '';
  const method = e.parameter.method || 'GET';
  const apiKey = e.parameter.apiKey || '';
  const token = e.parameter.token || '';
  const prefer = e.parameter.prefer || '';

  const url = SUPABASE_URL + path;
  
  const headers = {
    'apikey': apiKey,
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }
  
  if (prefer) {
    headers['Prefer'] = prefer;
  }

  const options = {
    method: method,
    headers: headers,
    muteHttpExceptions: true
  };

  if (method !== 'GET' && method !== 'HEAD' && e.postData && e.postData.contents) {
    options.payload = e.postData.contents;
  }

  try {
    const response = UrlFetchApp.fetch(url, options);
    const content = response.getContentText();
    const statusCode = response.getResponseCode();
    
    return ContentService.createTextOutput(content)
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
