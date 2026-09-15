import { User, Business } from "./models";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterBusinessInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  businessName: string;
  businessType: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export interface AuthData {
  user: User;
  business?: Business;
  accessToken: string;
}
