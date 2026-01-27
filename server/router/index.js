const Router = require('express').Router;
const authMiddleware = require('../middleware/auth');
const userController = require('../controllers/user-controller');
const elevationController = require('../controllers/elevation-controller');
const locationsController = require('../controllers/locations-controller');
const weatherController = require('../controllers/weather-controller');
const routeController = require('../controllers/route-controller.js');
const categoryController = require('../controllers/categories-controller.js');
const photoController = require('../controllers/photo-controller');

/** @type {Router} */
const router = new Router();
const { body } = require('express-validator');


router.post('/registration', [
    body('email').trim().isEmail(),
    body('password').trim().isLength({ min: 3, max: 32 }),
    body('FIO').trim().notEmpty() 
], userController.registration);

router.post('/login', [
    body('email').trim().isEmail(),
    body('password').trim().isLength({ min: 3, max: 32 })
], userController.login);


router.get('/elevation', elevationController.getElevation);


router.get('/weather', weatherController.getWeather);
router.get('/weather/forecast/range', weatherController.getForecastByDateRange);


router.get('/locations', locationsController.getLocations);
router.post('/locations', locationsController.createLocation);
router.get('/locations/:id', locationsController.getLocationById);
router.put('/locations/:id', locationsController.updateLocation);
router.delete('/locations/:id', locationsController.deleteLocation);


router.get('/categories', categoryController.getAllCategories);
router.get('/categories/:id', categoryController.getCategoryById);
router.post('/categories', categoryController.createCategory);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);


router.get('/route/elevations', routeController.getRouteElevations);


router.get('/roads', routeController.getAllRoads);
router.post('/roads/create', routeController.createRoad);
router.get('/roads/user/:userId', routeController.getRoadsByUser);
router.get('/roads/:id', routeController.getRoadById);
router.delete('/roads/:id', routeController.deleteRoad);

router.get('/user/me', authMiddleware, userController.getUserProfile);


router.post('/upload', photoController.uploadPhotos);


router.get('/photos/location/:locationId', photoController.getPhotosByLocation);

module.exports = router;