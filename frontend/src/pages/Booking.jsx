import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import toast from "react-hot-toast"
import { Header } from "../components/Header"
import { PageState } from "../components/PageState"
import { DateFields } from "../components/DateFields"
import { api, carImage, carName, daysBetween, formatDate, formatPrice, translateError } from "../api"
import { useCar } from "../hooks/useCar"

export function Booking() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { car, periods, loading, error } = useCar(id)
  const [dateError, setDateError] = useState("")

  async function onSubmit(event) {
    event.preventDefault()
    setDateError("")
    const data = Object.fromEntries(new FormData(event.target))
    if (!data.start || !data.end) {
      setDateError("Укажите обе даты")
      return
    }
    if (daysBetween(data.start, data.end) < 1) {
      setDateError("Дата окончания должна быть не раньше даты начала")
      return
    }
    try {
      const rental = await api("/rentals", "POST", {
        car_id: Number(car.car_id),
        start_date: data.start,
        end_date: data.end,
      })
      toast.success("Заявка создана. Нужна предоплата в течение 15 минут")
      navigate("/done", { state: { rental, car } })
    } catch (err) {
      toast.error(translateError(err.message))
    }
  }

  return (
    <PageState loading={loading} error={error}>
      {car && (
        <>
          <Header />
          <main className="page">
            <p className="eyebrow">Заявка</p>
            <h1>Оформление бронирования</h1>
            <p className="lead">Стоимость считает сервер. После отправки заявка держит машину 15 минут.</p>
            <section className="split">
              <form className="panel" onSubmit={onSubmit}>
                <h2>Даты</h2>
                <DateFields />
                {dateError && <p className="error">{dateError}</p>}
                <p className="spec">Водитель: {JSON.parse(localStorage.getItem("vela-user") || "null")?.name} {JSON.parse(localStorage.getItem("vela-user") || "null")?.surname}</p>
                <p className="spec">{JSON.parse(localStorage.getItem("vela-user") || "null")?.phone}</p>
                <button className="btn">Подтвердить</button>
              </form>
              <article className="panel summary">
                <img src={carImage(car)} alt={carName(car)} />
                <h2>{carName(car)}</h2>
                <p className="price">{formatPrice(car.price_per_day)} / сутки</p>
                <h3>Уже занято</h3>
                {periods.length === 0 && <p className="spec">Свободных ограничений нет.</p>}
                {periods.map((period) => <p key={period.start_date}>{formatDate(period.start_date)} — {formatDate(period.end_date)}</p>)}
                <Link to={"/cars/" + car.car_id}>К машине</Link>
              </article>
            </section>
          </main>
        </>
      )}
    </PageState>
  )
}