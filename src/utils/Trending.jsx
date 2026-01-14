// utils/trending.js

export const updateTrending = (term, poster) => {
  if (!term) return;

  const trending =
    JSON.parse(localStorage.getItem("trendingSearches")) || {};

  const key = term.toLowerCase();

  if (!trending[key]) {
    trending[key] = {
      count: 1,
      poster: poster || null,
    };
  } else {
    trending[key].count += 1;

    if (!trending[key].poster && poster) {
      trending[key].poster = poster;
    }
  }

  localStorage.setItem(
    "trendingSearches",
    JSON.stringify(trending)
  );
};

export const getTrending = () => {
  const trending =
    JSON.parse(localStorage.getItem("trendingSearches")) || {};

  return Object.entries(trending)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);
};

