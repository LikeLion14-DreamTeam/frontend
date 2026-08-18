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

/** mock/데모 전용. 업로드한 파일의 미리보기 URL 을 file_id 로 찾을 수 있게 들고 있다. */
const mockUploadedUrls = new Map()

/**
 * 일부 브라우저·공유 경로에서는 이미지 파일이어도 `File.type` 을 비워 둔다.
 * 이때는 파일명 확장자로, 업로드 API와 스토리지 PUT에 쓸 MIME 타입을 보완한다.
 */
const IMAGE_CONTENT_TYPES = {
  avif: 'image/avif',
  bmp: 'image/bmp',
  gif: 'image/gif',
  heic: 'image/heic',
  heif: 'image/heif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  webp: 'image/webp',
}

const getPhotoContentType = (file) => {
  if (file.type?.trim()) return file.type

  const extension = file.name.split('.').pop()?.toLowerCase()
  const contentType = IMAGE_CONTENT_TYPES[extension]

  if (!contentType) {
    throw new Error('파일 형식을 확인할 수 없는 사진이 있어 업로드할 수 없습니다.')
  }

  return contentType
}

export const getMockUploadedUrl = (fileId) => mockUploadedUrls.get(fileId)

const createLocalPreviewUrl = (file) =>
  new Promise((resolve) => {
    if (typeof FileReader === 'undefined') {
      resolve(URL.createObjectURL(file))
      return
    }

    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => resolve(URL.createObjectURL(file))
    reader.readAsDataURL(file)
  })

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
export const uploadFile = async ({ uploadUrl, fileId, file, contentType }) => {
  if (USE_MOCK) {
    // 실제로 올리지 않고 화면에 보여줄 미리보기 주소만 기억해둔다.
    mockUploadedUrls.set(fileId, await createLocalPreviewUrl(file))
    return null
  }

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType ?? file.type },
    body: file,
  })

  if (!response.ok) {
    throw new Error('파일을 업로드하지 못했습니다.')
  }

  // 데모 데이터는 서버에 없는 핀이라, 실서버 업로드 뒤에도 화면 표시용 URL을
  // 프론트 메모리에 보관해 둔다.
  mockUploadedUrls.set(fileId, await createLocalPreviewUrl(file))

  return null
}

/** 1~2단계를 묶어 실행하고 file_id 를 돌려준다. */
export const uploadPhoto = async (file) => {
  const contentType = getPhotoContentType(file)
  const { upload_url, file_id } = await createUpload({
    fileType: 'photo',
    contentType,
  })

  await uploadFile({ uploadUrl: upload_url, fileId: file_id, file, contentType })

  return file_id
}

/**
 * 음성 파일을 업로드하고 8.2 의 audio_file 에 넣을 file_id 를 반환한다.
 *
 * file_id 는 서버가 서명해 준 토큰이라 업로드 주소로 대체할 수 없다.
 * S3 주소를 보내면 서명 검증에 실패해 `유효하지 않거나 만료된 audio_file` 이 된다.
 * 사진(5.5)도 같은 방식으로 file_id 를 넘긴다.
 */
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
    contentType: file.type || 'audio/webm',
  })

  return upload.file_id
}
