const validateSearch = (req, res, next) => {
    const { userId } = req.body;
    
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }

    next();
};

module.exports = validateSearch;