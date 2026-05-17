import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBudgets } from './useBudgets'
import type { Budget } from '../types'

vi.mock('../services/api', () => {
  class ApiError extends Error {
    status: number
    constructor(status: number, message: string) {
      super(message)
      this.name = 'ApiError'
      this.status = status
    }
  }
  return {
    ApiError,
    budgetsApi: { getAll: vi.fn(), save: vi.fn() },
  }
})

import { budgetsApi, ApiError } from '../services/api'

const makeBudget = (overrides: Partial<Budget> = {}): Budget => ({
  id: 1,
  category: 'Monthly',
  limit: 1500,
  month: '2026-05',
  createdAt: '2026-05-01T00:00:00Z',
  userId: 1,
  ...overrides,
})

describe('useBudgets', () => {
  const onUnauthorized = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts with empty budgets and null savedMonthlyLimit', () => {
    const { result } = renderHook(() =>
      useBudgets({ token: 'token', onUnauthorized })
    )
    expect(result.current.budgets).toEqual([])
    expect(result.current.savedMonthlyLimit).toBeNull()
  })

  it('derives savedMonthlyLimit from the Monthly budget after fetch', async () => {
    vi.mocked(budgetsApi.getAll).mockResolvedValueOnce([makeBudget({ limit: 1500 })])

    const { result } = renderHook(() =>
      useBudgets({ token: 'token', onUnauthorized })
    )

    await act(async () => { await result.current.fetchBudgets() })

    expect(result.current.savedMonthlyLimit).toBe(1500)
  })

  it('returns null savedMonthlyLimit when no Monthly budget exists', async () => {
    vi.mocked(budgetsApi.getAll).mockResolvedValueOnce([
      makeBudget({ category: 'Food', limit: 400 }),
    ])

    const { result } = renderHook(() =>
      useBudgets({ token: 'token', onUnauthorized })
    )

    await act(async () => { await result.current.fetchBudgets() })

    expect(result.current.savedMonthlyLimit).toBeNull()
  })

  it('calls onUnauthorized when the API returns a 401', async () => {
    vi.mocked(budgetsApi.getAll).mockRejectedValueOnce(new ApiError(401, 'Unauthorized'))

    const { result } = renderHook(() =>
      useBudgets({ token: 'token', onUnauthorized })
    )

    await act(async () => { await result.current.fetchBudgets() })

    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('skips the fetch when token is null', async () => {
    const { result } = renderHook(() =>
      useBudgets({ token: null, onUnauthorized })
    )

    await act(async () => { await result.current.fetchBudgets() })

    expect(budgetsApi.getAll).not.toHaveBeenCalled()
  })

  it('updates savedMonthlyLimit when the budget changes', async () => {
    vi.mocked(budgetsApi.getAll)
      .mockResolvedValueOnce([makeBudget({ limit: 1000 })])
      .mockResolvedValueOnce([makeBudget({ limit: 2000 })])

    const { result } = renderHook(() =>
      useBudgets({ token: 'token', onUnauthorized })
    )

    await act(async () => { await result.current.fetchBudgets() })
    expect(result.current.savedMonthlyLimit).toBe(1000)

    await act(async () => { await result.current.fetchBudgets() })
    expect(result.current.savedMonthlyLimit).toBe(2000)
  })
})
