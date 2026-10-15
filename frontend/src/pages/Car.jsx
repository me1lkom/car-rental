import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Pagination } from "swiper/modules"
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"
import { Header } from "../components/Header"
import { api, carImage, carName, formatPrice } from "../api"

export function Car() {
  const { id } = useParams()
  const [car, setCar] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    api("/cars/" + id).then(setCar).catch((err) => setError(err.message))
  }, [id])

  if (error) {
    return <><Header /><main className="page"><h1>{error}</h1></main></>
  }
  if (!car) return <><Header /><main className="page"><p>Загрузка…</p></main></>

  const photos = [carImage(car), "/photos/interior.jpg"]
  return (
    <>
      <Header />
      <main className="page">
        <p className="eyebrow">Автопарк / {carName(car)}</p>
        <section className="split">
          <Swiper className="gallery" modules={[Navigation, Pagination]} navigation pagination>
            {photos.map((src) => (
              <SwiperSlide key={src}><img className="side-photo" src={src} alt={carName(car)} /></SwiperSlide>
            ))}
          </Swiper>
          <article className="panel">
            <p className="tag">{car.status}</p>
            <h1>{carName(car)}</h1>
            <p className="spec">{car.year} · {car.license_plate}</p>
            <p>{car.description}</p>
            <p className="price">{formatPrice(car.price_per_day)} / день</p>
            <Link className="btn" to={"/booking/" + car.car_id}>Забронировать</Link>
          </article>
        </section>
      </main>
    </>
  )
}
