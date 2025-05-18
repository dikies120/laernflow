import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaChartBar, FaBook, FaHistory, FaPlayCircle } from "react-icons/fa";

const colorPalettes = [
  "from-purple-600 via-pink-500 to-red-400",
  "from-blue-600 via-cyan-500 to-green-400",
  "from-yellow-500 via-orange-400 to-pink-500",
  "from-green-600 via-lime-400 to-yellow-300",
  "from-indigo-700 via-blue-400 to-teal-300",
  "from-rose-500 via-fuchsia-500 to-indigo-500",
];

const Dashboard = () => {
  const [materiList, setMateriList] = useState([]);
  const [user, setUser] = useState({ USERNAME: "User" });
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/api/materi/crud-materi")
      .then(res => res.json())
      .then(data => setMateriList(data));
    // Ambil user dari localStorage/sessionStorage
    let userData = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (userData) {
      userData = JSON.parse(userData);
      if (userData.USERNAME) {
        setUser(userData);
      }
    }
  }, []);

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    alert("You have been logged out!");
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    navigate("/");
  };

  const handleMateriClick = (id) => {
    navigate(`/materi/${id}`);
  };

  // Gambar random dengan variasi keyword
  const getRandomImage = (keyword, idx) => {
    const keywords = [
      keyword,
      "biology",
      "school",
      "science",
      "education",
      "learning",
      "students",
      "classroom",
    ];
    const query = keywords.filter(Boolean).join(",");
    return `https://source.unsplash.com/400x300/?${query}&sig=${idx}`;
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-6 flex flex-col fixed h-full">
        <h1 className="text-2xl font-bold mb-6 text-blue-700">LearnFlow</h1>
        <nav className="space-y-4">
          <button
            onClick={() => handleNavigation("/dashboard")}
            className="flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-800 text-left w-full"
          >
            <FaChartBar />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => handleNavigation("/materi")}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-800 text-left w-full"
          >
            <FaBook />
            <span>Materi</span>
          </button>
          <button
            onClick={() => handleNavigation("/quiz-history")}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-800 text-left w-full"
          >
            <FaHistory />
            <span>Quiz History</span>
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
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="https://randomuser.me/api/portraits/men/75.jpg"
              className="w-24 h-24 rounded-lg"
              alt="Profile"
            />
            <div>
  <h2 className="text-xl font-bold text-blue-700">{user.USERNAME}</h2>
  <p className="text-gray-500 text-sm">{user.EMAIL}</p>
</div>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-lg font-bold">27</p>
              <p className="text-gray-500">Quiz Passed</p>
            </div>
          </div>
        </div>

        {/* Daftar Materi seperti di page materi */}
        <h3 className="text-xl font-bold mb-6 text-gray-800">📚 Daftar Materi</h3>
        {materiList.length === 0 ? (
          <p className="text-gray-500">Belum ada materi tersedia.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {materiList.map((materi, index) => {
              const palette = colorPalettes[index % colorPalettes.length];
              return (
                <div
                  key={materi.ID || index}
                  className="relative rounded-2xl overflow-hidden shadow-xl cursor-pointer group transform hover:scale-105 transition border-2 border-white"
                  onClick={() => handleMateriClick(materi.ID)}
                  style={{ minHeight: 200 }}
                >
                  {/* <img
                    src={
                      materi.SAMPUL && materi.SAMPUL.trim() !== ""
                        ? materi.SAMPUL
                        : getRandomImage(materi.NAMA_MATERI, index)
                    }
                    alt={materi.NAMA_MATERI || "Materi"}
                    className="w-full h-40 object-cover"
                  /> */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-t ${palette} opacity-80 group-hover:opacity-90 transition`}
                  ></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <FaPlayCircle className="text-white text-4xl mb-2 opacity-90 group-hover:scale-110 transition" />
                    <p className="text-white font-bold text-lg px-4 text-center drop-shadow-lg">
                      {materi.NAMA_MATERI || "Tanpa Judul"}
                    </p>
                    {materi.KELAS && (
                      <span className="mt-2 px-3 py-1 bg-white/80 text-purple-700 rounded-full text-xs font-semibold shadow">
                        Kelas {materi.KELAS}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;