import { Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import Map from "./pages/Map"
import Archive from "./pages/Archive"
import MyPage from "./pages/MyPage"
import TripManagement from "./pages/TripManagement"
import TripSegmentEdit from "./pages/TripSegmentEdit"


function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/map" element={<Map />} />
      <Route path="/archive" element={<Archive />} />
      <Route path="/mypage" element={<MyPage />} />
      <Route path="/trip-management" element={<TripManagement />} />
      <Route path="/trip-management/edit" element={<TripSegmentEdit />} />
    </Routes>
  )
}

export default App
