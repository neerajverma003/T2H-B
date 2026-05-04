import { body } from 'express-validator';

// Plan Your Journey Validator
export const planYourJourneyValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('destination').trim().notEmpty().withMessage('Destination is required'),
];

// Contact Validator
export const contactValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
];

// Subscribe Validator
export const subscribeValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
];

// Suggestion/Complain Validator
export const suggestionComplainValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
];

// Plan Your Trip Validator
export const planYourTripValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone_no').trim().notEmpty().withMessage('Phone number is required'),
  body('from').trim().optional(),
  body('to').trim().optional(),
  body('NumberodDays').optional().isInt({ min: 0 }).withMessage('Days must be a positive number'),
  body('adults').optional().isInt({ min: 0 }).withMessage('Adults must be a positive number'),
  body('kids').optional().isInt({ min: 0 }).withMessage('Kids must be a positive number'),
  body('budget').optional().isInt({ min: 0 }).withMessage('Budget must be a positive number'),
  body('purpose').trim().optional(),
  body('consultation').optional().isBoolean().withMessage('Consultation must be a boolean'),
];
