import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import toast from "react-hot-toast"
import { Header } from "../components/Header"
import { api, carImage, carName, daysBetween, formatPrice, readUser } from "../api"

export function Booking() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = readUser()
  const [car, setCar] = useState(null)
  const [periods, setPeriods] = useState([])

  useEffect(() => {
    if (!user) navigate("/login")
    api("/cars/" + id).then(setCar).catch(() => toast.error("Машина не найдена"))
    api("/cars/" + id + "/availability")
      .then((data) => setPeriods(data.unavailable_periods || []))
      .catch(() => setPeriods([]))
  }, [id])

  if (!car) return <><Header /><main className="page"><p>Загрузка…</p></main></>

  async function onSubmit(event) {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.target))
    if (daysBetween(data.start, data.end) < 1) {
      toast.error("Проверьте даты")
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
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <>
      <Header />
      <main className="page">
        <p className="eyebrow">Заявка</p>
        <h1>Оформление бронирования</h1>
        <p className="lead">Стоимость считает сервер. После отправки заявка держит машину 15 минут.</p>
        <section className="split">
          <form className="panel" onSubmit={onSubmit}>
            <h2>Даты</h2>
            <div className="two">
              <label>Начало<input name="start" type="date" required /></label>
              <label>Конец<input name="end" type="date" required /></label>
            </div>
            <p className="spec">Водитель: {user?.name} {user?.surname}</p>
            <p className="spec">{user?.phone}</p>
            <button className="btn">Подтвердить</button>
          </form>
          <article className="panel summary">
            <img src={carImage(car)} alt={carName(car)} />
            <h2>{carName(car)}</h2>
            <p className="price">{formatPrice(car.price_per_day)} / сутки</p>
            <h3>Уже занято</h3>
            {periods.length === 0 && <p className="spec">Свободных ограничений нет.</p>}
            {periods.map((period) => <p key={period.start_date}>{period.start_date} — {period.end_date}</p>)}
            <Link to={"/cars/" + car.car_id}>К машине</Link>
          </article>
        </section>
      </main>
    </>
  )
}