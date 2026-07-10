import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 5000;

// Resolve path to data file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE_PATH = path.join(__dirname, "data", "reviews.json");

// Middleware
app.use(express.json());

// Helper function to read reviews
const readReviews = () => {
  try {
    if (!fs.existsSync(DATA_FILE_PATH)) {
      // Create directories and file if not exist
      fs.mkdirSync(path.dirname(DATA_FILE_PATH), { recursive: true });
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(DATA_FILE_PATH, "utf8");
    return JSON.parse(data || "[]");
  } catch (error) {
    console.error("Error reading reviews file:", error);
    return [];
  }
};

// Helper function to write reviews
const writeReviews = (reviews) => {
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(reviews, null, 2), "utf8");
  } catch (error) {
    console.error("Error writing reviews file:", error);
  }
};

// API: Get reviews for a specific movie
app.get("/api/reviews/:imdbID", (req, res) => {
  const { imdbID } = req.params;
  if (!imdbID) {
    return res.status(400).json({ error: "imdbID is required" });
  }

  const reviews = readReviews();
  const movieReviews = reviews.filter((r) => r.imdbID === imdbID);
  res.json(movieReviews);
});

// API: Add a review for a movie
app.post("/api/reviews", (req, res) => {
  const { imdbID, movieTitle, reviewerName, rating, reviewText, deviceId } = req.body;

  // Validation
  if (!imdbID || !reviewerName || !rating || !reviewText || !deviceId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const ratingNum = Number(rating);
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: "Rating must be a number between 1 and 5" });
  }

  const reviews = readReviews();

  // Check if a review already exists for this movie from this device
  const alreadyReviewed = reviews.some(
    (r) => r.imdbID === imdbID && r.deviceId === deviceId
  );
  if (alreadyReviewed) {
    return res.status(400).json({
      error: "You have already submitted a review for this movie from this device.",
    });
  }

  const newReview = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    imdbID,
    movieTitle: movieTitle || "Unknown Movie",
    reviewerName: reviewerName.trim(),
    rating: ratingNum,
    reviewText: reviewText.trim(),
    deviceId: deviceId.trim(),
    createdAt: new Date().toISOString(),
  };

  reviews.push(newReview);
  writeReviews(reviews);

  res.status(201).json(newReview);
});

// Serve static files from the React frontend build
const DIST_PATH = path.join(__dirname, "..", "dist");
app.use(express.static(DIST_PATH));

// Fallback to index.html for SPA support
app.get("(.*)", (req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "API route not found" });
  }
  const indexPath = path.join(DIST_PATH, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Frontend build not found. Run 'npm run build' to compile.");
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
