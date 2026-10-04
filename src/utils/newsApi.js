export function newsAuthConfig(role) {
  if (role !== "tutor") return {};
  const token = localStorage.getItem("student_token");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}
