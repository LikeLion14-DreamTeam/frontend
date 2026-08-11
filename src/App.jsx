import { Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import Map from "./pages/Map"
import Archive from "./pages/Archive"
import MyPage from "./pages/MyPage"
import TripManagement from "./pages/TripManagement"
import TripSegmentEdit from "./pages/TripSegmentEdit"
import TripArchive from "./pages/TripArchive"
import CityArchive from "./pages/CityArchive"


function App() {
  return (
    <Routes>
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
