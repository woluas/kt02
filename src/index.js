const express = require('express');
const config = require('./config');
const logger = require('./middleware/logger');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const productsRouter = require('./routes/products');

const app = express();

app.use(logger);                                   
app.use(express.json());                           
app.use('/uploads', express.static(config.uploadsRoot)); 
app.use('/api/products', productsRouter);          
app.use(notFound);                                 
app.use(errorHandler);                             

app.listen(config.port, () => {
    console.log(`Сервер запущен: http://localhost:${config.port}`);
});