import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  FaArrowLeft,
  FaPlayCircle,
  FaChalkboardTeacher,
  FaChartBar,
  FaBook,
  FaHistory,
  FaFilePdf,
  FaFileWord,
  FaFilePowerpoint,
  FaFileImage, // Ikon untuk gambar
  FaFileAlt,
  FaLink,
  FaDownload, // Ikon untuk download
} from "react-icons/fa";

const getFileIconAndName = (filePathOrLink) => {
  if (!filePathOrLink) return { icon: <FaFileAlt className="text-xl text-gray-500" />, name: "File tidak diketahui" };
  const fileName = filePathOrLink.split(/[\\/]/).pop(); // Ambil nama file dari path
  const extension = fileName.split('.').pop().toLowerCase();

  if (extension === 'pdf') return { icon: <FaFilePdf className="text-xl text-red-500" />, name: fileName };
  if (extension === 'doc' || extension === 'docx') return { icon: <FaFileWord className="text-xl text-blue-500" />, name: fileName };
  if (extension === 'ppt' || extension === 'pptx') return { icon: <FaFilePowerpoint className="text-xl text-orange-500" />, name: fileName };
  if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(extension)) return { icon: <FaFileImage className="text-xl text-teal-500" />, name: fileName };
  return { icon: <FaFileAlt className="text-xl text-gray-500" />, name: fileName };
};

const MateriDetail = () => {
  const { id } = useParams();
  const [materi, setMateri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`http://localhost:5000/api/materi/crud-materi`) // Asumsi mengambil semua, lalu find
      .then(res => {
        if (!res.ok) throw new Error(`Gagal mengambil data. Status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (!Array.isArray(data)) throw new Error("Format data materi tidak valid.");
        const found = data.find(m => String(m.ID) === String(id));
        if (found) {
          console.log("MateriDetail.jsx: Materi fetched ->", found);
          setMateri(found);
        } else {
          setError("Materi tidak ditemukan.");
        }
      })
      .catch(err => {
        console.error("MateriDetail Error fetching materi:", err);
        setError(err.message || "Gagal memuat detail materi.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const getYoutubeEmbedUrl = (youtubeLink) => {
    if (!youtubeLink) return "";
    let videoId = null;
    try {
      const url = new URL(youtubeLink);
      if (url.hostname === "youtube.com" || url.hostname === "www.youtube.com") {
        videoId = url.searchParams.get("v");
      } else if (url.hostname === "youtu.be") {
        videoId = url.pathname.split("/").pop();
      }
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    } catch (e) {
      console.warn("Could not parse YouTube URL:", youtubeLink, e);
    }
    // Fallback untuk format URL yang lebih sederhana jika parsing gagal
    const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/i;
    const match = youtubeLink.match(regex);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return ""; // Kembalikan string kosong jika tidak ada ID video yang valid
  };


  const handleNavigation = (path) => navigate(path);
  const handleLogout = () => {
    alert("You have been logged out!");
    localStorage.removeItem("user"); sessionStorage.removeItem("user");
    navigate("/");
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen text-xl font-semibold">Memuat materi...</div>;
  if (error) return <div className="flex justify-center items-center min-h-screen text-xl text-red-600 p-8">{error}</div>;
  if (!materi) return <div className="flex justify-center items-center min-h-screen text-xl">Materi tidak ditemukan.</div>;

  const embedYoutubeUrl = materi.TIPE_MATERI === "Video" ? getYoutubeEmbedUrl(materi.LINK_YOUTUBE) : "";
  const documentUrl = materi.LINK_DOKUMEN ? `http://localhost:5000/${materi.LINK_DOKUMEN.replace(/\\/g, "/")}` : "";
  const documentFileInfo = getFileIconAndName(materi.LINK_DOKUMEN);

  const isPdf = materi.LINK_DOKUMEN && materi.LINK_DOKUMEN.toLowerCase().endsWith('.pdf');
  const isImage = materi.LINK_DOKUMEN && /\.(jpeg|jpg|gif|png|webp|bmp)$/i.test(materi.LINK_DOKUMEN.toLowerCase());


  const renderMateriContent = () => {
    switch (materi.TIPE_MATERI) {
      case "Video":
        return embedYoutubeUrl ? (
          <div className="aspect-w-16 aspect-h-9 w-full rounded-lg overflow-hidden shadow-md mb-6 bg-black">
            <iframe className="w-full h-64 lg:h-[480px] rounded-lg" src={embedYoutubeUrl} title={materi.NAMA_MATERI} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
          </div>
        ) : materi.LINK_YOUTUBE ? (
          <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <FaPlayCircle className="text-5xl text-blue-500 mb-4 mx-auto"/>
            <p className="text-blue-700 mb-3 text-lg">Video tidak dapat disematkan atau link tidak valid.</p>
            <a href={materi.LINK_YOUTUBE} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
               Lihat Video di Sumber Asli <FaLink />
            </a>
          </div>
        ) : <p className="text-gray-600 mb-6 p-4 bg-gray-100 rounded-lg">Link video tidak tersedia.</p>;

      case "Teks":
        return (
          <div className="mb-6 p-6 bg-indigo-50 border-2 border-indigo-100 rounded-xl shadow-sm prose max-w-none lg:prose-lg">
            <h3 className="text-2xl font-semibold text-indigo-800 mb-4 flex items-center gap-2"><FaAlignLeft />Isi Materi Teks:</h3>
            {materi.ISI_TEKS && materi.ISI_TEKS.trim() !== "" ? (
              <div className="text-gray-800 whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: materi.ISI_TEKS.replace(/\n/g, '<br />') }}></div>
            ) : (
              <p className="text-gray-600 italic">Konten teks tidak tersedia untuk materi ini.</p>
            )}
            {/* Menampilkan LINK_YOUTUBE sebagai link referensi jika ada untuk materi Teks */}
            {materi.LINK_YOUTUBE && (
              <div className="mt-6 pt-4 border-t border-indigo-200">
                <p className="text-sm font-semibold text-indigo-700 mb-1">Link Referensi Tambahan:</p>
                <a href={materi.LINK_YOUTUBE} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline hover:text-indigo-800 break-all flex items-center gap-1">
                  <FaLink /> {materi.LINK_YOUTUBE}
                </a>
              </div>
            )}
          </div>
        );

      case "Dokumen":
        if (!materi.LINK_DOKUMEN) {
          return <p className="text-gray-600 mb-6 p-4 bg-gray-100 rounded-lg">File dokumen tidak tersedia.</p>;
        }
        if (isPdf) {
          return (
            <div className="mb-6 bg-gray-100 rounded-lg shadow-inner overflow-hidden">
              <iframe src={documentUrl} width="100%" height="750px" title={materi.NAMA_MATERI} className="border-0">
                Browser Anda tidak mendukung pratinjau PDF.
                <a href={documentUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 underline">Unduh PDF ({documentFileInfo.name})</a>
              </iframe>
            </div>
          );
        }
        if (isImage) {
          return (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
              <img src={documentUrl} alt={materi.NAMA_MATERI} className="max-w-full max-h-[70vh] h-auto rounded-md mx-auto shadow-lg" />
              <a href={documentUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                <FaDownload /> Lihat/Unduh Gambar ({documentFileInfo.name})
              </a>
            </div>
          );
        }
        // Untuk DOCX, PPTX, dll. - Coba Google Docs Viewer (perlu URL publik)
        // Jika tidak, hanya link download.
        const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(documentUrl)}&embedded=true`;
        return (
          <div className="mb-6">
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 mb-4 rounded-r-lg">
              <p className="font-semibold">Catatan Pratinjau Dokumen:</p>
              <p className="text-sm">Pratinjau di bawah menggunakan layanan eksternal (Google Docs Viewer) dan mungkin tidak berfungsi jika file tidak dapat diakses secara publik dari internet (misalnya pada server lokal Anda). Jika pratinjau gagal, silakan gunakan tombol unduh.</p>
            </div>
            <div className="aspect-w-4 aspect-h-3 lg:aspect-w-16 lg:aspect-h-9 w-full rounded-lg overflow-hidden shadow-md mb-4 bg-gray-200">
              <iframe src={googleViewerUrl} title={`Pratinjau ${materi.NAMA_MATERI}`} className="w-full h-full border-0 min-h-[600px]" sandbox="allow-scripts allow-same-origin allow-popups allow-forms">
                Tidak dapat menampilkan pratinjau.
              </iframe>
            </div>
            <div className="text-center mt-4">
                <a href={documentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors">
                    {documentFileInfo.icon} Unduh {documentFileInfo.name}
                </a>
            </div>
            {/* Menampilkan LINK_YOUTUBE sebagai link referensi jika ada untuk materi Dokumen */}
            {materi.LINK_YOUTUBE && (
              <div className="mt-6 pt-4 border-t border-gray-300">
                <p className="text-sm font-semibold text-gray-700 mb-1">Link Referensi Tambahan:</p>
                <a href={materi.LINK_YOUTUBE} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800 break-all flex items-center gap-1">
                  <FaLink /> {materi.LINK_YOUTUBE}
                </a>
              </div>
            )}
          </div>
        );
      default:
        return <p className="text-gray-600 mb-6 p-4 bg-gray-100 rounded-lg">Tipe materi tidak dikenali atau konten tidak tersedia.</p>;
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100">
      <aside className="w-64 bg-white shadow-lg p-6 flex flex-col fixed h-full">
        <h1 className="text-2xl font-bold mb-6 text-blue-700">LearnFlow</h1>
        <nav className="space-y-4">
          <button onClick={() => handleNavigation("/dashboard")} className={`flex items-center gap-2 text-left w-full font-semibold ${location.pathname === "/dashboard" ? "text-blue-600" : "text-gray-600 hover:text-blue-800"}`}><FaChartBar /><span>Dashboard</span></button>
          <button onClick={() => handleNavigation("/materi")} className={`flex items-center gap-2 text-left w-full font-semibold ${location.pathname.startsWith("/materi") ? "text-blue-600" : "text-gray-600 hover:text-blue-800"}`}><FaBook /><span>Materi</span></button>
          <button onClick={() => handleNavigation("/quiz-history")} className={`flex items-center gap-2 text-left w-full font-semibold ${location.pathname === "/quiz-history" ? "text-blue-600" : "text-gray-600 hover:text-blue-800"}`}><FaHistory /><span>Quiz History</span></button>
        </nav>
        <button onClick={handleLogout} className="mt-auto pt-10 text-red-500 cursor-pointer hover:text-red-700 text-left">🔒 Log Out</button>
      </aside>

      <main className="flex-1 p-8 ml-64">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold transition-colors"><FaArrowLeft /> Kembali</button>
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1 rounded-2xl shadow-xl bg-white overflow-hidden"> {/* Kontainer utama konten materi */}
            <div className="p-6"> {/* Padding untuk konten di dalam */}
              {renderMateriContent()}
              <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg shadow-md flex items-start gap-4">
                <span className="text-yellow-600 text-2xl pt-1">⚠️</span>
                <div>
                  <h4 className="font-semibold text-yellow-800 mb-2">Petunjuk Penting:</h4>
                  <ul className="list-disc ml-5 space-y-1 text-sm text-yellow-700">
                    <li>Pahami materi yang disajikan dengan saksama.</li>
                    <li>Setelah Anda merasa cukup paham, silakan lanjutkan ke sesi Quiz.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-96 bg-white p-8 rounded-2xl shadow-xl flex flex-col gap-3 sticky top-8 self-start">
            <div className="flex items-start gap-3 mb-2">
              <FaChalkboardTeacher className="text-purple-600 text-3xl mt-1" />
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 leading-tight">{materi.NAMA_MATERI}</h2>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-block bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-sm">
                Kelas {materi.KELAS}
                </span>
                <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-sm">
                Tipe: {materi.TIPE_MATERI || "N/A"}
                </span>
            </div>
            <p className="text-gray-600 text-sm mb-git4">
              Pelajari materi ini dengan baik untuk mempersiapkan diri Anda menghadapi quiz.
            </p>
            <button onClick={() => navigate(`/quiz/${materi.ID}`)} className="mt-auto w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold shadow-md hover:from-blue-700 hover:to-purple-700 transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50">
              Mulai Quiz
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MateriDetail;