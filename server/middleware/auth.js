// middleware/auth.js
const jwt = require('jsonwebtoken');
const ApiError = require('../exceptions/api-error');

// Секретный ключ (временно — в продакшене используйте process.env.JWT_SECRET)
const JWT_SECRET = process.env.JWT_ACCESS_SECRET; 

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Проверяем формат заголовка: "Bearer <токен>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.UnauthorizedError('Токен не предоставлен'));
  }

  const token = authHeader.split(' ')[1]; // Извлекаем сам токен

  try {
    // Проверяем и декодируем токен
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, fio, email } — доступно в контроллерах
    next();
  } catch (err) {
    return next(ApiError.UnauthorizedError('Неверный или просроченный токен'));
  }
};

module.exports = authMiddleware;