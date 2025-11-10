const Router = require('express').Router;
const userController = require('../controllers/user-controller');
const elevationController = require('../controllers/elevation-controller');
const locationsController = require('../controllers/locations-controller');
const weatherController = require('../controllers/weather-controller');
const routeController = require('../controllers/route-сontroller'); 

/** @type {Router} */
const router = new Router();
const { body } = require('express-validator');

// Пользователи
router.post('/registration', [
    body('email').trim().isEmail(),
    body('password').trim().isLength({ min: 3, max: 32 }),
    body('FIO').trim().notEmpty() 
], userController.registration);

router.post('/login', [
    body('email').trim().isEmail(),
    body('password').trim().isLength({ min: 3, max: 32 })
], userController.login);

// Высота
router.get('/elevation', elevationController.getElevation);

// Погода
router.get('/weather', weatherController.getWeather);
router.get('/weather/forecast/range', weatherController.getForecastByDateRange);

// Локации
router.get('/locations', locationsController.getLocations);

// Маршруты - разбиение на сегменты с высотами, статистикой и прогнозом погоды по времени
router.get('/route/elevations', routeController.getRouteElevations);

// Используйте routeController вместо roadController - все методы в одном классе
router.post('/roads/create', routeController.createRoad);
router.get('/roads/user/:userId', routeController.getRoadsByUser);
router.get('/roads/:id', routeController.getRoadById);
router.delete('/roads/:id', routeController.deleteRoad);

module.exports = router;