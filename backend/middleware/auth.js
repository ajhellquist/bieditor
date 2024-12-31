const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    console.log('Processing token:', token ? 'Token exists' : 'No token');
    
    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    
    // Preserve the original decoded structure and add _id for metrics
    req.user = {
      ...decoded,      // Keep all original decoded data
      _id: decoded.id  // Add _id for metrics
    };
    
    console.log('Set user:', req.user);
    next();
  } catch (error) {
    console.error('Auth middleware error:', {
      error: error.message,
      headers: req.headers.authorization
    });
    res.status(401).json({ message: 'Auth failed', error: error.message });
  }
};
