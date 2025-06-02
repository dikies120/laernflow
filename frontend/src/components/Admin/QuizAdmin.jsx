import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const QuizPage = () => {
  const { materiId } = useParams();
  const [quizList, setQuizList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    fetch(`http://localhost:5000/api/quiz/materi/${materiId}`)
      .then(res => res.json())
      .then(data => setQuizList(data))
      .finally(() => setLoading(false));
  }, [materiId]);

  const handleChange = (quizId, value) => {
    setAnswers(prev => ({ ...prev, [quizId]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let correct = 0;
    quizList.forEach(q => {
      if (answers[q.id] && answers[q.id] === q.jawaban) correct++;
    });
    setScore(correct);
    setSubmitted(true);
  };

  if (loading) return <div>Loading quiz...</div>;
  if (!quizList.length) return <div>Quiz belum tersedia untuk materi ini.</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Quiz</h2>
      <form onSubmit={handleSubmit}>
        {quizList.map((q, idx) => (
          <div key={q.id} className="mb-6 p-4 border rounded-lg bg-white shadow">
            <div className="font-semibold mb-2">{idx + 1}. {q.soal}</div>
            <div className="space-y-1">
              {["A", "B", "C", "D"].map(opt => (
                <label key={opt} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`quiz-${q.id}`}
                    value={opt}
                    disabled={submitted}
                    checked={answers[q.id] === opt}
                    onChange={() => handleChange(q.id, opt)}
                  />
                  {opt}. {q[`pilihan_${opt.toLowerCase()}`]}
                </label>
              ))}
            </div>
            {submitted && (
              <div className={`mt-2 text-sm font-semibold ${answers[q.id] === q.jawaban ? "text-green-600" : "text-red-600"}`}>
                Jawaban Anda: {answers[q.id] || "-"} | Kunci: {q.jawaban}
              </div>
            )}
          </div>
        ))}
        {!submitted && (
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-700">
            Submit Jawaban
          </button>
        )}
        {submitted && (
          <div className="mt-6 text-xl font-bold text-green-700">
            Skor Anda: {score} / {quizList.length}
          </div>
        )}
      </form>
    </div>
  );
};

export default QuizPage;