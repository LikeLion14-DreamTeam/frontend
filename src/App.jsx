import { Routes, Route } from "react-router-dom"
import Home from "./pages/home/Home"
import Map from "./pages/map/Map"
import Archive from "./pages/archive/Archive"
import TripArchive from "./pages/archive/TripArchive"
import CityArchive from "./pages/archive/CityArchive"
import MyPage from "./pages/mypage/MyPage"
import TripManagement from "./pages/trip-management/TripManagement"
import TripSegmentEdit from "./pages/trip-management/TripSegmentEdit"
import LogIn from "./pages/login/LogIn"
import Permission from "./pages/permission/Permission"
import PermissionDeniedGuide from "./pages/permission/PermissionDeniedGuide"


function App() {
  return (
    <Routes>
      <Route path="/login" element={<LogIn />} />
      <Route path="/permission" element={<Permission />} />
      <Route path="/permission/denied-guide" element={<PermissionDeniedGuide />} />
      <Route path="/" element={<Home />} />
      <Route path="/map" element={<Map />} />
      <Route path="/archive" element={<Archive />} />
      <Route path="/archive/trip/:tripID" element={<TripArchive />} />
      <Route path="/archive/city/:cityID" element={<CityArchive />} />
      <Route path="/mypage" element={<MyPage />} />
      <Route path="/trip-management" element={<TripManagement />} />
      <Route path="/trip-management/edit" element={<TripSegmentEdit />} />
    </Routes>
  )
}

export default App
