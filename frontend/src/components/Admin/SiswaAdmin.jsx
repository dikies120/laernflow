
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { 
  FaChartLine, FaBookOpen, FaUsers, FaEdit, FaTrash, FaSpinner, 
  FaGraduationCap, FaTimes, FaEye, FaListAlt, FaCheckCircle, 
  FaHourglassHalf, FaPlus, FaExpand, FaSignOutAlt, FaCrown, FaPuzzlePiece, FaUserGraduate
} from "react-icons/fa";

const API_BASE_URL = "http://localhost:5000";


const generateAvatarUrl = (username) => {
  const params = new URLSearchParams();
  
  params.append('name', username || 'S'); 
  params.append('background', 'random');
  params.append('color', 'fff');
  params.append('size', '36');
  params.append('font-size', '0.4'); 
  params.append('rounded', 'true');
  return `https://ui-avatars.com/api/?${params.toString()}`;
};

const SiswaAdmin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [siswaList, setSiswaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingSiswa, setEditingSiswa] = useState(null);
  const [editFormData, setEditFormData] = useState({
    USERNAME: "", EMAIL: "", KELAS: "", NAMA_LENGKAP: ""
  });

  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState(null);
  const [studentMaterialProgress, setStudentMaterialProgress] = useState([]);
  const [studentQuizAttempts, setStudentQuizAttempts] = useState({});
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsError, setDetailsError] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);


  const handleNavigation = (path) => navigate(path);

  const fetchUsers = async () => {
    setLoading(true); setError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/users/siswa`);
      if (res.data.success && Array.isArray(res.data.users)) {
        setSiswaList(res.data.users);
      } else {
        throw new Error(res.data.message || "Format data pengguna tidak sesuai dari server.");
      }
    } catch (err) {
      console.error("Gagal mengambil data siswa:", err.response ? err.response.data : err.message);
      setError(err.response?.data?.message || err.message || "Gagal mengambil data siswa.");
      setSiswaList([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleLogout = () => {
    alert("Anda telah logout!");
    localStorage.removeItem("adminToken"); localStorage.removeItem("adminData");
    navigate("/admin/login");
  };

  const handleEditClick = (siswa) => {
    setEditingSiswa(siswa);
    setEditFormData({
      USERNAME: siswa.username, EMAIL: siswa.email,
      KELAS: siswa.kelas || "", NAMA_LENGKAP: siswa.nama_lengkap || ""
    });
  };

  const handleEditFormChange = (e) => setEditFormData({ ...editFormData, [e.target.name]: e.target.value });

  const handleSaveEdit = async () => {
    if (!editingSiswa) return;
    try {
      const payload = {
        USERNAME: editFormData.USERNAME,
        EMAIL: editFormData.EMAIL,
        KELAS: editFormData.KELAS,
        NAMA_LENGKAP: editFormData.NAMA_LENGKAP,
      };
      await axios.put(`${API_BASE_URL}/api/users/${editingSiswa.id}/profile`, payload);
      setEditingSiswa(null); fetchUsers();
      alert("Data siswa berhasil diperbarui.");
    } catch (err) {
      console.error("Gagal update data siswa:", err.response?.data || err.message);
      alert("Gagal memperbarui data siswa: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus siswa ini? Tindakan ini tidak dapat diurungkan.")) {
      try {
        await axios.delete(`${API_BASE_URL}/api/users/${userId}`);
        fetchUsers(); alert("Siswa berhasil dihapus.");
      } catch (err) {
        console.error("Gagal menghapus siswa:", err.response?.data || err.message);
        alert("Gagal menghapus siswa: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleViewStudentDetails = async (siswa) => {
    setSelectedStudentForDetails(siswa); setShowDetailsModal(true); setLoadingDetails(true);
    setDetailsError(null); setStudentMaterialProgress([]); setStudentQuizAttempts({});
    try {
      const [progressRes, quizRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/users/${siswa.id}/material-progress`),
        axios.get(`${API_BASE_URL}/api/quiz/results/student/${siswa.id}`)
      ]);

      if (progressRes.data.success) {
        setStudentMaterialProgress(progressRes.data.progress);
      } else { throw new Error(progressRes.data.message || "Gagal mengambil progres materi."); }
      
      if (Array.isArray(quizRes.data)) {
        const groupedAttempts = quizRes.data.reduce((acc, attempt) => {
            const title = attempt.materi_title || `Materi ID ${attempt.materi_id}`;
            if (!acc[title]) { acc[title] = []; }
            acc[title].push(attempt); return acc;
        }, {});
        setStudentQuizAttempts(groupedAttempts);
      } else if (quizRes.data && quizRes.data.success === false) {
         throw new Error(quizRes.data.message || "Gagal mengambil riwayat kuis.");
      } else {
         console.warn("Format data riwayat kuis tidak terduga/kosong:", quizRes.data);
         setStudentQuizAttempts({});
      }
    } catch (err) {
      console.error("Gagal mengambil detail siswa:", err.response ? err.response.data : err.message);
      setDetailsError(err.response?.data?.message || err.message || "Gagal mengambil detail siswa.");
    } finally { setLoadingDetails(false); }
  };

  const StudentDetailsModal = () => {
    if (!showDetailsModal || !selectedStudentForDetails) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300">
        <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-5 border-b border-gray-200">
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-800">
              Detail Progres: {selectedStudentForDetails.nama_lengkap || selectedStudentForDetails.username}
            </h3>
            <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50">
              <FaTimes size={20} />
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-grow custom-scrollbar">
            {loadingDetails && ( 
              <div className="flex flex-col justify-center items-center py-16 text-center"> <FaSpinner className="animate-spin text-4xl text-purple-600 mb-3" /> <p className="text-gray-600 text-lg">Memuat detail progres siswa...</p> </div>
            )}
            {detailsError && !loadingDetails && ( 
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 my-4 rounded-md shadow"> <p className="font-bold text-lg">Terjadi Kesalahan</p> <p>{detailsError}</p> </div>
            )}
            {!loadingDetails && !detailsError && (
              <div className="space-y-8">
                <section>
                  <h4 className="text-lg font-bold text-gray-700 mb-3 flex items-center"><FaListAlt className="mr-2 text-purple-600"/> Progres Materi</h4>
                  {studentMaterialProgress.length > 0 ? (
                    <div className="space-y-3">
                      {studentMaterialProgress.map((item, index) => (
                        <div key={index} className="p-3 bg-slate-50 rounded-lg border border-slate-200 shadow-sm">
                          <p className="font-medium text-gray-800 text-md">{item.namaMateri}</p>
                          <div className="text-xs text-gray-500 mb-1"><span>Tipe: {item.tipeMateri}</span> | <span>Kelas: {item.kelasMateri}</span></div>
                          <p className="text-sm">Status: <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${item.status === 'completed' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'}`}>{item.status === 'completed' ? <FaCheckCircle className="inline mr-1 mb-0.5"/> : <FaHourglassHalf className="inline mr-1 mb-0.5"/>}{item.status === 'completed' ? 'Selesai' : 'Dipelajari'}</span></p>
                          {item.completedAt && <p className="text-xs text-gray-500 mt-1">Selesai: {new Date(item.completedAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>}
                          {item.lastAccessedAt && !item.completedAt && <p className="text-xs text-gray-500 mt-1">Diakses: {new Date(item.lastAccessedAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>}
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-gray-500 italic px-4 py-2 bg-gray-50 rounded-md">Belum ada progres materi.</p>}
                </section>
                <section>
                  <h4 className="text-lg font-bold text-gray-700 mb-3 flex items-center"><FaGraduationCap className="mr-2 text-purple-600"/> Riwayat Kuis</h4>
                  {Object.keys(studentQuizAttempts).length > 0 ? (
                      Object.entries(studentQuizAttempts).map(([materiTitle, attempts], materiIndex) => (
                          <div key={materiIndex} className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                              <h5 className="text-md font-medium text-purple-800 bg-purple-100 p-3 border-b border-purple-200">{materiTitle}</h5>
                              <ul className="divide-y divide-gray-100">
                                  {attempts.map((attempt, attemptIndex) => (
                                  <li key={attempt.id || attemptIndex} className="p-3 hover:bg-slate-50">
                                      <div className="flex justify-between items-start"><div><p className="font-medium text-gray-700 text-sm">Percobaan ke-{attemptIndex + 1}</p><p className="text-sm text-gray-600">Skor: <span className="font-bold text-gray-800">{attempt.score}%</span> <span className="text-xs text-gray-500"> ({attempt.correct_answers}/{attempt.total_questions} benar)</span></p></div><span className={`px-2.5 py-1 text-xs rounded-full font-semibold ${attempt.passed ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>{attempt.passed ? 'Lulus' : 'Gagal'}</span></div>
                                      <p className="text-xs text-gray-400 mt-1">Tanggal: {new Date(attempt.completed_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                  </li>
                                  ))}
                              </ul>
                          </div>
                      ))
                  ) : <p className="text-gray-500 italic px-4 py-2 bg-gray-50 rounded-md">Belum ada riwayat kuis.</p>}
                </section>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-gray-200 bg-gray-50 text-right">
            <button onClick={() => setShowDetailsModal(false)} className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm hover:shadow-md focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50">Tutup</button>
          </div>
        </div>
      </div>
    );
  };

  const sidebarItems = [
    { icon: FaChartLine, label: "Dashboard", path: "/admin/dashboardadmin" },
    { icon: FaUsers, label: "Siswa", path: "/admin/siswa" },
    { icon: FaBookOpen, label: "Materi", path: "/admin/materi" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">
      <aside className={`${sidebarCollapsed ? 'w-[5.5rem]' : 'w-72'} bg-white shadow-xl flex flex-col fixed h-full transition-all duration-300 border-r border-gray-200 z-30`}>
        <div className="p-5 border-b border-gray-200 h-[73px] flex items-center">
          <div className="flex items-center justify-between w-full">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center"> <FaCrown className="text-white text-xl" /> </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">LearnFlow</h1>
              </div>
            )}
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-purple-600 transition-colors" title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"} >
              <FaExpand className="transform transition-transform duration-300" style={{ transform: sidebarCollapsed ? 'rotate(45deg)' : 'rotate(0deg)' }} />
            </button>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {sidebarItems.map((item) => (
            <button key={item.label} onClick={() => handleNavigation(item.path)} title={item.label}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                location.pathname === item.path 
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-lg hover:opacity-95' 
                  : `text-gray-600 hover:bg-purple-50 hover:text-purple-700 ${sidebarCollapsed ? 'justify-center': ''}`
              }`} >
              <item.icon className={`text-lg ${location.pathname === item.path ? 'text-white' : 'text-gray-400 group-hover:text-purple-600'}`} />
              {!sidebarCollapsed && <span className="font-medium text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button onClick={handleLogout} title="Logout"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 group ${sidebarCollapsed ? 'justify-center': ''}`} >
            <FaSignOutAlt className="text-lg text-red-500 group-hover:text-red-600" />
            {!sidebarCollapsed && <span className="font-medium text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      <main className={`flex-1 p-6 sm:p-8 ${sidebarCollapsed ? 'ml-[5.5rem]' : 'ml-72'} transition-all duration-300`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Manajemen Data Siswa</h2>
        </div>

        {loading && ( <div className="flex flex-col justify-center items-center py-10 text-center"><FaSpinner className="animate-spin text-4xl text-purple-600 mb-3" /> <p className="text-gray-600 text-lg">Memuat data siswa...</p></div> )}
        {error && !loading && ( <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md mb-6"><p className="font-bold">Gagal Memuat Data!</p><p>{error}</p><button onClick={fetchUsers} className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 font-medium">Coba Lagi</button></div> )}

        {!loading && !error && (
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm text-left text-gray-700">
                <thead className="text-xs text-gray-700 uppercase bg-purple-50/70 border-b-2 border-gray-200">
                  <tr>
                    <th scope="col" className="px-6 py-4">Profil</th>
                    <th scope="col" className="px-6 py-4">Nama Pengguna & Lengkap</th>
                    <th scope="col" className="px-6 py-4">Email</th>
                    <th scope="col" className="px-6 py-4">Kelas</th>
                    <th scope="col" className="px-6 py-4 text-center">Tgl Daftar</th>
                    <th scope="col" className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {siswaList.length === 0 ? (
                    <tr> <td colSpan="6" className="text-center py-12 text-gray-500 italic"> <FaUserGraduate className="mx-auto text-4xl mb-2 text-gray-400"/> Belum ada data siswa.</td> </tr>
                  ) : (
                    siswaList.map((siswa) => (
                      <tr key={siswa.id} className="bg-white hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-3">
                          <img 
                            src={siswa.foto_profil ? (siswa.foto_profil.startsWith('http') ? siswa.foto_profil : `${API_BASE_URL}${siswa.foto_profil}`) : generateAvatarUrl(siswa.username)} 
                            alt="Profil" 
                            className="w-9 h-9 rounded-full object-cover shadow-sm border-2 border-white group-hover:border-purple-200" 
                            onError={(e) => { 
                              e.target.onerror = null; 
                              e.target.src = generateAvatarUrl(siswa.username);
                            }} 
                          />
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          {editingSiswa?.id === siswa.id ? <input type="text" name="USERNAME" value={editFormData.USERNAME} onChange={handleEditFormChange} className="px-2 py-1 border rounded-md w-full text-sm"/> : <span className="font-semibold text-purple-700">{siswa.username}</span>}
                          {editingSiswa?.id === siswa.id ? <input type="text" name="NAMA_LENGKAP" value={editFormData.NAMA_LENGKAP} onChange={handleEditFormChange} className="mt-1 px-2 py-1 border rounded-md w-full text-sm"/> : (siswa.nama_lengkap && <div className="text-xs text-gray-500">{siswa.nama_lengkap}</div>)}
                        </td>
                        <td className="px-6 py-3 text-gray-600">{editingSiswa?.id === siswa.id ? <input type="email" name="EMAIL" value={editFormData.EMAIL} onChange={handleEditFormChange} className="px-2 py-1 border rounded-md w-full text-sm"/> : siswa.email}</td>
                        <td className="px-6 py-3 text-gray-600">{editingSiswa?.id === siswa.id ? <input type="text" name="KELAS" value={editFormData.KELAS} onChange={handleEditFormChange} className="px-2 py-1 border rounded-md w-20 text-sm"/> : (siswa.kelas || "-")}</td>
                        <td className="px-6 py-3 text-center text-gray-500 text-xs">{siswa.tanggal_daftar ? new Date(siswa.tanggal_daftar).toLocaleDateString('id-ID', { day:'2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                        <td className="px-6 py-3 text-center">
                          {editingSiswa?.id === siswa.id ? (
                            <div className="flex gap-2 justify-center">
                              <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-800 font-semibold text-xs px-3 py-1.5 rounded-md bg-green-100 hover:bg-green-200 shadow-sm">Simpan</button>
                              <button onClick={() => setEditingSiswa(null)} className="text-gray-500 hover:text-gray-700 font-semibold text-xs px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 shadow-sm">Batal</button>
                            </div>
                          ) : (
                            <div className="flex gap-x-1.5 justify-center"><button onClick={() => handleViewStudentDetails(siswa)} className="text-indigo-500 hover:text-indigo-700 p-1.5 rounded-md hover:bg-indigo-50" title="Lihat Detail Siswa"><FaEye size={16}/></button><button onClick={() => handleEditClick(siswa)} className="text-blue-500 hover:text-blue-700 p-1.5 rounded-md hover:bg-blue-50" title="Edit Siswa"><FaEdit size={16}/></button><button onClick={() => handleDelete(siswa.id)} className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50" title="Hapus Siswa"><FaTrash size={15}/></button></div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      <StudentDetailsModal />
    </div>
  );
};

export default SiswaAdmin;