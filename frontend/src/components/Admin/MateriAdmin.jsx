// frontend/src/components/Admin/MateriAdmin.jsx
import React, { useEffect, useState, useCallback } from "react"; // Tambahkan useCallback
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaChartLine, FaBookOpen, FaUsers, FaPlus, FaFileUpload, FaLink, FaAlignLeft,
  FaTrash, FaEdit, FaPlusSquare, FaTimes, FaCrown, FaExpand, FaSignOutAlt,
  FaSpinner, FaPuzzlePiece, FaEye
} from "react-icons/fa";
import axios from "axios";

const tipeMateriOptionsList = [
  { value: "", label: "Pilih Tipe Materi*" }, { value: "Video", label: "Video" },
  { value: "Teks", label: "Teks/Artikel" }, { value: "Dokumen", label: "Dokumen (PDF, Word, dll)" },
];
const kelasAdminOptionsList = [
  { value: '', label: 'Pilih Kelas*', disabled: true },
  { value: '10-IPA-1', label: '10 IPA 1' }, { value: '10-IPA-2', label: '10 IPA 2' },
  { value: '10-IPS-1', label: '10 IPS 1' }, { value: '11-IPA-1', label: '11 IPA 1' },
  { value: '11-IPS-1', label: '11 IPS 1' }, { value: '12-IPA-1', label: '12 IPA 1' },
  { value: '12-IPS-1', label: '12 IPS 1' },
];
const API_BASE_URL = "http://localhost:5000";

const MateriAdmin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [kelas, setKelas] = useState(kelasAdminOptionsList[0].value);
  const [namaMateri, setNamaMateri] = useState("");
  const [tipeMateri, setTipeMateri] = useState(tipeMateriOptionsList[0].value);
  const [deskripsi, setDeskripsi] = useState("");
  const [durasi, setDurasi] = useState("");
  const [linkGambar, setLinkGambar] = useState("");

  const [urlVideo, setUrlVideo] = useState("");
  const [isiTeks, setIsiTeks] = useState("");
  const [fileDokumen, setFileDokumen] = useState(null);
  const [fileName, setFileName] = useState("");

  const [materiList, setMateriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingQuizCounts, setLoadingQuizCounts] = useState(false); // State untuk loading quiz counts
  const [formLoading, setFormLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [showAddQuizModal, setShowAddQuizModal] = useState(false);
  const [selectedMateriIdForQuiz, setSelectedMateriIdForQuiz] = useState(null);
  const [selectedMateriNameForQuiz, setSelectedMateriNameForQuiz] = useState("");
  const [newQuiz, setNewQuiz] = useState({ soal: '', a: '', b: '', c: '', d: '', jawaban: '' });
  const [quizFormLoading, setQuizFormLoading] = useState(false);
  const [quizError, setQuizError] = useState("");
  const [quizSuccess, setQuizSuccess] = useState("");

  const [showViewQuizModal, setShowViewQuizModal] = useState(false);
  const [selectedMateriForViewQuiz, setSelectedMateriForViewQuiz] = useState(null);
  const [listQuizQuestions, setListQuizQuestions] = useState([]);
  const [loadingQuizList, setLoadingQuizList] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const fetchQuizCountForMateri = async (materiId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/quiz/materi/${materiId}`);
      return Array.isArray(response.data) ? response.data.length : 0;
    } catch (err) {
      // Jika error (misal materi belum ada quiznya sama sekali dan API mengembalikan 404 atau error lain)
      // anggap saja jumlahnya 0. Atau log error jika diperlukan.
      console.warn(`Could not fetch quiz count for materi ID ${materiId}:`, err.response?.data?.message || err.message);
      return 0;
    }
  };

  const fetchMateriAndQuizCounts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`${API_BASE_URL}/api/materi/crud-materi`); //
      let fetchedMateriList = Array.isArray(response.data) ? response.data : [];
      setMateriList(fetchedMateriList.map(m => ({ ...m, QUIZ_COUNT: undefined }))); // Set initial QUIZ_COUNT to undefined
      setLoading(false); // Stop main loading

      if (fetchedMateriList.length > 0) {
        setLoadingQuizCounts(true); // Start loading for quiz counts
        const updatedMateriList = await Promise.all(
          fetchedMateriList.map(async (materi) => {
            const quizCount = await fetchQuizCountForMateri(materi.ID);
            return { ...materi, QUIZ_COUNT: quizCount };
          })
        );
        setMateriList(updatedMateriList);
        setLoadingQuizCounts(false); // Stop loading for quiz counts
      }
    } catch (err) {
      console.error("Fetch materi error:", err);
      setError("Gagal memuat daftar materi: " + (err.response?.data?.message || err.message));
      setMateriList([]);
      setLoading(false);
      setLoadingQuizCounts(false);
    }
  }, []); // useCallback dependencies, empty means it's created once

  useEffect(() => {
    fetchMateriAndQuizCounts();
  }, [fetchMateriAndQuizCounts]); // fetchMateriAndQuizCounts now a stable dependency

  const handleFileChange = (e) => { const file = e.target.files[0]; if (file) { setFileDokumen(file); setFileName(file.name); } else { setFileDokumen(null); setFileName(""); }};
  const resetTypeSpecificInputs = () => { setUrlVideo(""); setIsiTeks(""); setFileDokumen(null); setFileName(""); const fileInput = document.getElementById('file-input-dokumen'); if (fileInput) fileInput.value = ""; };
  const resetMateriForm = () => {
    setKelas(kelasAdminOptionsList[0].value);
    setNamaMateri("");
    setDeskripsi("");
    setDurasi("");
    setLinkGambar("");
    setTipeMateri(tipeMateriOptionsList[0].value);
    resetTypeSpecificInputs();
  };
  const handleTipeMateriChange = (e) => { setTipeMateri(e.target.value); resetTypeSpecificInputs(); };

  const handleAddMateri = async (e) => {
    e.preventDefault();
    setSuccess(""); setError(""); setFormLoading(true);
    if (!kelas || !namaMateri || !tipeMateri) { setError("Kelas, Nama Materi, dan Tipe Materi wajib diisi!"); setFormLoading(false); return; }

    const formData = new FormData();
    formData.append("kelas", kelas);
    formData.append("nama_materi", namaMateri);
    formData.append("tipe_materi", tipeMateri);
    formData.append("deskripsi", deskripsi);
    formData.append("durasi", durasi);
    formData.append("link_gambar", linkGambar);

    if (tipeMateri === "Video") {
        if (!urlVideo) { setError("Link Video Youtube wajib diisi!"); setFormLoading(false); return; }
        formData.append("link_youtube", urlVideo);
    } else if (tipeMateri === "Teks") {
        if (!isiTeks) { setError("Isi Teks Materi wajib diisi!"); setFormLoading(false); return; }
        formData.append("isi_teks", isiTeks);
    } else if (tipeMateri === "Dokumen") {
        if (!fileDokumen) { setError("File Dokumen wajib diunggah!"); setFormLoading(false); return; }
        formData.append("dokumenFile", fileDokumen);
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/api/materi/crud-materi`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }); //
      if (res.data.success) {
          setSuccess("Materi berhasil ditambahkan!");
          resetMateriForm();
          fetchMateriAndQuizCounts(); // Refresh list and quiz counts
          setTimeout(() => setSuccess(""), 4000);
      } else { setError(res.data.message || "Gagal menambah materi"); }
    } catch (err) {
        console.error("Error adding materi:", err.response || err);
        setError(err.response?.data?.message || "Terjadi kesalahan server.");
    }
    finally { setFormLoading(false); }
  };

  const handleDeleteMateri = async (id) => {
    if (!window.confirm("Yakin ingin menghapus materi ini beserta semua quiz terkait? Tindakan ini tidak dapat dibatalkan.")) return;
    setSuccess(""); setError("");
    try {
      const res = await axios.delete(`${API_BASE_URL}/api/materi/crud-materi/${id}`); //
      if (res.data.success) {
          setSuccess("Materi dan quiz terkait berhasil dihapus!");
          fetchMateriAndQuizCounts(); // Refresh list and quiz counts
          setTimeout(() => setSuccess(""), 4000);
      } else { setError(res.data.message || "Gagal menghapus materi"); }
    } catch (err) {
        console.error("Error deleting materi:", err.response || err);
        setError(err.response?.data?.message || "Terjadi kesalahan server.");
    }
  };

  const openAddQuizModal = (materi) => { setSelectedMateriIdForQuiz(materi.ID); setSelectedMateriNameForQuiz(materi.NAMA_MATERI); setShowAddQuizModal(true); setNewQuiz({ soal: '', a: '', b: '', c: '', d: '', jawaban: '' }); setQuizError(""); setQuizSuccess(""); };
  const handleQuizInputChange = (e) => setNewQuiz(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    setQuizError(""); setQuizSuccess(""); setQuizFormLoading(true);
    if (!selectedMateriIdForQuiz) { setQuizError("Materi ID tidak valid."); setQuizFormLoading(false); return; }
    if (!newQuiz.soal || !newQuiz.a || !newQuiz.b || !newQuiz.c || !newQuiz.d || !newQuiz.jawaban) { setQuizError("Semua field quiz wajib diisi."); setQuizFormLoading(false); return; }
    const quizData = { ...newQuiz, materi_id: selectedMateriIdForQuiz };
    try {
      const response = await axios.post(`${API_BASE_URL}/api/quiz/add`, quizData); //
      if (response.data.success) {
        setQuizSuccess('Pertanyaan quiz berhasil ditambahkan!');
        setNewQuiz({ soal: '', a: '', b: '', c: '', d: '', jawaban: '' });
        // Instead of full refresh, we can just update the count for the specific materi
        // Or rely on the full refresh for simplicity given the N+1 strategy is already in place for initial load
        fetchMateriAndQuizCounts(); // Refresh daftar materi untuk update QUIZ_COUNT
        setTimeout(() => {
            setQuizSuccess("");
        }, 2000);
      } else { setQuizError(`Gagal menambahkan quiz: ${response.data.message || 'Error server.'}`); }
    } catch (error) {
        console.error("Error adding quiz:", error.response || error);
        setQuizError(error.response?.data?.message || 'Terjadi kesalahan server.');
    }
    finally { setQuizFormLoading(false); }
  };

  const openViewQuizModal = async (materi) => {
    setSelectedMateriForViewQuiz(materi); setShowViewQuizModal(true);
    setLoadingQuizList(true); setListQuizQuestions([]);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/quiz/materi/${materi.ID}`); //
      setListQuizQuestions(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching quiz questions for material:", error);
      setListQuizQuestions([]);
    } finally { setLoadingQuizList(false); }
  };

  const handleNavigation = (path) => navigate(path);
  const handleLogout = () => { alert("Anda telah logout!"); localStorage.removeItem("adminToken"); localStorage.removeItem("adminData"); navigate("/admin/login"); }; //

  const sidebarItems = [
    { icon: FaChartLine, label: "Dashboard", path: "/admin/dashboardadmin" },
    { icon: FaUsers, label: "Siswa", path: "/admin/siswa" },
    { icon: FaBookOpen, label: "Materi", path: "/admin/materi" },
  ]; //

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">
      <aside className={`${sidebarCollapsed ? 'w-[5.5rem]' : 'w-72'} bg-white shadow-xl flex flex-col fixed h-full transition-all duration-300 border-r border-gray-200 z-30`}>
        {/* Sidebar content unchanged, see original file */}
        <div className="p-5 border-b border-gray-200 h-[73px] flex items-center">
          <div className="flex items-center justify-between w-full">
            {!sidebarCollapsed && ( <div className="flex items-center gap-3"> <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center"> <FaCrown className="text-white text-xl" /> </div> <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">LearnFlow</h1> </div> )}
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-purple-600 transition-colors" title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"} >
              <FaExpand className="transform transition-transform duration-300" style={{ transform: sidebarCollapsed ? 'rotate(45deg)' : 'rotate(0deg)' }} />
            </button>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {sidebarItems.map((item) => (
            <button key={item.label} onClick={() => handleNavigation(item.path)} title={item.label}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${ location.pathname === item.path ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-lg hover:opacity-95' : `text-gray-600 hover:bg-purple-50 hover:text-purple-700 ${sidebarCollapsed ? 'justify-center': ''}`}`} >
              <item.icon className={`text-lg ${location.pathname === item.path ? 'text-white' : 'text-gray-400 group-hover:text-purple-600'}`} />
              {!sidebarCollapsed && <span className="font-medium text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button onClick={handleLogout} title="Logout" className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 group ${sidebarCollapsed ? 'justify-center': ''}`} >
            <FaSignOutAlt className="text-lg text-red-500 group-hover:text-red-600" />
            {!sidebarCollapsed && <span className="font-medium text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      <main className={`flex-1 p-6 sm:p-8 ${sidebarCollapsed ? 'ml-[5.5rem]' : 'ml-72'} transition-all duration-300`}>
        {/* Main content header unchanged, see original file */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Manajemen Materi & Quiz</h2>
          <p className="text-gray-500 text-sm sm:text-base">Tambah, lihat, dan kelola materi pembelajaran serta quiz terkait.</p>
        </div>

        {success && (<div className="mb-6 p-3 bg-green-50 text-green-700 font-semibold rounded-lg border border-green-200 shadow-sm text-sm transition-opacity duration-300 ease-in-out opacity-100">{success}</div>)}
        {error && (<div className="mb-6 p-3 bg-red-50 text-red-700 font-semibold rounded-lg border border-red-200 shadow-sm text-sm transition-opacity duration-300 ease-in-out opacity-100">{error}</div>)}

        {/* Form Tambah Materi unchanged, see original file */}
        <form onSubmit={handleAddMateri} className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 max-w-3xl mx-auto space-y-6 mb-12 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-700 border-b pb-3 mb-6 flex items-center gap-2"> <FaPlusSquare className="text-purple-600 text-2xl"/> Form Tambah Materi Baru </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div> <label htmlFor="kelas-admin" className="block mb-1.5 text-sm font-medium text-gray-700">Kelas Tujuan*</label> <select id="kelas-admin" className="w-full border border-gray-300 px-3 py-2.5 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm" value={kelas} onChange={(e) => setKelas(e.target.value)} required> {kelasAdminOptionsList.map(opt => (<option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}</option>))} </select> </div>
            <div> <label htmlFor="tipe-materi-admin" className="block mb-1.5 text-sm font-medium text-gray-700">Tipe Materi*</label> <select id="tipe-materi-admin" className="w-full border border-gray-300 px-3 py-2.5 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm" value={tipeMateri} onChange={handleTipeMateriChange} required> {tipeMateriOptionsList.map(opt => (<option key={opt.value} value={opt.value} disabled={opt.value === ""}>{opt.label}</option>))} </select> </div>
          </div>
          <div> <label htmlFor="nama-materi-admin" className="block mb-1.5 text-sm font-medium text-gray-700">Nama Materi*</label> <input id="nama-materi-admin" type="text" className="w-full border border-gray-300 px-3 py-2.5 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm" value={namaMateri} onChange={(e) => setNamaMateri(e.target.value)} placeholder="Contoh: Pengenalan Fotosintesis" required /> </div>
          <div> <label htmlFor="deskripsi-materi-admin" className="block mb-1.5 text-sm font-medium text-gray-700">Deskripsi Singkat</label> <textarea id="deskripsi-materi-admin" rows="3" className="w-full border border-gray-300 px-3 py-2.5 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} placeholder="Jelaskan secara singkat isi materi ini..."></textarea> </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div> <label htmlFor="durasi-materi-admin" className="block mb-1.5 text-sm font-medium text-gray-700">Estimasi Durasi</label> <input id="durasi-materi-admin" type="text" className="w-full border border-gray-300 px-3 py-2.5 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm" value={durasi} onChange={(e) => setDurasi(e.target.value)} placeholder="Contoh: 45 Menit / 2 Jam" /> </div>
            <div> <label htmlFor="link-gambar-admin" className="block mb-1.5 text-sm font-medium text-gray-700">URL Gambar Thumbnail</label> <input id="link-gambar-admin" type="url" className="w-full border border-gray-300 px-3 py-2.5 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm" value={linkGambar} onChange={(e) => setLinkGambar(e.target.value)} placeholder="https://example.com/gambar.jpg" /> </div>
          </div>

          {tipeMateri === "Video" && ( <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400"><label htmlFor="url-video-admin" className="block mb-1.5 text-sm font-medium text-blue-700 flex items-center gap-2"><FaLink /> Link Video Youtube*</label><input id="url-video-admin" type="url" className="w-full border border-gray-300 px-3 py-2.5 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" value={urlVideo} onChange={(e) => setUrlVideo(e.target.value)} placeholder="https://www.youtube.com/watch?v=xxxx" required={tipeMateri === "Video"}/></div> )}
          {tipeMateri === "Teks" && ( <div className="p-4 bg-indigo-50 rounded-lg border-l-4 border-indigo-400"><label htmlFor="isi-teks-admin" className="block mb-1.5 text-sm font-medium text-indigo-700 flex items-center gap-2"><FaAlignLeft /> Isi Teks Materi*</label><textarea id="isi-teks-admin" rows="8" className="w-full border border-gray-300 px-3 py-2.5 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm" value={isiTeks} onChange={(e) => setIsiTeks(e.target.value)} placeholder="Ketik atau tempelkan teks materi..." required={tipeMateri === "Teks"}></textarea></div> )}
          {tipeMateri === "Dokumen" && ( <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400"> <label className="block mb-1.5 text-sm font-medium text-green-700">Upload Dokumen*</label> <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-green-400 transition-colors"> <div className="space-y-1 text-center"> <FaFileUpload className="mx-auto h-10 w-10 text-gray-400"/> <div className="flex text-sm text-gray-600"><label htmlFor="file-input-dokumen" className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500 px-1"><span>Upload file</span><input id="file-input-dokumen" name="dokumenFile" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.rar,.txt,.png,.jpg,.jpeg,.mp4" required={tipeMateri === "Dokumen"}/></label><p className="pl-1">atau tarik dan lepas</p></div> <p className="text-xs text-gray-500">PDF, DOC, PPT, Gambar, Video (Maks 100MB)</p> {fileName && <p className="text-sm text-green-700 font-medium mt-2">File terpilih: {fileName}</p>} </div> </div> </div> )}

          <button type="submit" disabled={formLoading} className="w-full flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-4 py-3 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-opacity duration-200 font-semibold text-base shadow-md hover:shadow-lg disabled:opacity-70"> {formLoading ? <FaSpinner className="animate-spin mr-2"/> : <FaPlus className="mr-2"/>} {formLoading ? "Menyimpan..." : "Tambah Materi"} </button>
        </form>

        {/* Modal Tambah Quiz unchanged, see original file */}
        {showAddQuizModal && selectedMateriIdForQuiz && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-40 transition-opacity duration-300">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col border border-gray-200">
              <div className="flex justify-between items-center pb-4 mb-4 border-b">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">Tambah Pertanyaan Quiz</h3>
                  <p className="text-sm text-gray-500">Materi: <span className="font-medium text-purple-600">{selectedMateriNameForQuiz}</span></p>
                </div>
                <button onClick={() => {setShowAddQuizModal(false); setQuizError(""); setQuizSuccess("");}} className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors"><FaTimes size={20}/></button>
              </div>
              <div className="overflow-y-auto flex-grow pr-2 custom-scrollbar">
                {quizError && (<div className="p-3 mb-4 bg-red-50 text-red-700 font-medium rounded-md border border-red-200 text-sm">{quizError}</div>)}
                {quizSuccess && (<div className="p-3 mb-4 bg-green-50 text-green-700 font-medium rounded-md border border-green-200 text-sm">{quizSuccess}</div>)}
                <form onSubmit={handleQuizSubmit} className="space-y-4">
                  <div><label htmlFor="quiz-soal" className="block text-sm font-medium text-gray-700 mb-1">Soal*</label><textarea id="quiz-soal" name="soal" value={newQuiz.soal} onChange={handleQuizInputChange} placeholder="Tulis soal quiz..." rows="3" className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-sm transition-all" required /></div>
                  {['a', 'b', 'c', 'd'].map((opt) => (<div key={opt}><label htmlFor={`quiz-${opt}`} className="block text-sm font-medium text-gray-700 mb-1">Pilihan {opt.toUpperCase()}*</label><input type="text" id={`quiz-${opt}`} name={opt} value={newQuiz[opt]} onChange={handleQuizInputChange} placeholder={`Pilihan jawaban ${opt.toUpperCase()}`} className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-sm transition-all" required /></div>))}
                  <div><label htmlFor="quiz-jawaban" className="block text-sm font-medium text-gray-700 mb-1">Kunci Jawaban*</label><select id="quiz-jawaban" name="jawaban" value={newQuiz.jawaban} onChange={handleQuizInputChange} className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm bg-white focus:ring-purple-500 focus:border-purple-500 text-sm transition-all" required><option value="">Pilih Kunci</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option></select></div>
                  <div className="flex justify-end gap-3 pt-3"><button type="button" onClick={() => {setShowAddQuizModal(false); setQuizError(""); setQuizSuccess("");}} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 transition-colors">Batal & Tutup</button><button type="submit" disabled={quizFormLoading} className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-purple-500 disabled:opacity-70 flex items-center">{quizFormLoading ? <FaSpinner className="animate-spin mr-2"/> : <FaPlus className="mr-2"/>}{quizFormLoading ? "Menyimpan..." : "Simpan Pertanyaan"}</button></div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal Lihat Daftar Quiz unchanged, see original file */}
        {showViewQuizModal && selectedMateriForViewQuiz && (
            <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-40">
                <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-gray-200">
                    <div className="flex justify-between items-center pb-4 mb-4 border-b">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800">Daftar Pertanyaan Quiz</h3>
                            <p className="text-sm text-gray-500">Materi: <span className="font-medium text-purple-600">{selectedMateriForViewQuiz.NAMA_MATERI}</span></p>
                        </div>
                        <button onClick={() => setShowViewQuizModal(false)} className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors"><FaTimes size={20}/></button>
                    </div>
                    <div className="overflow-y-auto flex-grow pr-2 custom-scrollbar">
                        {loadingQuizList ? (
                            <div className="flex justify-center items-center py-10"><FaSpinner className="animate-spin text-2xl text-purple-500"/> <span className="ml-2 text-gray-600">Memuat soal quiz...</span></div>
                        ) : listQuizQuestions.length > 0 ? (
                            <ul className="space-y-3">
                                {listQuizQuestions.map((q, index) => (
                                    <li key={q.id || index} className="p-3 bg-slate-50 border border-slate-200 rounded-md text-sm">
                                        <p className="font-medium text-gray-700">P{index + 1}: <span className="font-normal">{q.soal || q.SOAL}</span></p>
                                        <ol className="list-alpha list-inside ml-4 mt-1 text-gray-600 space-y-0.5">
                                            <li>{q.pilihan_a || q.A}</li><li>{q.pilihan_b || q.B}</li>
                                            <li>{q.pilihan_c || q.C}</li><li>{q.pilihan_d || q.D}</li>
                                        </ol>
                                        <p className="mt-1 text-xs font-semibold">Jawaban: <span className="text-green-600">{q.jawaban || q.JAWABAN}</span></p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-gray-500 italic py-6">Belum ada pertanyaan quiz untuk materi ini.</p>
                        )}
                    </div>
                     <div className="pt-4 mt-4 border-t text-right">
                        <button onClick={() => setShowViewQuizModal(false)} className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none">Tutup</button>
                    </div>
                </div>
            </div>
        )}

        <h3 className="text-2xl font-bold mt-12 mb-6 text-gray-800">Daftar Materi Tersedia</h3>
        {(loading || loadingQuizCounts) && <div className="flex justify-center py-8"><FaSpinner className="animate-spin text-3xl text-purple-500"/> <span className="ml-2 text-gray-700">{loading ? 'Memuat materi...' : 'Menghitung quiz...'}</span></div>}
        {!loading && !loadingQuizCounts && error && <div className="p-4 bg-red-50 text-red-700 font-medium rounded-md border border-red-200">{error}</div>}

        {!loading && !loadingQuizCounts && !error && (
          <div className="overflow-x-auto bg-white rounded-xl shadow-2xl border border-gray-200">
            <table className="w-full min-w-[800px]">
              <thead className="bg-purple-50/70 border-b-2 border-gray-200">
                <tr>
                  <th className="p-4 text-sm font-semibold tracking-wider text-left text-gray-700">Nama Materi</th>
                  <th className="p-4 text-sm font-semibold tracking-wider text-left text-gray-700">Kelas</th>
                  <th className="p-4 text-sm font-semibold tracking-wider text-left text-gray-700">Tipe</th>
                  <th className="p-4 text-sm font-semibold tracking-wider text-center text-gray-700">Jumlah Quiz</th>
                  <th className="p-4 text-sm font-semibold tracking-wider text-left text-gray-700">Resource</th>
                  <th className="p-4 text-sm font-semibold tracking-wider text-center text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {materiList.length > 0 ? materiList.map(materi => (
                  <tr key={materi.ID} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 text-sm text-gray-800 font-medium">{materi.NAMA_MATERI}</td>
                    <td className="p-4 text-sm text-gray-600">{materi.KELAS}</td>
                    <td className="p-4 text-sm text-gray-600">{materi.TIPE_MATERI || 'N/A'}</td>
                    <td className="p-4 text-sm text-gray-600 text-center">
                      <button onClick={() => openViewQuizModal(materi)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full hover:bg-blue-200 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-60 disabled:cursor-not-allowed"
                        disabled={materi.QUIZ_COUNT === undefined || materi.QUIZ_COUNT === 0}
                        title={(materi.QUIZ_COUNT === undefined || materi.QUIZ_COUNT === 0) ? "Belum ada quiz / sedang memuat" : "Lihat Daftar Quiz"} >
                        {materi.QUIZ_COUNT === undefined ? <FaSpinner className="animate-spin inline-block"/> : `${materi.QUIZ_COUNT} Pertanyaan`}
                      </button>
                    </td>
                    <td className="p-4 text-sm text-gray-600 max-w-xs truncate">
                      {materi.TIPE_MATERI === "Dokumen" && materi.LINK_DOKUMEN ? (
                        <a
                            href={`${API_BASE_URL}/${materi.LINK_DOKUMEN.startsWith('uploads/') ? materi.LINK_DOKUMEN : 'uploads/' + materi.LINK_DOKUMEN }`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline hover:text-blue-800"
                        >
                            {materi.LINK_DOKUMEN.split(/[\\/]/).pop()}
                        </a>
                       ) : materi.LINK_YOUTUBE ? (
                        <a
                            href={materi.LINK_YOUTUBE}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline hover:text-blue-800"
                        >
                            Lihat Video/Link
                        </a>
                       ) : materi.ISI_TEKS ? (<span className="italic">Teks Materi</span>) : ('-')}
                    </td>
                    <td className="p-4 text-sm whitespace-nowrap text-center">
                      <div className="flex justify-center items-center gap-2">
                          <button onClick={() => openAddQuizModal(materi)} className="p-2 bg-green-100 text-green-600 rounded-md hover:bg-green-200 focus:ring-1 focus:ring-green-400 transition-all" title="Tambah Pertanyaan Quiz"><FaPlusSquare /></button>
                          <button
                            onClick={() => openViewQuizModal(materi)}
                            disabled={materi.QUIZ_COUNT === undefined || materi.QUIZ_COUNT === 0}
                            className="p-2 bg-sky-100 text-sky-600 rounded-md hover:bg-sky-200 focus:ring-1 focus:ring-sky-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Lihat Daftar Quiz">
                              <FaEye />
                          </button>
                          <button onClick={() => alert("Fitur Edit Materi belum diimplementasikan.")} className="p-2 bg-yellow-100 text-yellow-600 rounded-md hover:bg-yellow-200 focus:ring-1 focus:ring-yellow-400 transition-all" title="Edit Materi"><FaEdit /></button>
                          <button onClick={() => handleDeleteMateri(materi.ID)} className="p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 focus:ring-1 focus:ring-red-400 transition-all" title="Hapus Materi & Quiz Terkait"><FaTrash /></button>
                      </div>
                    </td>
                  </tr>
                )) : (<tr><td colSpan="6" className="p-6 text-sm text-gray-500 text-center italic">Belum ada materi yang ditambahkan. Silakan tambahkan materi baru menggunakan form di atas.</td></tr>)}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default MateriAdmin;