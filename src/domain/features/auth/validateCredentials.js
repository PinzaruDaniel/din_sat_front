export function validateCredentials(input, registering = false) {
  const errors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email))
    errors.email = 'Introdu un email valid.';
  if (!input.password) errors.password = 'Introdu parola.';
  if (registering && input.password.length < 12)
    errors.password = 'Folosește cel puțin 12 caractere.';
  if (registering && input.name.trim().length < 2)
    errors.name = 'Introdu cel puțin două caractere.';
  return errors;
}
