import axios from 'axios'
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL, withCredentials: false })
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('an_access_token')
  if (token) config.headers.Authorization = 'Bearer ' + token
  return config
})
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('an_access_token')
      sessionStorage.removeItem('an_user')
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }
    return Promise.reject(error)
  }
)
export default api
