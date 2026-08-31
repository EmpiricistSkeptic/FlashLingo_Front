import type { User } from "./user";

export interface LoginPayload {
  username: string;
  password: string;
}

// LoginSerializer.validate() returns exactly this shape as validated_data
export interface LoginResponse {
  user_id: number;
  access: string;
  refresh: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  user: User;
  access: string;
  refresh: string;
  message: string;
}