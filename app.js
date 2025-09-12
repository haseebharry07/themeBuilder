require("dotenv").config();
const express = require("express");
const cors = require("cors");
const themeRoutes = require("./routes/themeRoutes");
const connectDB = require("./lib/mongo"); // 👈 import helper

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: "https://app.glitchgone.com",
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

// Start server
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
