// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; //
// Hapus UserProvider dan useUser jika tidak digunakan atau sudah dihandle di main.jsx
// import { UserProvider, useUser } from './components/contexts/UserContext';

import LoginForm from './components/Login/LoginForm'; //
import RegisterForm from './components/Login/RegisterForm';  //
import AuthLayout from './components/Login/AuthLayout'; //
import Dashboard from './components/Dashboard/Dashboard'; //
import Materi from './components/Materi/Materi'; // Asumsi Materi.jsx adalah daftar materi
import MateriDetail from './components/Materi/MateriDetail'; // Asumsi Materi1.jsx adalah detail materi

import LoginAdmin from './components/Admin/LoginAdmin'; //
import DashboardAdmin from './components/Admin/DashboardAdmin'; //
import SiswaAdmin from './components/Admin/SiswaAdmin'; //
import MateriAdmin from './components/Admin/MateriAdmin'; //
import Profile from './components/Profile/Profile';
// Jika UserContext.jsx ada dan digunakan, pastikan implementasi ProtectedRoute sudah benar.
// Jika tidak, Anda mungkin perlu menambahkan logika cek login di setiap halaman yang dilindungi.
// Untuk sementara, saya akan hapus ProtectedRoute demi kesederhanaan jika UserContext tidak lengkap.

function App() {
  return (
    <Router>
      <Routes>
        {/* Rute Siswa */}
        <Route path="/" element={ <AuthLayout><LoginForm /></AuthLayout> } />
        <Route path="/register" element={ <AuthLayout><RegisterForm /></AuthLayout> } />
        {/* Ganti dengan ProtectedRoute jika sudah ada */}
        <Route path="/dashboard" element={ <Dashboard /> } />
        <Route path="/materi" element={ <Materi /> } />
        <Route path="/materi/:id" element={ <MateriDetail /> } /> 
        {/* Tidak ada lagi /quiz/:materiId karena kuis ada di dalam MateriDetail */}

        {/* Rute Admin */}
        <Route path="/admin" element={<LoginAdmin/>}/>
        <Route path="/admin/login" element={<LoginAdmin />} />
         {/* Ganti dengan ProtectedAdminRoute jika sudah ada */}
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