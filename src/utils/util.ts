/**
 * Generates a random password with configurable options
 * @param length Length of the password (default: 12)
 * @param includeUppercase Include uppercase letters (default: true)
 * @param includeLowercase Include lowercase letters (default: true)
 * @param includeNumbers Include numbers (default: true)
 * @param includeSpecial Include special characters (default: true)
 * @returns Random password string
 */
export const generateRandomPassword = (
  length = 12,
  includeUppercase = true,
  includeLowercase = true,
  includeNumbers = true,
  includeSpecial = true,
): string => {
  // Define character sets
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const specialChars = '!@#$%^&*()_+~`|}{[]:;?><,./-=';

  // Build character pool based on options
  let charPool = '';
  if (includeUppercase) charPool += uppercaseChars;
  if (includeLowercase) charPool += lowercaseChars;
  if (includeNumbers) charPool += numberChars;
  if (includeSpecial) charPool += specialChars;

  // If no character set is selected, default to lowercase
  if (!charPool) charPool = lowercaseChars;

  // Ensure minimum length
  if (length < 8) {
    length = 8;
  }

  let password = '';

  // Ensure at least one character from each selected group
  if (includeUppercase) {
    password += uppercaseChars.charAt(
      Math.floor(Math.random() * uppercaseChars.length),
    );
  }
  if (includeLowercase) {
    password += lowercaseChars.charAt(
      Math.floor(Math.random() * lowercaseChars.length),
    );
  }
  if (includeNumbers) {
    password += numberChars.charAt(
      Math.floor(Math.random() * numberChars.length),
    );
  }
  if (includeSpecial) {
    password += specialChars.charAt(
      Math.floor(Math.random() * specialChars.length),
    );
  }

  // Fill the rest of the password
  for (let i = password.length; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charPool.length);
    password += charPool.charAt(randomIndex);
  }

  // Shuffle the password to avoid predictable character positions
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
};
