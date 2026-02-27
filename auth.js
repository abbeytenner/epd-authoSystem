export function signup(username, email, password) {
  const users = JSON.parse(localStorage.getItem("users") || "[]");
  if (users.find(u => u.email === email)) return { ok: false, error: "Email already registered." };
  const user = { username, email, password };
  users.push(user);
  localStorage.setItem("users", JSON.stringify(users));
  localStorage.setItem("currentUser", JSON.stringify({ username, email }));
  return { ok: true };
}

export function login(email, password) {
  const users = JSON.parse(localStorage.getItem("users") || "[]");
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return { ok: false, error: "Invalid email or password." };
  localStorage.setItem("currentUser", JSON.stringify({ username: user.username, email: user.email }));
  return { ok: true };
}

export function getCurrentUser() {
  const raw = localStorage.getItem("currentUser");
  return raw ? JSON.parse(raw) : null;
}

export function logout() {
  localStorage.removeItem("currentUser");
}
