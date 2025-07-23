export interface User {
  id: number;
  remote_user_id: number;
  name: string;
  email: string;
  created_at?: Date;
}