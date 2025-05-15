import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
// import Logo from './components/Login/Logo'
import LoginForm from './components/Login/LoginForm'
// import QuoteSection from './components/Login/AuthLayout'
import RegisterForm from './components/Login/RegisterForm' 
import AuthLayout from './components/Login/AuthLayout'
import Dashboard from './components/Dashboard/Dashboard'
import Materi from './components/Materi/Materi'
import Materi1 from './components/Materi/Materi1'
import LoginAdmin from './components/Admin/LoginAdmin'
import DashboardAdmin from './components/Admin/DashboardAdmin'
import SiswaAdmin from './components/Admin/SiswaAdmin'
import MateriAdmin from './components/Admin/MateriAdmin'


// import { AuthProvider } from './components/Login/AuthContext'
// import ProtectedRoute from './components/Login/ProtectedRoute'


function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <AuthLayout>
              <LoginForm />
            </AuthLayout>
          }
        />
        <Route
          path="/register"
          element={
            <AuthLayout>
              <RegisterForm />
            </AuthLayout>
          }
        />
        <Route
          path="/dashboard"
          element={
              <Dashboard />
          }
        />
        <Route path="/admin" element={<LoginAdmin/>}/>
        <Route path="/admin/dashboardadmin" element={<DashboardAdmin/>}/>
        <Route path="/admin/siswa" element={<SiswaAdmin/>}/>
        <Route path="/admin/materi" element={<MateriAdmin/>}/>
        <Route path="/materi" element={<Materi/>}/>
        <Route path="/materi/:id" element={<Materi1 />} />
      </Routes>
    </Router>
  )
}

export default App
