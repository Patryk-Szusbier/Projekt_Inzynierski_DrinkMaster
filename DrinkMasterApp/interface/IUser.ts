export type RoleEnum = "ADMIN" | "USER";

export interface User {
  id: number;
  username: string;
  email?: string;
  role: RoleEnum;
}
