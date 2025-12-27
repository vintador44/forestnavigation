// exceptions/api-error.js
class ApiError extends Error {
  constructor(status, message, errors = []) {
    super(message);
    this.status = status;
    this.errors = errors;
  }

  static BadRequest(message, errors = []) {
    return new ApiError(400, message, errors);
  }

  static UnauthorizedError(message = 'Пользователь не авторизован') {
    return new ApiError(401, message);
  }

  static ForbiddenError(message = 'Доступ запрещён') {
    return new ApiError(403, message);
  }

  static NotFoundError(message = 'Ресурс не найден') {
    return new ApiError(404, message);
  }
}

module.exports = ApiError;