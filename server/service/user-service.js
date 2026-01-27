const { User } = require('../models');
const bcrypt = require('bcryptjs'); 
const ApiError = require('../exceptions/api-error'); 
const UserDto = require('../dtos/user-dto');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_ACCESS_SECRET;

class UserService {
    async registration(email, password, FIO) {
        if (!email || !password || !FIO) {
            throw ApiError.BadRequest('Все поля (email, password, FIO) обязательны для заполнения');
        }

        const existingUser = await User.findOne({ where: { Email: email } });
        if (existingUser) {
            throw ApiError.BadRequest(`Пользователь с email ${email} уже существует`);
        }

        const hashPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            Email: email,
            Password: hashPassword,
            FIO: FIO
        });

        const userDto = new UserDto(user);

        const token = jwt.sign(
            { id: user.ID, fio: user.FIO, email: user.Email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return { 
            success: true,
            token,
            user: userDto 
        };
    }

    async login(authArg, password, by = 'email') {
        let user;
        if (by === 'email') {
            user = await User.findOne({ where: { Email: authArg } });
        } else {
            throw ApiError.BadRequest('Неподдерживаемый метод авторизации');
        }

        if (!user) {
            throw ApiError.BadRequest('Пользователь не найден');
        }

        const isPassEquals = await bcrypt.compare(password, user.Password);
        if (!isPassEquals) {
            throw ApiError.BadRequest('Неверный пароль');
        }

        const userDto = new UserDto(user);

        const token = jwt.sign(
            { id: user.ID, fio: user.FIO, email: user.Email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return { 
            success: true,
            token,
            user: userDto 
        };
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

        if (updateData.password) {
            updateData.Password = await bcrypt.hash(updateData.password, 10); // Исправил с 3 на 10
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

        const isOldPassValid = await bcrypt.compare(oldPassword, user.Password);
        if (!isOldPassValid) {
            throw ApiError.BadRequest('Неверный текущий пароль');
        }

        const newHashPassword = await bcrypt.hash(newPassword, 10); // Исправил с 3 на 10
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