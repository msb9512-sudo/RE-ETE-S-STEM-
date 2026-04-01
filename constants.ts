
import { InventoryItem, Recipe, User, Role } from './types';

/**
 * Uygulama ilk kurulumunda oluşturulan varsayılan yönetici.
 */
export const INITIAL_USERS: User[] = [
  { 
    id: 'u1', 
    name: 'Sistem Yöneticisi', 
    username: 'admin', 
    password: '123', 
    role: Role.ADMIN,
    securityQuestion: 'İlk evcil hayvanınızın adı nedir?',
    securityAnswer: 'tekir'
  }
];

/**
 * Başlangıç Envanteri - Boş Kurulum
 */
export const INITIAL_INVENTORY: InventoryItem[] = [];

/**
 * Başlangıç Reçeteleri - Boş Kurulum
 */
export const INITIAL_RECIPES: Recipe[] = [];
