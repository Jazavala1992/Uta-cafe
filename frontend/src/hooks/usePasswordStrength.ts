export type PasswordStrength = 'debil' | 'intermedio' | 'fuerte' | '';

export const usePasswordStrength = (password: string): PasswordStrength => {
  if (!password) return '';
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (!hasMinLength) return 'debil';
  if (hasUppercase && hasLowercase && hasNumbers && hasSpecial) return 'fuerte';
  if ((hasUppercase || hasLowercase) && hasNumbers) return 'intermedio';
  return 'debil';
};