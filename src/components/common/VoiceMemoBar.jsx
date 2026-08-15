import styled from 'styled-components'
import voicePauseIcon from '../../assets/map/voice-pause.png'
import voicePlayIcon from '../../assets/photobooks/voice-play.svg'

const DEFAULT_WAVE_HEIGHTS = [
  5, 9, 14, 7, 17, 11, 6, 15, 19, 9, 5, 12, 17, 8, 11, 5, 10, 15,
  7, 13, 9, 6, 11, 16, 8, 12, 6, 14, 9, 5, 11, 17, 7, 10, 15, 8,
  13, 6, 12, 18, 9, 7, 14, 11, 5, 16, 8, 12, 10, 6, 15, 9, 7, 13,
  11, 6,
]

const clampProgress = (progress) => Math.min(1, Math.max(0, progress || 0))

const formatDuration = (duration) => {
  if (typeof duration === 'string') return duration
  if (!Number.isFinite(duration)) return '00:00'

  const minutes = Math.floor(duration / 60)
  const seconds = Math.floor(duration % 60)

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const VoiceMemoBar = ({
  className,
  duration = 0,
  isPlaying = false,
  progress = 0,
  onToggle,
  disabled = false,
  waveHeights = DEFAULT_WAVE_HEIGHTS,
}) => {
  const playedRatio = clampProgress(progress)

  return (
    <Bar className={className}>
      <PlayButton
        type="button"
        aria-label={isPlaying ? '음성 일시정지' : '음성 재생'}
        aria-pressed={isPlaying}
        onClick={onToggle}
        disabled={disabled || !onToggle}
      >
        <img src={isPlaying ? voicePauseIcon : voicePlayIcon} alt="" />
      </PlayButton>

      <Waveform aria-hidden="true">
        {waveHeights.map((height, index) => (
          <Wave
            key={`${height}-${index}`}
            $height={height}
            $played={index < waveHeights.length * playedRatio}
          />
        ))}
      </Waveform>

      <Duration>{formatDuration(duration)}</Duration>
    </Bar>
  )
}

export default VoiceMemoBar

const Bar = styled.div`
  width: 100%;
  min-width: 0;
  height: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
`

const PlayButton = styled.button`
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;

  img {
    width: 22px;
    height: 22px;
    display: block;
    object-fit: contain;
  }

  &:disabled {
    cursor: default;
    opacity: 0.45;
  }
`

const Waveform = styled.span`
  min-width: 0;
  height: 24px;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 2px;
  overflow: hidden;
`

const Wave = styled.span`
  width: 2px;
  height: ${({ $height }) => `${$height}px`};
  flex: 0 0 2px;
  border-radius: 1px;
  background: ${({ $played }) =>
    $played ? 'var(--Primary-Cognac)' : 'rgb(181 161 140 / 45%)'};
`

const Duration = styled.span`
  flex: 0 0 auto;
  color: var(--Text-Secondary);
  font-family: var(--font-sans);
  font-size: 10px;
  line-height: 18px;
  white-space: nowrap;
`
