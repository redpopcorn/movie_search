import { useEffect, useState } from "react";

const API_KEY = import.meta.env.VITE_OMDB_API_KEY;
const API_BASE_URL = "https://www.omdbapi.com/";

const MovieCard = ({ movie, onClick }) => {
  const { Title, Poster, imdbID, Year, Type } = movie;
  const [rating, setRating] = useState(null);

  useEffect(() => {
    const fetchRating = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}?apikey=${API_KEY}&i=${imdbID}`
        );
        const data = await res.json();

        if (data.imdbRating && data.imdbRating !== "N/A") {
          setRating(data.imdbRating);
        }
      } catch (error) {
        console.error("Rating fetch failed");
      }
    };

    fetchRating();
  }, [imdbID]);

  return (
    <div
      onClick={onClick}
      className="movie-card bg-neutral-900 rounded-lg p-3 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/10 active:scale-95"
    >
      <img
        src={Poster !== "N/A" ? Poster : "/no-movie.png"}
        alt={Title}
        className="w-full h-[260px] object-cover rounded-md"
      />

      <h3 className="text-white mt-2 text-sm font-semibold">
        {Title}
      </h3>

      {/* ⭐ Rating */}
      {rating && (
        <p className="text-yellow-400 text-sm mt-1">
          ⭐ {rating} / 10
        </p>
      )}

      <p className="text-neutral-400 text-xs">
        {Year} • {Type}
      </p>
    </div>
  );
};

export default MovieCard;
