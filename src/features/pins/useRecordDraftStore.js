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
  setCoordinates: ({ latitude, longitude }) =>
    set({ latitude, longitude, hasResolvedLocation: true }),
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
