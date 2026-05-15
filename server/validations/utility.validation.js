// validations/utility.validation.js
// Validates utility form data before encryption

const Joi = require('joi');

// ── Knock Knock Validation ───────────────────────────────────
const knockKnockSchema = Joi.object({
  sessionLabel: Joi.string()
    .min(1)
    .max(50)
    .default('My Door')
    .messages({
      'string.max': 'Session label must be under 50 characters',
    }),

  sessionDuration: Joi.string()
    .valid('5', '10', '15', '30', '60')
    .default('10')
    .messages({
      'any.only': 'Duration must be 5, 10, 15, 30, or 60 minutes',
    }),
});

// ── Emergency Validation ─────────────────────────────────────
const emergencySchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min':  'Name must be at least 2 characters',
      'any.required': 'Name is required for emergency utility',
    }),

  age: Joi.string()
    .pattern(/^\d{1,3}$/)
    .required()
    .messages({
      'string.pattern.base': 'Age must be a valid number',
      'any.required':         'Age is required',
    }),

  bloodGroup: Joi.string()
    .valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
    .required()
    .messages({
      'any.only':    'Blood group must be a valid type (A+, B-, etc.)',
      'any.required': 'Blood group is required',
    }),

  emergencyContact: Joi.string()
    .pattern(/^[0-9+\-\s]{8,15}$/)
    .required()
    .messages({
      'string.pattern.base': 'Emergency contact must be a valid phone number',
      'any.required':         'Emergency contact is required',
    }),

  medicalNotes: Joi.string()
    .max(500)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Medical notes must be under 500 characters',
    }),
});

// ── Smart Parking Validation ─────────────────────────────────
const smartParkingSchema = Joi.object({
  vehicleNumber: Joi.string()
    .min(2)
    .max(20)
    .required()
    .messages({
      'any.required': 'Vehicle number is required',
      'string.max':   'Vehicle number too long',
    }),

  ownerContact: Joi.string()
    .pattern(/^[0-9+\-\s]{8,15}$/)
    .required()
    .messages({
      'string.pattern.base': 'Owner contact must be a valid phone number',
      'any.required':         'Owner contact is required',
    }),

  parkingArea: Joi.string()
    .max(100)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Parking area must be under 100 characters',
    }),
});

// ── Main Utility Submit Validation ───────────────────────────
const utilitySubmitSchema = Joi.object({
  selectedUtilities: Joi.array()
    .items(Joi.string().valid('knockKnock', 'emergency', 'smartParking'))
    .min(1)
    .required()
    .messages({
      'array.min':   'Please select at least one utility',
      'any.required': 'Please select at least one utility',
    }),

  knockKnock:  Joi.when('selectedUtilities', {
    is:        Joi.array().has('knockKnock'),
    then:      knockKnockSchema.optional(),
    otherwise: Joi.optional(),
  }),

  emergency:   Joi.when('selectedUtilities', {
    is:        Joi.array().has('emergency'),
    then:      emergencySchema.required(),
    otherwise: Joi.optional(),
  }),

  smartParking: Joi.when('selectedUtilities', {
    is:        Joi.array().has('smartParking'),
    then:      smartParkingSchema.required(),
    otherwise: Joi.optional(),
  }),
});

module.exports = {
  utilitySubmitSchema,
  emergencySchema,
  smartParkingSchema,
  knockKnockSchema,
};