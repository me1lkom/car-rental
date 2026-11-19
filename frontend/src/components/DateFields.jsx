export function DateFields({ startName = "start", endName = "end" }) {
  return (
    <div className="two">
      <label>Дата выдачи<input name={startName} type="date" /></label>
      <label>Дата возврата<input name={endName} type="date" /></label>
    </div>
  )
}