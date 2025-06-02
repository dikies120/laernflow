// src/components/MateriDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  FaArrowLeft, FaPlayCircle, FaChalkboardTeacher, FaBook, FaFilePdf, FaFileWord,
  FaFilePowerpoint, FaFileImage, FaFileAlt, FaLink, FaDownload, FaQuestionCircle,
  FaAlignLeft, FaChartBar, FaGraduationCap, FaUsers,
  FaClock, FaStar, FaBookmark, FaInfoCircle, FaCheckCircle, FaSpinner, FaAward // Untuk menampilkan skor
} from "react-icons/fa";
import QuizTaker from "./QuizTaker";

// ... (getFileIconAndName seperti sebelumnya)
const getFileIconAndName = (filePathOrLink) => {
  if (!filePathOrLink) return { icon: <FaFileAlt className="text-xl text-gray-500" />, name: "File tidak diketahui" };
  const fileName = filePathOrLink.split(/[\\/]/).pop();
  const extension = fileName.split('.').pop().toLowerCase();
  if (extension === 'pdf') return { icon: <FaFilePdf className="text-xl text-red-500" />, name: fileName };
  if (extension === 'doc' || extension === 'docx') return { icon: <FaFileWord className="text-xl text-blue-500" />, name: fileName };
  if (extension === 'ppt' || extension === 'pptx') return { icon: <FaFilePowerpoint className="text-xl text-orange-500" />, name: fileName };
  if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(extension)) return { icon: <FaFileImage className="text-xl text-teal-500" />, name: fileName };
  return { icon: <FaFileAlt className="text-xl text-gray-500" />, name: fileName };
};


const MateriDetail = () => {
  const { id } = useParams(); // id materi
  const [materi, setMateri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const [showQuiz, setShowQuiz] = useState(false);
  const [quizExists, setQuizExists] = useState(false);
  const [loadingQuizCheck, setLoadingQuizCheck] = useState(true);
  const [user, setUser] = useState({ ID_USER: null, USERNAME: "Guest", EMAIL: "", KELAS: "", FOTO_PROFIL: "" });

  const [isMateriMarkedComplete, setIsMateriMarkedComplete] = useState(false);
  const [completingMateri, setCompletingMateri] = useState(false);
  const [completionMessage, setCompletionMessage] = useState("");

  // State BARU untuk menyimpan status/skor kuis terakhir
  const [lastQuizAttempt, setLastQuizAttempt] = useState(null);
  const [loadingLastAttempt, setLoadingLastAttempt] = useState(false);

  const API_BASE_URL = "http://localhost:5000";

  useEffect(() => {
    let storedUserData = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (storedUserData) {
      const parsedUser = JSON.parse(storedUserData);
      setUser({
        ID_USER: parsedUser.ID_USER || parsedUser.USER_ID || null,
        USERNAME: parsedUser.USERNAME || "User", EMAIL: parsedUser.EMAIL || "",
        KELAS: parsedUser.KELAS || "", FOTO_PROFIL: parsedUser.FOTO_PROFIL || ""
      });
    }
    setLoading(true); setLoadingQuizCheck(true); setError(null);
    setShowQuiz(false); setQuizExists(false);
    setIsMateriMarkedComplete(false); setCompletionMessage("");
    setMateri(null);
    setLastQuizAttempt(null); // Reset last attempt
    setLoadingLastAttempt(true);


    const fetchDetailsAndStatus = async () => {
      try {
        const materiRes = await fetch(`${API_BASE_URL}/api/materi/crud-materi`);
        if (!materiRes.ok) { /* ... error handling ... */ 
            const errText = await materiRes.text();
            throw new Error(`Gagal mengambil data materi. Status: ${materiRes.status}. Detail: ${errText.substring(0,100)}`);
        }
        const materiDataArray = await materiRes.json();
        if (!Array.isArray(materiDataArray)) throw new Error("Format data materi tidak valid.");
        
        const foundMateri = materiDataArray.find(m => String(m.ID) === String(id));

        if (foundMateri) {
          const validatedMateri = { ...foundMateri, DESKRIPSI: foundMateri.DESKRIPSI || "Deskripsi tidak tersedia.", DURASI: foundMateri.DURASI || "N/A", RATING: foundMateri.RATING || "N/A", LINK_GAMBAR: foundMateri.LINK_GAMBAR || null, };
          setMateri(validatedMateri);
          
          // TODO: Fetch status penyelesaian materi dari backend (jika belum ada)
          // const completionStatusRes = await fetch(`${API_BASE_URL}/api/users/${user.ID_USER}/materi/${foundMateri.ID}/completion-status`);
          // if(completionStatusRes.ok) {
          //    const compData = await completionStatusRes.json();
          //    setIsMateriMarkedComplete(compData.isCompleted);
          // }


          // Cek ketersediaan kuis
          try {
            const quizRes = await fetch(`${API_BASE_URL}/api/quiz/materi/${id}`);
            if (quizRes.ok) {
              const quizData = await quizRes.json();
              const exists = Array.isArray(quizData) && quizData.length > 0;
              setQuizExists(exists);
              if (exists && user.ID_USER) { // Jika kuis ada dan user login, fetch status kuis terakhir
                setLoadingLastAttempt(true);
                try {
                    const lastAttemptRes = await fetch(`${API_BASE_URL}/api/quiz/user/${user.ID_USER}/materi/${id}/last-attempt-status`);
                    if (lastAttemptRes.ok) {
                        const attemptData = await lastAttemptRes.json();
                        if (attemptData.success) {
                            setLastQuizAttempt(attemptData.lastAttempt);
                        }
                    } else {
                        console.warn(`[MateriDetail] Gagal mengambil status kuis terakhir: ${lastAttemptRes.status}`);
                    }
                } catch (attemptErr) {
                    console.warn("[MateriDetail] Error fetching last quiz attempt:", attemptErr.message);
                } finally {
                    setLoadingLastAttempt(false);
                }
              } else {
                setLoadingLastAttempt(false); // Tidak perlu fetch jika kuis tidak ada atau user guest
              }
            } else if (quizRes.status === 404) {
              setQuizExists(false); setLoadingLastAttempt(false);
            } else {
               throw new Error(`Gagal mengecek kuis: ${quizRes.status}`);
            }
          } catch (quizErr) {
            console.warn("[MateriDetail] Error saat cek kuis:", quizErr.message);
            setQuizExists(false); setLoadingLastAttempt(false);
          }
        } else {
          setError("Materi tidak ditemukan."); setLoadingLastAttempt(false);
        }
      } catch (err) {
        console.error("[MateriDetail] Error fetching details:", err.message);
        setError(err.message || "Gagal memuat detail materi.");
        setLoadingLastAttempt(false);
      } finally {
        setLoading(false); setLoadingQuizCheck(false); 
      }
    };

    if (id) { // User ID akan dicek di dalam fetchDetailsAndStatus untuk fetch lastAttempt
        fetchDetailsAndStatus();
    } else {
        setError("ID Materi tidak valid."); setLoading(false); setLoadingQuizCheck(false); setLoadingLastAttempt(false);
    }
  }, [id, user.ID_USER]); // Hapus user.USERNAME karena ID_USER sudah cukup

  const handleCompleteMateri = async (forceComplete = false) => {
    // ... (handleCompleteMateri seperti sebelumnya, tapi mungkin dipanggil setelah kuis lulus)
    if (!user.ID_USER || !materi?.ID) {
      setCompletionMessage("Gagal: Informasi pengguna atau materi tidak lengkap."); return;
    }
    if (isMateriMarkedComplete && !forceComplete) {
        console.log("[MateriDetail] Materi sudah ditandai selesai, tidak perlu update.");
        return;
    }

    setCompletingMateri(true); setCompletionMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${user.ID_USER}/materi/${materi.ID}/complete`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json(); // Asumsi backend selalu kirim JSON
      if (!response.ok) { throw new Error(result.message || `Gagal menandai materi selesai: ${response.status}`); }
      if (result.success) {
        setIsMateriMarkedComplete(true);
        setCompletionMessage(result.message || "Materi telah ditandai selesai!");
        localStorage.setItem('dashboardNeedsRefresh', 'true');
      } else { throw new Error(result.message || "Gagal menandai materi sebagai selesai dari server."); }
    } catch (err) {
      console.error("[MateriDetail] Error marking materi as complete:", err.message);
      setCompletionMessage(`Error: ${err.message}`);
    } finally { setCompletingMateri(false); }
  };

  // ... (getYoutubeEmbedUrl, handleNavigation, handleLogout, renderMateriContent seperti sebelumnya) ...
  const getYoutubeEmbedUrl = (youtubeLink) => {
    if (!youtubeLink) return "";
    const patterns = [ /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|live\/)([a-zA-Z0-9_-]{11})/, /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/ ];
    for (const pattern of patterns) {
        const match = youtubeLink.match(pattern);
        if (match && match[1]) return `https://www.youtube.com/embed/${match[1]}`;
    }
    console.warn("Could not extract YouTube video ID from link:", youtubeLink);
    return "";
  };

  const handleNavigation = (path) => navigate(path);
  const handleLogout = () => {
    alert("You have been logged out!");
    localStorage.removeItem("user"); localStorage.removeItem("dashboardNeedsRefresh"); sessionStorage.removeItem("user");
    setUser({ ID_USER: null, USERNAME: "Guest", EMAIL: "", KELAS: "", FOTO_PROFIL: "" });
    navigate("/");
  };

  const renderMateriContent = () => {
    if (!materi) return <p className="text-gray-600 p-6 bg-gray-50 rounded-xl">Memuat konten materi...</p>;
    const documentUrl = materi.LINK_DOKUMEN ? (materi.LINK_DOKUMEN.startsWith('http') ? materi.LINK_DOKUMEN : `${API_BASE_URL}/${materi.LINK_DOKUMEN.startsWith('/') ? materi.LINK_DOKUMEN.substring(1) : materi.LINK_DOKUMEN}`) : "";
    const documentFileInfo = getFileIconAndName(materi.LINK_DOKUMEN);
    const isPdf = materi.LINK_DOKUMEN && materi.LINK_DOKUMEN.toLowerCase().endsWith('.pdf');
    const isImage = materi.LINK_DOKUMEN && /\.(jpeg|jpg|gif|png|webp|bmp)$/i.test(materi.LINK_DOKUMEN.toLowerCase());
    const embedYoutubeUrl = materi.TIPE_MATERI === "Video" ? getYoutubeEmbedUrl(materi.LINK_YOUTUBE) : "";

    switch (materi.TIPE_MATERI?.toLowerCase()) {
      case "video":
        return embedYoutubeUrl ? (
          <div className="bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 rounded-2xl shadow-2xl mb-8 text-white">
            <div className="px-4 py-3 flex items-center justify-between bg-black/50 rounded-t-xl"> <div className="flex items-center gap-3 min-w-0"> <FaPlayCircle className="text-purple-400 text-xl flex-shrink-0" /> <h3 className="font-semibold text-base truncate" title={materi.NAMA_MATERI || "Video Playback"}> {materi.NAMA_MATERI || "Video Playback"} </h3> </div> <span className="text-xs text-gray-300 hidden md:block flex-shrink-0 ml-3">LearnFlow Player</span> </div>
            <div className="aspect-w-16 aspect-h-9 w-full bg-black rounded-b-xl overflow-hidden relative"> <iframe className="absolute inset-0 w-full h-full" src={embedYoutubeUrl} title={materi.NAMA_MATERI || "Video YouTube"} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /> </div>
          </div>
        ) : materi.LINK_YOUTUBE ? (
          <div className="mb-8 p-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl text-center"> <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6"> <FaPlayCircle className="text-white text-3xl"/> </div> <h3 className="text-2xl font-bold text-blue-800 mb-4">Video Content</h3> <p className="text-blue-700 mb-6 text-lg">Video tidak dapat di-embed atau link tidak valid. Coba tonton langsung.</p> <a href={materi.LINK_YOUTUBE} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105" > Watch Video <FaLink /> </a> </div>
        ) : <p className="text-gray-600 mb-8 p-6 bg-gray-50 rounded-2xl text-center"><FaInfoCircle className="mx-auto text-3xl text-gray-400 mb-2"/>Video link not available.</p>;
      case "teks":
        return ( <div className="mb-8 p-6 sm:p-8 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-100 rounded-2xl shadow-xl"> <div className="flex items-center gap-3 mb-6"> <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center"> <FaAlignLeft className="text-white text-xl"/> </div> <h3 className="text-2xl font-bold text-indigo-800">Text Content</h3> </div> {materi.ISI_TEKS && materi.ISI_TEKS.trim() !== "" ? ( <div className="prose max-w-none lg:prose-lg prose-indigo"> <div className="text-gray-800 whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: materi.ISI_TEKS.replace(/\n/g, '<br />') }}> </div> </div> ) : ( <p className="text-gray-600 italic text-center py-4"><FaInfoCircle className="mx-auto text-3xl text-gray-400 mb-2"/>Text content not available.</p> )} {materi.LINK_YOUTUBE && ( <div className="mt-8 pt-6 border-t border-indigo-200"> <p className="text-sm font-semibold text-indigo-700 mb-2">Additional Reference Link:</p> <a href={materi.LINK_YOUTUBE} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline hover:text-indigo-800 break-all flex items-center gap-2"> <FaLink /> {materi.LINK_YOUTUBE} </a> </div> )} </div>);
      case "dokumen":
        if (!materi.LINK_DOKUMEN) return <p className="text-gray-600 mb-8 p-6 bg-gray-50 rounded-2xl text-center"><FaInfoCircle className="mx-auto text-3xl text-gray-400 mb-2"/>Document file not available.</p>;
        if (isPdf || isImage) { return ( <div className="mb-6 bg-gray-100 rounded-lg shadow-inner overflow-hidden p-2"> {isPdf && ( <iframe src={documentUrl} width="100%" height="750px" title={documentFileInfo.name} className="border-0 rounded-md"> Browser Anda tidak mendukung pratinjau PDF. <a href={documentUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 underline">Unduh PDF ({documentFileInfo.name})</a> </iframe> )} {isImage && ( <div className="text-center"> <img src={documentUrl} alt={documentFileInfo.name} className="max-w-full max-h-[70vh] h-auto rounded-md mx-auto shadow-lg" /> </div> )} <div className="text-center mt-4"> <a href={documentUrl} download={documentFileInfo.name} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors"> {React.cloneElement(documentFileInfo.icon, { className: "text-lg"})} Unduh {documentFileInfo.name} </a> </div> </div> ); }
        const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(documentUrl)}&embedded=true`;
        return ( <div className="mb-6"> <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 mb-4 rounded-r-lg shadow"> <p className="font-semibold">Document Preview Note:</p> <p className="text-sm">Preview uses Google Docs Viewer and might not work if the file isn't publicly accessible from the internet (e.g., on `localhost`). If preview fails, please use the download button.</p> </div> <div className="aspect-w-4 aspect-h-3 lg:aspect-w-16 lg:aspect-h-9 w-full rounded-lg overflow-hidden shadow-md mb-4 bg-gray-200"> <iframe src={googleViewerUrl} title={`Preview ${documentFileInfo.name}`} className="w-full h-full border-0 min-h-[600px]" sandbox="allow-scripts allow-same-origin allow-popups allow-forms"> Cannot display preview. </iframe> </div> <div className="text-center mt-4"> <a href={documentUrl} download={documentFileInfo.name} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors"> {React.cloneElement(documentFileInfo.icon, { className: "text-lg"})} Download {documentFileInfo.name} </a> </div> {materi.LINK_YOUTUBE && ( <div className="mt-6 pt-4 border-t border-gray-300"> <p className="text-sm font-semibold text-gray-700 mb-1">Additional Reference Link:</p> <a href={materi.LINK_YOUTUBE} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800 break-all flex items-center gap-1"> <FaLink /> {materi.LINK_YOUTUBE} </a> </div> )} </div> );
      default: return <p className="text-gray-600 mb-8 p-6 bg-gray-50 rounded-2xl text-center"><FaInfoCircle className="mx-auto text-3xl text-gray-400 mb-2"/>Tipe materi '{materi.TIPE_MATERI}' tidak dikenali atau konten tidak tersedia.</p>;
    }
  };


  // ... (blok return utama, sidebar, loading utama, error utama, seperti sebelumnya)
  if (loading) return ( <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50"> <div className="text-center"> <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse"> <FaBook className="text-white text-2xl" /> </div> <p className="text-xl font-semibold text-gray-700">Loading material...</p> </div> </div> );
  if (error && !materi) return ( <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4"> <div className="text-center p-6 sm:p-8 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl max-w-md w-full"> <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"> <span className="text-red-500 text-3xl">⚠</span> </div> <h2 className="text-xl sm:text-2xl font-bold text-red-700 mb-2">Error Loading Material</h2> <p className="text-sm sm:text-md text-red-600">{error}</p> <button onClick={() => handleNavigation(location.state?.from || "/materi")} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors" > Back </button> </div> </div> );
  if (!materi) return ( <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4"> <div className="text-center p-6 sm:p-8 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl max-w-md w-full"> <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"> <FaBook className="text-gray-400 text-3xl" /> </div> <h2 className="text-xl sm:text-2xl font-bold text-gray-700 mb-2">Material Not Found</h2> <p className="text-sm sm:text-md text-gray-600">The requested material could not be found.</p> <button onClick={() => handleNavigation(location.state?.from || "/materi")} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors" > Back </button> </div> </div> );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Sidebar */}
      <aside className="w-72 bg-white/80 backdrop-blur-lg shadow-2xl border-r border-white/20 p-6 flex flex-col fixed h-full z-20">
        <div className="flex items-center gap-3 mb-8"> <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center"> <FaGraduationCap className="text-white text-xl" /> </div> <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> LearnFlow </h1> </div>
        <nav className="space-y-2 flex-1"> <button onClick={() => handleNavigation("/dashboard")} className={`flex items-center gap-3 w-full p-3 rounded-xl font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 ${ location.pathname === "/dashboard" ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white" : "text-gray-600 hover:bg-blue-50 hover:text-blue-600" }`} > <FaChartBar className="text-lg" /> <span>Dashboard</span> </button> <button onClick={() => handleNavigation("/materi")} className={`flex items-center gap-3 w-full p-3 rounded-xl font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 ${ (location.pathname.startsWith("/materi")) ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white" : "text-gray-600 hover:bg-blue-50 hover:text-blue-600" }`} > <FaBook className="text-lg" /> <span>My Courses</span> </button> <button onClick={() => handleNavigation("/profile")} className={`flex items-center gap-3 w-full p-3 rounded-xl font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 ${ location.pathname === "/profile" ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white" : "text-gray-600 hover:bg-blue-50 hover:text-blue-600" }`} > <FaUsers className="text-lg" /> <span>Profile</span> </button> </nav>
        <div className="mt-auto pt-6 border-t border-gray-200"> <div className="flex items-center gap-3 mb-4"> <img src={user.FOTO_PROFIL ? (user.FOTO_PROFIL.startsWith('http') ? user.FOTO_PROFIL : `${API_BASE_URL}${user.FOTO_PROFIL}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.USERNAME)}&background=4f46e5&color=ffffff&size=40&font-size=0.4&rounded=true`} className="w-10 h-10 rounded-full border-2 border-white shadow-md object-cover" alt="Profile" /> <div className="flex-1 min-w-0"> <p className="text-sm font-medium text-gray-900 truncate"> {user.USERNAME} </p> <p className="text-xs text-gray-500 truncate"> Class {user.KELAS || "N/A"} </p> </div> </div> <button onClick={handleLogout} className="w-full px-4 py-2 text-sm font-medium text-red-600 hover:text-red-100 hover:bg-red-600/90 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg border border-red-200 hover:border-transparent" > Logout </button> </div>
      </aside>
      
      <main className="flex-1 ml-72 p-6 sm:p-8">
        <button onClick={() => showQuiz ? setShowQuiz(false) : navigate(location.state?.from || "/materi")} className="mb-6 sm:mb-8 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold transition-all duration-200 transform hover:scale-105 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500" > <FaArrowLeft /> {showQuiz ? "Back to Material Detail" : (location.state?.from && location.state.from !== location.pathname ? "Back" : "Back to Materials")} </button>
        
        {!showQuiz ? (
          <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 items-start">
            <div className="flex-1 w-full lg:max-w-4xl xl:max-w-5xl"> 
              {/* ... (renderMateriContent seperti sebelumnya) ... */}
              {error && materi && <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow"><p>{error}</p></div>}
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden"> 
                <div className="p-4 sm:p-6 md:p-8"> {renderMateriContent()} </div> 
              </div> 
            </div>
            <div className="w-full lg:w-80 xl:w-96 bg-white/80 backdrop-blur-lg p-6 sm:p-8 rounded-2xl shadow-xl flex flex-col gap-6 sticky top-8 self-start border border-white/20">
              {/* ... (Info Materi seperti Nama, Kelas, Tipe, Deskripsi, Durasi, Rating seperti sebelumnya) ... */}
              <div className="flex items-start gap-4"> <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"> <FaChalkboardTeacher className="text-white text-2xl sm:text-3xl" /> </div> <div className="flex-1 min-w-0"> <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight mb-1.5" title={materi.NAMA_MATERI}> {materi.NAMA_MATERI} </h2> <div className="flex flex-wrap gap-x-2 gap-y-1"> <span className="inline-block bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-purple-200"> Class {materi.KELAS} </span> <span className="inline-block bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-blue-200"> {materi.TIPE_MATERI || "N/A"} </span> </div> </div> </div>
              <div className="bg-gradient-to-r from-slate-50 to-gray-100 rounded-xl p-4 border border-gray-200 shadow-inner"> <p className="text-gray-700 text-sm leading-relaxed"> {materi.DESKRIPSI || "Study this material thoroughly. After you're ready, you can test your understanding by taking the available quiz."} </p> </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4"> <div className="text-center p-3 bg-green-50 rounded-xl border border-green-200 shadow-sm"> <FaClock className="text-green-600 text-xl mx-auto mb-1" /> <p className="text-xs text-gray-500">Duration</p> <p className="text-sm font-semibold text-gray-800"> {(materi.DURASI && materi.DURASI.trim() !== "") ? materi.DURASI : "N/A"} </p> </div> <div className="text-center p-3 bg-yellow-50 rounded-xl border border-yellow-200 shadow-sm"> <FaStar className="text-yellow-500 text-xl mx-auto mb-1" /> <p className="text-xs text-gray-500">Rating</p> <p className="text-sm font-semibold text-gray-800">{materi.RATING || "N/A"}</p> </div> </div>
              
              {/* Tombol Mark as Complete */}
              {user.ID_USER && !isMateriMarkedComplete && ( <button onClick={() => handleCompleteMateri()} disabled={completingMateri} className={`w-full flex items-center justify-center gap-2 text-sm py-3 px-4 rounded-xl font-semibold border-2 transition-all duration-200 focus:outline-none focus:ring-2 active:bg-green-100 ${completingMateri ? "bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed" : "border-green-400 text-green-600 hover:bg-green-50 hover:border-green-500 focus:ring-green-400"}`} > {completingMateri ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />} {completingMateri ? "Processing..." : "Mark Material as Complete"} </button> )}
              {user.ID_USER && isMateriMarkedComplete && ( <div className="w-full flex items-center justify-center gap-2 text-sm py-3 px-4 rounded-xl font-semibold bg-green-100 border-2 border-green-300 text-green-700"> <FaCheckCircle /> Material Completed! </div> )}
              {!user.ID_USER && (<p className="text-xs text-gray-500 text-center">Login to mark as complete or take quiz.</p>)}
              {completionMessage && (<p className={`text-xs text-center mt-2 ${isMateriMarkedComplete ? 'text-green-600' : 'text-red-600'}`}> {completionMessage} </p>)}
              
              {/* Bagian Kuis */}
              {loadingQuizCheck || loadingLastAttempt ? (
                 <div className="w-full bg-gray-200 text-gray-500 py-3 px-4 rounded-xl font-semibold text-center animate-pulse"> Loading Quiz Info... </div>
              ) : quizExists && user.ID_USER ? (
                <div className="space-y-3">
                    {lastQuizAttempt && (
                        <div className={`p-3 rounded-lg border-2 ${lastQuizAttempt.passed ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                            <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-semibold flex items-center">
                                    <FaAward className={`mr-2 ${lastQuizAttempt.passed ? 'text-green-600' : 'text-red-600'}`} />
                                    Last Quiz Score:
                                </h4>
                                <span className={`font-bold text-lg ${lastQuizAttempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                                    {lastQuizAttempt.score}%
                                </span>
                            </div>
                            <p className="text-xs text-gray-600">
                                ({lastQuizAttempt.correctAnswers}/{lastQuizAttempt.totalQuestions} correct)
                                - Attempt on: {new Date(lastQuizAttempt.completedAt).toLocaleDateString('id-ID')}
                            </p>
                        </div>
                    )}
                    <button 
                        onClick={() => setShowQuiz(true)} 
                        className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 flex items-center justify-center gap-2`} 
                    >
                        <FaQuestionCircle className="text-lg" /> 
                        {lastQuizAttempt ? "Retake Quiz" : "Start Quiz"}
                    </button>
                </div>
              ) : user.ID_USER && (
                 <div className="w-full bg-gray-100 border border-gray-300 text-gray-500 py-3 px-4 rounded-xl font-semibold text-center"> Quiz Not Available </div> 
              )}
              {user.ID_USER && (<p className="text-xs text-gray-500 text-center mt-1"> Completing the quiz may also update your completion status. </p>)}
            </div>
          </div>
        ) : ( 
            // Tampilan QuizTaker (logika onQuizComplete dan onQuizClose sudah disesuaikan sebelumnya)
            <div className="max-w-3xl mx-auto"> 
                <QuizTaker 
                    materiId={id} 
                    userId={user.ID_USER} 
                    onQuizComplete={(quizResult) => {
                        console.log("[MateriDetail] Quiz attempt processed by QuizTaker. Result:", quizResult);
                        // Perbarui lastQuizAttempt dengan hasil baru
                        if (quizResult.submitted) {
                            setLastQuizAttempt({
                                score: quizResult.percentage,
                                correctAnswers: quizResult.score,
                                totalQuestions: quizResult.totalQuestions,
                                passed: quizResult.passed,
                                completedAt: new Date().toISOString() // Waktu perkiraan, backend punya waktu akurat
                            });
                            // Jika kuis lulus dan materi belum selesai, tandai selesai
                            if (quizResult.passed && !isMateriMarkedComplete) {
                                handleCompleteMateri(true); // forceComplete true agar tidak di-skip jika sudah ada pesan
                            }
                            localStorage.setItem('dashboardNeedsRefresh', 'true');
                            console.log("[MateriDetail] (via QuizTaker's onQuizComplete): Flag 'dashboardNeedsRefresh' diatur.");
                        }
                        // setShowQuiz(false) TIDAK dipanggil di sini, biarkan QuizTaker yang menutup
                    }} 
                    onQuizClose={() => {
                        console.log("[MateriDetail] Closing QuizTaker UI via onQuizClose.");
                        setShowQuiz(false); 
                    }} 
                /> 
            </div> 
        )}
      </main>
    </div> 
  );
};

export default MateriDetail;