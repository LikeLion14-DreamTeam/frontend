import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { setSessionToken } from '../../api/session'
import { loginWithGoogle } from '../../features/auth/authApi'
import { getPostLoginPath } from '../../features/auth/authRoutes'
import useAuthStore from '../../features/auth/useAuthStore'
import googleIcon from '../../assets/login/google-icon.png'
import loginPhotoBottom from '../../assets/login/login-photo-bottom.png'
import loginPhotoTop from '../../assets/login/login-photo-top.png'
import loginTexture from '../../assets/login/login-texture.png'
import mcmOrteMark from '../../assets/login/mcm-orte-mark.svg'

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
    <LoginWrapper>
      <Texture src={loginTexture} alt="" aria-hidden="true" />
      <BrandArea>
        <BrandMark src={mcmOrteMark} alt="Orte" />
        <Collaboration>MCM X Orte</Collaboration>
        <Tagline>당신의 시선을 따라, 여정을 남깁니다</Tagline>
      </BrandArea>

      <PhotoBase aria-hidden="true">
        <PhotoBaseImage src={loginPhotoTop} alt="" />
      </PhotoBase>
      <PhotoOverlay aria-hidden="true">
        <PhotoOverlayImage src={loginPhotoBottom} alt="" />
      </PhotoOverlay>

      <LoginArea>
        {isSubmitting ? (
          <LoginButton type="button" disabled>
            로그인 처리 중...
          </LoginButton>
        ) : GOOGLE_CLIENT_ID ? (
          <GoogleButton>
            <GoogleButtonVisual aria-hidden="true">
              <GoogleIcon src={googleIcon} alt="" />
              Google 계정으로 계속하기
            </GoogleButtonVisual>
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
                width="330"
              />
            </GoogleButtonArea>
          </GoogleButton>
        ) : (
          <LoginButton type="button" disabled>
            구글 로그인 설정 필요
          </LoginButton>
        )}

        {(errorMessage || !GOOGLE_CLIENT_ID) && (
          <ErrorMessage role="alert">
            {errorMessage ||
              '.env에 VITE_GOOGLE_CLIENT_ID를 설정해 주세요.'}
          </ErrorMessage>
        )}
      </LoginArea>
    </LoginWrapper>
  )
}

export default Login

const LoginWrapper = styled.main`
  position: relative;
  width: 100%;
  max-width: 450px;
  height: var(--app-viewport-height);
  min-height: 0;
  margin: 0 auto;
  overflow: hidden;
  isolation: isolate;
  background: var(--Background-Base);
`

const Texture = styled.img`
  position: absolute;
  z-index: -3;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`

const BrandArea = styled.section`
  position: relative;
  z-index: 1;
  height: min(429px, 49.08vh);
  display: flex;
  flex-direction: column;
  align-items: center;
`

const BrandMark = styled.img`
  width: 136px;
  height: 49px;
  margin-top: min(159px, 18.19vh);
`

const Collaboration = styled.p`
  margin-top: 33px;
  color: var(--Accent-Gold);
  font: 600 20px/24px var(--font-serif);
  letter-spacing: 5.2px;
  padding-left: 5.2px;
`

const Tagline = styled.p`
  margin-top: 42px;
  color: var(--Text-Primary);
  font: 400 15px/22px var(--font-sans);
`

const PhotoBase = styled.div`
  position: absolute;
  z-index: -2;
  top: min(429px, 49.08vh);
  left: 0;
  width: 100%;
  height: min(445px, 50.92vh);
  overflow: hidden;
`

const PhotoBaseImage = styled.img`
  position: absolute;
  top: -55.19%;
  left: 0;
  width: 100%;
  height: auto;
  max-width: none;
`

const PhotoOverlay = styled.div`
  position: absolute;
  z-index: -1;
  top: min(184px, 21.05vh);
  left: 0;
  width: 100%;
  height: min(690px, 78.95vh);
  overflow: hidden;
`

const PhotoOverlayImage = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: auto;
  max-width: none;
`

const LoginArea = styled.section`
  position: absolute;
  z-index: 2;
  top: min(728px, 83.30vh);
  left: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`

const GoogleButton = styled.div`
  position: relative;
  width: min(330px, calc(100% - 48px));
  height: 56px;
`

const GoogleButtonVisual = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border-radius: 20px;
  background: #241c16;
  box-shadow: var(--Effect-Card);
  color: rgb(244 236 225 / 95%);
  font: 500 14px/20px var(--font-sans);
`

const GoogleIcon = styled.img`
  width: 17px;
  height: 18px;
  object-fit: contain;
`

const GoogleButtonArea = styled.div`
  position: absolute;
  inset: 8px 0;
  opacity: 0;
  overflow: hidden;

  & > div,
  & iframe {
    width: 100% !important;
  }
`

const LoginButton = styled.button`
  width: min(330px, calc(100% - 48px));
  height: 56px;
  border: 0;
  border-radius: 20px;
  background: #241c16;
  color: rgb(244 236 225 / 95%);
  font: 500 14px/20px var(--font-sans);
`


const ErrorMessage = styled.p`
  color: #b42318;
  font-size: 12px;
  line-height: 1.5;
  text-align: center;
  word-break: keep-all;
`
