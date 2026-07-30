export type Role = "admin" | "instructor" | "student";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
}

export interface Session {
  user: User;
  expiresAt: string;
}
