import { api } from "./api";

export interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: "SUPER_ADMIN" | "ADMIN" | "LEAD" | "MEMBER";
}

export const usersService = {
  getAll: (role?: string) => {
    const query = role ? `?role=${role}` : "";
    return api.get<User[]>(`/users${query}`);
  },
};
