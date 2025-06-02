// src/components/Materi.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaChartBar, FaBook, FaPlayCircle, FaGraduationCap, FaUsers,
  FaClock, FaBookmark, FaSearch, FaBell, FaFilter, FaChevronRight,
  FaAlignLeft, FaFileAlt, FaSpinner
} from "react-icons/fa";

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

const getTypeSpecificIcon = (type) => {
  const iconClasses = "text-white text-4xl sm:text-5xl opacity-70 group-hover:opacity-90 transition-opacity duration-300";
  switch (type?.toLowerCase()) {
    case 'video': return <FaPlayCircle className={iconClasses} />;
    case 'teks':  return <FaAlignLeft className={iconClasses} />;
    case 'dokumen': return <FaFileAlt className={iconClasses} />;
    default: return <FaBook className={iconClasses} />;
  }
};

const Materi = () => {
  const [allMateriList, setAllMateriList] = useState([]);
  const [filteredMateriList, setFilteredMateriList] = useState([]);
  const [user, setUser] = useState({ ID_USER: null, USERNAME: "Guest", EMAIL: "", KELAS: "", FOTO_PROFIL: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState(null);
  const notificationPanelRef = useRef(null);
  const notificationButtonRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let storedUserData = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (storedUserData) {
      const parsedUser = JSON.parse(storedUserData);
      setUser({
        ID_USER: parsedUser.ID_USER || parsedUser.USER_ID || null,
        USERNAME: parsedUser.USERNAME || "User",
        EMAIL: parsedUser.EMAIL || "",
        KELAS: parsedUser.KELAS || "",
        FOTO_PROFIL: parsedUser.FOTO_PROFIL || ""
      });
    }

    setLoading(true);
    fetch("http://localhost:5000/api/materi/crud-materi")
      .then(res => {
        if (!res.ok) {
          return res.text().then(text => {
            let detailError = `HTTP error! status: ${res.status}`;
            try { const jsonData = JSON.parse(text); if (jsonData && jsonData.message) detailError += ` - Pesan: ${jsonData.message}`; if (jsonData && jsonData.error) detailError += ` - Detail: ${jsonData.error}`;
            } catch(e) { if (text) detailError += ` - Respons: ${text.substring(0,100)}`;}
            throw new Error(detailError);
          });
        }
        return res.json();
      })
      .then(data => {
        const validatedData = Array.isArray(data) ? data.map(item => ({
            ID: item.ID, KELAS: item.KELAS, NAMA_MATERI: item.NAMA_MATERI,
            LINK_YOUTUBE: item.LINK_YOUTUBE, TIPE_MATERI: item.TIPE_MATERI,
            LINK_DOKUMEN: item.LINK_DOKUMEN, ISI_TEKS: item.ISI_TEKS,
            DESKRIPSI: item.DESKRIPSI || null, DURASI: item.DURASI || null,
            RATING: item.RATING || null, LINK_GAMBAR: item.LINK_GAMBAR || null,
        })) : [];
        setAllMateriList(validatedData);
        setError(null);
      })
      .catch(error => {
        console.error("Error fetching materi di Materi.jsx:", error.message);
        setError(error.message);
        setAllMateriList([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const fetchUserNotifications = async () => {
      if (!user.ID_USER || user.USERNAME === "Guest") {
        setNotifications([]); setLoadingNotifications(false); return;
      }
      setLoadingNotifications(true); setNotificationError(null);
      try {
        console.log(`[Materi.jsx] Simulating fetch notifications for user ID: ${user.ID_USER}`);
        await new Promise(resolve => setTimeout(resolve, 1200));
        setNotifications([]);
      } catch (err) {
        setNotificationError(err.message || "Could not load notifications."); setNotifications([]);
      } finally { setLoadingNotifications(false); }
    };
    if (user.ID_USER) { fetchUserNotifications(); }
  }, [user.ID_USER, user.USERNAME]);

  useEffect(() => {
    let classFiltered = [];
    if (user.KELAS && user.KELAS.trim() !== "" && allMateriList.length > 0) {
      classFiltered = allMateriList.filter(materi =>
        materi.KELAS && materi.KELAS.toString().trim().toLowerCase() === user.KELAS.toString().trim().toLowerCase()
      );
    } else if (allMateriList.length > 0) {
      classFiltered = allMateriList;
    }

    let searchFiltered = classFiltered;
    if (searchTerm) {
      searchFiltered = classFiltered.filter(materi =>
        materi.NAMA_MATERI && materi.NAMA_MATERI.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    let typeFiltered = searchFiltered;
    if (filterType !== "all") {
      typeFiltered = searchFiltered.filter(materi => {
        const materiTypeToCheck = materi.TIPE_MATERI || "";
        return materiTypeToCheck.toLowerCase().includes(filterType.toLowerCase());
      });
    }
    setFilteredMateriList(typeFiltered);
  }, [user.KELAS, allMateriList, searchTerm, filterType]);

  const handleNavigation = (path) => { navigate(path); setShowNotifications(false); };
  const handleLogout = () => {
    alert("You have been logged out!");
    localStorage.removeItem("user"); localStorage.removeItem("dashboardNeedsRefresh"); sessionStorage.removeItem("user");
    setUser({ ID_USER: null, USERNAME: "Guest", EMAIL: "", KELAS: "", FOTO_PROFIL: "" });
    setFilteredMateriList([]); setNotifications([]);
    navigate("/");
  };
  const handleMateriClick = (id) => { navigate(`/materi/${id}`, { state: { from: location.pathname } }); setShowNotifications(false); };

  const materialTypes = [...new Set(allMateriList
    .map(materi => materi.TIPE_MATERI)
    .filter(type => type && type.trim() !== "")
    .map(type => type.charAt(0).toUpperCase() + type.slice(1).toLowerCase())
  )];

  const unreadNotificationCount = notifications.filter(n => !n.read).length;
  const toggleNotifications = () => setShowNotifications(prev => !prev);
  const markNotificationAsRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    const clickedNotif = notifications.find(n => n.id === id);
    if(clickedNotif && clickedNotif.link) { navigate(clickedNotif.link); setShowNotifications(false); }
  };
  const markAllNotificationsAsRead = async () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
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

  if (loading && (!user.ID_USER && location.pathname !== "/")) {
    return ( <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 items-center justify-center"> <div className="text-center"> <FaSpinner className="animate-spin text-4xl text-purple-600 mx-auto mb-4" /> <p className="text-gray-700 text-lg font-medium">Loading materials...</p> </div> </div> );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <aside className="w-72 bg-white/80 backdrop-blur-lg shadow-2xl border-r border-white/20 p-6 flex flex-col fixed h-full z-20">
        <div className="flex items-center gap-3 mb-8"> <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center"> <FaGraduationCap className="text-white text-xl" /> </div> <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> LearnFlow </h1> </div>
        <nav className="space-y-2 flex-1"> <button onClick={() => handleNavigation("/dashboard")} className={`flex items-center gap-3 w-full p-3 rounded-xl font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 ${location.pathname === "/dashboard" ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white" : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"}`}><FaChartBar className="text-lg" /><span>Dashboard</span></button> <button onClick={() => handleNavigation("/materi")} className={`flex items-center gap-3 w-full p-3 rounded-xl font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 ${location.pathname.startsWith("/materi")? "bg-gradient-to-r from-blue-500 to-purple-500 text-white" : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"}`}><FaBook className="text-lg" /><span>My Courses</span></button> <button onClick={() => handleNavigation("/profile")} className={`flex items-center gap-3 w-full p-3 rounded-xl font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 ${location.pathname === "/profile" ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white" : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"}`}><FaUsers className="text-lg" /><span>Profile</span></button> </nav>
        <div className="mt-auto pt-6 border-t border-gray-200"> <div className="flex items-center gap-3 mb-4"> <img src={user.FOTO_PROFIL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.USERNAME)}&background=4f46e5&color=ffffff&size=40&font-size=0.4&rounded=true`} className="w-10 h-10 rounded-full border-2 border-white shadow-md object-cover" alt="Profile"/> <div className="flex-1 min-w-0"> <p className="text-sm font-medium text-gray-900 truncate">{user.USERNAME}</p> <p className="text-xs text-gray-500 truncate">Class {user.KELAS || 'N/A'}</p> </div> </div> <button onClick={handleLogout} className="w-full px-4 py-2 text-sm font-medium text-red-600 hover:text-red-100 hover:bg-red-600/90 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg border border-red-200 hover:border-transparent">Logout</button> </div>
      </aside>
      <main className="flex-1 ml-72 p-6 sm:p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6"> <div> <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1 sm:mb-2"> My Learning Materials </h1> <p className="text-gray-600 text-sm sm:text-base"> Explore and master your subjects with our comprehensive materials. </p> </div> <div className="flex items-center gap-4"> {user.KELAS && (<div className="bg-white/70 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-md text-sm"><span className="text-gray-600">Class:</span><span className="ml-1.5 font-semibold text-purple-600">{user.KELAS}</span></div>)} <div className="relative"> <button ref={notificationButtonRef} onClick={toggleNotifications} className="p-2.5 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-300 hover:bg-purple-50 text-gray-600 hover:text-purple-600 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500" aria-label="Notifications"> <FaBell className="text-xl" /> {unreadNotificationCount > 0 && (<span className="absolute top-1 right-1 block h-3 w-3 transform -translate-y-1/2 translate-x-1/2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex h-3 w-3 rounded-full bg-red-500 border-2 border-white"></span></span>)} </button> {showNotifications && ( <div ref={notificationPanelRef} className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-30"> <div className="p-3 flex justify-between items-center border-b bg-gray-50"> <h4 className="font-semibold text-gray-700">Notifications</h4> {unreadNotificationCount > 0 && notifications.length > 0 && (<button onClick={markAllNotificationsAsRead} className="text-xs text-purple-600 hover:underline">Mark all as read</button>)} </div> <div className="max-h-80 overflow-y-auto custom-scrollbar"> {loadingNotifications ? ( <div className="flex items-center justify-center p-10"><FaSpinner className="animate-spin text-2xl text-purple-500"/><span className="ml-2 text-gray-500">Loading...</span></div> ) : notificationError ? ( <p className="text-center text-red-500 py-10 px-4">Error: {notificationError}</p> ) : notifications.length === 0 ? ( <p className="text-center text-gray-500 py-10 px-4">No new notifications.</p> ) : ( notifications.map(notif => ( <div key={notif.id} className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${!notif.read ? 'bg-purple-50' : ''}`} onClick={() => markNotificationAsRead(notif.id)}> <p className={`text-sm mb-0.5 ${!notif.read ? 'font-semibold text-gray-800' : 'text-gray-700'}`}>{notif.message}</p> <p className={`text-xs ${!notif.read ? 'text-purple-600' : 'text-gray-400'}`}>{notif.time}</p> </div> )) )} </div> <div className="p-2 bg-gray-100 border-t text-center"> <button onClick={() => { alert("Navigate to all notifications page (placeholder)"); setShowNotifications(false); }} className="text-sm font-medium text-purple-600 hover:underline">View all notifications</button> </div> </div> )} </div> </div> </div>
          <div className="flex flex-col sm:flex-row gap-4 mb-6"> <div className="relative flex-1"><FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search materials by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 shadow-sm"/></div> <div className="relative"><FaFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" /> <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full sm:w-auto pl-12 pr-8 py-3 rounded-xl border border-gray-300 bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 appearance-none cursor-pointer shadow-sm"> <option value="all">All Types</option> {materialTypes.map(type => (<option key={type} value={type.toLowerCase()}>{type}</option>))} {!materialTypes.some(t => t.toLowerCase() === 'video') && <option value="video">Video</option>} {!materialTypes.some(t => t.toLowerCase() === 'teks') && <option value="teks">Teks</option>} {!materialTypes.some(t => t.toLowerCase() === 'dokumen') && <option value="dokumen">Dokumen</option>} </select> </div> </div>
        </div>
        {error && (<div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-md"><p className="font-semibold">Error!</p><p>{error}</p></div>)}
        <div className="grid grid-cols-1 gap-6 mb-8"> {[ { title: `Available Materials ${user.KELAS ? `for Class ${user.KELAS}` : '(All Classes)'}${searchTerm ? ` matching "${searchTerm}"` : ''}${filterType !== 'all' ? ` of type "${filterType}"` : ''}`, count: filteredMateriList.length, icon: FaBook, color: "from-blue-500 to-purple-500", loading: loading }, ].map(stat => ( <div key={stat.title} className="bg-white/70 backdrop-blur-lg rounded-2xl p-5 shadow-lg border border-white/20"> <div className="flex items-center justify-between"> <div> <p className="text-sm text-gray-600 mb-1">{stat.title}</p> {stat.loading ? ( <FaSpinner className="animate-spin text-3xl text-gray-700 mt-1" /> ) : ( <p className="text-3xl font-bold text-gray-900">{stat.count}</p> )} </div> <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center shadow-md`}> <stat.icon className="text-white text-xl" /> </div> </div> </div> ))} </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading && filteredMateriList.length === 0 ? ( Array.from({ length: 6 }).map((_, idx) => ( <div key={idx} className="bg-white/50 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/20 animate-pulse"> <div className="w-full h-40 bg-slate-200 rounded-lg mb-4"></div> <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div> <div className="h-3 bg-slate-200 rounded w-1/2 mb-3"></div> <div className="h-8 bg-slate-200 rounded w-full"></div> </div> ))
          ) : !loading && filteredMateriList.length === 0 ? ( <div className="col-span-full flex flex-col items-center justify-center py-16 text-center"> <div className="w-28 h-28 bg-gradient-to-br from-slate-200 to-gray-200 rounded-full flex items-center justify-center mb-6 shadow-md"><FaBook className="text-gray-400 text-5xl" /></div> <h3 className="text-2xl font-semibold text-gray-700 mb-2">No Materials Found</h3> <p className="text-gray-500 max-w-md"> {searchTerm || filterType !== "all" ? "Try adjusting your search or filter criteria, or check back later." : user.KELAS && user.KELAS.trim() !== "" ? `No materials are currently available for class ${user.KELAS}.` : "Please ensure your class is set in your profile, or try a broader search."} </p> </div>
          ) : (
            filteredMateriList.map((materi, index) => {
              const palette = colorPalettes[index % colorPalettes.length];
              const thumbnailUrl = (materi.LINK_GAMBAR && materi.LINK_GAMBAR.trim() !== "" && materi.LINK_GAMBAR.toLowerCase() !== "null") ? materi.LINK_GAMBAR : null;
              return ( <div key={materi.ID} onClick={() => handleMateriClick(materi.ID)} className="group bg-white/70 backdrop-blur-lg rounded-2xl p-0 overflow-hidden shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-white/20 flex flex-col"> <div className={`w-full h-40 bg-gradient-to-br ${palette} relative overflow-hidden group flex items-center justify-center`}> {thumbnailUrl ? (<img src={thumbnailUrl} alt={materi.NAMA_MATERI || 'Material thumbnail'} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"/>) : (getTypeSpecificIcon(materi.TIPE_MATERI))} <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-300"></div> <div className="absolute top-3 right-3 z-20"><button className="p-1.5 sm:p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all" title="Bookmark (mock)"><FaBookmark className="text-white/90 text-xs sm:text-sm" /></button></div> {materi.TIPE_MATERI && (<span className="absolute bottom-3 left-3 px-2 py-1 bg-black/50 text-white text-[0.7rem] sm:text-xs rounded-md backdrop-blur-sm z-20">{materi.TIPE_MATERI}</span>)} </div> <div className="p-5 flex flex-col flex-grow"> <div className="flex items-center justify-between mb-2"><span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full border border-purple-200">Class {materi.KELAS}</span></div> <h3 className="text-md font-semibold text-gray-800 group-hover:text-purple-600 transition-colors duration-200 mb-1.5 flex-grow min-h-[40px] line-clamp-2">{materi.NAMA_MATERI || "Untitled Material"}</h3> <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-grow min-h-[32px]">{materi.DESKRIPSI || "No description available."}</p> <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-200 pt-3 mt-auto"> <div className="flex items-center gap-1.5"><FaClock /><span>{materi.DURASI || "N/A"}</span></div> <div className="flex items-center text-purple-600 group-hover:gap-1.5 transition-all duration-200"><span>View Details</span><FaChevronRight className="opacity-0 group-hover:opacity-100 transition-opacity duration-200" /></div> </div> </div> </div> );
            })
          )}
        </div>
      </main>
    </div>
  );
};

export default Materi;
