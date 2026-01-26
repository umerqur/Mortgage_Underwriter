import netlifyIdentity from 'netlify-identity-widget';
import type { User } from 'netlify-identity-widget';

// Initialize Netlify Identity
export function initNetlifyIdentity(): void {
  netlifyIdentity.init();
}

// Get current user
export function getCurrentUser(): User | null {
  return netlifyIdentity.currentUser();
}

// Open login modal
export function openLoginModal(): void {
  netlifyIdentity.open('login');
}

// Logout
export function logout(): void {
  netlifyIdentity.logout();
}

// Listen for login event
export function onLogin(callback: (user: User) => void): void {
  netlifyIdentity.on('login', callback);
}

// Listen for logout event
export function onLogout(callback: () => void): void {
  netlifyIdentity.on('logout', callback);
}

// Close modal
export function closeModal(): void {
  netlifyIdentity.close();
}

export default netlifyIdentity;
