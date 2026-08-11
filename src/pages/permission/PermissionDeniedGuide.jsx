import React from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Card from '../../components/common/Card'
import Header from '../../components/layout/Header'

const deniedPermissions = [
  { key: 'camera', title: '카메라', description: '태깅 시 사진 촬영이 불가능합니다', action: '설정에서 허용' },
  { key: 'location', title: '위치', description: '여행 동선 지도 저장과 핀 기록이 불가능합니다', action: '설정에서 허용' },
  { key: 'nfc', title: 'NFC', description: 'MCM 태그 인식이 불가능합니다', action: '기기 지원 확인' },
]

const PermissionDeniedGuide = () => {
  const navigate = useNavigate()

  return (
    <>
      <Header>권한 거부 안내 화면</Header>

      <GuideWrapper>

        <Section>
          <Title>권한 설정 필요</Title>
          <Description>일부 기능을 사용하려면 다음 권한이 필요합니다</Description>
        </Section>

        <Section>
          <PermissionList>
            {deniedPermissions.map((item) => (
              <Card key={item.key} $padding="12px">
                <PermissionTitle>{item.title}</PermissionTitle>
                <PermissionDesc>{item.description}</PermissionDesc>
                <OutlineButton>{item.action}</OutlineButton>
              </Card>
            ))}
          </PermissionList>
        </Section>

        <Section>
          <Caption>
            권한 거부 상태에서는 이전 화면으로 돌아가 다른 기능을 이용하실 수 있습니다
          </Caption>
          <OutlineButton onClick={() => navigate(-1)}>돌아가기</OutlineButton>
        </Section>

      </GuideWrapper>
    </>
  )
}

export default PermissionDeniedGuide

const GuideWrapper = styled.main`
  width: 100%;
  max-width: 430px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 74px 24px 24px;
`

const Section = styled.section`
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;

  &:first-child {
    margin-top: 0;
  }
`

const Title = styled.h2`
  font-size: 16px;
  font-weight: 600;
`

const Description = styled.p`
  font-size: 12px;
`

const PermissionList = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const PermissionTitle = styled.p`
  font-size: 12px;
`

const PermissionDesc = styled.p`
  margin-top: 8px;
  font-size: 11px;
`

const Caption = styled.p`
  font-size: 11px;
`

const OutlineButton = styled.button`
  margin-top: 8px;
  padding: 8px 16px;
  border: 1px solid #1f2937;
  border-radius: 6px;
  background: #fff;
  color: #1f2937;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
`
