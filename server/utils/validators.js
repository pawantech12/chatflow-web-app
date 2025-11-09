function validateEmailPassword(email, password) {
  if (!email || !password) return false;
  if (typeof password !== "string" || password.length < 6) return false;
  // basic email check
  const re = /\S+@\S+\.\S+/;
  return re.test(email);
}

export { validateEmailPassword };
