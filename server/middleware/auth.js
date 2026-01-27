
const jwt = require('jsonwebtoken');
const ApiError = require('../exceptions/api-error');


const JWT_SECRET = process.env.JWT_ACCESS_SECRET; 

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;


  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.UnauthorizedError('Токен не предоставлен'));
  }

  const token = authHeader.split(' ')[1]; 

  try {

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; 
    next();
  } catch (err) {
    return next(ApiError.UnauthorizedError('Неверный или просроченный токен'));
  }
};

module.exports = authMiddleware;