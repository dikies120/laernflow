import React, { useEffect, useState } from "react";
import { FaChartBar, FaBook, FaHistory } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";

const Materi = () => {
  const [materiList, setMateriList] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetch("http://localhost:5000/api/materi/crud-materi")
      .then(res => res.json())
      .then(data => setMateriList(data));
  }, []);

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    alert("You have been logged out!");
    navigate("/");
  };

  // Saat kotak materi diklik, masuk ke halaman detail materi
  const handleMateriClick = (id) => {
    navigate(`/materi/${id}`);
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
        <h3 className="text-lg font-semibold mb-4">Daftar Materi</h3>
        <div className="grid grid-cols-3 gap-4">
          {materiList.map((materi) => (
            <div
              key={materi.ID}
              className="relative p-4 rounded-lg h-40 flex items-end bg-purple-700 text-white cursor-pointer hover:bg-purple-800 transition"
              onClick={() => handleMateriClick(materi.ID)}
            >
              <p className="font-semibold">{materi.NAMA_MATERI}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Materi;