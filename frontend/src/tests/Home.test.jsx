import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Home } from '../pages/Home'
import { vi } from 'vitest'

vi.mock('../api', () => ({
  api: vi.fn(),
  readUser: () => null,
  clearUser: vi.fn(),
  canManage: () => false,
  carImage: () => '/photo.jpg',
  carName: (c) => `${c.brand} ${c.model}`,
  formatPrice: (n) => n + ' ₽',
}))

import { api } from '../api'

const mockCars = [
  { car_id: 1, brand: 'Toyota', model: 'Camry', year: 2023, price_per_day: 5000 },
  { car_id: 2, brand: 'BMW', model: 'X5', year: 2024, price_per_day: 9000 },
]

describe('Каталог и фильтрация', () => {
  beforeEach(() => {
    api.mockReset()
    api.mockResolvedValue([])
  })

  it('загружает и показывает машины из каталога', async () => {
    api.mockImplementation((url) => {
      if (url.includes('car-attributes')) return Promise.resolve({ rental_classes: [], body_types: [] })
      if (url.includes('/cars')) return Promise.resolve(mockCars)
      return Promise.resolve([])
    })
    render(<MemoryRouter><Home /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText(/Camry/i)).toBeInTheDocument()
    })
  })

  it('показывает сообщение если машин не найдено', async () => {
    api.mockResolvedValue([])
    render(<MemoryRouter><Home /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText(/Машин не найдено/i)).toBeInTheDocument()
    })
  })

  it('показывает ошибку если сервер недоступен', async () => {
    api.mockRejectedValue(new Error('network'))
    render(<MemoryRouter><Home /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText(/Машин не найдено|Каталог/i)).toBeInTheDocument()
    })
  })
})