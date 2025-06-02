import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaChartBar, FaBook, FaBell, FaUsers, FaGraduationCap,
  FaSpinner, FaEdit, FaSave, FaTimes, FaCamera, FaUser, FaEnvelope,
  FaCalendarAlt, FaMapMarkerAlt, FaPhone
} from "react-icons/fa";

const Profile = () => {
  const [user, setUser] = useState({
    ID_USER: null, USERNAME: "Guest", EMAIL: "", KELAS: "",
    NAMA_LENGKAP: "", TANGGAL_LAHIR: "", ALAMAT: "", NO_TELEPON: "", FOTO_PROFIL: ""
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [profilePicFile, setProfilePicFile] = useState(null);

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState(null);
  const notificationPanelRef = useRef(null);
  const notificationButtonRef = useRef(null);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  const API_BASE_URL = 'http://localhost:5000';

  useEffect(() => {
    let storedUserData = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (storedUserData) {
      try {
        const parsedUser = JSON.parse(storedUserData);
        let fotoProfilStorage = parsedUser.FOTO_PROFIL || "";
        if (fotoProfilStorage && fotoProfilStorage.startsWith('/uploads') && !fotoProfilStorage.startsWith(API_BASE_URL)) {
            fotoProfilStorage = `${API_BASE_URL}${fotoProfilStorage}`;
        }
        const initialUser = {
          ID_USER: parsedUser.ID_USER || parsedUser.USER_ID || null,
          USERNAME: parsedUser.USERNAME || "Guest", FOTO_PROFIL: fotoProfilStorage,
          EMAIL: parsedUser.EMAIL || "", KELAS: parsedUser.KELAS || "",
          NAMA_LENGKAP: parsedUser.NAMA_LENGKAP || "", TANGGAL_LAHIR: parsedUser.TANGGAL_LAHIR || "",
          ALAMAT: parsedUser.ALAMAT || "", NO_TELEPON: parsedUser.NO_TELEPON || ""
        };
        setUser(initialUser);
        setEditForm(initialUser); 
      } catch (e) { console.error("[Profile.jsx] Gagal parse user dari storage:", e); localStorage.clear(); sessionStorage.clear(); }
    }
    setLoadingProfile(false); 
  }, [API_BASE_URL]);


  useEffect(() => {
    const fetchUserProfile = async () => {
      const currentUserId = user.ID_USER; 
      if (!currentUserId) { setLoadingProfile(false); return; }
      
      setLoadingProfile(true); setError(null); 
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/${currentUserId}/profile`);
        if (!response.ok) {
          const errData = await response.json().catch(() => ({ message: `Server error: ${response.status}.` }));
          throw new Error(errData.message || `Gagal mengambil profil pengguna. Status: ${response.status}`); 
        }
        const data = await response.json();
        if (data.success && data.user) {
          let fotoProfilFinal = data.user.FOTO_PROFIL || "";
          if (fotoProfilFinal && fotoProfilFinal.startsWith('/uploads') && !fotoProfilFinal.startsWith(API_BASE_URL)) {
             fotoProfilFinal = `${API_BASE_URL}${fotoProfilFinal}`;
          }
          const fetchedUser = { ...data.user, FOTO_PROFIL: fotoProfilFinal };
          setUser(fetchedUser);
          setEditForm(fetchedUser);
        } else { throw new Error(data.message || "Format data profil tidak valid."); }
      } catch (err) {
        console.error("[Profile.jsx] Error fetching profile:", err); 
        setError(err.message || "Tidak dapat memuat data profil.");
      } finally { setLoadingProfile(false); }
    };
    if (user.ID_USER) { fetchUserProfile(); } else { setLoadingProfile(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.ID_USER, API_BASE_URL]);

  const handleNavigation = (path) => navigate(path);
  const handleLogout = () => {
    localStorage.clear(); sessionStorage.clear();
    setUser({ ID_USER: null, USERNAME: "Guest", EMAIL: "", KELAS: "", NAMA_LENGKAP: "", TANGGAL_LAHIR: "", ALAMAT: "", NO_TELEPON: "", FOTO_PROFIL: "" });
    setEditForm({});
    navigate("/");
  };

  const handleEditToggle = () => {
    if (isEditing) {
      if (editForm.FOTO_PROFIL && editForm.FOTO_PROFIL.startsWith("blob:")) {
        URL.revokeObjectURL(editForm.FOTO_PROFIL);
      }
      setEditForm(user); 
      setProfilePicFile(null);
    } else {
      setEditForm({...user}); 
    }
    setIsEditing(!isEditing); setError(null); setSuccessMessage("");
  };

  const handleFormChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) { setError("File terpilih bukan gambar."); return; }
      if (file.size > 5 * 1024 * 1024) { setError("Ukuran file maks 5MB."); return; }
      setError(null); 
      if (editForm.FOTO_PROFIL && editForm.FOTO_PROFIL.startsWith("blob:")) {
        URL.revokeObjectURL(editForm.FOTO_PROFIL);
      }
      setProfilePicFile(file); 
      setEditForm(prev => ({ ...prev, FOTO_PROFIL: URL.createObjectURL(file) }));
    }
  };

  const handleSaveProfile = async () => {
    if (!editForm.ID_USER) { setError("User ID tidak ada."); return; }
    setSaveLoading(true); setError(null); setSuccessMessage("");

    const formData = new FormData();
    Object.keys(editForm).forEach(key => {
      if (key === 'FOTO_PROFIL' && profilePicFile) { return; }
      if (key === 'FOTO_PROFIL' && !profilePicFile) {
        formData.append(key, editForm[key] || ''); 
        return;
      }
      formData.append(key, editForm[key] === null || typeof editForm[key] === 'undefined' ? '' : editForm[key]);
    });

    if (profilePicFile) {
      formData.append('profilePicFile', profilePicFile, profilePicFile.name);
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${editForm.ID_USER}/profile`, {
        method: 'PUT',
        body: formData, 
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || `Gagal update profil: Server ${response.status}`);
      }

      if (responseData.success && responseData.user) {
        let serverFotoProfil = responseData.user.FOTO_PROFIL || "";
        if (serverFotoProfil && serverFotoProfil.startsWith('/uploads') && !serverFotoProfil.startsWith(API_BASE_URL)) {
            serverFotoProfil = `${API_BASE_URL}${serverFotoProfil}`;
        }
        const updatedUserFromServer = { ...responseData.user, FOTO_PROFIL: serverFotoProfil };

        setUser(updatedUserFromServer);
        setEditForm(updatedUserFromServer);

        try {
            const currentStoredUser = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
            const newStoredUser = { ...currentStoredUser, ...updatedUserFromServer };
            if (localStorage.getItem("user")) localStorage.setItem("user", JSON.stringify(newStoredUser));
            else if (sessionStorage.getItem("user")) sessionStorage.setItem("user", JSON.stringify(newStoredUser));
        } catch (storageError) { console.error("[Profile.jsx] Error updating storage:", storageError); }

        setIsEditing(false);
        setSuccessMessage("Profil berhasil diperbarui!");
        if (user.KELAS !== updatedUserFromServer.KELAS || (profilePicFile && user.FOTO_PROFIL !== updatedUserFromServer.FOTO_PROFIL)) {
          localStorage.setItem('dashboardNeedsRefresh', 'true');
        }
        setProfilePicFile(null); 
        setTimeout(() => setSuccessMessage(""), 3000);
      } else { throw new Error(responseData.message || "Gagal memperbarui profil."); }
    } catch (err) {
      console.error("[Profile.jsx] Error saving profile:", err);
      setError(err.message || "Tidak dapat memperbarui profil.");
    } finally { setSaveLoading(false); }
  };
  
  useEffect(() => { console.log("[Profile.jsx] User state changed:", user); }, [user]);

  let displayProfilePicture = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.USERNAME?.[0] || 'G')}&background=cccccc&color=ffffff&size=120&font-size=0.5&length=1&rounded=true`;
  if (isEditing && editForm.FOTO_PROFIL) {
    displayProfilePicture = editForm.FOTO_PROFIL;
  } else if (!isEditing && user.FOTO_PROFIL) {
    let finalUserPhoto = user.FOTO_PROFIL;
    if (finalUserPhoto && finalUserPhoto.startsWith('/uploads') && !finalUserPhoto.startsWith(API_BASE_URL) && !finalUserPhoto.startsWith('blob:')) {
        finalUserPhoto = `${API_BASE_URL}${finalUserPhoto}`;
    }
    displayProfilePicture = finalUserPhoto || displayProfilePicture; 
  } else if (user.USERNAME && user.USERNAME !== "Guest") {
    displayProfilePicture = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.USERNAME)}&background=6366f1&color=ffffff&size=120&font-size=0.4&rounded=true`;
  }

  if (loadingProfile) { 
    return ( <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 items-center justify-center"><div className="text-center"><FaSpinner className="animate-spin text-4xl text-purple-600 mx-auto mb-4" /><p className="text-gray-700 text-lg font-medium">Loading Profile...</p></div></div> );
  }
  
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <aside className="w-72 bg-white/80 backdrop-blur-lg shadow-2xl border-r border-white/20 p-6 flex flex-col fixed h-full z-20">
        <div className="flex items-center gap-3 mb-8"> <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center"> <FaGraduationCap className="text-white text-xl" /> </div> <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> LearnFlow </h1> </div>
        <nav className="space-y-2 flex-1">
            <button onClick={() => handleNavigation("/dashboard")} className={`flex items-center gap-3 w-full p-3 rounded-xl font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 ${location.pathname === "/dashboard" ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white" : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"}`}><FaChartBar className="text-lg" /><span>Dashboard</span></button>
            <button onClick={() => handleNavigation("/materi")} className={`flex items-center gap-3 w-full p-3 rounded-xl font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 ${location.pathname.startsWith("/materi")? "bg-gradient-to-r from-blue-500 to-purple-500 text-white" : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"}`}><FaBook className="text-lg" /><span>My Courses</span></button>
            <button onClick={() => handleNavigation("/profile")} className={`flex items-center gap-3 w-full p-3 rounded-xl font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 ${location.pathname === "/profile" ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white" : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"}`}><FaUsers className="text-lg" /><span>Profile</span></button>
        </nav>
        <div className="mt-auto pt-6 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-4">
                <img 
                    src={((user.FOTO_PROFIL && user.FOTO_PROFIL.startsWith('/uploads') && !user.FOTO_PROFIL.startsWith(API_BASE_URL)) ? `${API_BASE_URL}${user.FOTO_PROFIL}` : user.FOTO_PROFIL) || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.USERNAME || 'G')}&background=4f46e5&color=ffffff&size=40&font-size=0.4&rounded=true`} 
                    className="w-10 h-10 rounded-full border-2 border-white shadow-md object-cover" 
                    alt="Profile"
                />
                <div className="flex-1 min-w-0"> <p className="text-sm font-medium text-gray-900 truncate">{user.USERNAME}</p> <p className="text-xs text-gray-500 truncate">Class {user.KELAS || 'N/A'}</p> </div>
            </div>
            <button onClick={handleLogout} className="w-full px-4 py-2 text-sm font-medium text-red-600 hover:text-red-100 hover:bg-red-600/90 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg border border-red-200 hover:border-transparent">Logout</button>
        </div>
      </aside>
      <main className="flex-1 p-6 sm:p-8 ml-72">
        <div className="flex justify-between items-center mb-8">
            <div> <h2 className="text-2xl sm:text-3xl font-bold text-gray-800"> My Profile 👤 </h2> <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage your account information</p> </div>
        </div>
        {successMessage && <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-xl shadow transition-all duration-300">{successMessage}</div>}
        {error && <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl shadow transition-all duration-300">{error}</div>}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 p-8 relative">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <img
                  key={displayProfilePicture + (isEditing ? '_editing' : '_viewing') + (profilePicFile ? profilePicFile.name : '') + Date.now()} 
                  src={displayProfilePicture}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-xl object-cover"
                  alt="Profile"
                />
                {isEditing && (
                  <>
                    <input type="file" id="profilePictureInput" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                    <label htmlFor="profilePictureInput" className="absolute bottom-0 right-0 p-2 bg-purple-600 hover:bg-purple-700 rounded-full text-white shadow-lg transition-colors cursor-pointer" aria-label="Change profile picture">
                      <FaCamera className="text-sm" />
                    </label>
                  </>
                )}
              </div>
              <div className="flex-1 text-center sm:text-left text-white">
                <h3 className="text-2xl sm:text-3xl font-bold mb-2">{isEditing ? (editForm.USERNAME || user.USERNAME || '') : (user.USERNAME || '')}</h3>
                <p className="text-white/90 mb-1">{isEditing ? (editForm.EMAIL || user.EMAIL) : (user.EMAIL || "No email")}</p>
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-3">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium"> Class {isEditing ? (editForm.KELAS || user.KELAS) : (user.KELAS || "N/A")} </span>
                </div>
              </div>
              <div className="text-center sm:text-right mt-4 sm:mt-0">
                {!isEditing ? (
                  <button onClick={handleEditToggle} className="px-6 py-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl text-white font-medium transition-all duration-200 border border-white/30 hover:border-white/50 shadow-md"> <FaEdit className="inline mr-2" /> Edit Profile </button>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button onClick={handleSaveProfile} disabled={saveLoading} className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 rounded-lg text-white font-medium transition-all duration-200 text-sm shadow-md flex items-center justify-center"> {saveLoading ? <FaSpinner className="animate-spin mr-1" /> : <FaSave className="mr-1" />} {saveLoading ? "Saving..." : "Save"} </button>
                    <button onClick={handleEditToggle} disabled={saveLoading} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 rounded-lg text-white font-medium transition-all duration-200 text-sm shadow-md flex items-center justify-center"> <FaTimes className="mr-1" /> Cancel </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="p-6 sm:p-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Basic Information</h4>
                    <div className="space-y-4">
                        <div> <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"> <FaUser className="text-purple-500" /> Username </label> {isEditing ? ( <input type="text" name="USERNAME" value={editForm.USERNAME || ""} onChange={(e) => handleFormChange("USERNAME", e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm text-sm" placeholder="Enter username" /> ) : ( <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800 text-sm"> {user.USERNAME || "Not provided"} </div> )} </div>
                        <div> <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"> <FaEnvelope className="text-purple-500" /> Email </label> {isEditing ? ( <input type="email" name="EMAIL" value={editForm.EMAIL || ""} onChange={(e) => handleFormChange("EMAIL", e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm text-sm" placeholder="Enter email" /> ) : ( <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800 text-sm"> {user.EMAIL || "Not provided"} </div> )} </div>
                        <div> <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"> <FaGraduationCap className="text-purple-500" /> Full Name </label> {isEditing ? ( <input type="text" name="NAMA_LENGKAP" value={editForm.NAMA_LENGKAP || ""} onChange={(e) => handleFormChange("NAMA_LENGKAP", e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm text-sm" placeholder="Enter full name" /> ) : ( <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800 text-sm"> {user.NAMA_LENGKAP || "Not provided"} </div> )} </div>
                        <div> <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"> <FaBook className="text-purple-500" /> Class </label> {isEditing ? ( <select name="KELAS" value={editForm.KELAS || ""} onChange={(e) => handleFormChange("KELAS", e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm bg-white text-sm appearance-none" > <option value="">Select Class</option><option value="10">10</option><option value="11">11</option><option value="12">12</option> <option value="10-IPA-1">10-IPA-1</option><option value="11-IPA-8">11-IPA-8</option><option value="12-IPS-3">12-IPS-3</option> </select> ) : ( <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800 text-sm"> Class {user.KELAS || "Not specified"} </div> )} </div>
                    </div>
                </div>
                <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Contact Information</h4>
                    <div className="space-y-4">
                        <div> <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"> <FaPhone className="text-purple-500" /> Phone Number </label> {isEditing ? ( <input type="tel" name="NO_TELEPON" value={editForm.NO_TELEPON || ""} onChange={(e) => handleFormChange("NO_TELEPON", e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm text-sm" placeholder="Enter phone number" /> ) : ( <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800 text-sm"> {user.NO_TELEPON || "Not provided"} </div> )} </div>
                        <div> <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"> <FaCalendarAlt className="text-purple-500" /> Date of Birth </label> {isEditing ? ( <input type="date" name="TANGGAL_LAHIR" value={editForm.TANGGAL_LAHIR || ""} onChange={(e) => handleFormChange("TANGGAL_LAHIR", e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm text-sm" /> ) : ( <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800 text-sm"> {user.TANGGAL_LAHIR ? new Date(user.TANGGAL_LAHIR + "T00:00:00Z").toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' }) : "Not provided"} </div> )} </div>
                        <div> <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"> <FaMapMarkerAlt className="text-purple-500" /> Address </label> {isEditing ? ( <textarea name="ALAMAT" value={editForm.ALAMAT || ""} onChange={(e) => handleFormChange("ALAMAT", e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm text-sm min-h-[80px]" placeholder="Enter address" rows="3" /> ) : ( <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-800 whitespace-pre-line text-sm min-h-[80px]"> {user.ALAMAT || "Not provided"} </div> )} </div>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};
export default Profile;