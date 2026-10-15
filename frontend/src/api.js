export async function api(path, method = "GET", body) {
  const response = await fetch("/api" + path, {
    method,
    credentials: "include",
    ...(body === undefined
      ? {}
      : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  })
  if (response.status === 204) return null
  const text = await response.text()
  let payload = null
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    payload = null
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
  return [car.brand, car.model].filter(Boolean).join(" ")
}

export function carImage(car) {
  return car.image_url || "/photos/eclass.jpg"
}

export function formatPrice(value) {
  return new Intl.NumberFormat("ru-RU").format(value || 0) + " ₽"
}

export function readUser() {
  return JSON.parse(localStorage.getItem("vela-user") || "null")
}

export function saveUser(user) {
  localStorage.setItem("vela-user", JSON.stringify(user))
}

export function clearUser() {
  localStorage.removeItem("vela-user")
}

export function readOrders() {
  return JSON.parse(localStorage.getItem("vela-orders") || "[]")
}

export function daysBetween(start, end) {
  return Math.round((new Date(end) - new Date(start)) / 86400000)
}
