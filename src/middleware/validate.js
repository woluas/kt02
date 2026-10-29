function validate(schema, source = 'body') {
    return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
    });

    if (error) {
        return res.status(400).json({
        error: 'Validation error',
        details: error.details.map((d) => ({
            field: d.path.join('.'),
            message: d.message,
        })),
        });
    }

    req.validated = req.validated || {};
    req.validated[source] = value;
    next();
    };
}

module.exports = validate;