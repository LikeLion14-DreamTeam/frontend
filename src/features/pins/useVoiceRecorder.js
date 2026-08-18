import { useCallback, useEffect, useRef, useState } from 'react'
import {
  forgetRememberedPermissionGrant,
  rememberPermissionGranted,
} from '../permissions/devicePermissions'

const AUDIO_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
]

const getSupportedAudioType = () =>
  AUDIO_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? ''

const getAudioExtension = (mimeType) =>
  mimeType.includes('mp4') ? 'm4a' : 'webm'

/** 브라우저 MediaRecorder를 이용한 핀 음성 메모 녹음 상태를 관리한다. */
const useVoiceRecorder = () => {
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const startedAtRef = useRef(0)
  const timerRef = useRef(null)
  const audioUrlRef = useRef('')
  const mountedRef = useRef(true)
  const discardOnStopRef = useRef(false)
  const cancelRequestedRef = useRef(false)
  const isStartingRef = useRef(false)

  const [status, setStatus] = useState('idle')
  const [durationSec, setDurationSec] = useState(0)
  const [audioFile, setAudioFile] = useState(null)
  const [audioUrl, setAudioUrl] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const stopTimer = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = null
  }, [])

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const clearSavedAudio = useCallback(() => {
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
    audioUrlRef.current = ''
    setAudioUrl('')
    setAudioFile(null)
    setDurationSec(0)
  }, [])

  const startRecording = useCallback(async () => {
    if (
      isStartingRef.current ||
      status === 'requesting' ||
      status === 'recording'
    ) {
      return
    }

    isStartingRef.current = true
    cancelRequestedRef.current = false
    setErrorMessage('')
    clearSavedAudio()

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setStatus('error')
      setErrorMessage('이 브라우저는 음성 녹음을 지원하지 않습니다.')
      isStartingRef.current = false
      return
    }

    setStatus('requesting')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      rememberPermissionGranted('microphone')

      if (cancelRequestedRef.current || !mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        if (mountedRef.current) setStatus('idle')
        return
      }

      const mimeType = getSupportedAudioType()
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      )

      streamRef.current = stream
      recorderRef.current = recorder
      chunksRef.current = []
      discardOnStopRef.current = false

      recorder.addEventListener('dataavailable', ({ data }) => {
        if (data.size > 0) chunksRef.current.push(data)
      })

      recorder.addEventListener('stop', () => {
        stopTimer()
        stopStream()

        if (discardOnStopRef.current || !mountedRef.current) {
          chunksRef.current = []
          if (mountedRef.current) setStatus('idle')
          return
        }

        const recordedType = recorder.mimeType || mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: recordedType })
        const recordedDuration = Math.max(
          1,
          Math.round((Date.now() - startedAtRef.current) / 1000),
        )
        const file = new File(
          [blob],
          `orte-voice-${Date.now()}.${getAudioExtension(recordedType)}`,
          { type: recordedType, lastModified: Date.now() },
        )
        const url = URL.createObjectURL(blob)

        chunksRef.current = []
        audioUrlRef.current = url
        setAudioFile(file)
        setAudioUrl(url)
        setDurationSec(recordedDuration)
        setStatus('recorded')
      })

      startedAtRef.current = Date.now()
      recorder.start()
      setDurationSec(0)
      setStatus('recording')

      timerRef.current = window.setInterval(() => {
        setDurationSec(
          Math.floor((Date.now() - startedAtRef.current) / 1000),
        )
      }, 250)
    } catch (error) {
      stopStream()
      if (cancelRequestedRef.current) {
        setStatus('idle')
        return
      }

      setStatus('error')
      setErrorMessage(
        error.name === 'NotAllowedError'
          ? '마이크 권한이 거부되었습니다.'
          : '음성 녹음을 시작하지 못했습니다.',
      )

      if (error.name === 'NotAllowedError') {
        forgetRememberedPermissionGrant('microphone')
      }
    } finally {
      isStartingRef.current = false
    }
  }, [clearSavedAudio, status, stopStream, stopTimer])

  const stopRecording = useCallback(() => {
    cancelRequestedRef.current = true
    const recorder = recorderRef.current
    if (recorder?.state === 'recording') recorder.stop()
  }, [])

  const deleteRecording = useCallback(() => {
    cancelRequestedRef.current = true
    const recorder = recorderRef.current

    if (recorder?.state === 'recording') {
      discardOnStopRef.current = true
      recorder.stop()
    } else {
      clearSavedAudio()
      setStatus('idle')
    }

    setErrorMessage('')
  }, [clearSavedAudio])

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      discardOnStopRef.current = true
      cancelRequestedRef.current = true
      stopTimer()

      if (recorderRef.current?.state === 'recording') {
        recorderRef.current.stop()
      }

      stopStream()
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
    }
  }, [stopStream, stopTimer])

  return {
    status,
    durationSec,
    audioFile,
    audioUrl,
    errorMessage,
    startRecording,
    stopRecording,
    deleteRecording,
  }
}

export default useVoiceRecorder

export const formatVoiceDuration = (durationSec) => {
  const minutes = Math.floor(durationSec / 60)
  const seconds = durationSec % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
