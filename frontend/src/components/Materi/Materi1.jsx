import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const MateriDetail = () => {
  const { id } = useParams();
  const [materi, setMateri] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/api/materi/crud-materi")
      .then(res => res.json())
      .then(data => {
        const found = data.find(m => String(m.ID) === String(id));
        setMateri(found);
      });
  }, [id]);

  const getYoutubeEmbed = (url) => {
    let videoId = "";
    if (url.includes("youtube.com")) {
      const params = new URL(url).searchParams;
      videoId = params.get("v");
    } else if (url.includes("youtu.be")) {
      videoId = url.split("youtu.be/")[1];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
  };

  if (!materi) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <button onClick={() => navigate(-1)} className="mb-4 text-blue-600 underline">
        &larr; Kembali
      </button>
      <h2 className="text-2xl font-bold mb-4">{materi.NAMA_MATERI} (Kelas {materi.KELAS})</h2>
      {materi.LINK_YOUTUBE && getYoutubeEmbed(materi.LINK_YOUTUBE) ? (
        <iframe
          width="560"
          height="315"
          src={getYoutubeEmbed(materi.LINK_YOUTUBE)}
          title={materi.NAMA_MATERI}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      ) : (
        <a
          href={materi.LINK_YOUTUBE}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          Lihat Video
        </a>
      )}
    </div>
  );
};

export default MateriDetail;