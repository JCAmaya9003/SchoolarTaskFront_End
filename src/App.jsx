import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import GoogleLoad from "./pages/googleLoad";
import { useContext } from "react";
import { AuthContext } from "./contexts/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import News from "./pages/News";
import AdminDashboard from "./pages/AdminDashboard";
import ReservationAdmin from "./components/ReservationAdmin";

function App() {
  const { token } = useContext(AuthContext); // Get the token from AuthContext

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/googleLoad" element={<GoogleLoad />} />
        <Route element={<ProtectedRoute canActive ={token} redirectPath="/" />}>
          <Route path="/home" element={<Home />} />
          <Route path="/news" element={<News />} />
          <Route path="/AdminDashboard" element={<AdminDashboard />} />
          <Route path="/ReservationAdmin" element={<ReservationAdmin />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;