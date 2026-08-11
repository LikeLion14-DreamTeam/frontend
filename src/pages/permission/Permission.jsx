import React from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Header from '../../components/layout/Header'

const permissions = [
  { key: 'camera', title: '카메라', description: 'NFC 태깅 후 사진을 촬영하는 데 사용됩니다.' },
  { key: 'location', title: '위치', description: '핀 저장 시 촬영 위치를 기록하는 데 사용됩니다.' },
  { key: 'nfc', title: 'NFC', description: 'MCM 태그를 인식해 핀을 생성하는 데 사용됩니다.' },
]

const Permission = () => {
  const navigate = useNavigate()

  return (
    <>
      <Header>권한 안내 화면</Header>

      <PermissionWrapper>

        <Title>앱 접근 권한 안내</Title>
        <Description>여행 기록을 시작하려면 아래 권한이 필요합니다.</Description>

        <Section>
          <PermissionList>
            {permissions.map((item) => (
              <Card key={item.key} $padding="12px">
                <PermissionTitle>{item.title}</PermissionTitle>
                <PermissionDesc>{item.description}</PermissionDesc>
              </Card>
            ))}
          </PermissionList>
        </Section>

        <Caption>
          권한은 기능 사용 시점에만 요청되며, 태깅하지 않은 사진이나 위치는 수집하지 않습니다.
        </Caption>

        <Section>
          <ActionArea>
            <Button onClick={() => navigate('/onboarding/basic-question', { replace: true })}>
              권한 허용하고 시작하기
            </Button>
            <TextButton onClick={() => navigate('/permission/denied-guide')}>
              권한을 허용하지 않으면 어떻게 되나요?
            </TextButton>
          </ActionArea>
        </Section>

      </PermissionWrapper>
    </>
  )
}

export default Permission

const PermissionWrapper = styled.main`
  width: 100%;
  max-width: 430px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 74px 24px 24px;
`

const Title = styled.h2`
  font-size: 16px;
  font-weight: 600;
`

const Description = styled.p`
  margin-top: 16px;
  font-size: 12px;
`

const Section = styled.section`
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const PermissionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const PermissionTitle = styled.p`
  font-size: 12px;
`

const PermissionDesc = styled.p`
  margin-top: 12px;
  font-size: 11px;
`

const Caption = styled.p`
  margin-top: 16px;
  font-size: 11px;
`

const ActionArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
`

const TextButton = styled.button`
  padding: 0;
  background: none;
  border: none;
  color: #6b7280;
  font-size: 14px;
  text-decoration: underline;
  cursor: pointer;
`
