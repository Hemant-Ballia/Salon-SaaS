import { User } from "./models";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthData {
  user: User;
  accessToken: string;
}
