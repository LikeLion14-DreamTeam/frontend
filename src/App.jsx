import { Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import Map from "./pages/Map"
import Archive from "./pages/Archive"
import MyPage from "./pages/MyPage"
import TripManagement from "./pages/TripManagement"
import TripSegmentEdit from "./pages/TripSegmentEdit"
import TripArchive from "./pages/TripArchive"
import CityArchive from "./pages/CityArchive"
import LogIn from "./pages/LogIn"
import Permission from "./pages/Permission"
import PermissionDeniedGuide from "./pages/PermissionDeniedGuide"


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
