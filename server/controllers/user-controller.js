const userService = require('../service/user-service');
const { validationResult } = require('express-validator');
const ApiError = require('../exceptions/api-error');

class UserController {
    async registration(req, res, next) {
        try {
            const errors = validationResult(req);
            
            if (!errors.isEmpty()) {
                return next(ApiError.BadRequest('Ошибка при валидации', errors.array()));
            }

            const { email, password, FIO } = req.body;
            
            // Проверяем обязательные поля
            if (!FIO) {
                return next(ApiError.BadRequest('ФИО является обязательным полем'));
            }

            const userData = await userService.registration(email, password, FIO);
            
            return res.json(userData);
        } catch (e) {
            next(e);
        }
    }
    
    async login(req, res, next) {
        try {
            const errors = validationResult(req);
            
            if (!errors.isEmpty()) {
                return next(ApiError.BadRequest('Ошибка при валидации', errors.array()));
            }

            const { email, password } = req.body;
            
            const userData = await userService.login(email, password, 'email');
            
            return res.json(userData);
        } catch (e) {
            next(e);
        }
    }
    
    async getUsers(req, res, next) {
        try {
            const { page, limit, search } = req.query;
            const users = await userService.getAllUsers(page, limit, search);
            return res.json(users);
        } catch (e) {
            next(e);
        }
    }

    async getUserProfile(req, res, next) {
        try {
            // Предполагается, что ID пользователя сохраняется в req.user после аутентификации
            const userId = req.user?.ID || req.user?.id;
            
            if (!userId) {
                return next(ApiError.UnauthorizedError());
            }

            const user = await userService.getUserById(userId);
            return res.json(user);
        } catch (e) {
            next(e);
        }
    }

    async updateProfile(req, res, next) {
        try {
            const errors = validationResult(req);
            
            if (!errors.isEmpty()) {
                return next(ApiError.BadRequest('Ошибка при валидации', errors.array()));
            }

            const userId = req.user?.ID || req.user?.id;
            const { FIO, email } = req.body;

            if (!userId) {
                return next(ApiError.UnauthorizedError());
            }

            const updateData = {};
            if (FIO) updateData.FIO = FIO;
            if (email) updateData.Email = email;

            const updatedUser = await userService.updateUser(userId, updateData);
            return res.json(updatedUser);
        } catch (e) {
            next(e);
        }
    }

    async changePassword(req, res, next) {
        try {
            const errors = validationResult(req);
            
            if (!errors.isEmpty()) {
                return next(ApiError.BadRequest('Ошибка при валидации', errors.array()));
            }

            const userId = req.user?.ID || req.user?.id;
            const { oldPassword, newPassword } = req.body;

            if (!userId) {
                return next(ApiError.UnauthorizedError());
            }

            const result = await userService.changePassword(userId, oldPassword, newPassword);
            return res.json(result);
        } catch (e) {
            next(e);
        }
    }

    async deleteUser(req, res, next) {
        try {
            const userId = req.user?.ID || req.user?.id;
            
            if (!userId) {
                return next(ApiError.UnauthorizedError());
            }

            // Для администраторов можно добавить возможность удалять других пользователей
            const targetUserId = req.params.id || userId;
            
            const result = await userService.deleteUser(targetUserId);
            return res.json(result);
        } catch (e) {
            next(e);
        }
    }

    async getUserById(req, res, next) {
        try {
            const userId = req.params.id;
            
            if (!userId) {
                return next(ApiError.BadRequest('ID пользователя не указан'));
            }

            const user = await userService.getUserById(userId);
            return res.json(user);
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new UserController();