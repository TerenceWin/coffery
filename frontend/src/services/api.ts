import axios from 'axios'

const api = axios.create({
  baseURL: 'https://coffery.onrender.com',
  // withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    const isLoginRequest = err.config?.url?.includes('/auth/login')
    if (err.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token')
      localStorage.removeItem('hanaCoffeeSession')
      window.location.href = '/'
    }
    return Promise.reject(err)
  },
)

export default api