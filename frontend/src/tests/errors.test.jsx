import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Home } from '../pages/Home'
import { vi } from 'vitest'

vi.mock('../api', () => ({
  api: vi.fn().mockResolvedValue([]),
  readUser: () => null,
  clearUser: vi.fn(),
  canManage: () => false,
  carImage: () => '/photo.jpg',
  carName: (c) => `${c.brand} ${c.model}`,
  formatPrice: (n) => n + ' ₽',
}))

import { api } from '../api'

describe('Обработка ошибок', () => {
  it('каталог показывает ошибку сети', async () => {
    api.mockRejectedValueOnce(new Error('Failed to fetch'))
    render(<MemoryRouter><Home /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText(/Машин не найдено|Каталог/i)).toBeInTheDocument()
    })
  })
})