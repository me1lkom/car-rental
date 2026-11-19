import { Link } from "react-router-dom"
import { Header } from "./Header"

export function PageState({ loading, error, children }) {
  if (loading) return (
    <>
      <Header />
      <main className="page">
        <article className="panel"><p>Загрузка…</p></article>
      </main>
    </>
  )
  if (error) return (
    <>
      <Header />
      <main className="page">
        <article className="panel">
          <h1>{error}</h1>
          <Link className="btn" to="/">В каталог</Link>
        </article>
      </main>
    </>
  )
  return children
}