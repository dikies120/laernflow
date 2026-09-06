import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; 

import LoginForm from './components/Login/LoginForm'; 
import RegisterForm from './components/Login/RegisterForm';  
import AuthLayout from './components/Login/AuthLayout'; 
import Dashboard from './components/Dashboard/Dashboard'; 
import Materi from './components/Materi/Materi'; 
import MateriDetail from './components/Materi/MateriDetail'; 

import LoginAdmin from './components/Admin/LoginAdmin'; 
import DashboardAdmin from './components/Admin/DashboardAdmin'; 
import SiswaAdmin from './components/Admin/SiswaAdmin'; 
import MateriAdmin from './components/Admin/MateriAdmin'; 
import Profile from './components/Profile/Profile';
function App() {
  return (
    <Router>
      <Routes>
        {}
        <Route path="/" element={ <AuthLayout><LoginForm /></AuthLayout> } />
        <Route path="/register" element={ <AuthLayout><RegisterForm /></AuthLayout> } />
        {}
        <Route path="/dashboard" element={ <Dashboard /> } />
        <Route path="/materi" element={ <Materi /> } />
        <Route path="/materi/:id" element={ <MateriDetail /> } /> 
        {}

        {}
        <Route path="/admin" element={<LoginAdmin/>}/>
        <Route path="/admin/login" element={<LoginAdmin />} />
         {}
        <Route path="/admin/dashboardadmin" element={<DashboardAdmin/>}/>
        <Route path="/admin/siswa" element={<SiswaAdmin/>}/>
        <Route path="/admin/materi" element={<MateriAdmin/>}/>
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;