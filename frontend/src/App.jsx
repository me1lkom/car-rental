import { Navigate, Route, Routes } from "react-router-dom"
import { Footer } from "./components/Footer"
import { Home } from "./pages/Home"
import { Register } from "./pages/Register"
import { Login } from "./pages/Login"
import { Car } from "./pages/Car"
import { Booking } from "./pages/Booking"
import { Done } from "./pages/Done"
import { Account } from "./pages/Account"
import { Admin } from "./pages/Admin"
import { readUser } from "./api"

function ProtectedRoute({ children }) {
  const user = readUser()
  if (!user) return <Navigate to="/login" />
  return children
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cars/:id" element={<Car />} />
        <Route path="/booking/:id" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
        <Route path="/done" element={<Done />} />
        <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      </Routes>
      <Footer />
    </>
  )
}