
export enum Unit {
  KG = 'kg',
  LITER = 'lt',
  PIECE = 'adet',
  PORTION = 'porsiyon',
  GRAM = 'gr',
  MILLILITER = 'ml',
  CL = 'cl'
}

export type Category = string;

export enum StockMovementType {
  SALE = 'Satış',
  PURCHASE = 'Satın Alma',
  WASTE = 'Fire',
  COMPLIMENT = 'İkram',
  STAFF_MEAL = 'Personel Yemeği',
  ADJUSTMENT = 'Sayım Farkı'
}

export enum Role {
  ADMIN = 'Yönetici',
  CHEF = 'Mutfak Şefi',
  BAR_MANAGER = 'Bar Şefi',
  WAITER = 'Garson',
  PENDING = 'Onay Bekliyor'
}

export interface User {
  id: string;
  name: string;
  username: string;
  password: string; 
  role: Role;
  securityQuestion: string;
  securityAnswer: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: Category;
  quantity: number; 
  unit: Unit;
  minLevel: number;
  costPerUnit: number;
  lastCountDate?: number;
}

export interface RecipeIngredient {
  inventoryItemId: string;
  amount: number;
  unit: Unit;
}

export interface Recipe {
  id: string;
  name: string;
  price: number;
  ingredients: RecipeIngredient[];
  description?: string;
  tolerancePercentage: number; 
  category: Category; 
  lastUpdated?: number;
  updatedBy?: string;
}

export interface Sale {
  id: string;
  recipeId: string;
  quantity: number;
  totalPrice: number;
  timestamp: number;
  staffName: string;
}

export interface StockMovement {
  id: string;
  inventoryItemId: string;
  type: StockMovementType;
  amount: number;
  reason?: string;
  timestamp: number;
  staffName: string;
}

export interface CountSession {
  id: string;
  date: number;
  type: 'MONTHLY' | 'SPOT_CHECK';
  items: CountItem[];
  status: 'DRAFT' | 'COMPLETED';
  performedBy: string;
}

export interface CountItem {
  inventoryItemId: string;
  systemQuantity: number;
  countedQuantity: number;
  variance: number; 
  varianceCost: number; 
}

export interface Order {
  id: string;
  date: number;
  status: 'PENDING' | 'COMPLETED';
  items: {
    inventoryItemId: string;
    orderQuantity: number;
    costPerUnit: number;
  }[];
  totalEstimatedCost: number;
  createdBy: string;
}

export interface Log {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: number;
}

export interface LicenseData {
  key: string;
  activatedAt: number;
  machineId: string;
  clientName: string;
  expirationDate: number; 
}

export type ViewState = 'dashboard' | 'inventory' | 'bar' | 'recipes' | 'sales' | 'sales-calendar' | 'counting' | 'reports' | 'purchasing' | 'settings' | 'report-settings' | 'import-export';

declare global {
  interface Window {
    ipcRenderer: {
      send: (channel: string, ...args: any[]) => void;
      on: (channel: string, func: (...args: any[]) => void) => void;
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      removeListener: (channel: string, func: (...args: any[]) => void) => void;
    };
  }
}
