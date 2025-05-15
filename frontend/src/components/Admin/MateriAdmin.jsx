import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaChartBar, FaBook, FaUserGraduate, FaPlus } from "react-icons/fa";

const MateriAdmin = () => {
  const navigate = useNavigate();
  const [kelas, setKelas] = useState("");
  const [namaMateri, setNamaMateri] = useState("");
  const [linkYoutube, setLinkYoutube] = useState("");
  const [materiList, setMateriList] = useState([]);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Ambil data materi
  const fetchMateri = () => {
    fetch("http://localhost:5000/api/materi/crud-materi")
      .then(res => res.json())
      .then(data => setMateriList(data));
  };

  useEffect(() => {
    fetchMateri();
  }, []);

  // Tambah materi
  const handleAdd = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    if (!kelas || !namaMateri || !linkYoutube) {
      setError("Semua field wajib diisi!");
      return;
    }
    try {
      const res = await fetch("http://localhost:5000/api/materi/crud-materi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kelas,
          nama_materi: namaMateri,
          link_youtube: linkYoutube,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Materi berhasil ditambahkan!");
        setKelas("");
        setNamaMateri("");
        setLinkYoutube("");
        fetchMateri();
      } else {
        setError(data.message || "Gagal menambah materi");
      }
    } catch (err) {
      setError("Terjadi kesalahan server");
    }
  };

  // Hapus materi
  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus materi ini?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/materi/crud-materi/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Materi berhasil dihapus!");
        fetchMateri();
      } else {
        setError(data.message || "Gagal menghapus materi");
      }
    } catch (err) {
      setError("Terjadi kesalahan server");
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    alert("You have been logged out!");
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-purple-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-6 flex flex-col fixed h-full">
        <h1 className="text-2xl font-bold mb-6 text-blue-700">LearnFlow</h1>
        <nav className="space-y-4">
          <button
            onClick={() => handleNavigation("/admin/dashboardadmin")}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-800 text-left w-full"
          >
            <FaChartBar />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => handleNavigation("/admin/siswa")}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-800 text-left w-full"
          >
            <FaUserGraduate />
            <span>Siswa</span>
          </button>
          <button
            onClick={() => handleNavigation("/admin/materi")}
            className="flex items-center gap-2 text-blue-600 font-semibold text-left w-full"
          >
            <FaBook />
            <span>Materi</span>
          </button>
        </nav>
        <button
          onClick={handleLogout}
          className="mt-auto pt-10 text-red-500 cursor-pointer hover:text-red-700 text-left"
        >
          🔒 Log Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 ml-64">
        <h2 className="text-2xl font-bold mb-6 text-blue-700 flex items-center gap-2">
          <FaPlus /> Tambah Materi Baru
        </h2>
        <form
          onSubmit={handleAdd}
          className="bg-white rounded shadow p-6 max-w-lg"
        >
          {success && (
            <div className="mb-4 text-green-600 font-semibold">{success}</div>
          )}
          {error && (
            <div className="mb-4 text-red-600 font-semibold">{error}</div>
          )}
          <div className="mb-4">
            <label className="block mb-1 font-medium">Kelas</label>
            <input
              type="text"
              className="w-full border px-3 py-2 rounded"
              value={kelas}
              onChange={(e) => setKelas(e.target.value)}
              placeholder="kelas 10, 11, 12"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Nama Materi</label>
            <input
              type="text"
              className="w-full border px-3 py-2 rounded"
              value={namaMateri}
              onChange={(e) => setNamaMateri(e.target.value)}
              placeholder="Nama materi"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block mb-1 font-medium">Link Youtube</label>
            <input
              type="url"
              className="w-full border px-3 py-2 rounded"
              value={linkYoutube}
              onChange={(e) => setLinkYoutube(e.target.value)}
              placeholder="https://youtube.com/..."
              required
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Tambah Materi
          </button>
        </form>

        <h3 className="text-xl font-bold mt-10 mb-4">Daftar Materi</h3>
        <ul>
          {materiList.map(materi => (
            <li key={materi.ID} className="mb-4 bg-white p-4 rounded shadow flex justify-between items-center">
              <div>
                <div className="font-semibold">{materi.NAMA_MATERI} (Kelas {materi.KELAS})</div>
                <a href={materi.LINK_YOUTUBE} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  Lihat Video
                </a>
              </div>
              <button
                onClick={() => handleDelete(materi.ID)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700"
              >
                Hapus
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
};

export default MateriAdmin;