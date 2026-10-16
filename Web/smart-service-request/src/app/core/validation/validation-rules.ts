// One place for every form rule and message.
// API: APP.Models/Validation/ValidationRules.cs must say the same.

export const VALIDATION = {
  username: { min: 3, max: 50, pattern: /^[A-Za-z0-9._-]+$/ },
  email: { max: 150, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/ },
  password: { min: 6, max: 100 },
  requestType: { max: 100 },
  description: { max: 1000 },
  comment: { max: 1000 }
} as const;

export const PASSWORD_MISMATCH_MESSAGE = 'Passwords do not match.';

// Message for each error of each field. The order is the order they are checked.
export const FIELD_MESSAGES = {
  username: {
    required: 'Username is required.',
    minlength: `Username must be at least ${VALIDATION.username.min} characters.`,
    maxlength: `Username cannot be more than ${VALIDATION.username.max} characters.`,
    pattern: 'Use letters, numbers, dot, underscore or hyphen only.'
  },
  email: {
    required: 'Email is required.',
    maxlength: `Email cannot be more than ${VALIDATION.email.max} characters.`,
    pattern: 'Enter a valid email address.'
  },
  password: {
    required: 'Password is required.',
    minlength: `Password must be at least ${VALIDATION.password.min} characters.`,
    maxlength: `Password cannot be more than ${VALIDATION.password.max} characters.`
  },
  confirmPassword: {
    required: 'Please confirm your password.'
  },
  requestType: {
    required: 'Request type is required.',
    maxlength: `Request type cannot be more than ${VALIDATION.requestType.max} characters.`
  },
  requestDescription: {
    required: 'Request description is required.',
    maxlength: `Request description cannot be more than ${VALIDATION.description.max} characters.`
  },
  priority: {
    required: 'Priority is required.'
  },
  status: {
    required: 'Status is required.'
  },
  comment: {
    required: 'Comment cannot be empty.',
    maxlength: `Comment cannot be more than ${VALIDATION.comment.max} characters.`
  }
} as const;