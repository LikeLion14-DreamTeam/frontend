import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import {
  DEVICE_PERMISSION_STATUS,
  getCurrentPermissionStatus,
  hasRememberedLocationGrant,
} from './devicePermissions'

/**
 * 위치 권한이 없으면 권한 화면으로 되돌린다.
 *
 * 서버의 `permission_intro_shown` 은 "안내를 봤다" 는 기록일 뿐이라, 기기를
 * 바꾸거나 나중에 권한을 꺼도 그대로 통과한다. 실제 허용 여부는 브라우저가
 * 출처별로 들고 있으므로 진입할 때마다 브라우저에 직접 물어본다.
 *
 * Safari 는 위치 상태 조회를 지원하지 않아 늘 미결정으로 답한다. 그때만
 * 기기에 남겨둔 기록으로 판단한다. 이미 허용한 사용자를 매번 되돌리지 않기
 * 위해서다. 그 사이 권한을 껐다면 위치를 쓰는 화면에서 걸러진다.
 */
const RequireLocationPermission = () => {
  const [isAllowed, setIsAllowed] = useState(null)

  useEffect(() => {
    let ignore = false

    const check = async () => {
      const status = await getCurrentPermissionStatus('location')

      if (ignore) return

      if (status === DEVICE_PERMISSION_STATUS.GRANTED) {
        setIsAllowed(true)
        return
      }

      if (status === DEVICE_PERMISSION_STATUS.DENIED) {
        setIsAllowed(false)
        return
      }

      setIsAllowed(hasRememberedLocationGrant())
    }

    check()

    return () => {
      ignore = true
    }
  }, [])

  // 확인 전에는 아무것도 그리지 않는다. 화면이 잠깐 스쳤다 튕기지 않게.
  if (isAllowed === null) return null

  return isAllowed ? <Outlet /> : <Navigate to="/permission" replace />
}

export default RequireLocationPermission
