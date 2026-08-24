export function getPasswordChecks(password) {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };
}

export function isPasswordValid(password) {
  return Object.values(getPasswordChecks(password)).every(Boolean);
}

export function getPasswordStrength(password) {
  const score = Object.values(getPasswordChecks(password)).filter(Boolean).length;
  if (!password) return { score: 0, label: "" };
  if (score <= 2) return { score, label: "Weak" };
  if (score <= 4) return { score, label: "Medium" };
  return { score, label: "Strong" };
}
