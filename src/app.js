const express = require('express');
const mongoose = require('mongoose');
const { mongoURI } = require('./config/db.config');
const authRoutes = require('./routes/auth.routes');
const searchRoutes = require('./routes/search.routes');
const userdetailsroute = require('./routes/userdetails.routes');

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

app.use('/api/search', searchRoutes);
app.use('/on_search', searchRoutes);
app.use('/form',userdetailsroute)

// Connect to MongoDB
console.log("Using MongoDB URI:", mongoURI); 
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));