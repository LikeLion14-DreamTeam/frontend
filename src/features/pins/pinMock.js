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
    107: {
      pin_id: 107,
      segment_id: null,
      latitude: 35.1587,
      longitude: 129.1604,
      address: '부산 해운대구 해운대해변로',
      place_name: '해운대 해수욕장',
      tagged_at: '2025-08-14T06:30:00.000000Z',
      text_note: '해가 지는 걸 한참 봤다.',
    },
    108: {
      pin_id: 108,
      segment_id: null,
      latitude: 35.8714,
      longitude: 128.6014,
      address: '대구 중구 국채보상로',
      place_name: '',
      tagged_at: '2025-08-15T01:15:00.000000Z',
      text_note: '',
    },
    109: {
      pin_id: 109,
      segment_id: null,
      latitude: 35.8151,
      longitude: 127.153,
      address: '전북 전주시 완산구 기린대로',
      place_name: '전주 한옥마을',
      tagged_at: '2025-08-15T05:40:00.000000Z',
      text_note: '기와 지붕이 끝없이 이어졌다.',
    },
    110: {
      pin_id: 110,
      segment_id: null,
      latitude: 34.7604,
      longitude: 127.6622,
      address: '전남 여수시 돌산읍 돌산로',
      place_name: '돌산공원',
      tagged_at: '2025-08-16T00:20:00.000000Z',
      text_note: '',
    },
    111: {
      pin_id: 111,
      segment_id: null,
      latitude: 37.7952,
      longitude: 128.9059,
      address: '강원 강릉시 창해로',
      place_name: '경포해변',
      tagged_at: '2025-08-16T08:05:00.000000Z',
      text_note: '파도 소리만 한참 들었다.',
    },

    // tripMock 의 구간 11(도쿄, 요코하마)
    201: {
      pin_id: 201,
      segment_id: 11,
      latitude: 35.6595,
      longitude: 139.7004,
      address: '일본 도쿄도 시부야구 시부야 2초메',
      place_name: '시부야 스카이',
      tagged_at: '2024-08-01T00:00:00.000000Z',
      text_note: '해가 지는 쪽만 사람이 몰려 있었다.',
    },
    // tripMock 의 구간 10(유럽 일주). 국가 도장 테스트용이다.
    301: {
      pin_id: 301,
      segment_id: 10,
      latitude: 41.8902,
      longitude: 12.4922,
      address: '이탈리아 로마 콜로세오 광장',
      place_name: '콜로세움',
      tagged_at: '2024-05-02T08:00:00.000000Z',
      text_note: '돌 하나하나가 오래 남아 있었다.',
    },
    302: {
      pin_id: 302,
      segment_id: 10,
      latitude: 41.4036,
      longitude: 2.1744,
      address: '스페인 바르셀로나 마요르카 거리',
      place_name: '사그라다 파밀리아',
      tagged_at: '2024-05-04T10:30:00.000000Z',
      text_note: '',
    },
    303: {
      pin_id: 303,
      segment_id: 10,
      latitude: 38.6916,
      longitude: -9.216,
      address: '포르투갈 리스본 벨렝',
      place_name: '벨렝 탑',
      tagged_at: '2024-05-06T13:05:00.000000Z',
      text_note: '',
    },
    304: {
      pin_id: 304,
      segment_id: 10,
      latitude: 47.3564,
      longitude: 8.5417,
      address: '스위스 취리히 호숫가',
      place_name: '취리히 호수',
      tagged_at: '2024-05-09T07:45:00.000000Z',
      text_note: '물이 너무 맑아서 한참 서 있었다.',
    },
    305: {
      pin_id: 305,
      segment_id: 10,
      latitude: 50.0865,
      longitude: 14.4114,
      address: '체코 프라하 카를교',
      place_name: '카를교',
      tagged_at: '2024-05-11T16:10:00.000000Z',
      text_note: '',
    },
    306: {
      pin_id: 306,
      segment_id: 10,
      latitude: 48.1849,
      longitude: 16.3122,
      address: '오스트리아 빈 쇤브룬',
      place_name: '쇤브룬 궁전',
      tagged_at: '2024-05-13T09:25:00.000000Z',
      text_note: '',
    },
    307: {
      pin_id: 307,
      segment_id: 10,
      latitude: 52.3676,
      longitude: 4.9041,
      address: '네덜란드 암스테르담 운하지구',
      place_name: '암스테르담 운하',
      tagged_at: '2024-05-15T14:20:00.000000Z',
      text_note: '자전거 소리로 가득한 저녁.',
    },

    202: {
      pin_id: 202,
      segment_id: 11,
      latitude: 35.4563,
      longitude: 139.6317,
      address: '일본 가나가와현 요코하마시 니시구',
      place_name: '요코하마 미나토미라이',
      tagged_at: '2024-08-03T09:20:00.000000Z',
      text_note: '',
    },
  },

  /*
   * 3.2 국가 도장 저장소. 실제 서비스에서는 계정별 COUNTRY_STAMP 테이블이며,
   * 목업에서는 tripApi가 첫 핀을 만날 때 한 번만 채운다. 핀 목록을 매 조회마다
   * 도장으로 환산하지 않도록 생성 시각과 이미지 식별자를 별도 보관한다.
   */
  countryStamps: {},

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
    107: [
      {
        photo_id: 962,
        captured_at: '2025-08-14T06:31:20.000000Z',
        file_path: photoUrl('orte-962'),
        is_pin_cover: true,
      },
      {
        photo_id: 963,
        captured_at: '2025-08-14T06:35:02.000000Z',
        file_path: photoUrl('orte-963'),
        is_pin_cover: true,
      },
      {
        photo_id: 964,
        captured_at: '2025-08-14T06:38:47.000000Z',
        file_path: photoUrl('orte-964'),
        is_pin_cover: false,
      },
    ],
    108: [
      {
        photo_id: 965,
        captured_at: '2025-08-15T01:16:05.000000Z',
        file_path: photoUrl('orte-965'),
        is_pin_cover: true,
      },
    ],
    109: [
      {
        photo_id: 966,
        captured_at: '2025-08-15T05:41:30.000000Z',
        file_path: photoUrl('orte-966'),
        is_pin_cover: true,
      },
      {
        photo_id: 967,
        captured_at: '2025-08-15T05:48:12.000000Z',
        file_path: photoUrl('orte-967'),
        is_pin_cover: true,
      },
    ],
    110: [
      {
        photo_id: 968,
        captured_at: '2025-08-16T00:21:44.000000Z',
        file_path: photoUrl('orte-968'),
        is_pin_cover: true,
      },
      {
        photo_id: 969,
        captured_at: '2025-08-16T00:26:19.000000Z',
        file_path: photoUrl('orte-969'),
        is_pin_cover: false,
      },
    ],
    111: [
      {
        photo_id: 974,
        captured_at: '2025-08-16T08:06:02.000000Z',
        file_path: photoUrl('orte-974'),
        is_pin_cover: true,
      },
      {
        photo_id: 975,
        captured_at: '2025-08-16T08:12:55.000000Z',
        file_path: photoUrl('orte-975'),
        is_pin_cover: true,
      },
      {
        photo_id: 976,
        captured_at: '2025-08-16T08:19:31.000000Z',
        file_path: photoUrl('orte-976'),
        is_pin_cover: false,
      },
    ],
    201: [
      {
        photo_id: 970,
        captured_at: '2024-08-01T00:02:31.000000Z',
        file_path: photoUrl('orte-970'),
        is_pin_cover: true,
      },
      {
        photo_id: 971,
        captured_at: '2024-08-01T00:05:47.000000Z',
        file_path: photoUrl('orte-971'),
        is_pin_cover: true,
      },
      {
        photo_id: 972,
        captured_at: '2024-08-01T00:09:12.000000Z',
        file_path: photoUrl('orte-972'),
        is_pin_cover: true,
      },
      {
        photo_id: 973,
        captured_at: '2024-08-01T00:14:03.000000Z',
        file_path: photoUrl('orte-973'),
        is_pin_cover: false,
      },
    ],
    202: [
      {
        photo_id: 980,
        captured_at: '2024-08-03T09:21:08.000000Z',
        file_path: photoUrl('orte-980'),
        is_pin_cover: true,
      },
      {
        photo_id: 981,
        captured_at: '2024-08-03T09:24:55.000000Z',
        file_path: photoUrl('orte-981'),
        is_pin_cover: false,
      },
    ],
    301: [
      {
        photo_id: 1001,
        captured_at: '2024-05-02T08:02:14.000000Z',
        file_path: photoUrl('orte-1001'),
        is_pin_cover: true,
      },
      {
        photo_id: 1002,
        captured_at: '2024-05-02T08:09:38.000000Z',
        file_path: photoUrl('orte-1002'),
        is_pin_cover: true,
      },
    ],
    302: [
      {
        photo_id: 1003,
        captured_at: '2024-05-04T10:32:51.000000Z',
        file_path: photoUrl('orte-1003'),
        is_pin_cover: true,
      },
    ],
    303: [
      {
        photo_id: 1004,
        captured_at: '2024-05-06T13:07:20.000000Z',
        file_path: photoUrl('orte-1004'),
        is_pin_cover: true,
      },
      {
        photo_id: 1005,
        captured_at: '2024-05-06T13:15:44.000000Z',
        file_path: photoUrl('orte-1005'),
        is_pin_cover: false,
      },
    ],
    304: [
      {
        photo_id: 1006,
        captured_at: '2024-05-09T07:47:03.000000Z',
        file_path: photoUrl('orte-1006'),
        is_pin_cover: true,
      },
    ],
    305: [
      {
        photo_id: 1007,
        captured_at: '2024-05-11T16:12:29.000000Z',
        file_path: photoUrl('orte-1007'),
        is_pin_cover: true,
      },
      {
        photo_id: 1008,
        captured_at: '2024-05-11T16:20:11.000000Z',
        file_path: photoUrl('orte-1008'),
        is_pin_cover: true,
      },
    ],
    306: [
      {
        photo_id: 1009,
        captured_at: '2024-05-13T09:27:47.000000Z',
        file_path: photoUrl('orte-1009'),
        is_pin_cover: true,
      },
    ],
    307: [
      {
        photo_id: 1010,
        captured_at: '2024-05-15T14:22:05.000000Z',
        file_path: photoUrl('orte-1010'),
        is_pin_cover: true,
      },
      {
        photo_id: 1011,
        captured_at: '2024-05-15T14:31:52.000000Z',
        file_path: photoUrl('orte-1011'),
        is_pin_cover: false,
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
    107: {
      voice_memo_id: 58,
      audio_file: createMockAudioUrl(14),
      duration_sec: 14,
      saved_at: '2025-08-14T06:30:40.000000Z',
    },
    108: null,
    109: null,
    110: {
      voice_memo_id: 59,
      audio_file: createMockAudioUrl(21),
      duration_sec: 21,
      saved_at: '2025-08-16T00:20:35.000000Z',
    },
    111: null,
    201: {
      voice_memo_id: 57,
      audio_file: createMockAudioUrl(24),
      duration_sec: 24,
      saved_at: '2024-08-01T00:03:10.000000Z',
    },
    202: null,
    301: {
      voice_memo_id: 60,
      audio_file: createMockAudioUrl(16),
      duration_sec: 16,
      saved_at: '2024-05-02T08:01:05.000000Z',
    },
    302: null,
    303: null,
    304: {
      voice_memo_id: 61,
      audio_file: createMockAudioUrl(11),
      duration_sec: 11,
      saved_at: '2024-05-09T07:46:20.000000Z',
    },
    305: null,
    306: null,
    307: null,
  },
})

/** 세션 동안 유지되는 mock 상태. pinApi 의 mock 분기가 직접 읽고 쓴다. */
export const mockPinStore = createInitialState()

/** 테스트나 초기화가 필요할 때 사용한다. */
export const resetMockPinStore = () => {
  Object.assign(mockPinStore, createInitialState())
}
