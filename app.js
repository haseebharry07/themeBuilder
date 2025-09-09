// app.js
const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://haseebharry07_db_user:T7QYyyI0OVVPz5Dw@cluster0.mongodb.net/themeBuilderDB?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));
