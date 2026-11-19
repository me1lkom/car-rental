import { Link } from "react-router-dom"
import { carImage, carName, formatPrice } from "../api"

export function CarCard({ car }) {
  return (
    <article className="card">
      <div className="photo">
        <img src={carImage(car)} alt={carName(car)} />
      </div>
      <div className="card-body">
        <h3>{carName(car)}</h3>
        <p className="spec">{car.year} · {car.body_type_name || "кузов"} · {car.seats ? car.seats + " мест" : "места"}</p>
        <div className="card-foot">
          <b>{formatPrice(car.price_per_day)} / сутки</b>
          <Link className="btn" to={"/cars/" + car.car_id}>Подробнее</Link>
        </div>
      </div>
    </article>
  )
}