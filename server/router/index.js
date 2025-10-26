const Router = require('express').Router;
const userController = require('../controllers/user-controller');
const elevationController = require('../controllers/elevation-controller');

/** @type {Router} */
const router = new Router();
const {body, param, query} = require('express-validator');


// пользователи
router.post('/registration', [
    body('email').trim().isEmail(),
    body('password').trim().isLength({min: 3, max: 32})
], userController.registration);
router.post('/login', [
    body('email').trim().isEmail(),
    body('password').trim().isLength({min: 3, max: 32})
], userController.login);
router.get('/elevation', elevationController.getElevation);

module.exports = router