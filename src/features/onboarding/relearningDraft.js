const RELEARNING_DRAFT_KEY = 'orte_relearning_draft'

const getStorage = () => {
  if (typeof window === 'undefined') return null

  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export const readRelearningDraft = () => {
  const storage = getStorage()
  if (!storage) return {}

  try {
    return JSON.parse(storage.getItem(RELEARNING_DRAFT_KEY)) ?? {}
  } catch {
    return {}
  }
}

export const updateRelearningDraft = (partialDraft) => {
  const storage = getStorage()
  if (!storage) return

  try {
    storage.setItem(
      RELEARNING_DRAFT_KEY,
      JSON.stringify({ ...readRelearningDraft(), ...partialDraft }),
    )
  } catch {
    // draft 저장 실패가 재학습 진행 자체를 막지는 않는다.
  }
}

export const clearRelearningDraft = () => {
  const storage = getStorage()
  if (!storage) return

  storage.removeItem(RELEARNING_DRAFT_KEY)
}
