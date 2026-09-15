import { User } from "./models";

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterCustomerData {
  name: string;
  email: string;
  password?: string;
  phone?: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
}