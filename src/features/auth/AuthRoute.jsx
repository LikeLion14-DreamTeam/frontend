import { Navigate, Outlet } from 'react-router-dom'
import { getSessionToken } from '../../api/session'
import { getAuthenticatedEntryPath } from './authRoutes'
import useAuthStore from './useAuthStore'

export const RequireAuth = () => {
  if (!getSessionToken()) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export const GuestOnly = () => {
  const user = useAuthStore((state) => state.user)

  if (getSessionToken()) {
    return <Navigate to={getAuthenticatedEntryPath(user)} replace />
  }

  return <Outlet />
}
