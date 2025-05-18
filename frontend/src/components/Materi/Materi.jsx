import React, { useEffect, useState } from "react";
import { FaChartBar, FaBook, FaHistory, FaPlayCircle } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";

const colorPalettes = [
  "from-purple-600 via-pink-500 to-red-400",
  "from-blue-600 via-cyan-500 to-green-400",
  "from-yellow-500 via-orange-400 to-pink-500",
  "from-green-600 via-lime-400 to-yellow-300",
  "from-indigo-700 via-blue-400 to-teal-300",
  "from-rose-500 via-fuchsia-500 to-indigo-500",
];

const Materi = () => {
  const [materiList, setMateriList] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetch("http://localhost:5000/api/materi/crud-materi")
      .then((res) => res.json())
      .then((data) => setMateriList(data))
      .catch((err) => {
        console.error("Failed to fetch materi:", err);
      });
  }, []);

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    alert("You have been logged out!");
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
    // Gunakan idx agar gambar tetap konsisten per materi
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
            className={`flex items-center gap-2 text-left w-full font-semibold ${
              location.pathname === "/dashboard"
                ? "text-blue-600"
                : "text-gray-600 hover:text-blue-800"
            }`}
          >
            <FaChartBar />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => handleNavigation("/materi")}
            className={`flex items-center gap-2 text-left w-full font-semibold ${
              location.pathname.startsWith("/materi")
                ? "text-blue-600"
                : "text-gray-600 hover:text-blue-800"
            }`}
          >
            <FaBook />
            <span>Materi</span>
          </button>
          <button
            onClick={() => handleNavigation("/quiz-history")}
            className={`flex items-center gap-2 text-left w-full font-semibold ${
              location.pathname === "/quiz-history"
                ? "text-blue-600"
                : "text-gray-600 hover:text-blue-800"
            }`}
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
        <h3 className="text-xl font-bold mb-6 text-gray-800">
          📚 Daftar Materi
        </h3>
        {materiList.length === 0 ? (
          <p className="text-gray-500">Belum ada materi tersedia.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {materiList.map((materi, index) => {
              const palette = colorPalettes[index % colorPalettes.length];
              return (
                <div
                  key={materi.ID || index}
                  className={`relative rounded-2xl overflow-hidden shadow-xl cursor-pointer group transform hover:scale-105 transition border-2 border-white`}
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

export default Materi;
