import { ValidationError } from '../types/errors';

type ValidationRule<T, F = any> = {
  validate: (value: T, formData?: F) => boolean;
  message: string;
  severity?: 'error' | 'warning' | 'info';
};

type ValidationSchema<T> = {
  [K in keyof T]: ValidationRule<T[K], T>[];
};

interface ValidationResult {
  valid: boolean;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
  info: Record<string, string[]>;
}

type ValidationSeverity = 'error' | 'warning' | 'info';

interface ValidationFieldErrors {
  [key: string]: string[];
}

export function validateField<T, F = any>(
  value: T,
  rules: ValidationRule<T, F>[],
  formData?: F
): string[] {
  return rules
    .filter((rule: ValidationRule<T, F>) => !rule.validate(value, formData))
    .map((rule: ValidationRule<T, F>) => rule.message);
}

export function validateForm<T extends Record<string, any>>(
  data: T,
  schema: ValidationSchema<T>
): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: {},
    warnings: {},
    info: {}
  };

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    const fieldErrors = rules
      .filter((rule: ValidationRule<any, T>) => !rule.validate(value, data))
      .reduce((acc: ValidationFieldErrors, rule: ValidationRule<any, T>) => {
        const severity = rule.severity || 'error';
        if (!acc[severity]) acc[severity] = [];
        acc[severity].push(rule.message);
        return acc;
      }, {});

    if (fieldErrors.error?.length) {
      result.valid = false;
      result.errors[field] = fieldErrors.error;
    }
    if (fieldErrors.warning?.length) {
      result.warnings[field] = fieldErrors.warning;
    }
    if (fieldErrors.info?.length) {
      result.info[field] = fieldErrors.info;
    }
  }

  return result;
}

// Common validation rules
export const required = (message = 'This field is required'): ValidationRule<any> => ({
  validate: value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim().length > 0;
    return value !== null && value !== undefined;
  },
  message
});

export const minLength = (min: number, message?: string): ValidationRule<string> => ({
  validate: value => value.length >= min,
  message: message || `Must be at least ${min} characters`
});

export const maxLength = (max: number, message?: string): ValidationRule<string> => ({
  validate: value => value.length <= max,
  message: message || `Must be no more than ${max} characters`
});

export const pattern = (regex: RegExp, message: string): ValidationRule<string> => ({
  validate: value => regex.test(value),
  message
});

export const email = (message = 'Invalid email address'): ValidationRule<string> => ({
  validate: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  message
});

export const url = (message = 'Invalid URL'): ValidationRule<string> => ({
  validate: value => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  message
});

export const numeric = (message = 'Must be a number'): ValidationRule<string> => ({
  validate: value => !isNaN(Number(value)),
  message
});

export const min = (min: number, message?: string): ValidationRule<number> => ({
  validate: value => value >= min,
  message: message || `Must be at least ${min}`
});

export const max = (max: number, message?: string): ValidationRule<number> => ({
  validate: value => value <= max,
  message: message || `Must be no more than ${max}`
});

export const passwordStrength = (message?: string): ValidationRule<string> => ({
  validate: value => {
    const hasLength = value.length >= 8;
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    return hasLength && hasUpper && hasLower && hasNumber && hasSpecial;
  },
  message: message || 'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character'
});

export const matchesField = <T extends Record<string, any>>(
  field: keyof T,
  message?: string
): ValidationRule<any, T> => ({
  validate: (value, formData) => formData ? value === formData[field] : false,
  message: message || `Must match ${String(field)}`
});

// Example usage:
// const schema = {
//   email: [required(), email()],
//   password: [required(), passwordStrength()],
//   confirmPassword: [required(), matchesField('password')]
// };
//
// const result = validateForm(formData, schema);
// if (!result.valid) {
//   throw new ValidationError('Form validation failed', 'form', result.errors);
// }

// React hook for form validation
export function useFormValidation<T extends Record<string, any>>(
  schema: ValidationSchema<T>
) {
  const validateData = (data: T): ValidationResult => {
    return validateForm(data, schema);
  };

  const validateSingleField = (field: keyof T, value: T[keyof T], data?: T): string[] => {
    const rules = schema[field];
    if (!rules) return [];
    return validateField(value, rules, data);
  };

  return {
    validateData,
    validateSingleField
  };
} 