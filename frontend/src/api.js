const API = "/api"
let refreshInFlight = null

function isAuthPath(path) {
  return path === "/auth/login" || path === "/auth/registration" || path === "/auth/refresh" || path === "/auth/logout"
}

async function request(path, method, body) {
  const response = await fetch(API + path, {
    method,
    credentials: "include",
    ...(body === undefined
      ? {}
      : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  })
  if (response.status === 204) return { response, payload: null }
  const text = await response.text()
  let payload = null
  try { payload = text ? JSON.parse(text) : null } catch { payload = null }
  return { response, payload }
}

function refreshOnce() {
  if (!refreshInFlight) {
    refreshInFlight = request("/auth/refresh", "POST")
      .then(({ response }) => {
        if (!response.ok) throw new Error("Сессия истекла")
      })
      .finally(() => { refreshInFlight = null })
  }
  return refreshInFlight
}

export async function api(path, method = "GET", body, canRefresh = true) {
  const { response, payload } = await request(path, method, body)
  if (response.status === 401 && canRefresh && !isAuthPath(path)) {
    try {
      await refreshOnce()
      return api(path, method, body, false)
    } catch {
      clearUser()
      const error = new Error("Сессия истекла")
      error.status = 401
      throw error
    }
  }
  if (!response.ok) {
    const error = new Error(payload?.error || "Ошибка запроса")
    error.status = response.status
    error.details = payload?.details
    throw error
  }
  return payload
}

export function carName(car) {
  return [car?.brand, car?.model].filter(Boolean).join(" ")
}
export function carImage(car) {
  const url = car?.image_url || ""
  if (!url || url.includes("example.com")) return "/photos/eclass.jpg"
  return url
}
export function statusLabel(status) {
  if (status === "available") return "Свободна"
  if (status === "unavailable") return "Занята"
  if (status === "maintenance") return "На обслуживании"
  return status || "Статус не указан"
}
export function rentalStatus(rental) {
  return rental?.status_name || rental?.status_code || "Заявка"
}
export function formatPrice(value) {
  return new Intl.NumberFormat("ru-RU").format(value || 0) + " ₽"
}
export function daysBetween(start, end) {
  return Math.round((new Date(end) - new Date(start)) / 86400000) + 1
}
export function readUser() {
  return JSON.parse(localStorage.getItem("vela-user") || "null")
}
export function saveUser(user) {
  localStorage.setItem("vela-user", JSON.stringify(user))
  window.dispatchEvent(new Event("vela-user"))
}
export function clearUser() {
  localStorage.removeItem("vela-user")
  window.dispatchEvent(new Event("vela-user"))
}
export function canManage(user) {
  return user?.role === "manager" || user?.role === "admin"
}