import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FaArrowLeft, FaPlayCircle, FaChalkboardTeacher, FaChartBar, FaBook, FaHistory } from "react-icons/fa";

const MateriDetail = () => {
  const { id } = useParams();
  const [materi, setMateri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetch("http://localhost:5000/api/materi/crud-materi")
      .then(res => {
        if (!res.ok) throw new Error("Gagal mengambil data materi");
        return res.json();
      })
      .then(data => {
        const found = data.find(m => String(m.ID) === String(id));
        if (found) {
          setMateri(found);
        } else {
          setError("Materi tidak ditemukan");
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error:", err);
        setError("Gagal memuat data materi");
        setLoading(false);
      });
  }, [id]);

  const getYoutubeEmbed = (url) => {
    let videoId = "";
    try {
      if (url.includes("youtube.com")) {
        const params = new URL(url).searchParams;
        videoId = params.get("v");
      } else if (url.includes("youtu.be")) {
        videoId = url.split("youtu.be/")[1];
      }
    } catch (e) {
      console.warn("URL tidak valid", e);
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
  };

  // Gambar sampul fallback yang lebih menarik
  const getCover = () => {
    if (materi.SAMPUL && materi.SAMPUL.trim() !== "") {
      return materi.SAMPUL;
    }
    const keywords = encodeURIComponent(
      `${materi.NAMA_MATERI || "biology"},education,school,science`
    );
    return `https://source.unsplash.com/600x300/?${keywords}&sig=${materi.ID}`;
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    alert("You have been logged out!");
    navigate("/");
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100">
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
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold"
        >
          <FaArrowLeft /> Kembali
        </button>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* KIRI - VIDEO & PETUNJUK */}
          <div className="flex-1 rounded-2xl shadow-lg overflow-hidden bg-white">
            <div className="p-4">
              {materi.LINK_YOUTUBE && getYoutubeEmbed(materi.LINK_YOUTUBE) ? (
                <div className="aspect-w-16 aspect-h-9 w-full rounded-lg overflow-hidden shadow mb-4">
                  <iframe
                    className="w-full h-64 lg:h-[400px] rounded-lg"
                    src={getYoutubeEmbed(materi.LINK_YOUTUBE)}
                    title={materi.NAMA_MATERI}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              ) : (
                <div className="p-4">
                  <a
                    href={materi.LINK_YOUTUBE}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    Lihat Video
                  </a>
                </div>
              )}

              {/* Petunjuk */}
              <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow flex items-center gap-3">
                <span className="text-yellow-600 font-bold text-xl">⚠️</span>
                <div>
                  <div className="font-semibold text-yellow-700 mb-1">
                    Petunjuk:
                  </div>
                  <ul className="list-disc ml-5 text-sm text-yellow-800">
                    <li>Lihat dan pahami materi di atas sampai selesai.</li>
                    <li>Setelah benar-benar paham, lanjutkan ke Quiz.</li>
                    <li>Materi berikutnya akan terbuka jika kamu sudah menyelesaikan quiz dengan benar.</li>
                  </ul>
                  <div className="mt-2 text-xs text-yellow-700 italic">
                    Untuk itu, pastikan kamu benar-benar memahami materi ini sebelum melanjutkan ke materi berikutnya.
                  </div>
                </div>
              </div>

              {/* Pembahasan jika ada */}
              {/* {materi.PEMBAHASAN && materi.PEMBAHASAN.trim() !== "" && (
                <div className="mt-8 bg-purple-50 border-l-4 border-purple-400 p-6 rounded-xl shadow">
                  <h3 className="text-lg font-bold text-purple-700 mb-2">Pembahasan Materi</h3>
                  <div className="text-gray-700 leading-relaxed">
                    <span dangerouslySetInnerHTML={{ __html: materi.PEMBAHASAN }} />
                  </div>
                </div>
              )} */}
            </div>
          </div>

          {/* KANAN - INFO */}
          <div className="w-full lg:w-1/3 bg-white p-8 rounded-2xl shadow-xl flex flex-col gap-2">
            <div className="flex items-center gap-3 mb-2">
              <FaChalkboardTeacher className="text-purple-600 text-2xl" />
              <h2 className="text-2xl font-bold">{materi.NAMA_MATERI}</h2>
            </div>
            <span className="inline-block bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-base font-bold mb-2 shadow">
              Kelas {materi.KELAS}
            </span>
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded text-base font-bold shadow">
                Tonton video dan pelajari materi ini!
              </span>
            </div>
            <button
              onClick={() => navigate(`/quiz/${materi.ID}`)}
              className="mt-4 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-semibold shadow hover:from-blue-700 hover:to-purple-700 transition"
            >
              Mulai Quiz
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MateriDetail;