/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Аутентификация и авторизация
 *   - name: Users
 *     description: Операции с пользователями
 *   - name: Projects
 *     description: Управление проектами
 *   - name: Tasks
 *     description: Управление задачами
 */

/**
 * @swagger
 * /api/registration:
 *   post:
 *     tags: [Auth]
 *     summary: Регистрация пользователя
 *     description: Создание нового пользователя
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 32
 *                 example: "user123"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 32
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Пользователь успешно зарегистрирован
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *       400:
 *         description: Ошибка валидации или пользователь уже существует
 */

/**
 * @swagger
 * /api/login:
 *   post:
 *     tags: [Auth]
 *     summary: Вход в систему
 *     description: Аутентификация пользователя и получение токенов
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - login
 *               - password
 *             properties:
 *               login:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 32
 *                 example: "user123"
 *               password:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 32
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Успешная аутентификация
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *       401:
 *         description: Неверные учетные данные
 */

/**
 * @swagger
 * /api/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Выход из системы
 *     description: Инвалидация refresh токена пользователя
 *     responses:
 *       200:
 *         description: Успешный выход
 *       401:
 *         description: Не авторизован
 */

/**
 * @swagger
 * /api/activate/{link}:
 *   get:
 *     tags: [Auth]
 *     summary: Активация аккаунта
 *     description: Активация аккаунта пользователя по ссылке
 *     parameters:
 *       - name: link
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Перенаправление после активации
 *       400:
 *         description: Неверная ссылка активации
 */

/**
 * @swagger
 * /api/refresh:
 *   get:
 *     tags: [Auth]
 *     summary: Обновление токенов
 *     description: Получение нового access токена с помощью refresh токена
 *     responses:
 *       200:
 *         description: Токены обновлены
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *       401:
 *         description: Неверный refresh токен
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: Получить всех пользователей
 *     description: Возвращает список всех пользователей (требуется аутентификация)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список пользователей
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   username:
 *                     type: string
 *                   email:
 *                     type: string
 *       401:
 *         description: Не авторизован
 */

/**
 * @swagger
 * /api/projects/user/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Получить проекты пользователя
 *     description: Возвращает все проекты указанного пользователя
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Список проектов пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   user_id:
 *                     type: integer
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       404:
 *         description: Пользователь не найден
 */

/**
 * @swagger
 * /api/projects/user/create:
 *   post:
 *     tags: [Projects]
 *     summary: Создать проект
 *     description: Создает новый проект для пользователя
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - user_id
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               user_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Проект создан
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 user_id:
 *                   type: integer
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Ошибка валидации
 */

/**
 * @swagger
 * /api/projects/task/{project_id}:
 *   get:
 *     tags: [Tasks]
 *     summary: Получить задачи проекта
 *     description: Возвращает все задачи указанного проекта
 *     parameters:
 *       - name: project_id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Список задач проекта
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   project_id:
 *                     type: integer
 *                   user_id:
 *                     type: integer
 *                   status_id:
 *                     type: integer
 *                   date:
 *                     type: string
 *                     format: date-time
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       404:
 *         description: Проект не найден
 */

/**
 * @swagger
 * /api/projects/task/create_task:
 *   post:
 *     tags: [Tasks]
 *     summary: Создать задачу
 *     description: Создает новую задачу в проекте
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - project_id
 *               - user_id
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               project_id:
 *                 type: integer
 *               user_id:
 *                 type: integer
 *               status_id:
 *                 type: integer
 *               date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Задача создана
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 project_id:
 *                   type: integer
 *                 user_id:
 *                   type: integer
 *                 status_id:
 *                   type: integer
 *                 date:
 *                   type: string
 *                   format: date-time
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Ошибка валидации
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Your API Title',
      version: '1.0.0',
      description: 'A description of your API',
    },
    servers: [
      {
        url: 'http://localhost:5000', 
      },
    ],
  },
  apis: [__filename], 
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;