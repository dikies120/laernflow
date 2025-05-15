import React from "react";
import { useNavigate } from "react-router-dom";
import { FaChartBar, FaBook, FaUserGraduate, FaUserCheck } from "react-icons/fa";

const DashboardAdmin = () => {
  const navigate = useNavigate();
  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    console.log("Logging out...");
    alert("You have been logged out!");
    navigate("/");
  };

  // Dummy data untuk contoh
  const dummyStats = {
    siswa: 120,
    materi: 15,
    quiz: 10,
    siswaAktif: 25,
  };

  const siswaBaru = [
    { id: 1, nama: "Budi", email: "budi@email.com" },
    { id: 2, nama: "Siti", email: "siti@email.com" },
    { id: 3, nama: "Andi", email: "andi@email.com" },
  ];

  const aktivitasTerbaru = [
    { id: 1, aktivitas: "Budi menyelesaikan Quiz 1", waktu: "1 menit lalu" },
    { id: 2, aktivitas: "Siti mendaftar akun", waktu: "5 menit lalu" },
    { id: 3, aktivitas: "Andi menyelesaikan Materi 2", waktu: "10 menit lalu" },
  ];

  const pertumbuhanSiswa = [10, 20, 40, 60, 80, 100, 120];

  const GrafikPertumbuhan = ({ data }) => (
    <div className="bg-white p-4 rounded shadow mt-6">
      <h4 className="font-semibold mb-2">Grafik Pertumbuhan Siswa</h4>
      <div className="flex items-end h-32 gap-2">
        {data.map((val, idx) => (
          <div
            key={idx}
            className="bg-blue-500 w-8"
            style={{ height: `${val / Math.max(...data) * 100}%` }}
            title={`Minggu ${idx + 1}: ${val} siswa`}
          ></div>
        ))}
      </div>
      <div className="flex justify-between text-xs mt-2 text-gray-500">
        {data.map((_, idx) => (
          <span key={idx}>M{idx + 1}</span>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-purple-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-6 flex flex-col fixed h-full">
        <h1 className="text-2xl font-bold mb-6 text-blue-700">LearnFlow</h1>
        <nav className="space-y-4">
          <button
            onClick={() => handleNavigation("/admin/dashboardadmin")}
            className="flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-800 text-left w-full"
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
        {/* Statistik Ringkas */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded shadow p-4 flex flex-col items-center">
            <FaUserGraduate className="text-blue-600 text-2xl mb-2" />
            <div className="text-2xl font-bold">{dummyStats.siswa}</div>
            <div className="text-gray-600">Total Siswa</div>
          </div>
          <div className="bg-white rounded shadow p-4 flex flex-col items-center">
            <FaBook className="text-green-600 text-2xl mb-2" />
            <div className="text-2xl font-bold">{dummyStats.materi}</div>
            <div className="text-gray-600">Total Materi</div>
          </div>
          <div className="bg-white rounded shadow p-4 flex flex-col items-center">
            <FaChartBar className="text-purple-600 text-2xl mb-2" />
            <div className="text-2xl font-bold">{dummyStats.quiz}</div>
            <div className="text-gray-600">Total Quiz</div>
          </div>
          <div className="bg-white rounded shadow p-4 flex flex-col items-center">
            <FaUserCheck className="text-orange-600 text-2xl mb-2" />
            <div className="text-2xl font-bold">{dummyStats.siswaAktif}</div>
            <div className="text-gray-600">Siswa Aktif Hari Ini</div>
          </div>
        </div>

        {/* Daftar Siswa Terbaru */}
        <div className="bg-white rounded shadow p-4 mb-8">
          <h4 className="font-semibold mb-2">Siswa Terbaru</h4>
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="py-1">Nama</th>
                <th className="py-1">Email</th>
              </tr>
            </thead>
            <tbody>
              {siswaBaru.map((siswa) => (
                <tr key={siswa.id}>
                  <td className="py-1">{siswa.nama}</td>
                  <td className="py-1">{siswa.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Daftar Aktivitas Terbaru */}
        <div className="bg-white rounded shadow p-4 mb-8">
          <h4 className="font-semibold mb-2">Aktivitas Terbaru</h4>
          <ul>
            {aktivitasTerbaru.map((item) => (
              <li key={item.id} className="py-1 border-b last:border-b-0">
                <span className="font-medium">{item.aktivitas}</span>
                <span className="text-xs text-gray-500 ml-2">{item.waktu}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Grafik Pertumbuhan Siswa */}
        <GrafikPertumbuhan data={pertumbuhanSiswa} />
      </main>
    </div>
  );
};

export default DashboardAdmin;