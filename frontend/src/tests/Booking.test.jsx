import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { Booking } from '../pages/Booking'
import { vi } from 'vitest'

vi.mock('../api', () => ({
  api: vi.fn().mockResolvedValue({}),
  carImage: () => '/photo.jpg',
  carName: (c) => `${c.brand} ${c.model}`,
  formatPrice: (n) => n + ' ₽',
  formatDate: (d) => d,
  daysBetween: (a, b) => (a && b ? 2 : 0),
  translateError: (m) => m,
  readUser: () => null,
  clearUser: vi.fn(),
  canManage: () => false,
}))

vi.mock('../hooks/useCar', () => ({
  useCar: () => ({
    car: { car_id: 1, brand: 'Toyota', model: 'Camry', price_per_day: 5000 },
    periods: [],
    loading: false,
    error: '',
  }),
}))

describe('Бронирование', () => {
  it('показывает форму оформления', () => {
    render(
      <MemoryRouter initialEntries={['/booking/1']}>
        <Routes>
          <Route path="/booking/:id" element={<Booking />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText(/Оформление бронирования/i)).toBeInTheDocument()
    expect(screen.getByText(/Дата выдачи/i)).toBeInTheDocument()
    expect(screen.getByText(/Дата возврата/i)).toBeInTheDocument()
  })

  it('показывает ошибку если даты не указаны', async () => {
    render(
      <MemoryRouter initialEntries={['/booking/1']}>
        <Routes>
          <Route path="/booking/:id" element={<Booking />} />
        </Routes>
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText(/Подтвердить/i))
    expect(await screen.findByText(/Укажите обе даты/i)).toBeInTheDocument()
  })
})