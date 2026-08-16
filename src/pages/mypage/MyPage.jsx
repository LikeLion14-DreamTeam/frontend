import { useEffect, useRef, useState } from 'react'
import { googleLogout } from '@react-oauth/google'
import { useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import ConfirmationModal from '../../components/common/ConfirmationModal'
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
import {
  getProducts,
  unlinkProduct,
} from '../../features/products/productApi'
import briefcaseIcon from '../../assets/icons/mypage/briefcase.svg'
import chevronRightIcon from '../../assets/icons/mypage/chevron-right.svg'
import closeIcon from '../../assets/icons/mypage/close.png'
import keyIcon from '../../assets/icons/mypage/key.svg'
import relearningCurrentIcon from '../../assets/icons/mypage/relearning-current.svg'
import relearningWarningIcon from '../../assets/icons/mypage/relearning-warning.svg'
import refreshIcon from '../../assets/icons/mypage/refresh.svg'
import unlinkPreservedIcon from '../../assets/icons/mypage/unlink-preserved.svg'
import unlinkWarningIcon from '../../assets/icons/mypage/unlink-warning.svg'
import userIcon from '../../assets/icons/mypage/user.svg'

const TASTE_AXIS_PRESENTATION = [
  { axisCode: 'brightness', left: '어두운', right: '밝은' },
  { axisCode: 'vividness', left: '차분한', right: '선명한' },
  { axisCode: 'tone', left: '차가운', right: '따뜻한' },
  { axisCode: 'density', left: '여백있는', right: '밀도있는' },
  { axisCode: 'photo_type', left: '풍경', right: '인물' },
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

const RELEARNING_PROFILE_RESPONSE_COUNTS =
  '기본 질문 5 · 사진 비교 5 · 무드보드 3'

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

const PRODUCT_ICON_BY_TYPE = {
  BAG: briefcaseIcon,
}

const getProductIcon = (productType) =>
  PRODUCT_ICON_BY_TYPE[productType] ?? keyIcon

const getProductName = ({ product_name: productName, tag_id: tagId }) =>
  productName?.trim() || `미확인 제품 (${tagId})`

const formatIsoDate = (isoString) => {
  const dateParts = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoString ?? '')

  if (!dateParts) return ''

  return `${dateParts[1]}.${dateParts[2]}.${dateParts[3]}`
}

const getProductRegisteredDate = (registeredAt) => {
  const registeredDate = formatIsoDate(registeredAt)

  return registeredDate ? `${registeredDate} 태깅` : '등록일 미확인'
}

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
  const [tasteProfileLastUpdatedAt, setTasteProfileLastUpdatedAt] =
    useState(null)
  const [isTasteAxesLoading, setIsTasteAxesLoading] = useState(true)
  const [tasteAxesError, setTasteAxesError] = useState('')
  const [tasteAxesRequestKey, setTasteAxesRequestKey] = useState(0)
  const [savingTasteAxisCodes, setSavingTasteAxisCodes] = useState([])
  const [tasteAxisSaveError, setTasteAxisSaveError] = useState('')
  const [isRelearningConfirmOpen, setIsRelearningConfirmOpen] =
    useState(false)
  const [products, setProducts] = useState([])
  const [isProductsLoading, setIsProductsLoading] = useState(true)
  const [productsError, setProductsError] = useState('')
  const [productsRequestKey, setProductsRequestKey] = useState(0)
  const [unlinkingProductTagId, setUnlinkingProductTagId] = useState(null)
  const [productPendingUnlink, setProductPendingUnlink] = useState(null)
  const [productUnlinkError, setProductUnlinkError] = useState('')
  const savedTasteAxisValuesRef = useRef(new Map())
  const savingTasteAxisCodesRef = useRef(new Set())
  const [relearningNotice] = useState(() =>
    location.state?.relearningCompleted
      ? RELEARNING_COMPLETED_MESSAGE
      : '',
  )
  const stats = [
    { label: '핀 개수', value: account?.pin_count ?? 0 },
    { label: '완료 여정', value: account?.completed_trip_count ?? 0 },
    { label: '방문 도시', value: account?.visited_city_count ?? 0 },
  ]

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
          setTasteProfileLastUpdatedAt(
            typeof tasteProfile.last_updated_at === 'string'
              ? tasteProfile.last_updated_at
              : null,
          )
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
        setTasteProfileLastUpdatedAt(null)
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

  useEffect(() => {
    let ignore = false

    const loadProducts = async () => {
      setIsProductsLoading(true)
      setProductsError('')
      setProductUnlinkError('')

      try {
        const productList = await getProducts()

        if (!ignore) {
          setProducts(
            Array.isArray(productList.products) ? productList.products : [],
          )
        }
      } catch (error) {
        if (ignore) return

        if (error.code === 'UNAUTHENTICATED') {
          clearSessionToken()
          clearUser()
          navigate('/login', { replace: true })
          return
        }

        setProducts([])
        setProductsError(
          error.message ?? '등록 제품을 불러오지 못했습니다.',
        )
      } finally {
        if (!ignore) {
          setIsProductsLoading(false)
        }
      }
    }

    loadProducts()

    return () => {
      ignore = true
    }
  }, [clearUser, navigate, productsRequestKey])

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

      try {
        const refreshedTasteProfile = await getTasteProfileAxes()

        if (typeof refreshedTasteProfile.last_updated_at === 'string') {
          setTasteProfileLastUpdatedAt(
            refreshedTasteProfile.last_updated_at,
          )
        }
      } catch {
        // 축 값 저장은 완료됐으므로 날짜 갱신 실패만으로 값을 롤백하지 않는다.
      }
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
    setIsRelearningConfirmOpen(false)

    navigate(
      getOnboardingFlowPath('/onboarding/basic-question', true),
    )
  }

  const handleOpenProductUnlink = (product) => {
    if (unlinkingProductTagId !== null) return

    setProductUnlinkError('')
    setProductPendingUnlink(product)
  }

  const handleCancelProductUnlink = () => {
    if (unlinkingProductTagId !== null) return

    setProductPendingUnlink(null)
  }

  const handleConfirmProductUnlink = async () => {
    if (!productPendingUnlink || unlinkingProductTagId !== null) return

    const product = productPendingUnlink

    setUnlinkingProductTagId(product.tag_id)
    setProductUnlinkError('')

    try {
      const unlinkedProduct = await unlinkProduct(product.tag_id)

      setProducts((currentProducts) =>
        currentProducts.filter(
          (currentProduct) =>
            currentProduct.tag_id !== unlinkedProduct.tag_id,
        ),
      )
      setProductPendingUnlink(null)
    } catch (error) {
      if (error.code === 'UNAUTHENTICATED') {
        clearSessionToken()
        clearUser()
        navigate('/login', { replace: true })
        return
      }

      setProductUnlinkError(
        error.message ?? '제품 연결을 해제하지 못했습니다.',
      )
      setProductPendingUnlink(null)
    } finally {
      setUnlinkingProductTagId(null)
    }
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

  const tasteProfileUpdatedDate = formatIsoDate(
    tasteProfileLastUpdatedAt,
  )

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
            <RelearnButton
              type="button"
              onClick={() => setIsRelearningConfirmOpen(true)}
            >
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
            <ProductTotal>
              {isProductsLoading ? '조회 중' : `${products.length}개`}
            </ProductTotal>
          </SectionHeader>

          {isProductsLoading ? (
            <ProductFeedback role="status">
              등록 제품을 불러오는 중...
            </ProductFeedback>
          ) : productsError ? (
            <ProductFeedback role="alert" $error>
              <span>{productsError}</span>
              <RetryButton
                type="button"
                onClick={() => setProductsRequestKey((key) => key + 1)}
              >
                재시도
              </RetryButton>
            </ProductFeedback>
          ) : products.length === 0 ? (
            <ProductEmptyState>
              <strong>아직 등록된 제품이 없습니다.</strong>
              <span>제품에 태깅하면 이 목록에 자동으로 추가됩니다.</span>
            </ProductEmptyState>
          ) : (
            <>
              <ProductList>
                {products.map((product) => {
                  const productName = getProductName(product)

                  return (
                    <ProductItem key={product.tag_id}>
                      <ProductIdentity>
                        <ProductIcon
                          src={getProductIcon(product.product_type)}
                          alt=""
                          aria-hidden="true"
                        />
                        <ProductName>{productName}</ProductName>
                      </ProductIdentity>
                      <ProductMeta>
                        <ProductCount>
                          핀 {product.pin_count}개
                        </ProductCount>
                        <RemoveButton
                          type="button"
                          aria-label={`${productName} ${
                            unlinkingProductTagId === product.tag_id
                              ? '연결 해제 중'
                              : '연결 해제'
                          }`}
                          disabled={unlinkingProductTagId !== null}
                          onClick={() => handleOpenProductUnlink(product)}
                        >
                          <RemoveIcon
                            src={closeIcon}
                            alt=""
                            aria-hidden="true"
                          />
                        </RemoveButton>
                      </ProductMeta>
                    </ProductItem>
                  )
                })}
              </ProductList>
              {productUnlinkError && (
                <ProductActionFeedback role="alert">
                  {productUnlinkError}
                </ProductActionFeedback>
              )}
              <ProductRegistrationGuide>
                제품에 태깅하면 자동으로 등록됩니다.
              </ProductRegistrationGuide>
            </>
          )}
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

      <NavBar />

      <ConfirmationModal
        open={isRelearningConfirmOpen}
        title="취향 프로필을 다시 만들까요?"
        confirmLabel="재학습 시작하기"
        onConfirm={handleStartRelearning}
        onCancel={() => setIsRelearningConfirmOpen(false)}
        ariaDescribedBy="relearning-profile-warning"
      >
        <RelearningModalContent>
          <CurrentTasteProfileCard>
            <CurrentTasteProfileIcon
              src={relearningCurrentIcon}
              alt=""
              aria-hidden="true"
            />
            <CurrentTasteProfileText>
              <CurrentTasteProfileTitle>
                지금 프로필
                {tasteProfileUpdatedDate &&
                  ` · ${tasteProfileUpdatedDate} 학습`}
              </CurrentTasteProfileTitle>
              <CurrentTasteProfileSummary>
                {RELEARNING_PROFILE_RESPONSE_COUNTS}
              </CurrentTasteProfileSummary>
            </CurrentTasteProfileText>
          </CurrentTasteProfileCard>
          <RelearningModalWarning id="relearning-profile-warning">
            <RelearningModalWarningIcon
              src={relearningWarningIcon}
              alt=""
              aria-hidden="true"
            />
            <span>
              재학습을 완료하면 기존 프로필이 새 응답으로 교체돼요. 완료 전까지는 지금 프로필이 그대로 유지됩니다.
            </span>
          </RelearningModalWarning>
        </RelearningModalContent>
      </ConfirmationModal>

      <ConfirmationModal
        open={productPendingUnlink !== null}
        title="이 제품의 연결을 해제할까요?"
        confirmLabel={
          unlinkingProductTagId === null
            ? '연결 해제하기'
            : '연결 해제 중...'
        }
        onConfirm={() => void handleConfirmProductUnlink()}
        onCancel={handleCancelProductUnlink}
        confirmDisabled={unlinkingProductTagId !== null}
        cancelDisabled={unlinkingProductTagId !== null}
        ariaDescribedBy="product-unlink-notice"
      >
        {productPendingUnlink && (
          <ProductUnlinkContent>
            <ProductUnlinkSummary>
              <ProductIdentity>
                <ProductIcon
                  src={getProductIcon(productPendingUnlink.product_type)}
                  alt=""
                  aria-hidden="true"
                />
                <ProductName>
                  {getProductName(productPendingUnlink)}
                </ProductName>
              </ProductIdentity>
              <ProductUnlinkDate>
                {getProductRegisteredDate(
                  productPendingUnlink.registered_at,
                )}
              </ProductUnlinkDate>
            </ProductUnlinkSummary>
            <ProductUnlinkNotice id="product-unlink-notice">
              <ProductUnlinkNoticeRow>
                <ProductUnlinkNoticeIcon
                  src={unlinkPreservedIcon}
                  alt=""
                  aria-hidden="true"
                />
                <span>
                  이 제품으로 남긴 핀·사진·포토북은 그대로 유지돼요.
                </span>
              </ProductUnlinkNoticeRow>
              <ProductUnlinkNoticeRow>
                <ProductUnlinkNoticeIcon
                  src={unlinkWarningIcon}
                  alt=""
                  aria-hidden="true"
                />
                <span>
                  해제하면 이 태그는 자동으로 다시 등록되지 않아요. 다시
                  쓰려면 직접 태깅해야 합니다.
                </span>
              </ProductUnlinkNoticeRow>
            </ProductUnlinkNotice>
          </ProductUnlinkContent>
        )}
      </ConfirmationModal>
    </PageShell>
  )
}

export default MyPage

const PageShell = styled.main`
  width: 100%;
  max-width: 450px;
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
  max-width: 450px;
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

const RelearningModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`

const CurrentTasteProfileCard = styled.div`
  min-height: 56px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: 12px;
  background: var(--Background-Base);
`

const CurrentTasteProfileIcon = styled.img`
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  display: block;
`

const CurrentTasteProfileText = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
`

const CurrentTasteProfileTitle = styled.p`
  color: var(--Text-Primary);
  font: var(--text-ui-label);
`

const CurrentTasteProfileSummary = styled.p`
  overflow: hidden;
  color: var(--Text-Secondary);
  font: 400 11px/18px var(--font-sans);
  text-overflow: ellipsis;
  white-space: nowrap;
`

const RelearningModalWarning = styled.p`
  min-height: 66px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  border-radius: 12px;
  background: rgb(181 118 59 / 10%);
  color: var(--Primary-Cognac);
  font: 400 11px/18px var(--font-sans);
  word-break: keep-all;
`

const RelearningModalWarningIcon = styled.img`
  width: 18px;
  height: 17px;
  flex: 0 0 18px;
  display: block;
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

const ProductFeedback = styled.p`
  min-height: 58px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: ${({ $error }) => ($error ? '#b42318' : 'var(--Text-Secondary)')};
  font: var(--text-ui-caption);
  text-align: center;
`

const ProductEmptyState = styled.p`
  min-height: 76px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
  text-align: center;

  strong {
    color: var(--Text-Primary);
    font: var(--text-ui-label);
  }
`

const ProductRegistrationGuide = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
  text-align: center;
`

const ProductActionFeedback = styled.p`
  color: #b42318;
  font: var(--text-ui-caption);
  text-align: center;
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

const ProductUnlinkContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`

const ProductUnlinkSummary = styled(ProductItem)`
  flex: none;
`

const ProductUnlinkDate = styled.span`
  flex: 0 0 auto;
  color: #6b7280;
  font: var(--text-ui-nav);
  white-space: nowrap;
`

const ProductUnlinkNotice = styled.div`
  min-height: 90px;
  padding: 12px 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  border-radius: 12px;
  background: rgb(181 118 59 / 10%);
`

const ProductUnlinkNoticeRow = styled.p`
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0 5px;
  color: var(--Primary-Cognac);
  font: 400 11px/18px var(--font-sans);
  word-break: keep-all;
`

const ProductUnlinkNoticeIcon = styled.img`
  width: 13px;
  height: 12px;
  flex: 0 0 13px;
  display: block;
  object-fit: contain;
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

  &:disabled {
    opacity: 0.45;
    cursor: default;
  }

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
