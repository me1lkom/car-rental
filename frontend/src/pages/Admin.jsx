import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import { Header } from "../components/Header"
import { api, canManage, carName, formatDate, formatPrice, rentalStatus } from "../api"

const emptyCar = {
  license_plate: "", brand: "", model: "", year: 2024, image_url: "", description: "",
  price_per_day: 5000, status: "available", body_type_id: "", drive_type_id: "",
  rental_class_id: "", transmission_id: "", fuel_type_id: "", seats: 5, doors: 4,
}

export function Admin() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [cars, setCars] = useState([])
  const [rentals, setRentals] = useState([])
  const [users, setUsers] = useState([])
  const [attrs, setAttrs] = useState(null)
  const [form, setForm] = useState(emptyCar)
  const [tab, setTab] = useState("cars")

  function load() {
    api("/cars").then(setCars).catch((error) => toast.error(error.message))
    api("/rentals").then((data) => setRentals(data.items || [])).catch(() => setRentals([]))
    if (user?.role === "admin") api("/users").then(setUsers).catch(() => setUsers([]))
  }

  useEffect(() => {
    api("/auth/me")
      .then((profile) => {
        if (!canManage(profile)) {
          toast.error("Недостаточно прав")
          navigate("/")
          return
        }
        setUser(profile)
      })
      .catch(() => navigate("/login"))
    api("/cars/car-attributes").then(setAttrs).catch(() => setAttrs(null))
  }, [])

  useEffect(() => {
    if (user) load()
  }, [user])

  function update(event) {
    const { name, value } = event.target
    const numeric = ["year", "price_per_day", "seats", "doors", "body_type_id", "drive_type_id", "rental_class_id", "transmission_id", "fuel_type_id"]
    setForm((current) => ({ ...current, [name]: numeric.includes(name) ? Number(value) : value }))
  }

  async function createCar(event) {
    event.preventDefault()
    try {
      await api("/cars", "POST", form)
      setForm(emptyCar)
      toast.success("Машина добавлена")
      load()
    } catch (error) {
      toast.error(error.message)
    }
  }

  async function setCarStatus(car, status) {
    try {
      await api("/cars/" + car.car_id, "PATCH", { status })
      load()
    } catch (error) {
      toast.error(error.message)
    }
  }

  async function act(path, okText) {
    try {
      await api(path, path.includes("/mock-payment") ? "POST" : "PATCH")
      if (okText) toast.success(okText)
      load()
    } catch (error) {
      toast.error(error.message)
    }
  }

  if (!user) return <><Header /><main className="page"><p>Загрузка…</p></main></>

  return (
    <>
      <Header />
      <main className="page cabinet">
        <aside className="panel side">
          <h2>{user.role === "admin" ? "Админ" : "Менеджер"}</h2>
          <nav>
            <button className={tab === "cars" ? "on" : ""} onClick={() => setTab("cars")}>Машины</button>
            <button className={tab === "rentals" ? "on" : ""} onClick={() => setTab("rentals")}>Заявки</button>
            {user.role === "admin" && <button className={tab === "users" ? "on" : ""} onClick={() => setTab("users")}>Пользователи</button>}
          </nav>
        </aside>
        {tab === "cars" && (
          <section>
            <h1>Машины</h1>
            <form className="panel" onSubmit={createCar}>
              <div className="two">
                <label>Марка<input name="brand" value={form.brand} onChange={update} required /></label>
                <label>Модель<input name="model" value={form.model} onChange={update} required /></label>
              </div>
              <div className="two">
                <label>Номер<input name="license_plate" value={form.license_plate} onChange={update} required /></label>
                <label>Год<input name="year" type="number" value={form.year} onChange={update} required /></label>
              </div>
              <div className="two">
                <label>Цена<input name="price_per_day" type="number" value={form.price_per_day} onChange={update} required /></label>
                <label>Мест<input name="seats" type="number" value={form.seats} onChange={update} required /></label>
              </div>
              <div className="two">
                <label>Кузов<select name="body_type_id" value={form.body_type_id} onChange={update} required><option value="">Выберите</option>{attrs?.body_types?.map((item) => <option key={item.body_type_id} value={item.body_type_id}>{item.name}</option>)}</select></label>
                <label>Привод<select name="drive_type_id" value={form.drive_type_id} onChange={update} required><option value="">Выберите</option>{attrs?.drive_types?.map((item) => <option key={item.drive_type_id} value={item.drive_type_id}>{item.name}</option>)}</select></label>
              </div>
              <div className="two">
                <label>Класс<select name="rental_class_id" value={form.rental_class_id} onChange={update} required><option value="">Выберите</option>{attrs?.rental_classes?.map((item) => <option key={item.rental_class_id} value={item.rental_class_id}>{item.name}</option>)}</select></label>
                <label>Коробка<select name="transmission_id" value={form.transmission_id} onChange={update} required><option value="">Выберите</option>{attrs?.transmissions?.map((item) => <option key={item.transmission_id} value={item.transmission_id}>{item.name}</option>)}</select></label>
              </div>
              <label>Топливо<select name="fuel_type_id" value={form.fuel_type_id} onChange={update} required><option value="">Выберите</option>{attrs?.fuel_types?.map((item) => <option key={item.fuel_type_id} value={item.fuel_type_id}>{item.name}</option>)}</select></label>
              <label>Описание<input name="description" value={form.description} onChange={update} /></label>
              <button className="btn">Сохранить</button>
            </form>
            <div className="list">
              {cars.map((car) => (
                <article key={car.car_id} className="panel row">
                  <div>
                    <h3>{carName(car)}</h3>
                    <p className="spec">{formatPrice(car.price_per_day)} · {car.rental_class_name}</p>
                  </div>
                  <button className="btn btn-ghost" onClick={() => setCarStatus(car, "available")}>Свободна</button>
                  <button className="btn btn-ghost" onClick={() => setCarStatus(car, "unavailable")}>Занята</button>
                </article>
              ))}
            </div>
          </section>
        )}
        {tab === "rentals" && (
          <section>
            <h1>Заявки</h1>
            <div className="list">
              {rentals.map((rental) => (
                <article key={rental.rental_id} className="panel">
                  <p className="tag">VELA-{rental.rental_id}</p>
                  <h3>{carName(rental.car)} · {rental.user?.name}</h3>
                  <p>{formatDate(rental.start_date)} — {formatDate(rental.end_date)} · {formatPrice(rental.total_price)}</p>
                  <p className="spec">{rentalStatus(rental)}</p>
                  <div className="hero-actions">
                    <button className="btn btn-ghost" onClick={() => act("/rentals/" + rental.rental_id + "/confirm", "Подтверждена")}>Подтвердить</button>
                    <button className="btn btn-ghost" onClick={() => act("/rentals/" + rental.rental_id + "/reject", "Отклонена")}>Отклонить</button>
                    <button className="btn btn-ghost" onClick={() => act("/rentals/" + rental.rental_id + "/activate", "Начата")}>Начать</button>
                    <button className="btn btn-ghost" onClick={() => act("/rentals/" + rental.rental_id + "/complete", "Завершена")}>Завершить</button>
                    {user.role === "admin" && <button className="btn" onClick={() => act("/rentals/" + rental.rental_id + "/mock-payment", "Оплата отмечена")}>Оплата</button>}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
        {tab === "users" && user.role === "admin" && (
          <section>
            <h1>Пользователи</h1>
            <div className="list">
              {users.map((person) => (
                <article key={person.user_id} className="panel row">
                  <div>
                    <h3>{person.name} {person.surname}</h3>
                    <p className="spec">{person.email}</p>
                  </div>
                  {person.blocked_at
                    ? <button className="btn" onClick={() => act("/users/" + person.user_id + "/unblock", "Разблокирован")}>Разблокировать</button>
                    : <button className="btn btn-ghost" onClick={() => act("/users/" + person.user_id + "/block", "Заблокирован")}>Заблокировать</button>}
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  )
}