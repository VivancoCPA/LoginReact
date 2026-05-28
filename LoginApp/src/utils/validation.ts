/**
 * Helper utilities for form validation.
 */

/**
 * Validates whether a string is in a proper email format.
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates a password according to strict enterprise complexity rules:
 * - Minimum 8 characters long
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one numeric digit (0-9)
 * - At least one special character (@$!%*?& or standard symbols)
 */
export const validatePasswordStrength = (password: string): boolean => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#.\-_+=[\]{}()|:;'"<>,?~`/\\])[A-Za-z\d@$!%*?&#.\-_+=[\]{}()|:;'"<>,?~`/\\]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Validates password and returns specific error messages describing which rule is violated.
 */
export const getPasswordValidationMessage = (password: string): string | null => {
  if (password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }
  if (!/[A-Z]/.test(password)) {
    return "La contraseña debe incluir al menos una letra mayúscula.";
  }
  if (!/[a-z]/.test(password)) {
    return "La contraseña debe incluir al menos una letra minúscula.";
  }
  if (!/\d/.test(password)) {
    return "La contraseña debe incluir al menos un número (dígito).";
  }
  if (!/[@$!%*?&#.\-_+=[\]{}()|:;'"<>,?~`/\\]/.test(password)) {
    return "La contraseña debe incluir al menos un carácter especial (ej. @, $, !, %, *).";
  }
  return null;
};
