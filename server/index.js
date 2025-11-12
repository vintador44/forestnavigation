require('dotenv').config()
const express = require('express');
const cors = require('cors');

const postgres = require('./config-db/pg-db-pool');
const router = require('./router/index');
const expressWS = require('express-ws');

// Импортируем модели
const db = require('./models'); // путь к вашему models/index.js

const PORT = process.env.PORT || 5000;
const app = express();
expressWS(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL
}));

// Регистрируем модели в приложении
app.set('models', db);

// Проверяем подключение к БД и синхронизируем модели
db.sequelize.authenticate()
  .then(() => {
    console.log('Database connection established successfully.');
    // Синхронизация моделей (опционально)
    return db.sequelize.sync(); // { force: false } - не перезаписывает таблицы
  })
  .then(() => {
    console.log('Models synchronized successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

app.use('/api', router);

const start = async () => {
    try {
        app.listen(PORT, () => console.log(`Server started on PORT = ${PORT}`))
    } catch (e) {
        console.log(e);
    }
}

start();