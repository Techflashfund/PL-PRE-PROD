const express = require('express');
const mongoose = require('mongoose');
const { mongoURI } = require('./config/db.config');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const searchRoutes = require('./routes/search.routes');
const selectRoutes = require('./routes/select.routes');
const confirmRoutes = require('./routes/confirm.routes');
const userdetailsroute = require('./routes/userdetails.routes');
const amountRoutes = require('./routes/amount.routes');
const statusRoutes = require('./routes/status.routes');
const initRoutes = require('./routes/init.routes');
const updateRoutes = require('./routes/update.routes');
const bankdetailsRoutes = require('./routes/bankdetails.routes');
const app = express();

// Middleware
app.use(express.json());

// Enable CORS for localhost:3000
app.use(cors({
    origin: 'http://localhost:3000', // Allow requests from localhost:3000
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow specific methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
}));
app.options('*', cors());
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);
app.use('/on_search', searchRoutes);
app.use('/on_select', selectRoutes);
app.use('/form', userdetailsroute);
app.use('/on_status', statusRoutes);
app.use('/on_init', initRoutes);
app.use('/amount', amountRoutes);
app.use('/submit-bank-details', bankdetailsRoutes);
app.use('/agrement', confirmRoutes);
app.use('/on_confirm', confirmRoutes);
app.use('/consent', updateRoutes);
app.use('/on_update', updateRoutes);
app.get('/api/test', (req, res) => {
    res.json({ message: 'CORS is working!' });
});

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
