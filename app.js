require("dotenv").config();
const express = require("express");
const cors = require("cors");
const themeRoutes = require("./routes/themeRoutes");
const connectDB = require("./lib/mongo"); // 👈 import helper

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Allowed domains
const allowedOrigins = [
    "https://app.glitchgone.com",
    "https://client1.com",
    "https://client2.com"
];

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

            return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// ✅ Initialize DB connection once
connectDB();

// Routes
app.use("/api/theme", themeRoutes);

// Default route
app.get("/", (req, res) => res.send("Hello World from Node.js!"));

// Error handler for CORS rejections
app.use((err, req, res, next) => {
    if (err.message === "Not allowed by CORS") {
        return res.status(403).json({ message: "Forbidden: Origin not allowed" });
    }
    next(err);
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
