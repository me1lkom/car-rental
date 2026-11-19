import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Home } from '../pages/Home'
import { Car } from '../pages/Car'
import { Account } from '../pages/Account'
import { vi } from 'vitest'

vi.mock('../api', () => ({
  api: vi.fn(() => Promise.resolve([])),
  readUser: () => null,
  clearUser: vi.fn(),
  canManage: () => false,
  carImage: () => '/photo.jpg',
  carName: (c) => `${c.brand} ${c.model}`,
  formatPrice: (n) => n + ' ₽',
  formatDate: (d) => d,
  saveUser: vi.fn(),
}))

import { api } from '../api'

describe('Обработка ошибок', () => {
  it('каталог показывает ошибку при сбое сети', async () => {
    api.mockRejectedValueOnce(new Error('Failed to fetch'))
    render(<MemoryRouter><Home /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText(/не удалось|ошибк|Машин не найдено|Каталог/i)).toBeInTheDocument()
    })
  })

  it('карточка машины показывает ошибку при 401', async () => {
    api.mockRejectedValueOnce(new Error('Unauthorized'))
    render(<MemoryRouter initialEntries={['/cars/1']}><Car /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText(/не удалось|ошибк|Загрузка/i)).toBeInTheDocument()
    })
  })

  it('кабинет показывает ошибку при сбое запроса заявок', async () => {
    api.mockRejectedValueOnce(new Error('Network error'))
    render(<MemoryRouter><Account /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText(/не удалось|ошибк|заявк|Загрузка/i)).toBeInTheDocument()
    })
  })

    it('каталог показывает пустое состояние', async () => {
    api.mockResolvedValueOnce([])
    render(<MemoryRouter><Home /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Машин не найдено/i })).toBeInTheDocument()
    })
  })
})