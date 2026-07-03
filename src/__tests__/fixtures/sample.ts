export function authenticateUser(username: string, password: string) {
  return true;
}

export const MAX_LOGIN_ATTEMPTS = 5;

function internalHelper() {
  return false;
}
