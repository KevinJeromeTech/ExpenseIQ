import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ApiError, transactionsApi, authApi } from './api'

describe('ApiError', () => {
  it('sets name, status, and message', () => {
    const err = new ApiError(404, 'Not Found')
    expect(err.name).toBe('ApiError')
    expect(err.status).toBe(404)
    expect(err.message).toBe('Not Found')
    expect(err).toBeInstanceOf(Error)
  })

  it('is distinguishable from a plain Error', () => {
    const err = new ApiError(500, 'Server Error')
    expect(err).toBeInstanceOf(ApiError)
    expect(err).not.toBeInstanceOf(TypeError)
  })
})

describe('transactionsApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns data on a successful response', async () => {
    const mockData = [{ id: 1, merchant: 'Amazon', amount: 50, category: 'Shopping', createdAt: '2026-01-01' }]
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockData,
    } as Response)

    const result = await transactionsApi.getAll('test-token')
    expect(result).toEqual(mockData)
  })

  it('throws ApiError on a non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
    } as Response)

    await expect(transactionsApi.getAll('bad-token')).rejects.toBeInstanceOf(ApiError)
  })

  it('surfaces the error message from the response body', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'amount is required' }),
    } as Response)

    await expect(transactionsApi.getAll('token')).rejects.toThrow('amount is required')
  })

  it('includes the Authorization header', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    } as Response)

    await transactionsApi.getAll('my-token')

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/transactions'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer my-token' }),
      })
    )
  })

  it('sends the correct method and body for create', async () => {
    const payload = { merchant: 'Starbucks', amount: 6.5, category: 'Food' }
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ id: 2, ...payload, createdAt: '2026-05-01' }),
    } as Response)

    await transactionsApi.create('token', payload)

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/transactions'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      })
    )
  })
})

describe('authApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends email and password in the request body', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ token: 'jwt', user: { id: 1, email: 'a@b.com' }, message: 'ok' }),
    } as Response)

    await authApi.login('user@example.com', 'password123')

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/login'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'user@example.com', password: 'password123' }),
      })
    )
  })

  it('throws ApiError when credentials are invalid', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid email or password' }),
    } as Response)

    await expect(authApi.login('x@x.com', 'wrong')).rejects.toThrow('Invalid email or password')
  })
})
