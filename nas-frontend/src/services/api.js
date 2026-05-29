import axios from "axios"

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  withCredentials: true,
})

function getCSRFToken() {

  const cookies = document.cookie.split(";")

  for (let cookie of cookies) {

    cookie = cookie.trim()

    if (cookie.startsWith("csrftoken=")) {

      return cookie.substring("csrftoken=".length)
    }
  }

  return null
}

api.interceptors.request.use((config) => {

  const csrfToken = getCSRFToken()

  if (csrfToken) {

    config.headers["X-CSRFToken"] = csrfToken
  }

  return config
})

export default api