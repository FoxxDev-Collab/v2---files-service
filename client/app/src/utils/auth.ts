// client/src/utils/auth.ts

export function setToken(token: string): void {
    localStorage.setItem('token', token);
  }
  
  export function getToken(): string | null {
    return localStorage.getItem('token');
  }
  
  export function removeToken(): void {
    localStorage.removeItem('token');
  }
  
  export function isAuthenticated(): boolean {
    return !!getToken();
  }