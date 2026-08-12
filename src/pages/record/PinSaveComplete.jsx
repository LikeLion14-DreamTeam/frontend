import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

const getStoredRecord = () => {
  try {
    return JSON.parse(sessionStorage.getItem('latestPinRecord') || '{}')
  } catch {
    return {}
  }
}

const PinSaveComplete = () => {
  const navigate = useNavigate()
  const { state } = useLocation()
  const storedRecord = getStoredRecord()
  const record = {
    photo: state?.photo || storedRecord.photo || '',
    location: state?.location || storedRecord.location || '크컴',
    time: state?.time || storedRecord.time || '언제언제',
  }

  return (
    <PageShell>
      <TopBar>
        <BackButton type="button" aria-label="이전 화면" onClick={() => navigate('/record/camera')}>
          &lt;
        </BackButton>
        <HeaderTitle>핀 저장 완료 화면</HeaderTitle>
      </TopBar>

      <Content>
        <SuccessCopy>
          <SuccessTitle>저장되었습니다</SuccessTitle>
          <SuccessDescription>
            이 장소의 기록이
            <br />
            여행에 추가되었어요
          </SuccessDescription>
        </SuccessCopy>

        <PhotoBox>
          {record.photo ? (
            <SavedImage src={record.photo} alt="저장된 사진" />
          ) : (
            <ImagePlaceholder>Image</ImagePlaceholder>
          )}
        </PhotoBox>

        <FieldGroup>
          <FieldLabel>추가 기록 남기기</FieldLabel>
          <MemoBox />
        </FieldGroup>

        <FieldGroup>
          <FieldLabel>음성메모 남기기</FieldLabel>
        </FieldGroup>

        <SavedSection>
          <SavedTitle>저장된 항목</SavedTitle>
          <SavedCard>
            <Avatar aria-hidden="true">Aa</Avatar>
            <SavedList>
              <SavedItem>
                <ItemIcon aria-hidden="true" />
                <ItemText>
                  사진
                  <br />
                  1장
                </ItemText>
              </SavedItem>
              <SavedItem>
                <ItemIcon $accent aria-hidden="true" />
                <ItemText>
                  위치
                  <br />
                  {record.location}
                </ItemText>
              </SavedItem>
              <SavedItem>
                <ItemIcon aria-hidden="true" />
                <ItemText>
                  시간
                  <br />
                  {record.time}
                </ItemText>
              </SavedItem>
            </SavedList>
          </SavedCard>
        </SavedSection>

        <ActionGroup>
          <HomeButton type="button" onClick={() => navigate('/')}>
            홈으로
          </HomeButton>
          <ContinueButton type="button" onClick={() => navigate('/record/camera')}>
            계속 촬영하기
          </ContinueButton>
        </ActionGroup>
      </Content>
    </PageShell>
  )
}

export default PinSaveComplete

const PageShell = styled.main`
  width: 100%;
  max-width: 450px;
  min-height: 100svh;
  margin: 0 auto;
  background: #fff;
  color: #111827;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  font-family: var(--font-sans);
`

const TopBar = styled.header`
  height: 45px;
  display: grid;
  grid-template-columns: 48px 1fr 48px;
  align-items: center;
  border-bottom: 1px solid #d1d5db;
`

const BackButton = styled.button`
  width: 48px;
  height: 45px;
  border: 0;
  background: transparent;
  color: #111827;
  font-size: 18px;
  cursor: pointer;
`

const HeaderTitle = styled.h1`
  grid-column: 2;
  font-size: 14px;
  font-weight: 700;
  text-align: center;
`

const Content = styled.section`
  padding: 21px 22px 32px;
`

const SuccessCopy = styled.div`
  text-align: center;
`

const SuccessTitle = styled.h2`
  font-size: 15px;
  font-weight: 800;
`

const SuccessDescription = styled.p`
  margin-top: 8px;
  color: #374151;
  font-size: 12px;
  line-height: 1.5;
`

const PhotoBox = styled.div`
  width: 100%;
  height: 132px;
  margin-top: 26px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 10px;
  background: #fbfbfc;
`

const ImagePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #cfd8e3;
  color: #9ca3af;
  font-size: 12px;
`

const SavedImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 3px;
  display: block;
`

const FieldGroup = styled.div`
  margin-top: 22px;
`

const FieldLabel = styled.p`
  font-size: 13px;
  font-weight: 600;
`

const MemoBox = styled.textarea`
  min-height: 62px;
  margin-top: 14px;
  width: 100%;
  border: 1px solid #000;
  padding: 12px;
  color: #111827;
  font-size: 12px;
  line-height: 1.35;
`

const SavedSection = styled.section`
  margin-top: 26px;
`

const SavedTitle = styled.h2`
  font-size: 17px;
  font-weight: 800;
`

const SavedCard = styled.div`
  min-height: 142px;
  margin-top: 12px;
  padding: 14px;
  display: flex;
  gap: 13px;
  border: 1px solid #e5e7eb;
  border-radius: 5px;
  background: #fbfbfc;
`

const Avatar = styled.div`
  flex: 0 0 48px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #d9dee6;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
`

const SavedList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 9px;
`

const SavedItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 9px;
`

const ItemIcon = styled.span`
  width: 9px;
  min-width: 9px;
  height: 9px;
  margin-top: 4px;
  border-radius: 999px;
  border: 1px solid ${({ $accent }) => ($accent ? '#ef4444' : '#cbd5e1')};
  background: ${({ $accent }) => ($accent ? '#ef4444' : '#f8fafc')};
`

const ItemText = styled.p`
  color: #374151;
  font-size: 12px;
  line-height: 1.35;
`

const ActionGroup = styled.div`
  margin-top: 34px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
`

const HomeButton = styled.button`
  min-width: 70px;
  min-height: 35px;
  padding: 0 16px;
  border: 0;
  border-radius: 5px;
  background: #111827;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
`

const ContinueButton = styled.button`
  min-width: 113px;
  min-height: 34px;
  padding: 0 13px;
  border: 1px solid #111827;
  border-radius: 5px;
  background: #fff;
  color: #111827;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
`
