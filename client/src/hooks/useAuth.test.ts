import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuth } from './useAuth'

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('is unauthenticated by default', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.token).toBeNull()
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('reads a persisted session from localStorage on mount', () => {
    localStorage.setItem('token', 'saved-token')
    localStorage.setItem('user', JSON.stringify({ id: 1, email: 'test@example.com' }))

    const { result } = renderHook(() => useAuth())

    expect(result.current.token).toBe('saved-token')
    expect(result.current.user).toEqual({ id: 1, email: 'test@example.com' })
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('persists token and user on login success', () => {
    const { result } = renderHook(() => useAuth())

    act(() => {
      result.current.onLoginSuccess('new-token', { id: 2, email: 'user@example.com' })
    })

    expect(result.current.token).toBe('new-token')
    expect(result.current.user).toEqual({ id: 2, email: 'user@example.com' })
    expect(localStorage.getItem('token')).toBe('new-token')
    expect(JSON.parse(localStorage.getItem('user')!)).toEqual({ id: 2, email: 'user@example.com' })
  })

  it('clears state and localStorage on logout', () => {
    localStorage.setItem('token', 'token')
    localStorage.setItem('user', JSON.stringify({ id: 1, email: 'a@b.com' }))

    const { result } = renderHook(() => useAuth())

    act(() => {
      result.current.logout()
    })

    expect(result.current.token).toBeNull()
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('clears session on handleUnauthorized', () => {
    localStorage.setItem('token', 'token')
    localStorage.setItem('user', JSON.stringify({ id: 1, email: 'a@b.com' }))

    const { result } = renderHook(() => useAuth())

    act(() => {
      result.current.handleUnauthorized()
    })

    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('recovers gracefully from corrupted localStorage data', () => {
    localStorage.setItem('user', 'not-valid-json{{{')

    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })
})
