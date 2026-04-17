// API Configuration
const getBasePath = () => {
    const hostname = window.location.hostname;
    const path = window.location.pathname;
    const port = window.location.port;

    // If running via php artisan serve (port 8000)
    if (port === '8000') return '';

    // If running on production domain
    if (hostname.includes('.') && !hostname.includes('localhost')) return '';

    // For Laragon/Apache: Extract the base path (e.g., /payment-app/public)
    const match = path.match(/^(\/[^\/]+\/public)/i);
    if (match) return match[1];

    return '';
};

export const API_BASE = `${getBasePath()}/api`;
export const APP_BASE = getBasePath();

/**
 * Fetch with auth token
 */
export const authFetch = async (url, options = {}) => {
    const token = localStorage.getItem('auth_token');

    const headers = {
        'Accept': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Add Content-Type for JSON body (but not for FormData)
    if (options.body && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    // Handle 401 - redirect to login
    if (response.status === 401) {
        localStorage.removeItem('auth_token');
        window.location.href = `${APP_BASE}/login`;
    }

    return response;
};
