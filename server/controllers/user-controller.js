const userService = require('../service/user-service');
const {validationResult} = require('express-validator');
const ApiError = require('../exceptions/api-error');
const { isEmail } = require('validator');

class UserController {
	async registration(req, res, next) {
    try {
        const errors = validationResult(req);
        
        // ДОБАВЬТЕ ЭТОТ КОД ДЛЯ ДИАГНОСТИКИ:
        console.log('=== VALIDATION ERRORS ===');
        console.log('Request body:', req.body);
        console.log('Errors array:', errors.array());
        console.log('Errors isEmpty:', errors.isEmpty());
        console.log('======================');
        
        if (!errors.isEmpty()) {
            return next(ApiError.BadRequest('Ошибка при валидации', errors.array()));
        }

        const { email, password } = req.body;
        const userData = await userService.registration(email, password);
        
        return res.json(userData);
    } catch (e) {
        next(e);
    }
}
	
	 async login(req, res, next) {
        try {
            // Правильная проверка валидации
            const errors = validationResult(req);
            
            console.log('=== VALIDATION ERRORS ===');
            console.log('Errors object:', errors);
            console.log('Has errors:', !errors.isEmpty());
            console.log('Errors array:', errors.array());
            console.log('Errors array length:', errors.array().length);
            console.log('======================');
            
            // Проверяем, есть ли ошибки валидации
            if (!errors.isEmpty()) {
                // Если есть ошибки - возвращаем их
                return next(ApiError.BadRequest('Ошибка при валидации', errors.array()));
            }

            const { email, password } = req.body;
            
            console.log('Login attempt for email:', email);
            
            const userData = await userService.login(email, password, 'email');
            
            return res.json(userData);
            
        } catch (e) {
            console.error('Login error:', e);
            next(e);
        }
    }


	
	async getUsers(req, res, next) {
		try {
			const users = await userService.getAllUsers();
			return res.json(users);
		} catch (e) {
			next(e);
		}
	}

}


module.exports = new UserController();
