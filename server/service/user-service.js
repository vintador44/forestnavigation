const { User } = require('../models');
const bcrypt = require('bcrypt');
const ApiError = require('../exceptions/api-error'); 

const UserDto = require('../dtos/user-dto');
const { Op } = require('sequelize');

class UserService {
    async registration(email, password) {
        if (await User.findOne({ where: { email }, select: null })) throw ApiError.BadRequest(`Пользователь уже существует`);
 
         const hashPassword = await bcrypt.hash(password, 3);
       
        const user = await User.create({
            email,
            password_hash: hashPassword,
           
        });
        const userDto = new UserDto(user);
        
        return {user: userDto };
       
    }
    
     async login(authArg, password, by) {
        let user;
        
        // Ищем пользователя по email
        if (by === 'email') {
            user = await User.findOne({ where: { email: authArg } });
        }
        
        // Если пользователь не найден - ошибка
        if (!user) {
            throw ApiError.BadRequest('Пользователь не найден');
        }
        
        // Проверяем пароль
        const isPassEquals = await bcrypt.compare(password, user.password_hash);
        if (!isPassEquals) {
            throw ApiError.BadRequest('Неверный пароль');
        }
        
        const userDto = new UserDto(user);
        
        return { user: userDto }; // Только данные пользователя, без токена
    }

    async getAllUsers() {
        const users = await User.findAll();
        return users;
    }
}

module.exports = new UserService();
