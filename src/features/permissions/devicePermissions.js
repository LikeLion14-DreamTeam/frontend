export const DEVICE_PERMISSION_STATUS = {
  IDLE: 'idle',
  CHECKING: 'checking',
  GRANTED: 'granted',
  DENIED: 'denied',
  UNSUPPORTED: 'unsupported',
}

const MEDIA_CONSTRAINTS = {
  camera: { video: true },
  microphone: { audio: true },
}

const PERMISSIONS_API_NAMES = {
  camera: 'camera',
  location: 'geolocation',
  microphone: 'microphone',
}

export const detectMobileOS = (navigatorObject = globalThis.navigator) => {
  if (!navigatorObject) {
    return null
  }

  const userAgent = navigatorObject.userAgent ?? ''
  const platform = navigatorObject.userAgentData?.platform ?? navigatorObject.platform
  const isIPadOS = platform === 'MacIntel' && navigatorObject.maxTouchPoints > 1

  if (/android/i.test(userAgent)) {
    return 'android'
  }

  if (/iPad|iPhone|iPod/i.test(userAgent) || isIPadOS) {
    return 'ios'
  }

  return null
}

export const getNfcIntroStatus = (
  os,
  globalObject = globalThis,
) => {
  if (os !== 'android') {
    return null
  }

  return 'NDEFReader' in globalObject
    ? DEVICE_PERMISSION_STATUS.GRANTED
    : DEVICE_PERMISSION_STATUS.UNSUPPORTED
}

const isPermissionSupported = (
  permissionType,
  navigatorObject = globalThis.navigator,
) => {
  if (!navigatorObject) {
    return false
  }

  if (permissionType === 'location') {
    return Boolean(navigatorObject.geolocation)
  }

  return Boolean(
    MEDIA_CONSTRAINTS[permissionType] &&
      navigatorObject.mediaDevices?.getUserMedia,
  )
}

export const getCurrentPermissionStatus = async (
  permissionType,
  navigatorObject = globalThis.navigator,
) => {
  if (!isPermissionSupported(permissionType, navigatorObject)) {
    return DEVICE_PERMISSION_STATUS.UNSUPPORTED
  }

  const permissionName = PERMISSIONS_API_NAMES[permissionType]

  if (!permissionName || !navigatorObject.permissions?.query) {
    return DEVICE_PERMISSION_STATUS.IDLE
  }

  try {
    const permission = await navigatorObject.permissions.query({
      name: permissionName,
    })

    if (permission.state === 'granted') {
      return DEVICE_PERMISSION_STATUS.GRANTED
    }

    if (permission.state === 'denied') {
      return DEVICE_PERMISSION_STATUS.DENIED
    }
  } catch {
    // Safari 등 Permissions API가 개별 권한 조회를 지원하지 않는 경우
    // 실제 요청 시점까지 미결정 상태로 둔다.
  }

  return DEVICE_PERMISSION_STATUS.IDLE
}

const getMediaPermission = async (permissionType, navigatorObject) => {
  let stream

  try {
    stream = await navigatorObject.mediaDevices.getUserMedia(
      MEDIA_CONSTRAINTS[permissionType],
    )

    return DEVICE_PERMISSION_STATUS.GRANTED
  } catch (error) {
    if (
      error?.name === 'NotAllowedError' ||
      error?.name === 'PermissionDeniedError' ||
      error?.name === 'SecurityError'
    ) {
      return DEVICE_PERMISSION_STATUS.DENIED
    }

    return DEVICE_PERMISSION_STATUS.UNSUPPORTED
  } finally {
    stream?.getTracks().forEach((track) => track.stop())
  }
}

const getLocationPermission = (navigatorObject) =>
  new Promise((resolve) => {
    navigatorObject.geolocation.getCurrentPosition(
      () => resolve(DEVICE_PERMISSION_STATUS.GRANTED),
      (error) => {
        resolve(
          error.code === 1
            ? DEVICE_PERMISSION_STATUS.DENIED
            : DEVICE_PERMISSION_STATUS.UNSUPPORTED,
        )
      },
      {
        enableHighAccuracy: false,
        maximumAge: 0,
        timeout: 10000,
      },
    )
  })

export const requestDevicePermission = async (
  permissionType,
  navigatorObject = globalThis.navigator,
) => {
  if (!isPermissionSupported(permissionType, navigatorObject)) {
    return DEVICE_PERMISSION_STATUS.UNSUPPORTED
  }

  const status =
    permissionType === 'location'
      ? await getLocationPermission(navigatorObject)
      : await getMediaPermission(permissionType, navigatorObject)

  if (status === DEVICE_PERMISSION_STATUS.GRANTED) {
    rememberPermissionGranted(permissionType)
  } else if (status === DEVICE_PERMISSION_STATUS.DENIED) {
    forgetRememberedPermissionGrant(permissionType)
  }

  return status
}

/**
 * 이 기기에서 위치 권한을 받은 적이 있는지 남겨둔다.
 *
 * Safari 는 Permissions API 로 위치 상태를 알려주지 않아 조회가 늘 미결정으로
 * 나온다. 그때 이 기록이 없으면 이미 허용한 사용자도 매번 권한 화면으로
 * 되돌아간다. 권한은 기기마다 다르므로 계정이 아니라 기기에 남긴다.
 *
 * 브라우저가 상태를 알려주는 경우(크롬 등)에는 이 값을 보지 않는다.
 */
const GRANTED_PERMISSION_STORAGE_KEYS = {
  camera: 'orte_camera_granted',
  location: 'orte_location_granted',
  microphone: 'orte_microphone_granted',
}

export const rememberPermissionGranted = (permissionType) => {
  const storageKey = GRANTED_PERMISSION_STORAGE_KEYS[permissionType]

  if (!storageKey) return

  try {
    globalThis.localStorage?.setItem(storageKey, 'true')
  } catch {
    // 저장이 막힌 환경(시크릿 모드 등)에서는 기억하지 않는다.
  }
}

export const forgetRememberedPermissionGrant = (permissionType) => {
  const storageKey = GRANTED_PERMISSION_STORAGE_KEYS[permissionType]

  if (!storageKey) return

  try {
    globalThis.localStorage?.removeItem(storageKey)
  } catch {
    // 저장이 막힌 환경에서는 지울 값도 없다.
  }
}

export const hasRememberedPermissionGrant = (permissionType) => {
  const storageKey = GRANTED_PERMISSION_STORAGE_KEYS[permissionType]

  if (!storageKey) return false

  try {
    return globalThis.localStorage?.getItem(storageKey) === 'true'
  } catch {
    return false
  }
}

export const rememberLocationGranted = () => {
  rememberPermissionGranted('location')
}

export const hasRememberedLocationGrant = () => {
  return hasRememberedPermissionGrant('location')
}
