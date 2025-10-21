const BASE_URL = 'http://localhost:8080';

export async function authFetch(endpoint, options = {}) {
  try {

    let headers = options.headers || {};
    // Only set Content-Type to application/json if body is not FormData
    if (!(options.body instanceof FormData)) {
      headers = { 'Content-Type': 'application/json', ...headers };
    }
    
    const res = await fetch(BASE_URL + endpoint, {
      ...options,
      headers
    });
    return res;
  } catch (err) {
    throw new Error('Network error');
  }

}