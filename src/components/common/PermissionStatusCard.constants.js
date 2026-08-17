import cameraOffIcon from '../../assets/icons/permission-camera-off.png'
import cameraOnIcon from '../../assets/icons/permission-camera-on.png'
import locationOffIcon from '../../assets/icons/permission-location-off.png'
import locationOnIcon from '../../assets/icons/permission-location-on.png'
import nfcOffIcon from '../../assets/icons/permission-nfc-off.png'
import nfcOnIcon from '../../assets/icons/permission-nfc-on.png'

/**
 * Figma 권한 카드 3종 기본값입니다.
 * 단일 카드는 permissionStatusCardPresets.camera처럼 사용하고,
 * 목록 렌더링은 permissionStatusCardItems를 사용합니다.
 */

export const permissionStatusCardPresets = {
  nfc: {
    title: 'NFC',
    description: 'MCM 태그를 읽어 핀을 만들어요',
    disabledDescription: '제품을 태그해도 반응하지 않아요',
    enabledBadgeLabel: '확인',
    icon: nfcOnIcon,
    disabledIcon: nfcOffIcon,
    iconSize: 28,
  },
  camera: {
    title: '카메라',
    description: '태깅한 자리에서 바로 사진을 남겨요',
    disabledDescription: '태깅 직후 사진 촬영이 안 돼요',
    enabledBadgeLabel: '필수',
    icon: cameraOnIcon,
    disabledIcon: cameraOffIcon,
    iconSize: {
      width: 22,
      height: 23,
    },
  },
  location: {
    title: '위치',
    description: '이 핀이 지도 위 어디인지 기록해요',
    disabledDescription: '지도 위에 기록이 안 돼요',
    // 위치 없이는 핀·지도·여정이 성립하지 않아 허용 전에는 진입을 막는다.
    enabledBadgeLabel: '필수',
    icon: locationOnIcon,
    disabledIcon: locationOffIcon,
    iconSize: 26,
  },
}

export const permissionStatusCardItems = [
  {
    key: 'nfc',
    ...permissionStatusCardPresets.nfc,
  },
  {
    key: 'camera',
    ...permissionStatusCardPresets.camera,
  },
  {
    key: 'location',
    ...permissionStatusCardPresets.location,
  },
]
