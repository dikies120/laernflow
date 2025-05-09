import React from "react";
import { useNavigate } from "react-router-dom";
import { FaChartBar, FaBook, FaHistory, FaLock } from "react-icons/fa";

const Dashboard = () => {
  const navigate = useNavigate(); 
  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    console.log("Logging out...");
    alert("You have been logged out!");
    navigate("/"); 
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
    {/* Sidebar */}
    <aside className="w-64 bg-white shadow-lg p-6 flex flex-col">
      <h1 className="text-2xl font-bold mb-6 text-blue-700">LearnFlow</h1>
      <nav className="space-y-4">
        <button
          onClick={() => handleNavigation("/dashboard")}
          className="flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-800 text-left w-full"
        >
          <FaChartBar />
          <span>Dashboard</span>
        </button>
        <button
          onClick={() => handleNavigation("/materi")}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-800 text-left w-full"
        >
          <FaBook />
          <span>Materi</span>
        </button>
        <button
          onClick={() => handleNavigation("/quiz-history")}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-800 text-left w-full"
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
      <main className="flex-1 p-8">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-8">
          <input
            type="text"
            placeholder="Search"
            className="px-4 py-2 border rounded-lg w-1/3"
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
            Start Quiz
          </button>
          <div className="flex items-center gap-2">
            <img
              src="https://randomuser.me/api/portraits/men/75.jpg"
              alt="User"
              className="w-10 h-10 rounded-full"
            />
            <span>Ambagus</span>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="https://randomuser.me/api/portraits/men/75.jpg"
              className="w-24 h-24 rounded-lg"
              alt="Profile"
            />
            <div>
              <h2 className="text-xl font-bold text-blue-700">Ambagus</h2>
              <p>Bonus booster 24lv</p>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-lg font-bold">27</p>
              <p className="text-gray-500">Quiz Passed</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">27min</p>
              <p className="text-gray-500">Fastest Time</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">200</p>
              <p className="text-gray-500">Correct Answers</p>
            </div>
          </div>
        </div>

        {/* Featured Quizzes */}
        <h3 className="text-lg font-semibold mb-4">Featured Quizzes</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="relative bg-purple-700 text-white p-4 rounded-lg h-40 flex items-end">
            <p>Reproduksi Makhluk Hidup</p>
            {/* <span className="absolute top-2 left-2 bg-white text-black text-xs px-2 py-1 rounded">
              15 min
            </span> */}
          </div>
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="relative bg-gray-300 p-4 rounded-lg h-40 flex items-center justify-center"
            >
              <FaLock size={32} className="text-gray-600" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;