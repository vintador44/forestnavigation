const { User } = require('../models');
const bcrypt = require('bcrypt');
const ApiError = require('../exceptions/api-error'); 
const UserDto = require('../dtos/user-dto');
const { Op } = require('sequelize');

class UserService {
    async registration(email, password, FIO) {
        // Проверяем обязательные поля
        if (!email || !password || !FIO) {
            throw ApiError.BadRequest('Все поля (email, password, FIO) обязательны для заполнения');
        }

        // Проверяем существование пользователя
        const existingUser = await User.findOne({ where: { Email: email } });
        if (existingUser) {
            throw ApiError.BadRequest(`Пользователь с email ${email} уже существует`);
        }

        // Хешируем пароль
        const hashPassword = await bcrypt.hash(password, 3);
       
        // Создаем пользователя
        const user = await User.create({
            Email: email,
            Password: hashPassword, // Используем поле Password вместо password_hash
            FIO: FIO
        });

        const userDto = new UserDto(user);
        
        return { user: userDto };
    }
    
    async login(authArg, password, by = 'email') {
        let user;
        
        // Ищем пользователя по email
        if (by === 'email') {
            user = await User.findOne({ where: { Email: authArg } });
        } else {
            throw ApiError.BadRequest('Неподдерживаемый метод авторизации');
        }
        
        // Если пользователь не найден - ошибка
        if (!user) {
            throw ApiError.BadRequest('Пользователь не найден');
        }
        
        // Проверяем пароль
        const isPassEquals = await bcrypt.compare(password, user.Password);
        if (!isPassEquals) {
            throw ApiError.BadRequest('Неверный пароль');
        }
        
        const userDto = new UserDto(user);
        
        return { user: userDto };
    }

    async getUserById(id) {
        const user = await User.findByPk(id);
        if (!user) {
            throw ApiError.BadRequest('Пользователь не найден');
        }
        return user;
    }

    async getUserByEmail(email) {
        const user = await User.findOne({ where: { Email: email } });
        if (!user) {
            throw ApiError.BadRequest('Пользователь не найден');
        }
        return user;
    }

    async updateUser(id, updateData) {
        const user = await User.findByPk(id);
        if (!user) {
            throw ApiError.BadRequest('Пользователь не найден');
        }

        // Если обновляется пароль - хешируем его
        if (updateData.password) {
            updateData.Password = await bcrypt.hash(updateData.password, 3);
            delete updateData.password;
        }

        await user.update(updateData);
        return user;
    }

    async deleteUser(id) {
        const user = await User.findByPk(id);
        if (!user) {
            throw ApiError.BadRequest('Пользователь не найден');
        }

        await user.destroy();
        return { message: 'Пользователь успешно удален' };
    }

    async getAllUsers(page = 1, limit = 10, search = '') {
        const offset = (page - 1) * limit;
        
        const whereCondition = {};
        if (search) {
            whereCondition[Op.or] = [
                { FIO: { [Op.iLike]: `%${search}%` } },
                { Email: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const { count, rows } = await User.findAndCountAll({
            where: whereCondition,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['ID', 'ASC']],
            attributes: { exclude: ['Password'] } 
        });

        return {
            users: rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalUsers: count,
                usersPerPage: parseInt(limit)
            }
        };
    }

    async changePassword(userId, oldPassword, newPassword) {
        const user = await User.findByPk(userId);
        if (!user) {
            throw ApiError.BadRequest('Пользователь не найден');
        }

        // Проверяем старый пароль
        const isOldPassValid = await bcrypt.compare(oldPassword, user.Password);
        if (!isOldPassValid) {
            throw ApiError.BadRequest('Неверный текущий пароль');
        }

        // Хешируем и сохраняем новый пароль
        const newHashPassword = await bcrypt.hash(newPassword, 3);
        await user.update({ Password: newHashPassword });

        return { message: 'Пароль успешно изменен' };
    }

    async validateUserCredentials(email, password) {
        const user = await User.findOne({ where: { Email: email } });
        if (!user) {
            return false;
        }

        const isPassValid = await bcrypt.compare(password, user.Password);
        return isPassValid ? user : false;
    }
}

module.exports = new UserService();