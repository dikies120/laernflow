import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();
export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    try {
        return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
        console.error("Error parsing stored user JSON:", error);
        localStorage.removeItem('user'); // Hapus data korup
        sessionStorage.removeItem('user'); // Hapus data korup
        return null;
    }
  });

 
  const loginUser = (userData, rememberMe) => {
    setUser(userData);
    if (rememberMe) {
      localStorage.setItem('user', JSON.stringify(userData));
      sessionStorage.removeItem('user'); // Hapus dari session jika ada
    } else {
      sessionStorage.setItem('user', JSON.stringify(userData));
      localStorage.removeItem('user'); // Hapus dari local jika ada
    }
  };

  // Fungsi untuk logout
  const logoutUser = () => {
    setUser(null);
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
  };


  return (
    <UserContext.Provider value={{ user, setUser, loginUser, logoutUser }}>
      {children}
    </UserContext.Provider>
  );
};