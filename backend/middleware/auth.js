const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    console.log('Processing token:', token ? 'Token exists' : 'No token');
    
    if (!token) {
      throw new Error('No token provided');
    }

    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.log('Token being verified:', token);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    
    // Handle both id and userId for backwards compatibility
    const userId = decoded.userId || decoded.id;
    
    if (!userId) {
      throw new Error('No user ID in token');
    }

    req.user = {
      userId: userId,
      _id: userId
    };
    
    console.log('Set user:', req.user);
    next();
  } catch (error) {
    console.error('Auth middleware error:', {
      error: error.message,
      headers: req.headers.authorization,
      jwtSecretExists: !!process.env.JWT_SECRET
    });
    res.status(401).json({ message: 'Auth failed', error: error.message });
  }
};
