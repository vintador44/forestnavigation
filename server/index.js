require('dotenv').config()
const express = require('express');
const cors = require('cors');

const postgres = require('./config-db/pg-db-pool');
const router = require('./router/index');
const expressWS = require('express-ws');


const db = require('./models'); 

const PORT = process.env.PORT || 5000;
const app = express();
expressWS(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL
}));


app.set('models', db);


db.sequelize.authenticate()
  .then(() => {
    console.log('Database connection established successfully.');
 
    console.log('Database is ready (tables created via init.sql)');
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