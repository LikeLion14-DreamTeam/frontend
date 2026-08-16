import apiClient from './client'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true'

/**
 * 파일 업로드 (명세서 0-2 공통 사항)
 *
 * 사진·음성은 2단계로 올린다.
 *   1) POST /uploads 로 사전 서명 URL 과 file_id 를 받는다
 *   2) 그 URL 에 파일을 직접 PUT 한다
 *   3) 받은 file_id 를 각 기능의 등록 API(5.5, 8.2 등)에 넘긴다
 *
 * 사진과 음성이 함께 쓰는 공통 엔드포인트라 features 아래가 아니라 여기에 둔다.
 */

/** mock 전용. 업로드한 파일의 미리보기 URL 을 file_id 로 찾을 수 있게 들고 있다. */
const mockUploadedUrls = new Map()

export const getMockUploadedUrl = (fileId) => mockUploadedUrls.get(fileId)

/** 1단계. 사전 서명 URL 발급 */
export const createUpload = async ({ fileType, contentType }) => {
  if (USE_MOCK) {
    const fileId = `file_mock_${mockUploadedUrls.size + 1}_${contentType.replace('/', '_')}`

    return {
      upload_url: `https://mock-storage.local/${fileId}`,
      file_id: fileId,
      expires_at: null,
    }
  }

  return apiClient.post('/uploads', {
    file_type: fileType,
    content_type: contentType,
  })
}

/**
 * 2단계. 사전 서명 URL 에 파일을 직접 올린다.
 *
 * 공통 apiClient 를 쓰면 baseURL 과 Authorization 헤더가 붙어 스토리지가 거부한다.
 * README 규칙 10번. 그래서 fetch 를 그대로 쓴다.
 */
export const uploadFile = async ({ uploadUrl, fileId, file }) => {
  if (USE_MOCK) {
    // 실제로 올리지 않고 화면에 보여줄 미리보기 주소만 기억해둔다.
    mockUploadedUrls.set(fileId, URL.createObjectURL(file))
    return null
  }

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })

  if (!response.ok) {
    throw new Error('파일을 업로드하지 못했습니다.')
  }

  return null
}

/** 1~2단계를 묶어 실행하고 file_id 를 돌려준다. */
export const uploadPhoto = async (file) => {
  const { upload_url, file_id } = await createUpload({
    fileType: 'photo',
    contentType: file.type,
  })

  await uploadFile({ uploadUrl: upload_url, fileId: file_id, file })

  return file_id
}

/** 음성 파일을 업로드하고 8.2의 audio_file에 전달할 공개 URL을 반환한다. */
export const uploadAudio = async (file) => {
  const upload = await createUpload({
    // 명세 0-2 가 허용하는 값은 photo · voice 뿐이다.
    fileType: 'voice',
    contentType: file.type || 'audio/webm',
  })

  await uploadFile({
    uploadUrl: upload.upload_url,
    fileId: upload.file_id,
    file,
  })

  if (USE_MOCK) return getMockUploadedUrl(upload.file_id)

  // 백엔드가 공개 URL을 별도 필드로 주는 경우를 우선 사용한다. 기존 presigned
  // 응답과도 호환되도록 쿼리를 제외한 object URL을 fallback으로 둔다.
  return (
    upload.file_url ??
    upload.public_url ??
    upload.upload_url.split('?')[0]
  )
}
