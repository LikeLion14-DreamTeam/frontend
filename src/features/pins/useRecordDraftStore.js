import { create } from 'zustand'

const INITIAL_DRAFT = {
  tagId: null,
  photos: [],
  latitude: null,
  longitude: null,
  hasResolvedLocation: false,
  address: '',
  city: '',
  countryCode: '',
  countryName: '',
  placeName: '',
  textNote: '',
}

/**
 * 촬영 화면과 핀 저장 화면 사이에서 유지하는 임시 기록.
 *
 * Blob과 object URL은 JSON 저장소에 직렬화할 수 없으므로 메모리에만 둔다.
 * 저장 또는 촬영 취소 시 clearDraft가 미리보기 URL까지 함께 정리한다.
 */
const useRecordDraftStore = create((set, get) => ({
  ...INITIAL_DRAFT,

  setTagId: (tagId) => set({ tagId: tagId || null }),
  setPhotos: (photos) => set({ photos }),
  /*
   * 좌표를 받았을 때만 쓴다.
   *
   * `hasResolvedLocation` 은 "더 물어볼 필요 없다"는 표시라, 실패했을 때
   * 세우면 촬영 화면에 다시 들어와도 위치를 다시 잡지 않는다. 실내에서
   * 실패한 뒤 밖에 나가 이어 찍어도 계속 위치가 없는 상태로 남는다.
   */
  setCoordinates: ({ latitude, longitude }) =>
    set({ latitude, longitude, hasResolvedLocation: true }),

  /** 위치를 못 받았을 때. 다음에 다시 물어볼 수 있게 표시를 세우지 않는다. */
  clearCoordinates: () =>
    set({ latitude: null, longitude: null, hasResolvedLocation: false }),
  setLocationDetails: ({ address, city, countryCode, countryName }) =>
    set({ address, city, countryCode, countryName }),
  setContext: ({ placeName, textNote }) => set({ placeName, textNote }),

  clearDraft: () => {
    if (typeof URL !== 'undefined') {
      get().photos.forEach((photo) => URL.revokeObjectURL(photo.url))
    }

    set({ ...INITIAL_DRAFT })
  },
}))

export default useRecordDraftStore
