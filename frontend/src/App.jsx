import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
// import Logo from './components/Login/Logo'
import LoginForm from './components/Login/LoginForm'
// import QuoteSection from './components/Login/AuthLayout'
import RegisterForm from './components/Login/RegisterForm' 
import AuthLayout from './components/Login/AuthLayout'
import Dashboard from './components/Dashboard/Dashboard'
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
      </Routes>
    </Router>
  )
}

export default App
