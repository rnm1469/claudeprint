/**
 * @file src/lib/types.ts
 * @description Définitions des types TypeScript pour P2Print Marketplace.
 * Définit l'énumération des rôles (client, maker, admin) et les interfaces d'utilisateurs.
 */

export type UserRole = 'client' | 'maker' | 'admin';

export enum UserRoleEnum {
  CLIENT = 'client',
  MAKER = 'maker',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<User, 'id'>>;
      };
    };
    Enums: {
      user_role: UserRole;
    };
  };
}
