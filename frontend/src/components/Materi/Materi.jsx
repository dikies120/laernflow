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
  const [allMateriList, setAllMateriList] = useState([]);
  const [filteredMateriList, setFilteredMateriList] = useState([]);
  const [user, setUser] = useState({ USERNAME: "Guest", EMAIL: "", KELAS: "" }); // Tambahkan state user
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Ambil data user dari localStorage/sessionStorage
  useEffect(() => {
    let storedUserData = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (storedUserData) {
      try {
        const parsedUser = JSON.parse(storedUserData);
        console.log('Materi.jsx: User data from storage (parsedUser):', parsedUser);
        setUser({
          USERNAME: parsedUser.USERNAME || "User",
          EMAIL: parsedUser.EMAIL || "",
          KELAS: parsedUser.KELAS || ""
        });
      } catch (error) {
        console.error("Materi.jsx: Error parsing user data from storage:", error);
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");
      }
    }

    // Fetch semua materi
    fetch("http://localhost:5000/api/materi/crud-materi")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setAllMateriList(Array.isArray(data) ? data : []);
        console.log('Materi.jsx: All materi fetched:', data);
      })
      .catch((err) => {
        console.error("Materi.jsx: Failed to fetch materi:", err);
        setAllMateriList([]);
      });
  }, []); // Hanya dijalankan sekali saat komponen dimuat

  // 2. Filter materi berdasarkan kelas user ketika user.KELAS atau allMateriList berubah
  useEffect(() => {
    console.log('Materi.jsx: Filtering. User KELAS:', user.KELAS, 'All Materi Count:', allMateriList.length);
    if (user.KELAS && user.KELAS.trim() !== "" && allMateriList.length > 0) {
      const filtered = allMateriList.filter(materi =>
        materi.KELAS && materi.KELAS.toString().trim().toLowerCase() === user.KELAS.toString().trim().toLowerCase()
      );
      setFilteredMateriList(filtered);
      console.log('Materi.jsx: Filtered materi:', filtered);
    } else {
      // Jika user tidak punya kelas, atau tidak ada materi, tampilkan list kosong
      // Atau bisa juga tampilkan semua materi jika user.KELAS kosong (sesuai preferensi)
      // Saat ini: tampilkan kosong jika kelas user tidak ada
      setFilteredMateriList([]);
      console.log('Materi.jsx: No user class or no materi, filtered list is empty.');
    }
  }, [user.KELAS, allMateriList]);


  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    alert("You have been logged out!");
    localStorage.removeItem("user"); // Hapus user dari storage
    sessionStorage.removeItem("user");
    setUser({ USERNAME: "Guest", EMAIL: "", KELAS: "" }); // Reset state user
    navigate("/");
  };

  const handleMateriClick = (id) => {
    navigate(`/materi/${id}`);
  };

  const materiPageTitle = user.KELAS && user.KELAS.trim() !== ""
    ? `📚 Daftar Materi (Kelas: ${user.KELAS})`
    : "📚 Daftar Materi (Kelas tidak ditentukan)";


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
              location.pathname.startsWith("/materi") // Aktif jika path dimulai dengan /materi
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
          {materiPageTitle}
        </h3>
        {/* Gunakan filteredMateriList untuk ditampilkan */}
        {filteredMateriList.length === 0 ? (
          <p className="text-gray-500">
             {user.KELAS && user.KELAS.trim() !== ""
              ? `Belum ada materi tersedia untuk kelas ${user.KELAS}.`
              : "Kelas Anda belum ditentukan atau tidak ada materi yang sesuai."}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {filteredMateriList.map((materi, index) => {
              const palette = colorPalettes[index % colorPalettes.length];
              return (
                <div
                  key={materi.ID || index}
                  className={`relative rounded-2xl overflow-hidden shadow-xl cursor-pointer group transform hover:scale-105 transition border-2 border-white`}
                  onClick={() => handleMateriClick(materi.ID)}
                  style={{ minHeight: 200 }}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-t ${palette} opacity-80 group-hover:opacity-90 transition`}
                  ></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                    <FaPlayCircle className="text-white text-4xl mb-2 opacity-90 group-hover:scale-110 transition" />
                    <p className="text-white font-bold text-lg px-4 text-center drop-shadow-lg">
                      {materi.NAMA_MATERI || "Tanpa Judul"}
                    </p>
                    {materi.KELAS && (
                      <span className="mt-2 px-3 py-1 bg-white/80 text-purple-700 rounded-full text-xs font-semibold shadow">
                        Kelas {materi.KELAS}
                      </span>
                    )}
                     {/* Tampilkan Tipe Materi Jika Ada */}
                    {materi.TIPE_MATERI && (
                      <span className="mt-1 px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs font-medium shadow">
                        {materi.TIPE_MATERI}
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