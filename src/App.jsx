import { useState, useEffect } from "react";
import Search from "./components/Search.jsx";
import Spinner from "./components/Spinner.jsx";
import MovieCard from "./components/MovieCard.jsx";
import { updateTrending, getTrending } from "./utils/trending";

const API_KEY = import.meta.env.VITE_OMDB_API_KEY;
const API_BASE_URL = "https://www.omdbapi.com/";

const App = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [movieList, setMovieList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [trending, setTrending] = useState([]);

  const fetchMovies = async (title = "avengers") => {
    setIsLoading(true);
    setErrorMsg("");

    try {
      const endpoint = `${API_BASE_URL}?apikey=${API_KEY}&s=${title}`;
      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.Response === "False") {
        setErrorMsg(data.Error);
        setMovieList([]);
      } else {
        setMovieList(data.Search || []);

        const firstPoster =
          data.Search?.[0]?.Poster !== "N/A"
            ? data.Search[0].Poster
            : null;

        updateTrending(title, firstPoster);
        setTrending(getTrending());
      }
    } catch (error) {
      setErrorMsg("Failed to fetch movies. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies(searchTerm || "avengers");
 }, [searchTerm]);

  const topTrending = trending[0];

  return (
    <main>
      <div className="pattern" />
      <div className="wrapper">
        <header>
      <img src="/hero-img.png" alt="hero" />
          <h1>
            Find <span className="text-gradient">movies</span> you enjoy truly
          </h1>

          <Search
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />

          
          {topTrending && topTrending[1].poster && (
            <div className="mt-6 flex flex-col items-center">
              <h3 className="text-white mb-2">🔥 Trending Now</h3>
              <img
                src={topTrending[1].poster}
                alt={topTrending[0]}
                className="w-48 rounded-lg shadow-lg"
              />
              <p className="text-white mt-2 capitalize">
                #{1} {topTrending[0]} ({topTrending[1].count} searches)
              </p>
            </div>
          )}

         
          {trending.length > 0 && (
            <section className="mt-4">
              <h3 className="text-white mb-2">Trending Searches</h3>
              <ul className="flex gap-3 flex-wrap">
                {trending.map(([term, data], index) => (
                  <li
                    key={term}
                    onClick={() => setSearchTerm(term)}
                    className="cursor-pointer bg-neutral-800 px-3 py-1 rounded text-white"
                  >
                    #{index + 1} {term} ({data.count})
                  </li>
                ))}
              </ul>
            </section>
          )}
        </header>

        <section className="movie-container">
          <h2 className="mt-[40px]">All Movies</h2>

          {isLoading ? (
            <Spinner />
          ) : errorMsg ? (
            <p className="text-red-500">{errorMsg}</p>
          ) : (
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {movieList.map((movie) => (
                <MovieCard key={movie.imdbID} movie={movie} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
};

export default App;
