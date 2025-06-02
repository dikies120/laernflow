import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const QuizPage = () => {
  const { materiId } = useParams();
  const [quizList, setQuizList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:5000/api/quiz/materi/${materiId}`)
      .then(res => res.json())
      .then(data => setQuizList(data))
      .finally(() => setLoading(false));
  }, [materiId]);

  if (loading) return <div>Loading quiz...</div>;
  if (!quizList.length) return <div>Quiz belum tersedia untuk materi ini.</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Quiz</h2>
      {quizList.map((q, idx) => (
        <div key={q.id} className="mb-6 p-4 border rounded-lg bg-white shadow">
          <div className="font-semibold mb-2">{idx + 1}. {q.soal}</div>
          <ul className="space-y-1">
            <li>A. {q.pilihan_a}</li>
            <li>B. {q.pilihan_b}</li>
            <li>C. {q.pilihan_c}</li>
            <li>D. {q.pilihan_d}</li>
          </ul>
        </div>
      ))}
    </div>
  );
};

export default QuizPage;