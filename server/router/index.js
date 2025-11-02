const Router = require('express').Router;
const userController = require('../controllers/user-controller');
const elevationController = require('../controllers/elevation-controller');

/** @type {Router} */
const router = new Router();
const { body } = require('express-validator');

// Пользователи
router.post('/registration', [
    body('email').trim().isEmail(),
    body('password').trim().isLength({ min: 3, max: 32 }),
    body('FIO').trim().notEmpty() // Добавляем обязательное поле FIO
], userController.registration);

router.post('/login', [
    body('email').trim().isEmail(),
    body('password').trim().isLength({ min: 3, max: 32 })
], userController.login);

router.get('/elevation', elevationController.getElevation);



module.exports = router;