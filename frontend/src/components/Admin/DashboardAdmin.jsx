
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaEye, FaCrown, FaChartLine,
  FaUsers, FaBookOpen, FaExpand, FaSignOutAlt, FaSpinner,
  FaTags, FaUniversity 
} from "react-icons/fa";
import axios from "axios";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  Tooltip, Legend, Title, ArcElement, BarElement
} from "chart.js";

ChartJS.register(
  CategoryScale, LinearScale, Tooltip, Legend, Title, ArcElement, BarElement
);

const API_BASE_URL = "http://localhost:5000";
const POLLING_INTERVAL = 30000;

const StatCard = ({ icon: Icon, title, value, subtitle, iconBgColor, cardBgGradient }) => (
  <div className={`relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${cardBgGradient || 'bg-gradient-to-br from-white to-slate-50'}`}>
    <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-[0.07]">
      <Icon className="w-32 h-32 text-gray-900" />
    </div>
    <div className="relative p-5 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-lg shadow-md ${iconBgColor || 'bg-blue-500'}`}>
          <Icon className="text-xl sm:text-2xl text-white" />
        </div>
      </div>
      <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">{value !== null && value !== undefined ? value.toLocaleString() : 'N/A'}</div>
      <div className="text-sm text-gray-700 font-medium">{title}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>}
    </div>
  </div>
);

const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top",
      labels: { usePointStyle: true, font: { size: 12, family: 'Inter, sans-serif', weight: '600' }, color: '#374151' }
    },
    title: {
      display: true,
      font: { size: 16, family: 'Inter, sans-serif', weight: 'bold' },
      color: '#1F2937',
      padding: { top: 10, bottom: 20 }
    },
    tooltip: {
      backgroundColor: 'rgba(31, 41, 55, 0.9)',
      titleFont: { weight: 'bold', family: 'Inter, sans-serif' },
      bodyFont: { family: 'Inter, sans-serif' },
      titleColor: '#fff',
      bodyColor: '#E5E7EB',
      cornerRadius: 6,
      displayColors: false,
      padding: 10
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(229, 231, 235, 0.6)', borderDash: [3, 3] },
      ticks: { color: '#4B5563', font: { size: 11, family: 'Inter, sans-serif' } }
    },
    x: {
      grid: { display: false },
      ticks: { color: '#4B5563', font: { size: 11, family: 'Inter, sans-serif' }, maxRotation: 45, minRotation: 0, autoSkipPadding: 15 }
    }
  },
  interaction: { mode: 'index', intersect: false },
};

const doughnutOptionsBase = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { padding: 15, usePointStyle: true, font: { size: 11, family: 'Inter, sans-serif' }}},
    title: { display: true, font: { size: 16, family: 'Inter, sans-serif', weight: 'bold' }, color: '#1F2937', padding: {top:10, bottom:20}},
    tooltip: {
      backgroundColor: 'rgba(31, 41, 55, 0.9)', titleFont: { weight: 'bold', family: 'Inter, sans-serif' }, bodyFont: {family: 'Inter, sans-serif'}, titleColor: '#fff', bodyColor: '#E5E7EB', cornerRadius: 6, padding: 10,
      callbacks: { label: function(context) { let label = context.label || ''; if (label) { label += ': '; } if (context.parsed !== null) { label += context.parsed.toLocaleString(); } return label; } }
    }
  },
  cutout: '60%',
};

const DashboardAdmin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [allUsers, setAllUsers] = useState([]);
  const [allMateriData, setAllMateriData] = useState([]);

  const [allQuizAttempts, setAllQuizAttempts] = useState([]); 
  const [stats, setStats] = useState({ siswa: 0, materi: 0, percobaanKuis: 0 });
  const [siswaTerbaru, setSiswaTerbaru] = useState([]);

  const initialChartDataset = { label: '', data: [], backgroundColor: 'transparent', borderColor: 'transparent' };
  const initialChartData = { labels: [], datasets: [initialChartDataset] };

  const [distribusiSiswaKelasData, setDistribusiSiswaKelasData] = useState(initialChartData);
  const [materiPerTipeChartData, setMateriPerTipeChartData] = useState({ labels: [], datasets: [{ label: 'Jumlah Materi', data: []}]});
  const [materiPerKelasChartData, setMateriPerKelasChartData] = useState(initialChartData);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) {
        setLoading(true);
        setError(null);
    }
    try {
      const [userRes, materiRes, quizAttemptsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/users/siswa`),
        axios.get(`${API_BASE_URL}/api/materi/crud-materi`),
        axios.get(`${API_BASE_URL}/api/quiz/results/admin?limit=0`)
      ]);

      let currentSiswaCount = 0;
      if (userRes.data.success && Array.isArray(userRes.data.users)) {
        setAllUsers(userRes.data.users);
        currentSiswaCount = userRes.data.users.length;
        const sortedUsers = [...userRes.data.users].sort((a, b) => new Date(b.tanggal_daftar) - new Date(a.tanggal_daftar));
        setSiswaTerbaru(sortedUsers.slice(0, 5));
      } else {
        console.warn("DashboardAdmin: Data pengguna tidak valid.", userRes.data);
        setAllUsers([]); 
      }

      let currentMateriCount = 0;
      if (Array.isArray(materiRes.data)) { 
        setAllMateriData(materiRes.data);
        currentMateriCount = materiRes.data.length;
      } else {
        console.warn("DashboardAdmin: Data materi tidak valid.", materiRes.data);
        setAllMateriData([]); 
      }

      let currentPercobaanKuisCount = 0;
      if (Array.isArray(quizAttemptsRes.data)) {
        setAllQuizAttempts(quizAttemptsRes.data); 
        currentPercobaanKuisCount = quizAttemptsRes.data.length;
      } else {
        console.warn("DashboardAdmin: Data percobaan kuis tidak valid.", quizAttemptsRes.data);
        setAllQuizAttempts([]);
      }

      setStats({ siswa: currentSiswaCount, materi: currentMateriCount, percobaanKuis: currentPercobaanKuisCount });
      if (isInitialLoad) setError(null);

    } catch (err) {
      console.error("DashboardAdmin: Gagal mengambil data dashboard:", err.response?.data?.message || err.message, err);
      const errorMessage = `Tidak dapat memuat data: ${err.response?.data?.message || err.message || "Error tidak diketahui."}`;
      if (isInitialLoad || !error ) { 
          setError(errorMessage);
      }
      setAllUsers([]); setAllMateriData([]); setAllQuizAttempts([]);
      setStats({ siswa: 0, materi: 0, percobaanKuis: 0 });
    } finally {
      if (isInitialLoad) {
          setLoading(false);
      }
    }
  }, [error]); 

  useEffect(() => {
    fetchData(true);
    const intervalId = setInterval(() => fetchData(false), POLLING_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchData]);

  useEffect(() => {
    if (loading && (!distribusiSiswaKelasData.datasets[0] || distribusiSiswaKelasData.datasets[0].data.length === 0)) {
        setDistribusiSiswaKelasData({ labels: [], datasets: [{ label: 'Jumlah Siswa', data: [], backgroundColor: 'rgba(75, 192, 192, 0.6)', borderColor: 'rgba(75, 192, 192, 1)', borderWidth: 1 }] });
        return;
    }
    if (allUsers.length === 0 && !loading) {
      setDistribusiSiswaKelasData({ labels: [], datasets: [{ label: 'Jumlah Siswa', data: [], backgroundColor: 'rgba(75, 192, 192, 0.6)', borderColor: 'rgba(75, 192, 192, 1)', borderWidth: 1 }] });
      return;
    }
    const kelasCounts = allUsers.reduce((acc, user) => {
      const kelas = user.kelas || "Tidak Diketahui";
      acc[kelas] = (acc[kelas] || 0) + 1;
      return acc;
    }, {});

    const labels = Object.keys(kelasCounts);
    const data = Object.values(kelasCounts);
    
    const currentLabelsStr = distribusiSiswaKelasData.labels.join(',');
    const currentDataStr = distribusiSiswaKelasData.datasets[0]?.data.join(',');

    if (labels.join(',') !== currentLabelsStr || data.join(',') !== currentDataStr) {
        if (labels.length > 0) {
            setDistribusiSiswaKelasData({
              labels,
              datasets: [{
                label: 'Jumlah Siswa', data,
                backgroundColor: 'rgba(75, 192, 192, 0.6)', borderColor: 'rgba(75, 192, 192, 1)', borderWidth: 1,
              }]
            });
        } else { 
            setDistribusiSiswaKelasData({ labels: [], datasets: [{ label: 'Jumlah Siswa', data: [], backgroundColor: 'rgba(75, 192, 192, 0.6)', borderColor: 'rgba(75, 192, 192, 1)', borderWidth: 1 }] });
        }
    }
  }, [allUsers, loading, distribusiSiswaKelasData.datasets, distribusiSiswaKelasData.labels]);

  useEffect(() => {
    if (loading && (!materiPerTipeChartData.datasets[0] || materiPerTipeChartData.datasets[0].data.length === 0)) {
        setMateriPerTipeChartData({ labels: [], datasets: [{ label: 'Jumlah Materi', data: [], backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'] }] });
        return;
    }
    if (allMateriData.length === 0 && !loading) {
      setMateriPerTipeChartData({ labels: [], datasets: [{ label: 'Jumlah Materi', data: [], backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'] }] });
      return;
    }

    const tipeCounts = allMateriData.reduce((acc, materi) => {
      const tipe = materi.TIPE_MATERI || "Tidak Diketahui";
      acc[tipe] = (acc[tipe] || 0) + 1;
      return acc;
    }, {});

    const labels = Object.keys(tipeCounts);
    const data = Object.values(tipeCounts);

    const currentLabelsStr = materiPerTipeChartData.labels.join(',');
    const currentDataStr = materiPerTipeChartData.datasets[0]?.data.join(',');

    if (labels.join(',') !== currentLabelsStr || data.join(',') !== currentDataStr) {
        if (labels.length > 0) {
            setMateriPerTipeChartData({
              labels,
              datasets: [{
                label: 'Jumlah Materi', data,
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FFCD56', '#C9CBCF'],
                borderColor: '#fff', borderWidth: 1, hoverOffset: 8
              }]
            });
        } else {
             setMateriPerTipeChartData({ labels: [], datasets: [{ label: 'Jumlah Materi', data: [], backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'] }] });
        }
    }
  }, [allMateriData, loading, materiPerTipeChartData.datasets, materiPerTipeChartData.labels]);

  useEffect(() => {
    if (loading && (!materiPerKelasChartData.datasets[0] || materiPerKelasChartData.datasets[0].data.length === 0)) {
        setMateriPerKelasChartData({ labels: [], datasets: [{ label: 'Jumlah Materi', data: [], backgroundColor: 'rgba(255, 159, 64, 0.6)', borderColor: 'rgba(255, 159, 64, 1)', borderWidth: 1 }] });
        return;
    }
    if (allMateriData.length === 0 && !loading) {
      setMateriPerKelasChartData({ labels: [], datasets: [{ label: 'Jumlah Materi', data: [], backgroundColor: 'rgba(255, 159, 64, 0.6)', borderColor: 'rgba(255, 159, 64, 1)', borderWidth: 1 }] });
      return;
    }

    const kelasCounts = allMateriData.reduce((acc, materi) => {
      const kelas = materi.KELAS || "Tidak Diketahui";
      acc[kelas] = (acc[kelas] || 0) + 1;
      return acc;
    }, {});

    const labels = Object.keys(kelasCounts);
    const data = Object.values(kelasCounts);

    const currentLabelsStr = materiPerKelasChartData.labels.join(',');
    const currentDataStr = materiPerKelasChartData.datasets[0]?.data.join(',');
    
    if (labels.join(',') !== currentLabelsStr || data.join(',') !== currentDataStr) {
        if (labels.length > 0) {
            setMateriPerKelasChartData({
              labels,
              datasets: [{
                label: 'Jumlah Materi', data,
                backgroundColor: 'rgba(255, 159, 64, 0.6)', borderColor: 'rgba(255, 159, 64, 1)', borderWidth: 1,
              }]
            });
        } else {
            setMateriPerKelasChartData({ labels: [], datasets: [{ label: 'Jumlah Materi', data: [], backgroundColor: 'rgba(255, 159, 64, 0.6)', borderColor: 'rgba(255, 159, 64, 1)', borderWidth: 1 }] });
        }
    }
  }, [allMateriData, loading, materiPerKelasChartData.datasets, materiPerKelasChartData.labels]);


  const handleNavigation = (path) => navigate(path);
  const handleLogout = () => {
    alert("Anda telah logout!");
    localStorage.removeItem("adminToken"); localStorage.removeItem("adminData");
    navigate("/admin/login");
  };

  const sidebarItems = [
    { icon: FaChartLine, label: "Dashboard", path: "/admin/dashboardadmin" },
    { icon: FaUsers, label: "Siswa", path: "/admin/siswa" },
    { icon: FaBookOpen, label: "Materi", path: "/admin/materi" },
  ];

  const currentDistribusiSiswaOptions = {
    ...baseChartOptions,
    plugins: { ...baseChartOptions.plugins, title: { ...baseChartOptions.plugins.title, text: "Distribusi Siswa per Kelas" }},
  };
  const currentMateriPerTipeOptions = {
    ...doughnutOptionsBase,
    plugins: { ...doughnutOptionsBase.plugins, title: { ...doughnutOptionsBase.plugins.title, text: "Jumlah Materi per Tipe" }},
  };
  const currentMateriPerKelasOptions = { 
    ...baseChartOptions, 
    plugins: { ...baseChartOptions.plugins, title: { ...baseChartOptions.plugins.title, text: "Jumlah Materi per Kelas" }},
  };

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">
      <aside className={`${sidebarCollapsed ? 'w-[5.5rem]' : 'w-72'} bg-white shadow-xl flex flex-col fixed h-full transition-all duration-300 border-r border-gray-200 z-30`}>
        <div className="p-5 border-b border-gray-200 h-[73px] flex items-center">
          <div className="flex items-center justify-between w-full">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <FaCrown className="text-white text-xl" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">LearnFlow</h1>
              </div>
            )}
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-purple-600 transition-colors" title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}>
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
              }`}>
              <item.icon className={`text-lg ${location.pathname === item.path ? 'text-white' : 'text-gray-400 group-hover:text-purple-600'}`} />
              {!sidebarCollapsed && <span className="font-medium text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button onClick={handleLogout} title="Logout"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 group ${sidebarCollapsed ? 'justify-center': ''}`}>
            <FaSignOutAlt className="text-lg text-red-500 group-hover:text-red-600" />
            {!sidebarCollapsed && <span className="font-medium text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      <main className={`flex-1 p-6 sm:p-8 ${sidebarCollapsed ? 'ml-[5.5rem]' : 'ml-72'} transition-all duration-300`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Dashboard Admin</h2>
            <p className="text-gray-500 text-sm sm:text-base">Ringkasan aktivitas platform LearnFlow Anda.</p>
          </div>
        </div>

        {loading && <div className="flex flex-col justify-center items-center h-64 text-center"><FaSpinner className="animate-spin text-4xl text-purple-600" /> <span className="ml-3 mt-3 text-lg text-gray-600">Memuat data dashboard...</span></div>}
        {error && !loading && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md mb-6"><p className="font-bold">Terjadi Kesalahan</p><p>{error}</p></div>}

        {!loading && !error && (
          <>
            {}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <StatCard icon={FaUsers} title="Total Siswa" value={stats.siswa} subtitle="Pembelajar aktif" iconBgColor="bg-gradient-to-br from-blue-500 to-sky-600" cardBgGradient="bg-white hover:bg-blue-50/50" />
              <StatCard icon={FaBookOpen} title="Total Materi" value={stats.materi} subtitle="Konten tersedia" iconBgColor="bg-gradient-to-br from-green-500 to-emerald-600" cardBgGradient="bg-white hover:bg-green-50/50" />
              {}
            </div>
            
            {}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-5 sm:p-6 hover:shadow-2xl transition-shadow">
                <div className="h-80 sm:h-96">
                  {distribusiSiswaKelasData.labels && distribusiSiswaKelasData.labels.length > 0 && distribusiSiswaKelasData.datasets[0]?.data.length > 0 ? (
                     <Bar data={distribusiSiswaKelasData} options={currentDistribusiSiswaOptions} />
                  ) : (<p className="text-center text-gray-500 pt-10">Data siswa tidak cukup untuk distribusi kelas.</p>)}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-5 sm:p-6 hover:shadow-2xl transition-shadow">
                 <div className="h-80 sm:h-96 flex items-center justify-center">
                    {(materiPerTipeChartData.labels && materiPerTipeChartData.labels.length > 0 && materiPerTipeChartData.datasets[0]?.data.some(d => d > 0)) ? (
                        <Doughnut data={materiPerTipeChartData} options={currentMateriPerTipeOptions} />
                    ) : (<p className="text-center text-gray-500">Tidak ada data tipe materi.</p>)}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6 sm:gap-8 mb-8"> 
                <div className="bg-white rounded-xl shadow-lg p-5 sm:p-6 hover:shadow-2xl transition-shadow">
                    <div className="h-80 sm:h-96">
                        {(materiPerKelasChartData.labels && materiPerKelasChartData.labels.length > 0 && materiPerKelasChartData.datasets[0]?.data.length > 0) ? (
                            <Bar data={materiPerKelasChartData} options={currentMateriPerKelasOptions} />
                        ) : (<p className="text-center text-gray-500 pt-10">Data materi tidak cukup untuk distribusi per kelas.</p>)}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow">
              <div className="p-5 sm:p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800">Siswa Terbaru Terdaftar</h3>
                  <button onClick={() => navigate("/admin/siswa")}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-400 transition-colors text-xs sm:text-sm font-medium shadow-md hover:shadow-lg">
                    Lihat Semua Siswa
                  </button>
                </div>
              </div>
              <div className="p-1 sm:p-2 md:p-3">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px]">
                    <thead>
                      <tr className="text-left border-b border-gray-100">
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Siswa</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Kelas</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Status</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {siswaTerbaru.map((siswa) => (
                        <tr key={siswa.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <img
                                src={siswa.foto_profil ? (siswa.foto_profil.startsWith('http') ? siswa.foto_profil : `${API_BASE_URL}${siswa.foto_profil}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(siswa.username || 'N A')}&background=random&color=fff&size=36&font-size=0.4&rounded=true`}
                                alt={siswa.username || 'Avatar Siswa'}
                                className="w-9 h-9 rounded-full object-cover mr-3 border-2 border-white shadow-sm group-hover:ring-2 group-hover:ring-purple-300 transition-all"
                                onError={(e) => { e.target.onerror = null; e.target.src=`https://ui-avatars.com/api/?name=${encodeURIComponent(siswa.username || 'N A')}&background=random&color=fff&size=36&font-size=0.4&rounded=true`}}
                              />
                              <div>
                                <div className="font-semibold text-sm text-gray-800">{siswa.nama_lengkap || siswa.username}</div>
                                <div className="text-xs text-gray-500">ID: {siswa.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">{siswa.email}</td>
                           <td className="py-3 px-4 text-sm text-gray-600 text-center">{siswa.kelas || '-'}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 border border-green-200">
                              Aktif
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => navigate(`/admin/siswa/${siswa.id}`)} 
                              className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors" title="Lihat Detail Siswa">
                              <FaEye size={16}/>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                 {siswaTerbaru.length === 0 && !loading && (
                    <p className="text-center text-gray-500 py-8">Tidak ada data siswa terbaru.</p>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default DashboardAdmin;