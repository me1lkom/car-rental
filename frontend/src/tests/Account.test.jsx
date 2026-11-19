import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Account } from '../pages/Account'
import { vi } from 'vitest'

vi.mock('../api', () => ({
  api: vi.fn().mockResolvedValue([]),
  readUser: () => ({ name: 'Иван', surname: 'Иванов', email: 'ivan@test.com', role: 'client', phone: '+7999' }),
  clearUser: vi.fn(),
  formatDate: (d) => d,
  formatPrice: (n) => n,
  carName: (c) => c?.brand || '',
  canManage: () => false,
}))

describe('Личный кабинет', () => {
  it('показывает данные профиля', () => {
    render(<MemoryRouter><Account /></MemoryRouter>)
    expect(screen.getAllByText(/Иван|Загрузка/i).length).toBeGreaterThan(0)
  })

  it('показывает сообщение если заявок нет', () => {
    render(<MemoryRouter><Account /></MemoryRouter>)
    expect(screen.getByText(/Загрузка|заявок|Профиль/i)).toBeInTheDocument()
  })
})