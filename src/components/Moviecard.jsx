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
      className="movie-card bg-neutral-900/60 border border-neutral-800/40 rounded-2xl p-3 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/10 active:scale-95 group relative flex flex-col gap-2"
    >
      <div className="relative overflow-hidden rounded-xl h-[260px] w-full">
        <img
          src={Poster !== "N/A" ? Poster : "/no-movie.png"}
          alt={Title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* ⭐ Rating Badge */}
        {rating && (
          <div className="absolute top-2 left-2 bg-neutral-950/80 backdrop-blur-md text-[10px] font-bold px-2 py-0.5 rounded-lg border border-neutral-800/80 flex items-center gap-1 shadow-md shadow-neutral-950/50">
            <span className={`w-1.5 h-1.5 rounded-full ${
              parseFloat(rating) >= 7.5 ? 'bg-emerald-500 animate-pulse' :
              parseFloat(rating) >= 6.0 ? 'bg-amber-500' : 'bg-rose-500'
            }`}></span>
            <span className="text-neutral-200">{rating}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-0.5 px-1 pb-1">
        <h3 className="text-white mt-1 text-sm font-semibold truncate group-hover:text-[#a78bfa] transition-colors duration-200">
          {Title}
        </h3>

        <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-1">
          <span>{Year}</span>
          <span className="bg-neutral-800/60 px-1.5 py-0.5 rounded uppercase tracking-wider text-[9px] font-medium border border-neutral-800/60 text-neutral-300">
            {Type}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
