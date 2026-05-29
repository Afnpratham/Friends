export const demoAuthKey = 'friends-demo-auth';

export function isDemoAuthenticated() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(demoAuthKey) === 'true';
}

export function startDemoSession() {
  window.localStorage.setItem(demoAuthKey, 'true');
}

export function clearDemoSession() {
  window.localStorage.removeItem(demoAuthKey);
}
