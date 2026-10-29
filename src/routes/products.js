const fs = require('fs');
const path = require('path');
const express = require('express');
const Joi = require('joi');

const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const config = require('../config');

const router = express.Router();

let products = [];
let nextId = 1;

const CATEGORIES = ['electronics', 'clothing', 'food', 'other'];

const productFields = {
    name: Joi.string().min(2).max(100),
    price: Joi.number().greater(0),
    category: Joi.string().valid(...CATEGORIES),
    stock: Joi.number().integer().min(0),
    description: Joi.string().max(500).allow(''),
};

const createSchema = Joi.object({
    name: productFields.name.required(),
    price: productFields.price.required(),
    category: productFields.category.required(),
    stock: productFields.stock.default(0),
    description: productFields.description,
});

const replaceSchema = createSchema; 

const patchSchema = Joi.object({
    name: productFields.name,
    price: productFields.price,
    category: productFields.category,
    stock: productFields.stock,
    description: productFields.description,
}).min(1); 

const idSchema = Joi.object({
    id: Joi.number().integer().positive().required(),
});

const listQuerySchema = Joi.object({
    category: Joi.string().valid(...CATEGORIES),
    minPrice: Joi.number().min(0),
    maxPrice: Joi.number().min(0),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
}).custom((value, helpers) => {
        if (value.minPrice !== undefined && value.maxPrice !== undefined && value.minPrice > value.maxPrice) {
        return helpers.message('minPrice не может быть больше maxPrice');
    }
    return value;
});

const validateId = validate(idSchema, 'params');

function findProduct(req, res, next) {
    const product = products.find((p) => p.id === req.validated.params.id);
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    req.product = product;
    next();
}

function removeImageFile(imageUrl) {
    if (!imageUrl) return;
    const file = path.join(config.productsUploadDir, path.basename(imageUrl));
    fs.unlink(file, () => {});
}

router.get('/', validate(listQuerySchema, 'query'), (req, res) => {
    const { category, minPrice, maxPrice, page, limit } = req.validated.query;

    let result = products;
    if (category) result = result.filter((p) => p.category === category);
    if (minPrice !== undefined) result = result.filter((p) => p.price >= minPrice);
    if (maxPrice !== undefined) result = result.filter((p) => p.price <= maxPrice);

    const total = result.length;
    const start = (page - 1) * limit;

    res.json({ data: result.slice(start, start + limit), total, page, limit });
});

router.get('/:id', validateId, findProduct, (req, res) => {
    res.json(req.product);
});

router.post('/', validate(createSchema), (req, res) => {
    const product = {
        id: nextId++,
        ...req.validated.body,
        createdAt: new Date().toISOString(),
    };
    products.push(product);
    res.status(201).location(`/api/products/${product.id}`).json(product);
});

router.put('/:id', validateId, findProduct, validate(replaceSchema), (req, res) => {
    const { id, createdAt, imageUrl } = req.product;
    const updated = { id, ...req.validated.body, createdAt };
    if (imageUrl) updated.imageUrl = imageUrl;

    products[products.indexOf(req.product)] = updated;
    res.json(updated);
});

router.patch('/:id', validateId, findProduct, validate(patchSchema), (req, res) => {
    Object.assign(req.product, req.validated.body);
    res.json(req.product);
});

router.delete('/:id', validateId, findProduct, (req, res) => {
    removeImageFile(req.product.imageUrl);
    products = products.filter((p) => p !== req.product);
    res.status(204).send();
});

router.post('/:id/image', validateId, findProduct, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            error: 'Validation error',
            details: [{ field: 'image', message: 'Файл не передан (поле "image")' }],
        });
    }

    removeImageFile(req.product.imageUrl);
    req.product.imageUrl = `/uploads/products/${req.file.filename}`;
    res.json(req.product);
});

module.exports = router;

