import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaChartBar, FaBook, FaUserGraduate } from "react-icons/fa";

const SiswaAdmin = () => {
  const navigate = useNavigate();
  const [siswaBaru, setSiswaBaru] = useState([]);

  const handleNavigation = (path) => {
    navigate(path);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("/api/users/siswa");
        if (res.data.success) {
          const users = res.data.users;
          setSiswaBaru(users.slice(0, 5)); // ambil 5 pengguna terbaru
        }
      } catch (err) {
        console.error("Gagal mengambil data:", err);
      }
    };

    fetchUsers();
  }, []);

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
            className="flex items-center gap-2 text-blue-600 font-semibold text-left w-full"
          >
            <FaUserGraduate />
            <span>Siswa</span>
          </button>
          <button
            onClick={() => handleNavigation("/admin/materi")}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-800 text-left w-full"
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
        <h2 className="text-2xl font-bold mb-6 text-blue-700">Daftar Siswa & Skor</h2>
        <div className="bg-white rounded shadow p-4">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="py-2">Nama</th>
                <th className="py-2">Email</th>
                <th className="py-2">Skor</th>
              </tr>
            </thead>
            <tbody>
              {siswaBaru.map((siswa) => (
                <tr key={siswa.id}>
                  <td className="py-2">{siswa.nama}</td>
                  <td className="py-2">{siswa.email}</td>
                  <td className="py-2 font-semibold text-center">-</td> {/* skor default */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default SiswaAdmin;
