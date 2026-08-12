import React from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Button from '../../components/common/Button'
import Header from '../../components/layout/Header'

const Login = () => {
  const navigate = useNavigate()

  const handleGoogleLogin = () => {
    // TODO: 구글 OAuth 연동
    navigate('/permission')
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
          <Button onClick={handleGoogleLogin}>구글로 계속하기</Button>
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
  min-height: 100vh;
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
