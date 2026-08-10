import { Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import Record from "./pages/Record"
import Recommendation from "./pages/Recommendation"
import Archive from "./pages/Archive"
import Trip from "./pages/Trip"
import TripManagement from "./pages/TripManagement"


function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/record" element={<Record />} />
      <Route path="/recommendation" element={<Recommendation />} />
      <Route path="/archive" element={<Archive />} />
      <Route path="/trip" element={<Trip />} />
      <Route path="/trip-management" element={<TripManagement />} />
    </Routes>
  )
}

export default App
