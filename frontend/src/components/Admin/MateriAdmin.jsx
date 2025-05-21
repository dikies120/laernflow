import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaChartBar, FaBook, FaUserGraduate, FaPlus, FaFileUpload, FaLink, FaAlignLeft } from "react-icons/fa";

const tipeMateriOptionsList = [
  { value: "", label: "Pilih Tipe Materi*" },
  { value: "Video", label: "Video" },
  { value: "Teks", label: "Teks/Artikel" },
  { value: "Dokumen", label: "Dokumen (PDF, Word, dll)" },
];

const kelasAdminOptionsList = [
  { value: '', label: 'Pilih Kelas Anda*', disabled: true },
  { value: '10-IPA-1', label: 'Kelas 10-IPA-1' }, { value: '10-IPA-2', label: 'Kelas 10-IPA-2' },
  { value: '10-IPA-3', label: 'Kelas 10-IPA-3' }, { value: '10-IPA-4', label: 'Kelas 10-IPA-4' },
  { value: '10-IPA-5', label: 'Kelas 10-IPA-5' }, { value: '10-IPA-6', label: 'Kelas 10-IPA-6' },
  { value: '10-IPA-7', label: 'Kelas 10-IPA-7' }, { value: '10-IPA-8', label: 'Kelas 10-IPA-8' },
  { value: '10-IPA-9', label: 'Kelas 10-IPA-9' }, { value: '11-IPA-1', label: 'Kelas 11-IPA-1' },
  { value: '11-IPA-2', label: 'Kelas 11-IPA-2' }, { value: '11-IPA-3', label: 'Kelas 11-IPA-3' },
  { value: '11-IPA-4', label: 'Kelas 11-IPA-4' }, { value: '11-IPA-5', label: 'Kelas 11-IPA-5' },
  { value: '11-IPA-6', label: 'Kelas 11-IPA-6' }, { value: '11-IPA-7', label: 'Kelas 11-IPA-7' },
  { value: '11-IPA-8', label: 'Kelas 11-IPA-8' }, { value: '11-IPA-9', label: 'Kelas 11-IPA-9' },
  { value: '12-IPA-1', label: 'Kelas 12-IPA-1' }, { value: '12-IPA-2', label: 'Kelas 12-IPA-2' },
  { value: '12-IPA-3', label: 'Kelas 12-IPA-3' }, { value: '12-IPA-4', label: 'Kelas 12-IPA-4' },
  { value: '12-IPA-5', label: 'Kelas 12-IPA-5' }, { value: '12-IPA-6', label: 'Kelas 12-IPA-6' },
  { value: '12-IPA-7', label: 'Kelas 12-IPA-7' }, { value: '12-IPA-8', label: 'Kelas 12-IPA-8' },
  { value: '12-IPA-9', label: 'Kelas 12-IPA-9' },
];

const MateriAdmin = () => {
  const navigate = useNavigate();
  const [kelas, setKelas] = useState("");
  const [namaMateri, setNamaMateri] = useState("");
  const [tipeMateri, setTipeMateri] = useState("");
  
  // State spesifik berdasarkan tipe materi
  const [urlVideo, setUrlVideo] = useState("");
  const [isiTeks, setIsiTeks] = useState("");
  const [fileDokumen, setFileDokumen] = useState(null);
  
  const [materiList, setMateriList] = useState([]);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const fetchMateri = () => {
    fetch("http://localhost:5000/api/materi/crud-materi")
      .then(res => {
        if (!res.ok) throw new Error('Gagal fetch materi');
        return res.json();
      })
      .then(data => setMateriList(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error("Fetch materi error in Admin:", err);
        setError("Gagal memuat daftar materi.");
        setMateriList([]);
      });
  };

  useEffect(() => {
    fetchMateri();
  }, []);

  const handleFileChange = (e) => {
    setFileDokumen(e.target.files[0]);
  };

  const resetTypeSpecificInputs = () => {
    setUrlVideo("");
    setIsiTeks("");
    setFileDokumen(null);
    if (document.getElementById('file-input-dokumen')) {
        document.getElementById('file-input-dokumen').value = "";
    }
  };

  const handleTipeMateriChange = (e) => {
    setTipeMateri(e.target.value);
    resetTypeSpecificInputs(); // Reset input lain saat tipe materi berubah
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");

    if (!kelas || !namaMateri || !tipeMateri) {
      setError("Field Kelas, Nama Materi, dan Tipe Materi wajib diisi!");
      return;
    }

    const formData = new FormData();
    formData.append("kelas", kelas);
    formData.append("nama_materi", namaMateri);
    formData.append("tipe_materi", tipeMateri);

    if (tipeMateri === "Video") {
      if (!urlVideo) {
        setError("Link Video Youtube wajib diisi untuk Tipe Materi Video!");
        return;
      }
      formData.append("link_youtube", urlVideo); // Backend akan map ini ke LINK_YOUTUBE
    } else if (tipeMateri === "Teks") {
      if (!isiTeks) {
        setError("Isi Teks Materi wajib diisi untuk Tipe Materi Teks!");
        return;
      }
      formData.append("isi_teks", isiTeks); // Backend akan map ini ke ISI_TEKS
    } else if (tipeMateri === "Dokumen") {
      if (!fileDokumen) {
        setError("File Dokumen wajib diunggah untuk Tipe Materi Dokumen!");
        return;
      }
      formData.append("dokumenFile", fileDokumen); // Backend akan map ini ke LINK_DOKUMEN
    }

    try {
      const res = await fetch("http://localhost:5000/api/materi/crud-materi", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess("Materi berhasil ditambahkan!");
        setKelas("");
        setNamaMateri("");
        setTipeMateri("");
        resetTypeSpecificInputs();
        fetchMateri();
      } else {
        setError(data.message || "Gagal menambah materi");
      }
    } catch (err) {
      console.error("Add materi error:", err);
      setError("Terjadi kesalahan pada server saat menambah materi.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus materi ini?")) return;
    setSuccess(""); setError("");
    try {
      const res = await fetch(`http://localhost:5000/api/materi/crud-materi/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess("Materi berhasil dihapus!");
        fetchMateri();
      } else {
        setError(data.message || "Gagal menghapus materi");
      }
    } catch (err) {
      console.error("Delete materi error:", err);
      setError("Terjadi kesalahan pada server saat menghapus materi.");
    }
  };

  const handleNavigation = (path) => navigate(path);
  const handleLogout = () => {
    alert("You have been logged out!");
    localStorage.removeItem("user"); sessionStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-purple-50"> {/* Ganti bg-purple-100 menjadi bg-purple-50 */}
      <aside className="w-64 bg-white shadow-lg p-6 flex flex-col fixed h-full">
        <h1 className="text-2xl font-bold mb-6 text-blue-700">LearnFlow</h1>
        <nav className="space-y-4">
          <button onClick={() => handleNavigation("/admin/dashboardadmin")} className="flex items-center gap-2 text-gray-600 hover:text-blue-800 text-left w-full"><FaChartBar /><span>Dashboard</span></button>
          <button onClick={() => handleNavigation("/admin/siswa")} className="flex items-center gap-2 text-gray-600 hover:text-blue-800 text-left w-full"><FaUserGraduate /><span>Siswa</span></button>
          <button onClick={() => handleNavigation("/admin/materi")} className="flex items-center gap-2 text-blue-600 font-semibold text-left w-full"><FaBook /><span>Materi</span></button>
        </nav>
        <button onClick={handleLogout} className="mt-auto pt-10 text-red-500 cursor-pointer hover:text-red-700 text-left">🔒 Log Out</button>
      </aside>

      <main className="flex-1 p-8 ml-64">
        <h2 className="text-3xl font-bold mb-8 text-gray-800 flex items-center gap-3"> {/* Perbesar font dan beri ikon */}
            <FaPlus className="text-blue-600"/> Tambah Materi Baru
        </h2>
        <form onSubmit={handleAdd} className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl space-y-6"> {/* Perbesar form dan beri space */}
          {success && (<div className="p-4 bg-green-50 text-green-700 font-semibold rounded-lg border border-green-200">{success}</div>)}
          {error && (<div className="p-4 bg-red-50 text-red-700 font-semibold rounded-lg border border-red-200">{error}</div>)}

          <div>
            <label htmlFor="kelas-admin" className="block mb-2 text-sm font-medium text-gray-800">Kelas</label>
            <select id="kelas-admin" className="w-full border border-gray-300 px-4 py-3 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={kelas} onChange={(e) => setKelas(e.target.value)} required>
              {kelasAdminOptionsList.map(opt => (<option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}</option>))}
            </select>
          </div>
          <div>
            <label htmlFor="nama-materi-admin" className="block mb-2 text-sm font-medium text-gray-800">Nama Materi</label>
            <input id="nama-materi-admin" type="text" className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={namaMateri} onChange={(e) => setNamaMateri(e.target.value)} placeholder="Contoh: Pengenalan Sel Biologi" required />
          </div>
          <div>
            <label htmlFor="tipe-materi-admin" className="block mb-2 text-sm font-medium text-gray-800">Tipe Materi</label>
            <select id="tipe-materi-admin" className="w-full border border-gray-300 px-4 py-3 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={tipeMateri} onChange={handleTipeMateriChange} required>
              {tipeMateriOptionsList.map(opt => (<option key={opt.value} value={opt.value} disabled={opt.value === ""}>{opt.label}</option>))}
            </select>
          </div>

          {/* Input Dinamis Berdasarkan Tipe Materi */}
          {tipeMateri === "Video" && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <label htmlFor="url-video-admin" className="block mb-2 text-sm font-medium text-blue-700 flex items-center gap-2"><FaLink /> Link Video Youtube</label>
              <input id="url-video-admin" type="url" className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={urlVideo} onChange={(e) => setUrlVideo(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
              <p className="text-xs text-gray-500 mt-1">Wajib diisi jika materi adalah Video.</p>
            </div>
          )}
          {tipeMateri === "Teks" && (
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <label htmlFor="isi-teks-admin" className="block mb-2 text-sm font-medium text-indigo-700 flex items-center gap-2"><FaAlignLeft /> Isi Teks Materi</label>
              <textarea id="isi-teks-admin" rows="8" className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={isiTeks} onChange={(e) => setIsiTeks(e.target.value)} placeholder="Ketik atau tempelkan isi materi teks di sini..."></textarea>
              <p className="text-xs text-gray-500 mt-1">Wajib diisi jika materi adalah Teks/Artikel.</p>
            </div>
          )}
          {tipeMateri === "Dokumen" && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <label htmlFor="file-input-dokumen" className="block mb-2 text-sm font-medium text-green-700">Upload Dokumen (PDF, DOCX, PPTX)</label>
              <div className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg bg-white">
                <FaFileUpload className="text-green-600"/>
                <input id="file-input-dokumen" type="file" className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200 cursor-pointer" onChange={handleFileChange} accept=".pdf,.doc,.docx,.ppt,.pptx" />
              </div>
              {fileDokumen && <p className="text-xs text-gray-600 mt-2">File dipilih: {fileDokumen.name}</p>}
              <p className="text-xs text-gray-500 mt-1">Wajib diunggah jika materi adalah Dokumen.</p>
            </div>
          )}
          {/* Akhir Input Dinamis */}

          <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-lg hover:opacity-90 transition-opacity font-semibold text-base"> {/* Style tombol submit */}
            Tambah Materi
          </button>
        </form>

        <h3 className="text-2xl font-bold mt-12 mb-6 text-gray-800">Daftar Materi</h3> {/* Perbesar font */}
        <div className="overflow-x-auto bg-white rounded-xl shadow-2xl"> {/* Style tabel */}
          <table className="w-full table-auto">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                <th className="p-4 text-sm font-semibold tracking-wide text-left text-gray-700">Nama Materi</th>
                <th className="p-4 text-sm font-semibold tracking-wide text-left text-gray-700">Kelas</th>
                <th className="p-4 text-sm font-semibold tracking-wide text-left text-gray-700">Tipe</th>
                <th className="p-4 text-sm font-semibold tracking-wide text-left text-gray-700">Resource</th>
                <th className="p-4 text-sm font-semibold tracking-wide text-left text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {materiList.length > 0 ? materiList.map(materi => (
                <tr key={materi.ID} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-sm text-gray-800 whitespace-nowrap">{materi.NAMA_MATERI}</td>
                  <td className="p-4 text-sm text-gray-800 whitespace-nowrap">{materi.KELAS}</td>
                  <td className="p-4 text-sm text-gray-800 whitespace-nowrap">{materi.TIPE_MATERI || 'N/A'}</td>
                  <td className="p-4 text-sm text-gray-800 max-w-xs truncate"> {/* Batasi lebar dan truncate */}
                    {materi.TIPE_MATERI === "Dokumen" && materi.LINK_DOKUMEN ? (
                      <a href={`http://localhost:5000/${materi.LINK_DOKUMEN}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                        {materi.LINK_DOKUMEN.split(/[\\/]/).pop()}
                      </a>
                    ) : materi.LINK_YOUTUBE ? (
                      <a href={materi.LINK_YOUTUBE} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                        Lihat Link
                      </a>
                    ) : ('-')}
                  </td>
                  <td className="p-4 text-sm whitespace-nowrap">
                    <button onClick={() => handleDelete(materi.ID)} className="bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 transition-colors text-xs">Hapus</button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="p-4 text-sm text-gray-500 text-center">Belum ada materi.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default MateriAdmin;