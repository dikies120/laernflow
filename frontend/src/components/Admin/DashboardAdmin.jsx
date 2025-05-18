import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaChartBar, FaBook, FaUserGraduate } from "react-icons/fa";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from "chart.js";

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title
);

const DashboardAdmin = () => {
  const navigate = useNavigate();
  const [siswaBaru, setSiswaBaru] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    siswa: 0,
    materi: 0,
    quiz: 10,
  });

  // Contoh data pertumbuhan siswa per minggu
  const pertumbuhanSiswa = [10, 20, 40, 60, 80, 100, 120];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, materiRes] = await Promise.all([
          axios.get("/api/users/siswa"),
          axios.get("/api/materi/crud-materi"),
        ]);

        if (userRes.data.success) {
          const users = userRes.data.users;
          setStats((prev) => ({ ...prev, siswa: users.length }));
          setSiswaBaru(users.slice(0, 5));
        }

        if (Array.isArray(materiRes.data)) {
          setStats((prev) => ({ ...prev, materi: materiRes.data.length }));
        }
      } catch (err) {
        console.error("Gagal mengambil data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleNavigation = (path) => navigate(path);

  const handleLogout = () => {
    alert("You have been logged out!");
    navigate("/");
  };

  const chartData = {
    labels: pertumbuhanSiswa.map((_, idx) => `Minggu ${idx + 1}`),
    datasets: [
      {
        label: "Pertumbuhan Siswa",
        data: pertumbuhanSiswa,
        fill: false,
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        tension: 0.3,
        pointBorderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: "Grafik Pertumbuhan Siswa per Minggu",
        font: { size: 18 },
      },
    },
  };

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
        <div className="grid grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded shadow p-6 flex flex-col items-center">
            <FaUserGraduate className="text-blue-600 text-3xl mb-2" />
            <div className="text-3xl font-bold">{stats.siswa}</div>
            <div className="text-gray-600">Total Siswa</div>
          </div>
          <div className="bg-white rounded shadow p-6 flex flex-col items-center">
            <FaBook className="text-green-600 text-3xl mb-2" />
            <div className="text-3xl font-bold">{stats.materi}</div>
            <div className="text-gray-600">Total Materi</div>
          </div>
          <div className="bg-white rounded shadow p-6 flex flex-col items-center">
            <FaChartBar className="text-purple-600 text-3xl mb-2" />
            <div className="text-3xl font-bold">{stats.quiz}</div>
            <div className="text-gray-600">Total Quiz</div>
          </div>
        </div>

        {/* Daftar Siswa Terbaru */}
        <div className="bg-white rounded shadow p-6 mb-10">
          <h4 className="font-semibold mb-4 text-lg">Siswa Terbaru</h4>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-600 border-b">
                  <th className="py-2">Nama</th>
                  <th className="py-2">Email</th>
                </tr>
              </thead>
              <tbody>
                {siswaBaru.map((siswa) => (
                  <tr key={siswa.id} className="border-b hover:bg-gray-50">
                    <td className="py-2">{siswa.nama}</td>
                    <td className="py-2">{siswa.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Grafik Pertumbuhan */}
        <div className="bg-white rounded shadow p-6">
          <Line data={chartData} options={chartOptions} />
        </div>
      </main>
    </div>
  );
};

export default DashboardAdmin;
