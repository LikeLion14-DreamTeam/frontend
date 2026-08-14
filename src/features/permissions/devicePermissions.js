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

  if (permissionType === 'location') {
    return getLocationPermission(navigatorObject)
  }

  return getMediaPermission(permissionType, navigatorObject)
}
