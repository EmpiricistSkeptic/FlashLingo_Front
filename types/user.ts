export interface User {
  id: number;
  username: string;
  email: string;
}

// UserProfileSerializer currently only exposes timestamps — extend this
// as more fields get added to the profile endpoint.
export interface UserProfile {
  created_at: string;
  updated_at: string;
}