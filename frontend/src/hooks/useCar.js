import { useEffect, useState } from "react"
import { api } from "../api"

export function useCar(id) {
  const [car, setCar] = useState(null)
  const [periods, setPeriods] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError("")
    api("/cars/" + id)
      .then((data) => {
        setCar(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.status === 404 ? "Машина не найдена" : "Не удалось загрузить машину")
        setLoading(false)
      })
    api("/cars/" + id + "/availability")
      .then((data) => setPeriods(data.unavailable_periods || []))
      .catch(() => setPeriods([]))
  }, [id])

  return { car, periods, loading, error }
}