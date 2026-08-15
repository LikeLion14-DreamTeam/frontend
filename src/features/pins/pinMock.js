/**
 * 핀 mock 데이터.
 *
 * 고정 응답이 아니라 메모리에 상태를 들고 있어서 수정·삭제가 실제로 반영된다.
 * 새로고침하면 초기값으로 돌아간다.
 *
 * 응답 형태는 API 명세서 5번과 동일하게 맞춘다.
 */

// mock 전용 이미지. 실제로는 S3 URL 이 온다.
const photoUrl = (seed) => `https://picsum.photos/seed/${seed}/600/600`

/**
 * 사진은 picsum 으로 대신하지만 음성은 그럴 만한 곳이 없어, 길이만 맞춘 WAV 를
 * 직접 만들어 쓴다. 재생·일시정지·파형 진행을 목업만으로 확인하기 위한 것이다.
 */
const createMockAudioUrl = (durationSec) => {
  const sampleRate = 8000
  const frameCount = sampleRate * durationSec
  const buffer = new ArrayBuffer(44 + frameCount * 2)
  const view = new DataView(buffer)

  const writeText = (offset, text) => {
    for (let i = 0; i < text.length; i += 1) {
      view.setUint8(offset + i, text.charCodeAt(i))
    }
  }

  // 16비트 모노 PCM WAV 헤더.
  writeText(0, 'RIFF')
  view.setUint32(4, 36 + frameCount * 2, true)
  writeText(8, 'WAVEfmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeText(36, 'data')
  view.setUint32(40, frameCount * 2, true)

  for (let i = 0; i < frameCount; i += 1) {
    const sample = Math.sin((2 * Math.PI * 220 * i) / sampleRate) * 0.2
    view.setInt16(44 + i * 2, sample * 32767, true)
  }

  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }))
}

const createInitialState = () => ({
  // 핀 번호와 segment_id 는 tripMock 의 구간 12 와 맞춘다.
  // 어긋나면 핀 상세의 여정 칩(`n개 핀 중 m번째`)이 이상하게 표시된다.
  pins: {
    101: {
      pin_id: 101,
      segment_id: 12,
      latitude: 48.8584,
      longitude: 2.2945,
      address: '프랑스 파리 샹드마르스 5번가',
      place_name: '파리 에펠탑 근처',
      tagged_at: '2024-11-03T01:24:00.000000Z',
      text_note:
        '오래된 돌담을 따라 걷다가, 해가 드는 순간에 멈춰 섰다. 다음엔 이른 아침에 다시 오기로.',
    },
    102: {
      pin_id: 102,
      segment_id: 12,
      latitude: 48.8606,
      longitude: 2.3376,
      address: '프랑스 파리 리볼리가',
      place_name: '루브르 박물관 앞',
      tagged_at: '2024-11-04T05:11:00.000000Z',
      text_note: '유리 피라미드에 구름이 통째로 비쳤다.',
    },
    103: {
      // 구간에서 제외된 핀(tripMock 의 included_in_segment=false)
      pin_id: 103,
      segment_id: 12,
      latitude: 48.8867,
      longitude: 2.3431,
      address: '프랑스 파리 몽마르트르',
      place_name: '몽마르트르 언덕',
      tagged_at: '2024-11-05T02:05:00.000000Z',
      text_note: '',
    },
    104: {
      // 위치 권한을 거부한 상태에서 저장된 핀. 장소명·기록·음성이 모두 없다.
      pin_id: 104,
      segment_id: 12,
      latitude: null,
      longitude: null,
      address: '',
      place_name: '',
      tagged_at: '2024-11-06T07:40:00.000000Z',
      text_note: '',
    },
    105: {
      pin_id: 105,
      segment_id: 12,
      latitude: 48.8049,
      longitude: 2.1204,
      address: '프랑스 베르사유 궁전 광장',
      place_name: '베르사유 궁전 정원',
      tagged_at: '2024-11-08T00:30:00.000000Z',
      text_note: '분수까지 걸어가는 길이 생각보다 길었다.',
    },
    106: {
      // 진행 중인 여정의 핀. segment_id 가 null 이라 5.3 삭제가 가능하다.
      pin_id: 106,
      segment_id: null,
      latitude: 37.5665,
      longitude: 126.978,
      address: '서울 중구 세종대로',
      place_name: '서울시청 앞',
      tagged_at: '2025-08-14T02:10:00.000000Z',
      text_note: '퇴근길에 잠깐 들렀다.',
    },
  },

  /** 5.4 GET /pins/{pinId}/photos. is_pin_cover 가 대표사진 표시다. */
  photos: {
    101: [
      {
        photo_id: 900,
        captured_at: '2025-06-14T01:32:10.000000Z',
        file_path: photoUrl('orte-900'),
        is_pin_cover: true,
      },
      {
        photo_id: 901,
        captured_at: '2025-06-14T01:33:02.000000Z',
        file_path: photoUrl('orte-901'),
        is_pin_cover: true,
      },
      {
        photo_id: 902,
        captured_at: '2025-06-14T01:33:40.000000Z',
        file_path: photoUrl('orte-902'),
        is_pin_cover: true,
      },
      {
        photo_id: 903,
        captured_at: '2025-06-14T01:34:12.000000Z',
        file_path: photoUrl('orte-903'),
        is_pin_cover: false,
      },
      {
        photo_id: 904,
        captured_at: '2025-06-14T01:35:01.000000Z',
        file_path: photoUrl('orte-904'),
        is_pin_cover: false,
      },
      {
        photo_id: 905,
        captured_at: '2025-06-14T01:36:20.000000Z',
        file_path: photoUrl('orte-905'),
        is_pin_cover: false,
      },
      {
        photo_id: 906,
        captured_at: '2025-06-14T01:37:44.000000Z',
        file_path: photoUrl('orte-906'),
        is_pin_cover: false,
      },
      {
        photo_id: 907,
        captured_at: '2025-06-14T01:38:30.000000Z',
        file_path: photoUrl('orte-907'),
        is_pin_cover: false,
      },
    ],
    102: [
      {
        photo_id: 920,
        captured_at: '2024-11-04T05:11:30.000000Z',
        file_path: photoUrl('orte-920'),
        is_pin_cover: true,
      },
      {
        photo_id: 921,
        captured_at: '2024-11-04T05:12:44.000000Z',
        file_path: photoUrl('orte-921'),
        is_pin_cover: true,
      },
      {
        photo_id: 922,
        captured_at: '2024-11-04T05:14:02.000000Z',
        file_path: photoUrl('orte-922'),
        is_pin_cover: false,
      },
    ],
    103: [
      {
        photo_id: 930,
        captured_at: '2024-11-05T02:05:18.000000Z',
        file_path: photoUrl('orte-930'),
        is_pin_cover: true,
      },
      {
        photo_id: 931,
        captured_at: '2024-11-05T02:07:51.000000Z',
        file_path: photoUrl('orte-931'),
        is_pin_cover: false,
      },
    ],
    105: [
      {
        photo_id: 940,
        captured_at: '2024-11-08T00:30:25.000000Z',
        file_path: photoUrl('orte-940'),
        is_pin_cover: true,
      },
      {
        photo_id: 941,
        captured_at: '2024-11-08T00:33:09.000000Z',
        file_path: photoUrl('orte-941'),
        is_pin_cover: true,
      },
    ],
    104: [
      {
        photo_id: 950,
        captured_at: '2024-11-06T07:40:20.000000Z',
        file_path: photoUrl('orte-950'),
        is_pin_cover: true,
      },
    ],
    106: [
      {
        photo_id: 960,
        captured_at: '2025-08-14T02:10:12.000000Z',
        file_path: photoUrl('orte-960'),
        is_pin_cover: true,
      },
      {
        photo_id: 961,
        captured_at: '2025-08-14T02:11:40.000000Z',
        file_path: photoUrl('orte-961'),
        is_pin_cover: true,
      },
    ],
  },

  /** 5.8 GET /pins/{pinId}/voice-memos. 없으면 null 이 온다. */
  voiceMemos: {
    101: {
      voice_memo_id: 55,
      audio_file: createMockAudioUrl(18),
      duration_sec: 18,
      saved_at: '2024-11-03T01:24:30.000000Z',
    },
    102: null,
    103: {
      voice_memo_id: 56,
      audio_file: createMockAudioUrl(9),
      duration_sec: 9,
      saved_at: '2024-11-05T02:06:10.000000Z',
    },
    104: null,
    105: null,
    106: null,
  },
})

/** 세션 동안 유지되는 mock 상태. pinApi 의 mock 분기가 직접 읽고 쓴다. */
export const mockPinStore = createInitialState()

/** 테스트나 초기화가 필요할 때 사용한다. */
export const resetMockPinStore = () => {
  Object.assign(mockPinStore, createInitialState())
}
