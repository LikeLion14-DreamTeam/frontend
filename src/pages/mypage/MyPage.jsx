import { useEffect, useRef, useState } from 'react'
import { googleLogout } from '@react-oauth/google'
import { useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Button from '../../components/common/Button'
import NavBar from '../../components/layout/NavBar'
import {
  clearSessionToken,
  getSessionToken,
} from '../../api/session'
import { getMyAccount, logout } from '../../features/auth/authApi'
import useAuthStore from '../../features/auth/useAuthStore'
import {
  getTasteProfileAxes,
  updateTasteProfileAxis,
} from '../../features/onboarding/tasteProfileApi'
import { getOnboardingFlowPath } from '../../features/onboarding/onboardingFlow'
import addIcon from '../../assets/icons/mypage/add.svg'
import briefcaseIcon from '../../assets/icons/mypage/briefcase.svg'
import chevronRightIcon from '../../assets/icons/mypage/chevron-right.svg'
import closeIcon from '../../assets/icons/mypage/close.png'
import keyIcon from '../../assets/icons/mypage/key.svg'
import refreshIcon from '../../assets/icons/mypage/refresh.svg'
import userIcon from '../../assets/icons/mypage/user.svg'

const stats = [
  { label: '태깅 횟수', value: 12 },
  { label: '완료 여정', value: 2 },
  { label: '방문 도시', value: 4 },
]

const TASTE_AXIS_PRESENTATION = [
  { axisCode: 'brightness', left: '밝은', right: '어두운' },
  { axisCode: 'vividness', left: '선명한', right: '차분한' },
  { axisCode: 'tone', left: '웜', right: '쿨' },
  { axisCode: 'density', left: '여백 많은', right: '꽉 찬' },
  { axisCode: 'framing', left: '클로즈업', right: '넓게' },
  { axisCode: 'angle', left: '정면', right: '뒷모습·옆모습' },
]

const TASTE_AXIS_COMMIT_KEYS = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowDown',
  'ArrowUp',
  'Home',
  'End',
  'PageDown',
  'PageUp',
])

const RELEARNING_COMPLETED_MESSAGE =
  '취향 프로필이 갱신되었습니다. 기존 추천은 유지되며, 이후 생성하거나 재추천한 사진부터 새 기준이 적용됩니다.'

const getAxisValue = (value) => {
  if (value === null || value === undefined) return 50

  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) return 50

  return Math.min(100, Math.max(0, numericValue))
}

const createTasteAxisPresentation = (axes = []) => {
  const axisByCode = new Map(axes.map((axis) => [axis.axis_code, axis]))

  return TASTE_AXIS_PRESENTATION.map((presentation) => {
    const axis = axisByCode.get(presentation.axisCode)

    return {
      ...presentation,
      value: getAxisValue(axis?.value),
      status: axis?.status ?? 'REFLECTED',
    }
  })
}

const products = [
  { id: 1, name: '비세토스 백팩', count: '9회 태깅', icon: briefcaseIcon },
  { id: 2, name: '로고 참 키링', count: '3회 태깅', icon: keyIcon },
]

const settings = [
  { label: '위치 권한', state: '허용됨' },
  { label: '카메라 권한', state: '허용됨' },
  { label: '알림', state: '켜짐' },
]

const MyPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const storedUser = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const clearUser = useAuthStore((state) => state.clearUser)
  const [account, setAccount] = useState(storedUser)
  const [isAccountLoading, setIsAccountLoading] = useState(true)
  const [accountError, setAccountError] = useState('')
  const [accountRequestKey, setAccountRequestKey] = useState(0)
  const [tasteAxes, setTasteAxes] = useState([])
  const [isTasteAxesLoading, setIsTasteAxesLoading] = useState(true)
  const [tasteAxesError, setTasteAxesError] = useState('')
  const [tasteAxesRequestKey, setTasteAxesRequestKey] = useState(0)
  const [savingTasteAxisCodes, setSavingTasteAxisCodes] = useState([])
  const [tasteAxisSaveError, setTasteAxisSaveError] = useState('')
  const savedTasteAxisValuesRef = useRef(new Map())
  const savingTasteAxisCodesRef = useRef(new Set())
  const [relearningNotice] = useState(() =>
    location.state?.relearningCompleted
      ? RELEARNING_COMPLETED_MESSAGE
      : '',
  )

  useEffect(() => {
    let ignore = false

    const loadAccount = async () => {
      setIsAccountLoading(true)
      setAccountError('')

      try {
        const currentUser = await getMyAccount()

        if (!ignore) {
          setAccount(currentUser)
          setUser(currentUser)
        }
      } catch (error) {
        if (ignore) {
          return
        }

        if (error.code === 'UNAUTHENTICATED') {
          clearSessionToken()
          clearUser()
          navigate('/login', { replace: true })
          return
        }

        setAccountError(error.message)
      } finally {
        if (!ignore) {
          setIsAccountLoading(false)
        }
      }
    }

    loadAccount()

    return () => {
      ignore = true
    }
  }, [accountRequestKey, clearUser, navigate, setUser])

  useEffect(() => {
    let ignore = false

    const loadTasteAxes = async () => {
      setIsTasteAxesLoading(true)
      setTasteAxesError('')

      try {
        const tasteProfile = await getTasteProfileAxes()

        if (!ignore) {
          const presentedTasteAxes = createTasteAxisPresentation(
            tasteProfile.axes,
          )

          setTasteAxes(presentedTasteAxes)
          savedTasteAxisValuesRef.current = new Map(
            presentedTasteAxes.map((axis) => [axis.axisCode, axis.value]),
          )
          setTasteAxisSaveError('')
        }
      } catch (error) {
        if (ignore) return

        if (error.code === 'UNAUTHENTICATED') {
          clearSessionToken()
          clearUser()
          navigate('/login', { replace: true })
          return
        }

        setTasteAxes([])
        savedTasteAxisValuesRef.current = new Map()
        setTasteAxesError(
          error.message ?? '취향 프로필을 불러오지 못했습니다.',
        )
      } finally {
        if (!ignore) {
          setIsTasteAxesLoading(false)
        }
      }
    }

    loadTasteAxes()

    return () => {
      ignore = true
    }
  }, [clearUser, navigate, tasteAxesRequestKey])

  const handleTasteAxisChange = (axisCode, rawValue) => {
    const value = getAxisValue(rawValue)

    setTasteAxes((currentAxes) =>
      currentAxes.map((axis) =>
        axis.axisCode === axisCode ? { ...axis, value } : axis,
      ),
    )
    setTasteAxisSaveError('')
  }

  const commitTasteAxisValue = async (axisCode, rawValue) => {
    const value = getAxisValue(rawValue)
    const savedValue = savedTasteAxisValuesRef.current.get(axisCode)

    if (
      savedValue === value ||
      savingTasteAxisCodesRef.current.has(axisCode)
    ) {
      return
    }

    savingTasteAxisCodesRef.current.add(axisCode)
    setSavingTasteAxisCodes([...savingTasteAxisCodesRef.current])
    setTasteAxisSaveError('')

    try {
      const updatedAxis = await updateTasteProfileAxis({ axisCode, value })
      const updatedValue = getAxisValue(updatedAxis.value)

      savedTasteAxisValuesRef.current.set(axisCode, updatedValue)
      setTasteAxes((currentAxes) =>
        currentAxes.map((axis) =>
          axis.axisCode === axisCode
            ? {
                ...axis,
                value: updatedValue,
                status: updatedAxis.status,
              }
            : axis,
        ),
      )
    } catch (error) {
      if (error.code === 'UNAUTHENTICATED') {
        clearSessionToken()
        clearUser()
        navigate('/login', { replace: true })
        return
      }

      setTasteAxes((currentAxes) =>
        currentAxes.map((axis) =>
          axis.axisCode === axisCode
            ? { ...axis, value: savedValue }
            : axis,
        ),
      )
      setTasteAxisSaveError(
        error.message ?? '취향 값을 저장하지 못했습니다. 다시 시도해 주세요.',
      )
    } finally {
      savingTasteAxisCodesRef.current.delete(axisCode)
      setSavingTasteAxisCodes([...savingTasteAxisCodesRef.current])
    }
  }

  const handleTasteAxisKeyUp = (axisCode, event) => {
    if (!TASTE_AXIS_COMMIT_KEYS.has(event.key)) return

    void commitTasteAxisValue(axisCode, event.currentTarget.value)
  }

  const handleStartRelearning = () => {
    const shouldStartRelearning = window.confirm(
      '재학습을 완료하면 기존 취향 프로필이 새 응답으로 교체됩니다. 완료 전까지는 기존 프로필이 유지됩니다. 재학습을 시작할까요?',
    )

    if (!shouldStartRelearning) return

    navigate(
      getOnboardingFlowPath('/onboarding/basic-question', true),
    )
  }

  const handleLogout = () => {
    const sessionToken = getSessionToken()
    const logoutRequest = logout(sessionToken)

    // 명세 1.2: 네트워크 결과와 무관하게 로컬 세션을 즉시 폐기한다.
    clearSessionToken()
    clearUser()
    googleLogout()
    navigate('/login', { replace: true })

    // 서버 세션 해제 실패는 사용자 로그아웃을 되돌리지 않는다.
    void logoutRequest.catch(() => {})
  }

  return (
    <PageShell>
      <Content>
        <ProfileSection aria-label="프로필">
          <Avatar>
            <AvatarIcon src={userIcon} alt="" aria-hidden="true" />
          </Avatar>
          <ProfileText>
            <UserName>
              {account?.email ??
                (isAccountLoading ? '계정 정보 불러오는 중...' : 'Orte 여행자')}
            </UserName>
            {accountError ? (
              <AccountError role="alert">
                {accountError}
                <RetryButton
                  type="button"
                  onClick={() => setAccountRequestKey((key) => key + 1)}
                >
                  재시도
                </RetryButton>
              </AccountError>
            ) : (
              <AccountType>Google 계정으로 연결됨</AccountType>
            )}
          </ProfileText>
        </ProfileSection>

        <StatsGrid aria-label="활동 통계">
          {stats.map((stat) => (
            <StatCard key={stat.label}>
              <StatValue>{stat.value}</StatValue>
              <StatLabel>{stat.label}</StatLabel>
            </StatCard>
          ))}
        </StatsGrid>

        {relearningNotice && (
          <RelearningNotice role="status">{relearningNotice}</RelearningNotice>
        )}

        <Panel>
          <SectionHeader>
            <SectionTitle>취향 프로필</SectionTitle>
            <RelearnButton type="button" onClick={handleStartRelearning}>
              재학습
              <RefreshIcon src={refreshIcon} alt="" aria-hidden="true" />
            </RelearnButton>
          </SectionHeader>

          {isTasteAxesLoading ? (
            <PreferenceFeedback role="status">
              취향 프로필을 불러오는 중...
            </PreferenceFeedback>
          ) : tasteAxesError ? (
            <PreferenceFeedback role="alert" $error>
              <span>{tasteAxesError}</span>
              <RetryButton
                type="button"
                onClick={() => setTasteAxesRequestKey((key) => key + 1)}
              >
                재시도
              </RetryButton>
            </PreferenceFeedback>
          ) : (
            <>
              <PreferenceList>
                {tasteAxes.map((preference) => {
                  const isSaving = savingTasteAxisCodes.includes(
                    preference.axisCode,
                  )

                  return (
                    <PreferenceItem
                      key={preference.axisCode}
                      aria-busy={
                        preference.status === 'PENDING' || isSaving
                      }
                    >
                      <PreferenceLabels>
                        <span>{preference.left}</span>
                        <span>{preference.right}</span>
                      </PreferenceLabels>
                      <PreferenceSlider
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={preference.value}
                        style={{
                          '--slider-progress': `${preference.value}%`,
                        }}
                        aria-label={`${preference.left}에서 ${preference.right} 사이의 취향 값`}
                        aria-valuetext={`${Math.round(preference.value)}점${
                          isSaving
                            ? ', 저장 중'
                            : preference.status === 'PENDING'
                              ? ', 반영 중'
                              : ''
                        }`}
                        onChange={(event) =>
                          handleTasteAxisChange(
                            preference.axisCode,
                            event.currentTarget.value,
                          )
                        }
                        onPointerUp={(event) =>
                          void commitTasteAxisValue(
                            preference.axisCode,
                            event.currentTarget.value,
                          )
                        }
                        onPointerCancel={(event) =>
                          void commitTasteAxisValue(
                            preference.axisCode,
                            event.currentTarget.value,
                          )
                        }
                        onKeyUp={(event) =>
                          handleTasteAxisKeyUp(preference.axisCode, event)
                        }
                        onBlur={(event) =>
                          void commitTasteAxisValue(
                            preference.axisCode,
                            event.currentTarget.value,
                          )
                        }
                        disabled={isSaving}
                      />
                    </PreferenceItem>
                  )
                })}
              </PreferenceList>
              {tasteAxisSaveError && (
                <PreferenceUpdateFeedback role="alert" $error>
                  {tasteAxisSaveError}
                </PreferenceUpdateFeedback>
              )}
            </>
          )}
        </Panel>

        <Panel>
          <SectionHeader>
            <SectionTitle>내 MCM 제품</SectionTitle>
            <ProductTotal>{products.length}개</ProductTotal>
          </SectionHeader>

          <ProductList>
            {products.map((product) => (
              <ProductItem key={product.id}>
                <ProductIdentity>
                  <ProductIcon src={product.icon} alt="" aria-hidden="true" />
                  <ProductName>{product.name}</ProductName>
                </ProductIdentity>
                <ProductMeta>
                  <ProductCount>{product.count}</ProductCount>
                  <RemoveButton type="button" aria-label={`${product.name} 삭제`}>
                    <RemoveIcon src={closeIcon} alt="" aria-hidden="true" />
                  </RemoveButton>
                </ProductMeta>
              </ProductItem>
            ))}
          </ProductList>

          <TagButton type="button" $variant="secondary">
            <AddIcon src={addIcon} alt="" aria-hidden="true" />
            새 제품 태그하기
          </TagButton>
        </Panel>

        <AccountPanel aria-label="설정">
          {settings.map((setting) => (
            <SettingRow type="button" key={setting.label}>
              <SettingLabel>{setting.label}</SettingLabel>
              <SettingState>{setting.state}</SettingState>
              <ChevronIcon src={chevronRightIcon} alt="" aria-hidden="true" />
            </SettingRow>
          ))}
          <SettingRow type="button" onClick={handleLogout}>
            <LogoutLabel>로그아웃</LogoutLabel>
            <ChevronIcon src={chevronRightIcon} alt="" aria-hidden="true" />
          </SettingRow>
        </AccountPanel>
      </Content>

      <NavigationBoundary>
        <NavBar />
      </NavigationBoundary>
    </PageShell>
  )
}

export default MyPage

const PageShell = styled.main`
  width: 100%;
  max-width: 402px;
  height: var(--app-viewport-height);
  margin: 0 auto;
  overflow-y: auto;
  scrollbar-width: none;
  background: var(--Background-Base);
  color: var(--Text-Primary);

  &::-webkit-scrollbar {
    display: none;
  }
`

const Content = styled.div`
  width: 100%;
  max-width: 402px;
  min-height: 100%;
  margin: 0 auto;
  padding: calc(74px - var(--design-safe-top)) 24px 115px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: var(--Background-Base);
`

const ProfileSection = styled.section`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 15px;
`

const Avatar = styled.div`
  width: 72px;
  height: 72px;
  flex: 0 0 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24px;
  background: #e7d7c6;
  overflow: hidden;
`

const AvatarIcon = styled.img`
  width: 36px;
  height: 36px;
  display: block;
`

const ProfileText = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
`

const UserName = styled.h1`
  color: #1f2937;
  font: var(--text-ui-h2);
  letter-spacing: -0.22px;
`

const AccountType = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
`

const AccountError = styled.p`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #b42318;
  font: var(--text-ui-caption);
`

const RetryButton = styled.button`
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--Primary-Cognac);
  font: var(--text-ui-caption);
  text-decoration: underline;
  cursor: pointer;
`

const StatsGrid = styled.section`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
`

const StatCard = styled.article`
  min-width: 0;
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border-radius: 8px;
  background: var(--Surface-Base);
  box-shadow: var(--Effect-Chip);
  text-align: center;
`

const StatValue = styled.strong`
  color: #1f2937;
  font: var(--text-ui-h3);
`

const StatLabel = styled.span`
  color: #6b7280;
  font: var(--text-ui-nav);
  white-space: nowrap;
`

const Panel = styled.section`
  width: 100%;
  padding: 25px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  border-radius: 16px;
  background: var(--Surface-Base);
  box-shadow: var(--Effect-Chip);
  overflow: hidden;
`

const SectionHeader = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`

const SectionTitle = styled.h2`
  min-width: 0;
  color: var(--Text-Primary);
  font: var(--text-ui-h3);
`

const RelearnButton = styled.button`
  flex: 0 0 auto;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 0;
  background: transparent;
  color: var(--Primary-Cognac);
  font: var(--text-ui-label);
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--Primary-Cognac);
    outline-offset: 3px;
    border-radius: 3px;
  }
`

const RefreshIcon = styled.img`
  width: 13px;
  height: 13px;
  display: block;
`

const PreferenceList = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
`

const RelearningNotice = styled.p`
  padding: 12px 14px;
  border: 1px solid rgb(181 118 59 / 35%);
  border-radius: 10px;
  background: rgb(181 118 59 / 8%);
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
  line-height: 1.55;
  word-break: keep-all;
`

const PreferenceFeedback = styled.p`
  min-height: 132px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: ${({ $error }) => ($error ? '#b42318' : 'var(--Text-Secondary)')};
  font: var(--text-ui-caption);
  text-align: center;
`

const PreferenceUpdateFeedback = styled.p`
  color: ${({ $error }) => ($error ? '#b42318' : 'var(--Text-Secondary)')};
  font: var(--text-ui-caption);
  text-align: center;
`

const PreferenceItem = styled.label`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
`

const PreferenceLabels = styled.div`
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  color: var(--Text-Secondary);
  font: 400 11px/18px var(--font-sans);
`

const PreferenceSlider = styled.input`
  width: 100%;
  height: 20px;
  margin: 0;
  padding: 0;
  display: block;
  -webkit-appearance: none;
  appearance: none;
  border: 0;
  background: transparent;
  cursor: pointer;
  touch-action: none;

  &:disabled {
    opacity: 1;
    cursor: default;
  }

  &::-webkit-slider-runnable-track {
    width: 100%;
    height: 1px;
    background: linear-gradient(
      to right,
      rgb(181 118 59 / 50%) 0 var(--slider-progress),
      var(--Border-Default) var(--slider-progress) 100%
    );
  }

  &::-webkit-slider-thumb {
    width: 10px;
    height: 10px;
    margin-top: -4.5px;
    -webkit-appearance: none;
    appearance: none;
    border: 0;
    border-radius: 50%;
    background: var(--Primary-Cognac);
  }

  &::-moz-range-track {
    width: 100%;
    height: 1px;
    border: 0;
    background: linear-gradient(
      to right,
      rgb(181 118 59 / 50%) 0 var(--slider-progress),
      var(--Border-Default) var(--slider-progress) 100%
    );
  }

  &::-moz-range-thumb {
    width: 10px;
    height: 10px;
    border: 0;
    border-radius: 50%;
    background: var(--Primary-Cognac);
  }

  &:focus-visible {
    outline: 2px solid var(--Primary-Cognac);
    outline-offset: 3px;
    border-radius: 5px;
  }
`

const ProductTotal = styled.span`
  flex: 0 0 auto;
  color: var(--Primary-Cognac);
  font: var(--text-ui-label);
`

const ProductList = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const ProductItem = styled.article`
  width: 100%;
  min-height: 38px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-radius: 8px;
  background: var(--Background-Base);
`

const ProductIdentity = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
`

const ProductIcon = styled.img`
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  display: block;
`

const ProductName = styled.p`
  min-width: 0;
  overflow: hidden;
  color: #1f2937;
  font: 400 13px/18px var(--font-sans);
  text-overflow: ellipsis;
  white-space: nowrap;
`

const ProductMeta = styled.div`
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 11px;
`

const ProductCount = styled.span`
  color: #6b7280;
  font: var(--text-ui-nav);
  white-space: nowrap;
`

const RemoveButton = styled.button`
  width: 16px;
  height: 16px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--Primary-Cognac);
    outline-offset: 2px;
    border-radius: 2px;
  }
`

const RemoveIcon = styled.img`
  width: 16px;
  height: 16px;
  display: block;
  object-fit: cover;
`

const TagButton = styled(Button)`
  height: 44px;
  border-color: rgb(181 118 59 / 50%);
  border-radius: 22px;
  color: var(--Primary-Cognac);
  background: transparent;
  font: var(--text-ui-button);

  &:hover {
    border-color: var(--Primary-Cognac);
  }

  &:focus-visible {
    outline: 2px solid var(--Primary-Cognac);
    outline-offset: 3px;
  }
`

const AddIcon = styled.img`
  width: 12px;
  height: 12px;
  display: block;
`

const AccountPanel = styled.section`
  width: 100%;
  padding: 10px 16px;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  background: var(--Surface-Base);
  box-shadow: var(--Effect-Chip);
  overflow: hidden;
`

const SettingRow = styled.button`
  width: 100%;
  min-height: 47px;
  padding: 14px 10px;
  display: flex;
  align-items: center;
  gap: 15px;
  border: 0;
  border-bottom: 1px solid rgb(222 211 198 / 70%);
  background: transparent;
  color: var(--Text-Primary);
  text-align: left;
  cursor: pointer;

  &:last-child {
    border-bottom: 0;
  }

  &:focus-visible {
    outline: 2px solid var(--Primary-Cognac);
    outline-offset: -2px;
  }
`

const SettingLabel = styled.span`
  min-width: 0;
  flex: 1 1 auto;
  font: var(--text-ui-label);
`

const SettingState = styled.span`
  flex: 0 0 auto;
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
  white-space: nowrap;
`

const LogoutLabel = styled(SettingLabel)`
  color: var(--Text-Secondary);
`

const ChevronIcon = styled.img`
  width: 5px;
  height: 10px;
  flex: 0 0 5px;
  display: block;
`

const NavigationBoundary = styled.div`
  nav {
    width: min(100%, 402px);
    left: 50%;
    transform: translateX(-50%);
  }
`
