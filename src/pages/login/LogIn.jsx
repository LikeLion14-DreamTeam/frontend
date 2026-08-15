import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Button from '../../components/common/Button'
import Header from '../../components/layout/Header'
import { setSessionToken } from '../../api/session'
import { loginWithGoogle } from '../../features/auth/authApi'
import { getPostLoginPath } from '../../features/auth/authRoutes'
import useAuthStore from '../../features/auth/useAuthStore'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const setUser = useAuthStore((state) => state.setUser)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleGoogleLogin = async (credentialResponse) => {
    const googleIdToken = credentialResponse.credential

    if (!googleIdToken) {
      setErrorMessage('구글 인증 정보를 받지 못했습니다. 다시 시도해 주세요.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const { session_token: sessionToken, user } =
        await loginWithGoogle(googleIdToken)

      setSessionToken(sessionToken)
      setUser(user)
      navigate(getPostLoginPath(user, location.state?.from), {
        replace: true,
      })
    } catch (error) {
      setErrorMessage(
        error.message ?? '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Header>로그인 화면</Header>

      <LoginWrapper>

        <TitleArea>
          <Title>Orte</Title>
          <SubTitle>당신의 순간을 생생하게 남겨보세요</SubTitle>
        </TitleArea>

        <PassportArea />

        <BottomArea>
          {isSubmitting ? (
            <Button type="button" disabled>
              로그인 처리 중...
            </Button>
          ) : GOOGLE_CLIENT_ID ? (
            <GoogleButtonArea>
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() =>
                  setErrorMessage(
                    '구글 로그인이 취소되었거나 실패했습니다. 다시 시도해 주세요.',
                  )
                }
                theme="outline"
                size="large"
                shape="pill"
                text="continue_with"
                logo_alignment="center"
                width="400"
              />
            </GoogleButtonArea>
          ) : (
            <Button type="button" disabled>
              구글 로그인 설정 필요
            </Button>
          )}

          {(errorMessage || !GOOGLE_CLIENT_ID) && (
            <ErrorMessage role="alert">
              {errorMessage ||
                '.env에 VITE_GOOGLE_CLIENT_ID를 설정해 주세요.'}
            </ErrorMessage>
          )}

          <Notice>
            구글 계정으로 로그인하면
            <br />
            취향 프로파일과 여행 기록을 저장할 수 있습니다
          </Notice>
        </BottomArea>

      </LoginWrapper>
    </>
  )
}

export default Login

const LoginWrapper = styled.main`
  width: 100%;
  max-width: 450px;
  min-height: calc(
    var(--app-viewport-height) - 116px + var(--design-safe-top)
  );
  margin: 0 auto;
  padding: 74px 24px 24px;
  display: flex;
  flex-direction: column;
`

const TitleArea = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`

const PassportArea = styled.div`
  flex: 1;
`

const BottomArea = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`

const GoogleButtonArea = styled.div`
  width: 100%;
  min-height: 44px;
  display: flex;
  justify-content: center;
  overflow: hidden;

  & > div,
  & iframe {
    width: 100% !important;
  }
`

const Title = styled.h2`
  font-size: 16px;
  font-weight: 600;
`

const SubTitle = styled.p`
  font-size: 12px;
`

const Notice = styled.p`
  margin-top: 8px;
  font-size: 11px;
  line-height: 1.9;
  text-align: center;
`

const ErrorMessage = styled.p`
  color: #b42318;
  font-size: 12px;
  line-height: 1.5;
  text-align: center;
  word-break: keep-all;
`
