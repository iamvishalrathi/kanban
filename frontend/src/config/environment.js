// Environment configuration
const config = {
  development: {
    API_BASE_URL: '/api',
    SOCKET_URL: 'http://localhost:3001',
    WS_ENABLED: true,
  },
  production: {
    API_BASE_URL: '/api',
    SOCKET_URL: 'https://your-render-app.onrender.com',
    WS_ENABLED: true,
  }
}

const environment = import.meta.env.MODE || 'development'

export default config[environment]