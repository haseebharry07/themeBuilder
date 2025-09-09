const express = require('express');
const mongoose = require('mongoose');
const themeRoutes = require('./routes/themeRoutes');
const cors = require('cors');   // ✅ import cors


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: "https://app.glitchgone.com",   // allow only your frontend
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
// Middleware
app.use(express.json());

// Connect MongoDB
mongoose.connect('mongodb+srv://haseebharry07_db_user:T7QYyyI0OVVPz5Dw@cluster0.ofu0pz0.mongodb.net/themeBuilderDB?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error:', err));

// Routes
app.use('/api/theme', themeRoutes); // <-- Theme APIs

// Default route
app.get('/', (req, res) => res.send('Hello World from Node.js!'));

// Start server
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
