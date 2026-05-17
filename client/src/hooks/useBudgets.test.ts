import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
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

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useBudgets', () => {
  const onUnauthorized = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts with empty budgets and null savedMonthlyLimit before data loads', () => {
    vi.mocked(budgetsApi.getAll).mockResolvedValue([])

    const { result } = renderHook(
      () => useBudgets({ token: 'token', onUnauthorized }),
      { wrapper: makeWrapper() }
    )

    expect(result.current.budgets).toEqual([])
    expect(result.current.savedMonthlyLimit).toBeNull()
  })

  it('fetches budgets and derives savedMonthlyLimit automatically', async () => {
    vi.mocked(budgetsApi.getAll).mockResolvedValue([makeBudget({ limit: 1500 })])

    const { result } = renderHook(
      () => useBudgets({ token: 'token', onUnauthorized }),
      { wrapper: makeWrapper() }
    )

    await waitFor(() => expect(result.current.savedMonthlyLimit).toBe(1500))
  })

  it('returns null savedMonthlyLimit when no Monthly budget exists', async () => {
    vi.mocked(budgetsApi.getAll).mockResolvedValue([
      makeBudget({ category: 'Food', limit: 400 }),
    ])

    const { result } = renderHook(
      () => useBudgets({ token: 'token', onUnauthorized }),
      { wrapper: makeWrapper() }
    )

    await waitFor(() => expect(budgetsApi.getAll).toHaveBeenCalled())
    expect(result.current.savedMonthlyLimit).toBeNull()
  })

  it('calls onUnauthorized when the API returns a 401', async () => {
    vi.mocked(budgetsApi.getAll).mockRejectedValue(new ApiError(401, 'Unauthorized'))

    renderHook(
      () => useBudgets({ token: 'token', onUnauthorized }),
      { wrapper: makeWrapper() }
    )

    await waitFor(() => expect(onUnauthorized).toHaveBeenCalledOnce())
  })

  it('does not fetch when token is null', () => {
    vi.mocked(budgetsApi.getAll).mockResolvedValue([])

    renderHook(
      () => useBudgets({ token: null, onUnauthorized }),
      { wrapper: makeWrapper() }
    )

    expect(budgetsApi.getAll).not.toHaveBeenCalled()
  })

  it('exposes saveBudget as a function and isSavingBudget as a boolean', () => {
    vi.mocked(budgetsApi.getAll).mockResolvedValue([])

    const { result } = renderHook(
      () => useBudgets({ token: 'token', onUnauthorized }),
      { wrapper: makeWrapper() }
    )

    expect(typeof result.current.saveBudget).toBe('function')
    expect(typeof result.current.isSavingBudget).toBe('boolean')
    expect(result.current.isSavingBudget).toBe(false)
  })

  it('reports isSavingBudget true while mutation is in flight', async () => {
    vi.mocked(budgetsApi.getAll).mockResolvedValue([])
    let resolveSave!: (v: Budget) => void
    vi.mocked(budgetsApi.save).mockReturnValue(
      new Promise<Budget>((res) => { resolveSave = res })
    )

    const { result } = renderHook(
      () => useBudgets({ token: 'token', onUnauthorized }),
      { wrapper: makeWrapper() }
    )

    void result.current.saveBudget({ category: 'Monthly', limit: 1000, month: '2026-05' })

    await waitFor(() => expect(result.current.isSavingBudget).toBe(true))

    resolveSave(makeBudget({ limit: 1000 }))

    await waitFor(() => expect(result.current.isSavingBudget).toBe(false))
  })
})
