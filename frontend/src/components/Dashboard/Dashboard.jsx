// src/components/Dashboard.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaChartBar, FaBook, FaPlayCircle, FaBell, FaSearch, FaClock,
  FaUsers, FaGraduationCap, FaChevronRight, FaBookmark, FaFire, FaSpinner
} from "react-icons/fa"; // FaTrophy is no longer used for stats, FaClock might still be used for materi duration

const colorPalettes = [
  "from-violet-600 via-purple-500 to-pink-500",
  "from-blue-600 via-indigo-500 to-purple-500",
  "from-emerald-500 via-teal-500 to-cyan-500",
  "from-orange-500 via-red-500 to-pink-500",
  "from-indigo-600 via-blue-500 to-cyan-400",
  "from-rose-500 via-pink-500 to-purple-500",
  "from-amber-500 via-orange-500 to-red-500",
  "from-lime-500 via-green-500 to-emerald-500",
];

const getTypeSpecificIconDashboard = (type) => {
    const iconClasses = "text-white text-4xl sm:text-5xl opacity-70 group-hover:opacity-90 transition-opacity duration-300";
    switch (type?.toLowerCase()) {
      case 'video': return <FaPlayCircle className={iconClasses} />;
      case 'teks': return <FaBook className={iconClasses} />;
      case 'dokumen': return <FaBook className={iconClasses} />;
      default: return <FaBook className={iconClasses} />;
    }
};

const Dashboard = () => {
  const [allMateriList, setAllMateriList] = useState([]);
  const [filteredMateriList, setFilteredMateriList] = useState([]);
  const [user, setUser] = useState({ ID_USER: null, USERNAME: "Guest", EMAIL: "", KELAS: "", FOTO_PROFIL: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dashboardStats, setDashboardStats] = useState({ completedCourses: 0 }); // Removed quizPassed and studyHours
  const [loadingDashboardStats, setLoadingDashboardStats] = useState(true);
  const [errorDashboardStats, setErrorDashboardStats] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState(null);
  const notificationPanelRef = useRef(null);
  const notificationButtonRef = useRef(null);
  const [loadingMateri, setLoadingMateri] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const API_BASE_URL = 'http://localhost:5000';

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    console.log("[Dashboard.jsx] Attempting to load user from storage...");
    let storedUserData = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (storedUserData) {
      try {
        const parsedUser = JSON.parse(storedUserData);
        console.log("[Dashboard.jsx] User data loaded from storage:", parsedUser);
        
        let fotoProfilStorage = parsedUser.FOTO_PROFIL || "";
        if (fotoProfilStorage && fotoProfilStorage.startsWith('/uploads') && !fotoProfilStorage.startsWith(API_BASE_URL)) {
            fotoProfilStorage = `${API_BASE_URL}${fotoProfilStorage}`;
        }

        setUser({
          ID_USER: parsedUser.ID_USER || parsedUser.USER_ID || null,
          USERNAME: parsedUser.USERNAME || "User",
          EMAIL: parsedUser.EMAIL || "",
          KELAS: parsedUser.KELAS || "",
          FOTO_PROFIL: fotoProfilStorage
        });
      } catch (e) {
        console.error("[Dashboard.jsx] Gagal parse user dari storage:", e);
        localStorage.clear();
        sessionStorage.clear();
        setUser({ ID_USER: null, USERNAME: "Guest", EMAIL: "", KELAS: "", FOTO_PROFIL: "" });
      }
    } else {
        console.log("[Dashboard.jsx] No user data in storage.");
        setLoadingMateri(false);
        setLoadingDashboardStats(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    if (!user.ID_USER) {
      setLoadingMateri(false);
      setAllMateriList([]);
      setFilteredMateriList([]);
      return;
    }
    setLoadingMateri(true);
    fetch(`${API_BASE_URL}/api/materi/crud-materi`)
      .then(res => {
        if (!res.ok) {
          return res.json().then(errData => {
            const errorMessage = errData?.message || `HTTP error ${res.status}`;
            throw new Error(errorMessage);
          }).catch(() => {
            throw new Error(`HTTP error ${res.status} - Tidak bisa parse JSON error`);
          });
        }
        return res.json();
      })
      .then(data => {
        const materiArray = Array.isArray(data.materi) ? data.materi
                          : Array.isArray(data) ? data
                          : [];
        const validatedData = materiArray.map(item => ({
            ID: item.ID_MATERI || item.ID,
            KELAS: item.KELAS || "",
            NAMA_MATERI: item.NAMA_MATERI || "Materi Tanpa Judul",
            LINK_YOUTUBE: item.LINK_YOUTUBE || null,
            TIPE_MATERI: item.TIPE_MATERI || "teks",
            LINK_DOKUMEN: item.LINK_DOKUMEN || null,
            ISI_TEKS: item.ISI_TEKS || "",
            DESKRIPSI: item.DESKRIPSI || null,
            DURASI: item.DURASI || null,
            RATING: item.RATING || null,
            LINK_GAMBAR: item.LINK_GAMBAR || null,
        }));
        setAllMateriList(validatedData);
      })
      .catch(error => {
        console.error("[Dashboard.jsx] Error fetch materi:", error);
        setAllMateriList([]);
      })
      .finally(() => setLoadingMateri(false));
  }, [user.ID_USER, API_BASE_URL]);

  const fetchUserDashboardStats = async (isInitialLoad = false) => {
    if (!user.ID_USER || user.USERNAME === "Guest") {
      setDashboardStats({ completedCourses: 0 }); // Removed quizPassed and studyHours
      if (isInitialLoad) setLoadingDashboardStats(false);
      return;
    }
    
    if (isInitialLoad) {
        setLoadingDashboardStats(true);
    }

    console.log(`[Dashboard.jsx] Fetching stats for user ${user.ID_USER}. Initial: ${isInitialLoad}`);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${user.ID_USER}/dashboard-stats`);
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gagal ambil stats: ${response.status} - ${errText.substring(0,100)}`);
      }
      const data = await response.json();
      if (data.success && data.stats) {
        console.log("[Dashboard.jsx] Statistik diterima:", data.stats);
        setDashboardStats({
          completedCourses: data.stats.coursesCompleted || 0, // Only coursesCompleted
        });
        setErrorDashboardStats(null);
      } else {
        throw new Error(data.message || "Format API stats tidak valid");
      }
    } catch (error) {
      console.error("[Dashboard.jsx] Error fetch stats:", error);
      setErrorDashboardStats(error.message);
    }
    finally {
      if (isInitialLoad) {
        setLoadingDashboardStats(false);
      }
    }
  };

  useEffect(() => {
    if (user.ID_USER) {
      const needsRefresh = localStorage.getItem('dashboardNeedsRefresh');
      if (needsRefresh === 'true') {
        console.log("[Dashboard.jsx] Flag 'dashboardNeedsRefresh' ditemukan, memuat ulang statistik...");
        fetchUserDashboardStats(true);
        localStorage.removeItem('dashboardNeedsRefresh');
      } else {
        fetchUserDashboardStats(true);
      }
      const intervalId = setInterval(() => {
        console.log("[Dashboard.jsx] Polling statistik dashboard (setiap 30 detik)...");
        fetchUserDashboardStats(false);
      }, 30000);
      return () => clearInterval(intervalId);
    } else {
      setLoadingDashboardStats(false);
      setDashboardStats({ completedCourses: 0 }); // Removed quizPassed and studyHours
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.ID_USER, refreshTrigger, API_BASE_URL]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user.ID_USER) {
        console.log("[Dashboard.jsx] Tab aktif, memuat ulang statistik...");
        fetchUserDashboardStats(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.ID_USER]);

  useEffect(() => {
    const fetchDashboardNotifications = async () => {
        if (!user.ID_USER || user.USERNAME === "Guest") { setNotifications([]); setLoadingNotifications(false); return; }
        setLoadingNotifications(true); setNotificationError(null);
        try {
          console.log(`[Dashboard.jsx] Simulating fetch notifications for user ID: ${user.ID_USER}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          setNotifications([]);
        } catch (err) { console.error("[Dashboard.jsx] Error fetching notifications:", err); setNotificationError(err.message); setNotifications([]); }
        finally { setLoadingNotifications(false); }
      };
      if (user.ID_USER && user.USERNAME !== "Guest") { fetchDashboardNotifications(); }
  }, [user.ID_USER, user.USERNAME]);

  useEffect(() => {
    if (allMateriList.length > 0) {
        let materiUntukUser = [];
        if (user.KELAS && user.KELAS.trim() !== "") {
            materiUntukUser = allMateriList.filter(materi =>
            materi.KELAS?.toString().trim().toLowerCase() === user.KELAS.toString().trim().toLowerCase()
            );
        } else {
            materiUntukUser = allMateriList;
        }

        if (searchTerm) {
            materiUntukUser = materiUntukUser.filter(materi =>
            materi.NAMA_MATERI?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        setFilteredMateriList(materiUntukUser);
    } else {
      setFilteredMateriList([]);
    }
  }, [user.KELAS, allMateriList, searchTerm]);

  const handleNavigation = (path) => { navigate(path); setShowNotifications(false); };
  const handleLogout = () => {
    alert("You have been logged out!");
    localStorage.clear(); sessionStorage.clear();
    setUser({ ID_USER: null, USERNAME: "Guest", EMAIL: "", KELAS: "", FOTO_PROFIL: "" });
    setAllMateriList([]); setFilteredMateriList([]);
    setNotifications([]);
    setDashboardStats({ completedCourses: 0 }); // Removed quizPassed and studyHours
    navigate("/");
  };
  const handleMateriClick = (id) => { navigate(`/materi/${id}`); setShowNotifications(false); };
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning"; if (hour < 17) return "Good Afternoon"; return "Good Evening";
  };
  const unreadNotificationCount = notifications.filter(n => !n.read).length;
  const toggleNotifications = () => setShowNotifications(prev => !prev);
  const markNotificationAsRead = async (id) => { /* ... */ };
  const markAllNotificationsAsRead = async () => { /* ... */ };

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationPanelRef.current && !notificationPanelRef.current.contains(event.target) &&
          notificationButtonRef.current && !notificationButtonRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  let sidebarFotoProfilUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.USERNAME?.[0] || 'G')}&background=4f46e5&color=ffffff&size=40&font-size=0.4&rounded=true`;
  if (user.FOTO_PROFIL) {
    if (user.FOTO_PROFIL.startsWith('/uploads') && !user.FOTO_PROFIL.startsWith(API_BASE_URL)) {
      sidebarFotoProfilUrl = `${API_BASE_URL}${user.FOTO_PROFIL}`;
    } else if (user.FOTO_PROFIL.startsWith('http') || user.FOTO_PROFIL.startsWith('blob:')) {
      sidebarFotoProfilUrl = user.FOTO_PROFIL;
    }
  }
  
  let mainCardFotoProfilUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.USERNAME || 'U')}&background=6366f1&color=ffffff&size=100&font-size=0.4&rounded=true`;
  if (user.FOTO_PROFIL) {
    if (user.FOTO_PROFIL.startsWith('/uploads') && !user.FOTO_PROFIL.startsWith(API_BASE_URL)) {
        mainCardFotoProfilUrl = `${API_BASE_URL}${user.FOTO_PROFIL}`;
    } else if (user.FOTO_PROFIL.startsWith('http') || user.FOTO_PROFIL.startsWith('blob:')) {
        mainCardFotoProfilUrl = user.FOTO_PROFIL;
    }
  }

  const isLoadingScreenNeeded = loadingMateri && loadingDashboardStats && !user.ID_USER &&
                              !localStorage.getItem("user") && !sessionStorage.getItem("user") &&
                              location.pathname !== "/";

  if (isLoadingScreenNeeded) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-purple-600 mx-auto mb-4" />
          <p className="text-gray-700 text-lg font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <aside className="w-72 bg-white/80 backdrop-blur-lg shadow-2xl border-r border-white/20 p-6 flex flex-col fixed h-full z-20">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <FaGraduationCap className="text-white text-xl" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> LearnFlow </h1>
        </div>
        <nav className="space-y-2 flex-1">
            <button onClick={() => handleNavigation("/dashboard")} className={`flex items-center gap-3 w-full p-3 rounded-xl font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 ${location.pathname === "/dashboard" ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white" : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"}`}><FaChartBar className="text-lg" /><span>Dashboard</span></button>
            <button onClick={() => handleNavigation("/materi")} className={`flex items-center gap-3 w-full p-3 rounded-xl font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 ${location.pathname.startsWith("/materi")? "bg-gradient-to-r from-blue-500 to-purple-500 text-white" : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"}`}><FaBook className="text-lg" /><span>My Courses</span></button>
            <button onClick={() => handleNavigation("/profile")} className={`flex items-center gap-3 w-full p-3 rounded-xl font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 ${location.pathname === "/profile" ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white" : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"}`}><FaUsers className="text-lg" /><span>Profile</span></button>
        </nav>
        <div className="mt-auto pt-6 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-4">
                <img
                    key={sidebarFotoProfilUrl + Date.now()}
                    src={sidebarFotoProfilUrl}
                    className="w-10 h-10 rounded-full border-2 border-white shadow-md object-cover"
                    alt="Profile"/>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.USERNAME}</p>
                    <p className="text-xs text-gray-500 truncate">Class {user.KELAS || 'N/A'}</p>
                </div>
            </div>
            <button onClick={handleLogout} className="w-full px-4 py-2 text-sm font-medium text-red-600 hover:text-red-100 hover:bg-red-600/90 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg border border-red-200 hover:border-transparent">Logout</button>
        </div>
      </aside>

      <main className="flex-1 p-6 sm:p-8 ml-72">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800"> {getGreeting()}, {user.USERNAME}! 👋 </h2>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Ready to continue your learning journey?</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <FaSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search courses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2.5 bg-white/70 backdrop-blur-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-56 sm:w-64 shadow-sm"/>
            </div>
            <div className="relative">
              <button ref={notificationButtonRef} onClick={toggleNotifications} className="p-2.5 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-300 hover:bg-purple-50 text-gray-600 hover:text-purple-600 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500" aria-label="Notifications">
                <FaBell className="text-xl" />
                {unreadNotificationCount > 0 && ( <span className="absolute top-1 right-1 block h-3 w-3 transform -translate-y-1/2 translate-x-1/2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex h-3 w-3 rounded-full bg-red-500 border-2 border-white"></span></span> )}
              </button>
              {showNotifications && (
                <div ref={notificationPanelRef} className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-30">
                  <div className="p-3 flex justify-between items-center border-b bg-gray-50">
                    <h4 className="font-semibold text-gray-700">Notifications</h4>
                    {unreadNotificationCount > 0 && notifications.length > 0 && (<button onClick={markAllNotificationsAsRead} className="text-xs text-purple-600 hover:underline">Mark all as read</button>)}
                  </div>
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {loadingNotifications ? ( <div className="flex items-center justify-center p-10"><FaSpinner className="animate-spin text-2xl text-purple-500"/><span className="ml-2 text-gray-500">Loading...</span></div> )
                    : notificationError ? ( <p className="text-center text-red-500 py-10 px-4">Error: {notificationError}</p> )
                    : notifications.length === 0 ? ( <p className="text-center text-gray-500 py-10 px-4">No new notifications.</p> )
                    : ( notifications.map(notif => ( <div key={notif.id} className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${!notif.read ? 'bg-purple-50' : ''}`} onClick={() => markNotificationAsRead(notif.id)}> <p className={`text-sm mb-0.5 ${!notif.read ? 'font-semibold text-gray-800' : 'text-gray-700'}`}>{notif.message}</p> <p className={`text-xs ${!notif.read ? 'text-purple-600' : 'text-gray-400'}`}>{notif.time}</p> </div> )) )}
                  </div>
                  <div className="p-2 bg-gray-100 border-t text-center"> <button onClick={() => { alert("Navigate to all notifications page (placeholder)"); setShowNotifications(false); }} className="text-sm font-medium text-purple-600 hover:underline">View all notifications</button> </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8"> {/* Changed md:grid-cols-3 to md:grid-cols-1 as only one stat remains */}
          {[
            { title: "Courses Completed", value: dashboardStats.completedCourses, icon: FaBook, color: "from-emerald-500 to-teal-500" },
          ].map(stat => (
            <div key={stat.title} className={`bg-gradient-to-r ${stat.color} p-6 rounded-2xl text-white shadow-xl`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="opacity-80">{stat.title}</p>
                        {loadingDashboardStats && dashboardStats.completedCourses === 0 ? ( // Check specific stat
                            <FaSpinner className="animate-spin text-3xl mt-1" />
                        ) : errorDashboardStats && stat.title === "Courses Completed" ? (
                            <p className="text-xl font-bold text-red-200">Error</p>
                        ) : (
                            <p className="text-3xl font-bold">{stat.value}</p>
                        )}
                    </div>
                    <stat.icon className="text-4xl opacity-70" />
                </div>
            </div>
          ))}
        </div>
        {!loadingDashboardStats && errorDashboardStats && <p className="text-center text-red-500 text-sm mb-6">Could not load dashboard statistics: {errorDashboardStats}</p>}
        
        <div className="bg-white/70 backdrop-blur-lg p-6 sm:p-8 rounded-2xl shadow-xl mb-8 border border-white/20">
           <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="relative flex-shrink-0">
              <img
                key={mainCardFotoProfilUrl + Date.now()}
                src={mainCardFotoProfilUrl}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full shadow-lg border-4 border-white object-cover"
                alt="Profile"/>
            </div>
            <div className="flex-1 text-center sm:text-left"> <h3 className="text-xl sm:text-2xl font-bold text-gray-800">{user.USERNAME}</h3> <p className="text-gray-600 text-sm">{user.EMAIL || "No email provided"}</p> <div className="flex items-center justify-center sm:justify-start gap-3 mt-2"> <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-purple-700 border border-purple-200 rounded-full text-xs sm:text-sm font-medium"> Class {user.KELAS || "N/A"} </span> </div> </div>
            <div className="text-center sm:text-right mt-4 sm:mt-0"> <p className="text-2xl sm:text-3xl font-bold text-gray-800">{loadingMateri ? <FaSpinner className="animate-spin inline" /> : filteredMateriList.length}</p> <p className="text-gray-600 text-sm">Available Courses for You</p> </div>
          </div>
        </div>
        <div className="flex items-center justify-between mb-6"> <h3 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2"> <FaFire className="text-orange-500" /> Featured Courses </h3> <button onClick={() => handleNavigation("/materi")} className="flex items-center gap-1.5 text-purple-600 hover:text-purple-700 font-medium text-sm sm:text-base"> View All <FaChevronRight className="text-xs" /> </button> </div>
        
        {loadingMateri && filteredMateriList.length === 0 && allMateriList.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({length:3}).map((_,idx) => ( <div key={idx} className="bg-white/50 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/20 animate-pulse"> <div className="w-full h-40 bg-slate-200 rounded-lg mb-4"></div> <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div> <div className="h-3 bg-slate-200 rounded w-1/2 mb-3"></div> <div className="h-8 bg-slate-200 rounded w-full"></div> </div> ))}
          </div>
        ) : !loadingMateri && filteredMateriList.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg"> <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-r from-slate-200 to-gray-200 rounded-full mx-auto mb-6 flex items-center justify-center shadow-md"> <FaBook className="text-4xl sm:text-5xl text-gray-400" /> </div> <h4 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">No Courses Available Yet</h4> <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto"> {user.KELAS && user.KELAS.trim() !== "" ? `No courses currently match your class (${user.KELAS})${searchTerm ? ' and search criteria' : ''}. Please check back later.` : "Please ensure your class information is set in your profile to view courses."} </p> </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMateriList.slice(0, 6).map((materi, index) => {
              const palette = colorPalettes[index % colorPalettes.length];
              const thumbnailUrl = (materi.LINK_GAMBAR && materi.LINK_GAMBAR.trim() !== "" && materi.LINK_GAMBAR.toLowerCase() !== "null") ? materi.LINK_GAMBAR : null;
              return (
                <div key={materi.ID} className="group bg-white/70 backdrop-blur-lg rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer border border-white/20 hover:scale-[1.03] flex flex-col" onClick={() => handleMateriClick(materi.ID)}>
                  <div className={`h-44 bg-gradient-to-br ${palette} relative overflow-hidden group flex items-center justify-center`}>
                    {thumbnailUrl ? ( <img src={thumbnailUrl} alt={materi.NAMA_MATERI || 'Material thumbnail'} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"/> ) : ( getTypeSpecificIconDashboard(materi.TIPE_MATERI) )}
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-300"></div>
                    <div className="absolute top-3 right-3 z-20"><button className="p-1.5 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all" title="Bookmark (mock)"><FaBookmark className="text-white/90 text-xs" /></button></div>
                    {materi.TIPE_MATERI && (<span className="absolute bottom-3 left-3 px-2 py-1 bg-black/50 text-white text-[0.7rem] rounded-md backdrop-blur-sm z-20">{materi.TIPE_MATERI}</span>)}
                  </div>
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex items-center gap-2 mb-2"><span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold border border-purple-200">Class {materi.KELAS}</span></div>
                    <h4 className="text-base sm:text-lg font-bold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors duration-200 min-h-[48px] sm:min-h-[56px] line-clamp-2">{materi.NAMA_MATERI || "Untitled Course"}</h4>
                    <div className="flex items-center justify-between text-xs text-gray-600 mt-auto pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-1.5"><FaClock /><span>{materi.DURASI || "N/A"}</span></div>
                      <FaChevronRight className="text-purple-500 group-hover:translate-x-1 transition-transform" />
                    </div>
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