import { useEffect, useState, useRef } from "react";
import Spinner from "./Spinner.jsx";

const API_KEY = import.meta.env.VITE_OMDB_API_KEY;
const API_BASE_URL = "https://www.omdbapi.com/";

// Helper to get or create a device ID
const getDeviceId = () => {
  let id = localStorage.getItem("movie_review_device_id");
  if (!id) {
    id = `dev-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
    localStorage.setItem("movie_review_device_id", id);
  }
  return id;
};

const MovieModal = ({ imdbID, onClose }) => {
  const [movieDetails, setMovieDetails] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);

  // Form State
  const [reviewerName, setReviewerName] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [hasReviewed, setHasReviewed] = useState(false);

  const modalRef = useRef(null);

  // Close modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Fetch full details and reviews
  useEffect(() => {
    if (!imdbID) return;

    setHasReviewed(false); // Reset reviewed state for the new movie

    const fetchFullDetails = async () => {
      setIsLoadingDetails(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}?apikey=${API_KEY}&i=${imdbID}&plot=full`
        );
        const data = await res.json();
        if (data.Response === "True") {
          setMovieDetails(data);
        } else {
          console.error("OMDb Error:", data.Error);
        }
      } catch (err) {
        console.error("Failed to fetch full details:", err);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    const fetchReviews = async () => {
      setIsLoadingReviews(true);
      try {
        const res = await fetch(`/api/reviews/${imdbID}`);
        if (res.ok) {
          const data = await res.json();
          setReviews(data);
          // Check if this device has already reviewed this movie
          const devId = getDeviceId();
          const alreadyReviewed = data.some((r) => r.deviceId === devId);
          setHasReviewed(alreadyReviewed);
        }
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
      } finally {
        setIsLoadingReviews(false);
      }
    };

    fetchFullDetails();
    fetchReviews();
  }, [imdbID]);

  // Handle Review Submission
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!reviewerName.trim() || !reviewText.trim()) {
      setErrorMsg("Please fill out both your name and review details.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imdbID,
          movieTitle: movieDetails?.Title || "Unknown Movie",
          reviewerName,
          rating,
          reviewText,
          deviceId: getDeviceId(),
        }),
      });

      if (response.ok) {
        const newReview = await response.json();
        setReviews((prevReviews) => [newReview, ...prevReviews]);
        setReviewerName("");
        setRating(5);
        setReviewText("");
        setHasReviewed(true);
        setSuccessMsg("Review posted successfully! Thank you.");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        const errData = await response.json();
        setErrorMsg(errData.error || "Failed to post review. Please try again.");
      }
    } catch (err) {
      setErrorMsg("Connection error. Could not post review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  const renderStars = (num) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={i < num ? "text-yellow-400" : "text-neutral-600"}
      >
        ★
      </span>
    ));
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        ref={modalRef}
        className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative shadow-2xl flex flex-col p-6 text-white"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-full p-2 border border-neutral-800 cursor-pointer transition-colors duration-200"
          aria-label="Close modal"
        >
          ✕
        </button>

        {isLoadingDetails ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Spinner />
            <p className="text-neutral-400 mt-4">Loading movie details...</p>
          </div>
        ) : movieDetails ? (
          <div className="flex flex-col gap-8">
            {/* Header Block: Title & Core Info */}
            <div className="flex flex-col md:flex-row gap-6 mt-4">
              <div className="flex-shrink-0 mx-auto md:mx-0">
                <img
                  src={
                    movieDetails.Poster !== "N/A"
                      ? movieDetails.Poster
                      : "/no-movie.png"
                  }
                  alt={movieDetails.Title}
                  className="w-[220px] h-[320px] object-cover rounded-xl border border-neutral-800 shadow-md shadow-neutral-950"
                />
              </div>

              <div className="flex-grow flex flex-col justify-between">
                <div>
                  <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#D53F8C] via-[#ED64A6] to-[#63B3ED]">
                    {movieDetails.Title}
                  </h2>
                  <div className="flex flex-wrap gap-2 items-center text-sm text-neutral-400 mt-2">
                    <span className="bg-neutral-900 px-2 py-0.5 rounded text-neutral-300 font-medium">
                      {movieDetails.Rated}
                    </span>
                    <span>•</span>
                    <span>{movieDetails.Year}</span>
                    <span>•</span>
                    <span>{movieDetails.Runtime}</span>
                    <span>•</span>
                    <span className="text-[#a78bfa]">{movieDetails.Genre}</span>
                  </div>

                  <p className="mt-4 text-neutral-300 leading-relaxed text-sm">
                    {movieDetails.Plot !== "N/A" ? movieDetails.Plot : "No plot summary available."}
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-neutral-800 pt-4 text-xs">
                  <div>
                    <span className="text-neutral-500 block">DIRECTOR</span>
                    <span className="text-neutral-300 font-semibold">{movieDetails.Director}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">WRITER</span>
                    <span className="text-neutral-300 font-semibold">{movieDetails.Writer}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">IMDB RATING</span>
                    <span className="text-yellow-400 font-bold text-sm">⭐ {movieDetails.imdbRating} / 10</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cast & Awards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-neutral-900/40 p-4 rounded-xl border border-neutral-800/60 text-xs">
              <div>
                <span className="text-neutral-500 block mb-1">STARRING</span>
                <span className="text-neutral-300 font-medium leading-relaxed">{movieDetails.Actors}</span>
              </div>
              <div>
                <span className="text-neutral-500 block mb-1">AWARDS & ACCOLADES</span>
                <span className="text-neutral-300 font-medium leading-relaxed">{movieDetails.Awards}</span>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="border-t border-neutral-800 pt-6">
              <h3 className="text-xl font-bold mb-4 text-[#a78bfa] flex items-center gap-2">
                💬 User Reviews
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Reviews List */}
                <div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto pr-2">
                  {isLoadingReviews ? (
                    <div className="flex items-center gap-2 text-neutral-500 text-sm">
                      <div className="w-4 h-4 border-2 border-t-transparent border-[#a78bfa] rounded-full animate-spin"></div>
                      Loading reviews...
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="bg-neutral-900/20 border border-dashed border-neutral-800/80 rounded-xl p-6 text-center text-neutral-500 text-sm">
                      No reviews yet. Be the first to share your thoughts!
                    </div>
                  ) : (
                    reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="bg-neutral-900/50 border border-neutral-800/60 p-4 rounded-xl flex flex-col gap-2 shadow-inner"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="font-semibold text-neutral-200 text-sm">
                              {rev.reviewerName}
                            </span>
                            <span className="text-neutral-500 text-[10px] block">
                              {new Date(rev.createdAt).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          <div className="flex gap-0.5 text-xs">
                            {renderStars(rev.rating)}
                          </div>
                        </div>
                        <p className="text-neutral-300 text-xs whitespace-pre-wrap leading-relaxed mt-1">
                          {rev.reviewText}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Write Review Form */}
                {hasReviewed ? (
                  <div className="bg-neutral-900/40 border border-neutral-800/80 p-6 rounded-xl flex flex-col items-center justify-center text-center gap-4">
                    <div className="w-12 h-12 bg-neutral-950 border border-neutral-800 rounded-full flex items-center justify-center text-xl text-yellow-400 shadow-inner">
                      ★
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-200">You've reviewed this movie</h4>
                      <p className="text-neutral-400 text-xs mt-2 leading-relaxed max-w-xs">
                        Thank you! You have already submitted a review for this movie from this device.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmitReview}
                    className="bg-neutral-900/40 border border-neutral-800/80 p-4 rounded-xl flex flex-col gap-3"
                  >
                    <h4 className="text-sm font-bold text-neutral-200">Share your thoughts</h4>

                    {errorMsg && (
                      <div className="bg-red-950/40 border border-red-900/80 text-red-400 p-2 rounded text-xs">
                        {errorMsg}
                      </div>
                    )}

                    {successMsg && (
                      <div className="bg-emerald-950/40 border border-emerald-900/80 text-emerald-400 p-2 rounded text-xs">
                        {successMsg}
                      </div>
                    )}

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                        Your Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Jane Doe"
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        className="bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#a78bfa] transition-colors"
                        disabled={isSubmitting}
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                        Rating
                      </label>
                      {/* Interactive Star Selector */}
                      <div className="flex gap-2 items-center">
                        <div className="flex gap-1 cursor-pointer text-lg">
                          {Array.from({ length: 5 }, (_, i) => (
                            <span
                              key={i}
                              onClick={() => setRating(i + 1)}
                              className={i < rating ? "text-yellow-400" : "text-neutral-600 hover:text-neutral-500"}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-neutral-400 font-medium">({rating}/5 stars)</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                        Review
                      </label>
                      <textarea
                        placeholder="What did you think of this movie? What did you like or dislike?"
                        rows={3}
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        className="bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#a78bfa] resize-none transition-colors"
                        disabled={isSubmitting}
                        required
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="bg-[#a78bfa] hover:bg-[#8b5cf6] text-neutral-950 hover:text-white font-bold text-xs py-2 px-4 rounded cursor-pointer transition-all duration-200 disabled:opacity-50 mt-1 flex items-center justify-center gap-2 shadow"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-t-transparent border-neutral-950 rounded-full animate-spin"></div>
                          Posting Review...
                        </>
                      ) : (
                        "Post Review"
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
            Movie details could not be loaded. Please close and try again.
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieModal;
