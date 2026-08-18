import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom"
import Home from "./pages/home/Home"
import Map from "./pages/map/Map"
import ManualPinAdd from "./pages/map/ManualPinAdd"
import ManualPinDetails from "./pages/map/ManualPinDetails"
import PinDetail from "./pages/map/PinDetail"
import AllPhotos from "./pages/map/AllPhotos"
import Archive from "./pages/archive/Archive"
import TripArchive from "./pages/archive/TripArchive"
import PinStoryShare from "./pages/archive/PinStoryShare"
import CountryStampPins from "./pages/archive/CountryStampPins"
import MyPage from "./pages/mypage/MyPage"
import TripManagement from "./pages/trip-management/TripManagement"
import TripSegmentEdit from "./pages/trip-management/TripSegmentEdit"
import LogIn from "./pages/login/LogIn"
import RequireLocationPermission from "./features/permissions/RequireLocationPermission"
import Permission from "./pages/permission/Permission"
import PermissionDeniedGuide from "./pages/permission/PermissionDeniedGuide"
import PreferenceStart from "./pages/onboarding/PreferenceStart"
import BasicQuestion from "./pages/onboarding/BasicQuestion"
import AbPreference from "./pages/onboarding/AbPreference"
import MoodBoard from "./pages/onboarding/MoodBoard"
import MultiCapture from "./pages/record/MultiCapture"
import PinSaveComplete from "./pages/record/PinSaveComplete"
import { GuestOnly, RequireAuth } from "./features/auth/AuthRoute"


/*
 * 데이터 라우터로 만든다.
 *
 * 화면을 오갈 때 앞뒤 모습을 이어 붙이려면(`viewTransition`) 라우터가 갱신이
 * 끝나는 시점을 알아야 하는데, `<BrowserRouter>` 는 그 정보를 주지 않는다.
 * 라우트 목록 자체는 그대로다.
 */
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<LogIn />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route path="/permission" element={<Permission />} />
        <Route path="/permission/denied-guide" element={<PermissionDeniedGuide />} />

        {/* 위치 권한이 없으면 여기부터 들어올 수 없다. */}
        <Route element={<RequireLocationPermission />}>
          <Route path="/onboarding/preference-start" element={<PreferenceStart />} />
          <Route path="/onboarding/basic-question" element={<BasicQuestion />} />
          <Route path="/onboarding/ab-preference" element={<AbPreference />} />
          <Route path="/onboarding/moodboard" element={<MoodBoard />} />
          <Route path="/" element={<Home />} />
          <Route path="/record/multi-capture" element={<MultiCapture />} />
          <Route path="/record/pin-saved" element={<PinSaveComplete />} />
          <Route path="/map" element={<Map />} />
          <Route path="/map/pin/new" element={<ManualPinAdd />} />
          <Route path="/map/pin/new/details" element={<ManualPinDetails />} />
          <Route path="/map/pin/:pinID" element={<PinDetail />} />
          <Route path="/map/pin/:pinID/photos" element={<AllPhotos />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/archive/country-pins" element={<CountryStampPins />} />
          <Route path="/archive/trip/:tripID" element={<TripArchive />} />
          <Route path="/archive/trip/:tripID/pin/:pinID/share" element={<PinStoryShare />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/trip-management" element={<TripManagement />} />
          <Route path="/trip-management/:segmentId" element={<TripManagement />} />
          <Route path="/trip-management/edit" element={<TripSegmentEdit />} />
          <Route
            path="/trip-management/:segmentId/edit"
            element={<TripSegmentEdit />}
          />
        </Route>
      </Route>
    </Route>,
  ),
)

export default router
