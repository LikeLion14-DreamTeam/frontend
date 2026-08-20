import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getSessionToken } from '../../api/session'
import { getPostLoginPath } from './authRoutes'
import useAuthStore from './useAuthStore'

export const RequireAuth = () => {
  const location = useLocation()

  if (!getSessionToken()) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: {
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
          },
        }}
      />
    )
  }

  return <Outlet />
}

export const GuestOnly = () => {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)

  if (getSessionToken()) {
    return (
      <Navigate
        to={getPostLoginPath(user, location.state?.from)}
        replace
      />
    )
  }

  return <Outlet />
}
