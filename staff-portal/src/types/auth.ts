import { User, Staff } from "./models";

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface AuthSession {
  user: User;
  staff?: Staff | null;
  accessToken: string;
  refreshToken?: string;
}