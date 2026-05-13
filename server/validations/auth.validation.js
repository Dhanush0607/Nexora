//Joi schemas -validates data before it hits the contoller
const Joi = require('joi');

//Register validtaion rules
const registerSchema = Joi.object({
    fullName:Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
        'string.min':'Full name must be at least 2 characters',
        'any.required':'Full name is required',
    }),
    email:Joi.string()
    .email()
    .required()
    .messages({
        'string.email':'Please enter a valid email address',
        'any.required': 'Email is required',
    }),
    password:Joi.string()
    .min(8)
    .required()
    .messages({
        'string.min':'Password must be at least 8 characters',
        'any.required':'Password is required',
    }),
});

//Login validation rules 
const loginSchema = Joi.object({
    email:Joi.string()
    .email()
    .required()
    .messages({
        'string.email':'Please enter a valid email',
        'any.required':'Email is required',
    }),
    password:Joi.string()
    .required()
    .messages({
        'any.required':'Password is required',
    }),
});

module.exports = {registerSchema,loginSchema};