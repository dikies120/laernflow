// src/components/QuizTaker.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  FaArrowLeft, FaArrowRight, FaTimesCircle, FaRegStopCircle, FaCheck, FaRedo,
  FaCheckCircle, FaTrophy, FaQuestionCircle, FaHourglassHalf, FaSave
} from "react-icons/fa";

const QuizTaker = ({ materiId, onQuizClose, userId, onQuizComplete }) => {
  const [quizList, setQuizList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  // 'score' utama masih menyimpan jumlah jawaban benar, tapi kita akan gunakan 'resultForDisplay' untuk UI akhir.
  const [score, setScore] = useState(0); 
  const [resultForDisplay, setResultForDisplay] = useState({ score: 0, totalQuestions: 0, percentage: 0 }); // State baru untuk tampilan hasil

  const [error, setError] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentSelection, setCurrentSelection] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [savingScore, setSavingScore] = useState(false);

  const API_BASE_URL = "http://localhost:5000";

  const fetchQuizData = useCallback(async () => {
    setLoading(true); setError(null); setAnswers({}); setCurrentQuestionIndex(0);
    setCurrentSelection(null); setSubmitted(false); setScore(0); setQuizList([]);
    setResultForDisplay({ score: 0, totalQuestions: 0, percentage: 0 }); // Reset hasil tampilan juga
    setStartTime(Date.now());

    if (!materiId) {
        setError("ID Materi tidak valid untuk memuat kuis."); setLoading(false); return;
    }
    try {
      // ... (fetchQuizData logic seperti sebelumnya) ...
      const response = await fetch(`${API_BASE_URL}/api/quiz/materi/${materiId}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gagal memuat data quiz: ${response.status} ${response.statusText}. Server: ${errorText}`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) { throw new Error("Format data quiz dari server tidak valid (bukan array)."); }
      if (data.length === 0) { setError("Quiz belum tersedia untuk materi ini atau tidak ada pertanyaan.");
      } else {
        const validatedData = data.map((q) => ({ ...q, pilihan_a: q.pilihan_a || "Tidak ada opsi A", pilihan_b: q.pilihan_b || "Tidak ada opsi B", pilihan_c: q.pilihan_c || "Tidak ada opsi C", pilihan_d: q.pilihan_d || "Tidak ada opsi D",
        })).filter(q => q && typeof q.id !== 'undefined' && typeof q.soal === 'string' && typeof q.jawaban === 'string');
        setQuizList(validatedData);
        if (validatedData.length === 0 && data.length > 0) { setError("Data quiz diterima tapi formatnya tidak lengkap/valid setelah divalidasi.");
        } else if (validatedData.length === 0) { setError("Tidak ada pertanyaan kuis yang valid ditemukan."); }
      }
    } catch (err) {
      setError(err.message || "Gagal memuat quiz. Periksa console browser untuk detail."); setQuizList([]);
    } finally { setLoading(false); }
  }, [materiId]);

  useEffect(() => { if (materiId) { fetchQuizData(); } }, [materiId, fetchQuizData]);

  const handleOptionSelect = (option) => { setCurrentSelection(option); };

  const navigateToQuestion = (index) => {
    if (quizList && index >= 0 && index < quizList.length) {
        setCurrentQuestionIndex(index);
        const questionId = quizList[index]?.id;
        setCurrentSelection(answers[questionId] || null);
    }
  };

  const saveAndGoNext = (isSkipping = false) => {
    const currentQ = quizList[currentQuestionIndex];
    if (currentQ && currentSelection && !isSkipping) {
      setAnswers(prev => ({ ...prev, [currentQ.id]: currentSelection }));
    }
    if (currentQuestionIndex < quizList.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setCurrentSelection(answers[quizList[nextIndex]?.id] || null);
    } else { handleSubmitQuiz(true); } // Auto submit on last question
  };

  const handleSkipQuestion = () => saveAndGoNext(true);

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      setCurrentSelection(answers[quizList[prevIndex]?.id] || null);
    }
  };

  const saveScoreToDatabase = async (finalAnswers, correctCount) => {
    // ... (fungsi saveScoreToDatabase seperti sebelumnya) ...
    if (!userId) {
      console.warn("User ID tidak tersedia, skor tidak dapat disimpan");
      return { success: false, message: "User ID tidak tersedia." };
    }
    setSavingScore(true);
    try {
      const timeTaken = startTime ? Math.round((Date.now() - startTime) / 1000) : null;
      const response = await fetch(`${API_BASE_URL}/api/quiz/submit-score`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify({ student_id: userId, materi_id: materiId, score: correctCount, total_questions: quizList.length, answers: finalAnswers, time_taken: timeTaken })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({message: `Gagal menyimpan skor: Status ${response.status}`}));
        throw new Error(errorData.message || `Gagal menyimpan skor: Status ${response.status}`);
      }
      const result = await response.json();
      console.log("Skor berhasil disimpan:", result);
      return { success: true, data: result };
    } catch (error) {
      console.error("Error menyimpan skor:", error);
      return { success: false, message: error.message || "Error tidak diketahui saat menyimpan skor." };
    } finally { setSavingScore(false); }
  };

  const handleSubmitQuiz = async (isAutoSubmit = false) => {
    let finalAnswers = { ...answers };
    const currentQ = quizList[currentQuestionIndex];
    if (currentQ && currentSelection && !isAutoSubmit) {
      finalAnswers[currentQ.id] = currentSelection;
      setAnswers(finalAnswers);
    }
    let correctCount = 0;
    quizList.forEach(question => { if (finalAnswers[question.id] === question.jawaban) { correctCount++; } });
    
    // Set nilai untuk tampilan dan state utama
    const currentQuizListLength = quizList.length; // Ambil panjang quizList saat ini
    setScore(correctCount); // Set state 'score' utama
    setResultForDisplay({ // Set state untuk tampilan hasil
        score: correctCount,
        totalQuestions: currentQuizListLength,
        percentage: currentQuizListLength > 0 ? Math.round((correctCount / currentQuizListLength) * 100) : 0,
    });
    setSubmitted(true); // Tandai kuis sudah disubmit

    const saveResult = await saveScoreToDatabase(finalAnswers, correctCount); // Simpan skor

    if (typeof onQuizComplete === 'function') {
        onQuizComplete({ // Kirim hasil ke parent
            submitted: true, 
            score: correctCount, 
            totalQuestions: currentQuizListLength,
            percentage: currentQuizListLength > 0 ? Math.round((correctCount / currentQuizListLength) * 100) : 0,
            passed: currentQuizListLength > 0 ? (Math.round((correctCount / currentQuizListLength) * 100) >= 70) : false,
            saveStatus: saveResult
        });
    }
  };

  const handleRetryQuiz = () => { fetchQuizData(); }; // fetchQuizData sudah mereset semua state yang perlu

  // Fungsi getScoreColor sekarang menggunakan resultForDisplay
  const getScoreColor = () => {
    const percentage = resultForDisplay.percentage;
    if (percentage >= 80) return "text-green-600"; 
    if (percentage >= 60) return "text-yellow-600"; 
    return "text-red-600";
  };

  const getAnsweredCount = () => Object.keys(answers).length;

  // ... (blok loading dan error seperti sebelumnya) ...
  if (loading) return ( <div className="flex items-center justify-center min-h-screen bg-gray-50"><div className="text-center"><FaHourglassHalf className="text-4xl text-blue-500 animate-spin mx-auto mb-4" /><p className="text-lg text-gray-600">Memuat kuis...</p></div></div> );
  if (error) return ( <div className="flex items-center justify-center min-h-screen bg-gray-50"><div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4"><div className="text-center"><FaTimesCircle className="text-5xl text-red-500 mx-auto mb-4" /><h2 className="text-xl font-bold text-gray-800 mb-4">Error</h2><p className="text-gray-600 mb-6">{error}</p><div className="flex flex-col sm:flex-row gap-3"><button onClick={fetchQuizData} className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"><FaRedo className="mr-2" /> Coba Lagi</button><button onClick={onQuizClose} className="flex items-center justify-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"><FaArrowLeft className="mr-2" /> Kembali</button></div></div></div></div> );


  if (submitted) {
    // Tambahkan log di sini untuk memeriksa nilai resultForDisplay saat render
    console.log("Rendering submitted view. Result for display:", resultForDisplay); 
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white text-center">
              <FaTrophy className="text-4xl mx-auto mb-3" />
              <h2 className="text-2xl font-bold">Kuis Selesai!</h2>
            </div>

            <div className="p-8">
              <div className="text-center mb-8">
                {/* Gunakan resultForDisplay untuk persentase */}
                <div className={`text-6xl font-bold mb-2 ${getScoreColor()}`}>
                  {resultForDisplay.percentage}% 
                </div>
                {/* Gunakan resultForDisplay untuk skor mentah */}
                <p className="text-gray-600 text-lg">
                  Skor Anda: {resultForDisplay.score} dari {resultForDisplay.totalQuestions} soal
                </p>
                {savingScore && (
                  <div className="flex items-center justify-center mt-2 text-blue-600">
                    <FaSave className="mr-2 animate-pulse" />
                    <span>Menyimpan skor...</span>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-gray-800 mb-4">Detail Jawaban:</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {quizList.map((question, index) => { // quizList masih valid di sini
                    const userAnswer = answers[question.id];
                    const isCorrect = userAnswer === question.jawaban;
                    const wasAnswered = userAnswer !== undefined;
                    return (
                      <div key={question.id} className="flex items-center justify-between p-3 bg-white rounded border">
                        <span className="text-sm truncate pr-2" title={question.soal}>
                          Soal {index + 1}: {question.soal.substring(0, 30)}...
                        </span>
                        <div className="flex items-center flex-shrink-0">
                          {wasAnswered ? (
                            isCorrect ? ( <FaCheckCircle className="text-green-500 mr-2" /> )
                                      : ( <FaTimesCircle className="text-red-500 mr-2" /> )
                          ) : ( <FaQuestionCircle className="text-gray-400 mr-2" /> )}
                          <span className={`text-xs px-2 py-1 rounded ${
                            wasAnswered 
                              ? (isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {wasAnswered ? (isCorrect ? 'Benar' : 'Salah') : 'Tidak Dijawab'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleRetryQuiz}
                  className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                > <FaRedo className="mr-2" /> Ulangi Kuis </button>
                <button
                  onClick={onQuizClose}
                  className="flex-1 flex items-center justify-center px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                > <FaArrowLeft className="mr-2" /> Kembali ke Materi </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ... (sisa kode render untuk pertanyaan kuis seperti sebelumnya) ...
  const currentQuestion = quizList[currentQuestionIndex];
  const progress = quizList.length > 0 ? ((currentQuestionIndex + 1) / quizList.length) * 100 : 0;

  return ( <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100"><div className="container mx-auto px-4 py-8"><div className="bg-white rounded-lg shadow-md p-4 mb-6"><div className="flex justify-between items-center mb-4"><button onClick={onQuizClose} className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"><FaArrowLeft className="mr-2" /> Kembali</button><div className="text-center"><h1 className="text-xl font-bold text-gray-800">Kuis Materi</h1><p className="text-sm text-gray-600">Soal {currentQuestionIndex + 1} dari {quizList.length}</p></div><div className="text-right"><p className="text-sm text-gray-600">Dijawab: {getAnsweredCount()}/{quizList.length}</p></div></div><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div></div></div><div className="bg-white rounded-lg shadow-md p-6 mb-6"><div className="mb-6"><h2 className="text-lg font-semibold text-gray-800 mb-4">{currentQuestion?.soal}</h2><div className="space-y-3">{['a', 'b', 'c', 'd'].map((option) => { const optionKey = `pilihan_${option}`; const optionValue = currentQuestion?.[optionKey]; const isSelected = currentSelection === option.toUpperCase(); return ( <button key={option} onClick={() => handleOptionSelect(option.toUpperCase())} className={`w-full p-4 text-left rounded-lg border-2 transition-all ${ isSelected ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}><div className="flex items-center"><span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-3 text-sm font-medium ${ isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 text-gray-600'}`}>{option.toUpperCase()}</span><span className="text-gray-800">{optionValue}</span></div></button> ); })}</div></div></div><div className="bg-white rounded-lg shadow-md p-4"><div className="flex justify-between items-center"><button onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0} className={`flex items-center px-4 py-2 rounded-lg transition-colors ${ currentQuestionIndex === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-500 text-white hover:bg-gray-600'}`}><FaArrowLeft className="mr-2" /> Sebelumnya</button><div className="flex space-x-2"><button onClick={handleSkipQuestion} disabled={currentQuestionIndex === quizList.length -1 && getAnsweredCount() === quizList.length -1 } className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><FaRegStopCircle className="mr-2" /> Lewati</button>{currentQuestionIndex === quizList.length - 1 ? ( <button onClick={() => handleSubmitQuiz(false)} disabled={!currentSelection && !answers[currentQuestion?.id]} className="flex items-center px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><FaCheck className="mr-2" /> Selesai</button> ) : ( <button onClick={() => saveAndGoNext(false)} disabled={!currentSelection} className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Selanjutnya <FaArrowRight className="ml-2" /></button> )}</div></div></div>{quizList.length > 0 && ( <div className="bg-white rounded-lg shadow-md p-4 mt-6"><h3 className="text-sm font-medium text-gray-700 mb-3">Navigasi Soal:</h3><div className="grid grid-cols-5 sm:grid-cols-10 gap-2">{quizList.map((_, index) => { const questionId = quizList[index]?.id; const isAnswered = answers[questionId] !== undefined; const isCurrent = index === currentQuestionIndex; return ( <button key={index} onClick={() => navigateToQuestion(index)} className={`w-full h-8 rounded text-xs font-medium transition-colors ${ isCurrent ? 'bg-blue-500 text-white ring-2 ring-blue-300' : isAnswered ? 'bg-green-100 text-green-800 border border-green-300 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{index + 1}</button> ); })}</div></div> )}</div></div> );
};

export default QuizTaker;