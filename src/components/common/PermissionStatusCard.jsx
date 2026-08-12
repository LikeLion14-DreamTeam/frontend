import styled, { css } from 'styled-components'

/**
 * 권한/기능 상태를 보여주는 공통 카드입니다.
 *
 * 기본 사용:
 * <PermissionStatusCard {...permissionStatusCardPresets.camera} />
 *
 * 비활성 상태:
 * <PermissionStatusCard {...permissionStatusCardPresets.camera} disabled />
 *
 * NFC/카메라/위치처럼 이미 정의된 권한 카드는
 * 직접 title/icon/description을 반복 작성하지 말고
 * PermissionStatusCard.constants.js의 preset을 우선 사용하세요.
 */

const DEFAULT_ICON_SIZE = {
  width: 28,
  height: 28,
}

const getIconSize = (iconSize = DEFAULT_ICON_SIZE) => {
  if (!iconSize) {
    return DEFAULT_ICON_SIZE
  }

  if (typeof iconSize === 'number') {
    return {
      width: iconSize,
      height: iconSize,
    }
  }

  return {
    width: iconSize.width ?? DEFAULT_ICON_SIZE.width,
    height: iconSize.height ?? DEFAULT_ICON_SIZE.height,
  }
}

const PermissionStatusCard = ({
  title,
  description,
  icon,
  disabled = false,
  disabledTitle,
  disabledDescription,
  disabledIcon,
  badgeLabel,
  enabledBadgeLabel = '필수',
  disabledBadgeLabel = '꺼짐',
  iconAlt = '',
  iconSize,
  className,
}) => {
  const resolvedTitle = disabled ? disabledTitle || title : title
  const resolvedDescription = disabled
    ? disabledDescription || description
    : description
  const resolvedIcon = disabled ? disabledIcon || icon : icon
  const resolvedBadgeLabel =
    badgeLabel || (disabled ? disabledBadgeLabel : enabledBadgeLabel)
  const resolvedIconSize = getIconSize(iconSize)

  return (
    <Card className={className} data-state={disabled ? 'disabled' : 'enabled'}>
      <IconBox $disabled={disabled}>
        {resolvedIcon && (
          <IconImage
            src={resolvedIcon}
            alt={iconAlt}
            $width={resolvedIconSize.width}
            $height={resolvedIconSize.height}
          />
        )}
      </IconBox>

      <TextArea>
        <TitleRow>
          <Title $disabled={disabled}>{resolvedTitle}</Title>
          <Badge $disabled={disabled}>{resolvedBadgeLabel}</Badge>
        </TitleRow>
        <Description $disabled={disabled}>{resolvedDescription}</Description>
      </TextArea>
    </Card>
  )
}

export default PermissionStatusCard

const disabledText = css`
  color: var(--State-Disabled-Text);
`

const Card = styled.article`
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 14px;
  overflow: hidden;
  border: 1px solid var(--Border-Default);
  border-radius: 14px;
  background: var(--Surface-Base);
`

const IconBox = styled.div`
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 12px;
  background: ${({ $disabled }) =>
    $disabled ? 'var(--State-Disabled-Fill)' : 'rgb(197 161 91 / 16%)'};
`

const IconImage = styled.img`
  width: ${({ $width }) => $width}px;
  height: ${({ $height }) => $height}px;
  display: block;
  object-fit: contain;
  pointer-events: none;
`

const TextArea = styled.div`
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
`

const TitleRow = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
`

const Title = styled.p`
  min-width: 0;
  flex: 1;
  color: var(--Text-Primary);
  font: var(--text-ui-label);
  word-break: break-word;

  ${({ $disabled }) => $disabled && disabledText}
`

const Badge = styled.span`
  flex: 0 0 auto;
  padding: 2px 7px;
  border-radius: 5px;
  background: ${({ $disabled }) =>
    $disabled ? 'var(--State-Disabled-Fill)' : 'var(--Background-Base)'};
  color: var(--Text-Secondary);
  font-size: 10px;
  font-weight: 400;
  line-height: 18px;
  white-space: nowrap;
  word-break: break-word;

  ${({ $disabled }) => $disabled && disabledText}
`

const Description = styled.p`
  width: 100%;
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
  word-break: break-word;

  ${({ $disabled }) => $disabled && disabledText}
`
