
export type UserRole = 'syndic' | 'resident' | 'super_admin' | 'doorman';

export interface Condo {
  id: string; // This is the subdomain (e.g., 'gaudi')
  name: string;
  address: string;
  unitCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface Unit {
  id: string;
  condoId: string;
  number: string;
  block?: string;
  status: 'active' | 'inactive';
}

export type ResidentType = 'owner' | 'tenant' | 'dependent';

export interface User {
  id: string;
  condoId: string; // Link to Condo
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  apartment?: string;
  unitId?: string; // Link to Unit entity
  residentType?: ResidentType;
  cpf?: string;
  phone?: string;
  needsPasswordChange: boolean;
  photoUrl?: string;
}

export interface Notice {
  id: string;
  condoId: string;
  title: string;
  content: string;
  date: string;
  author: string;
  important: boolean;
}

export interface CommonArea {
  id: string;
  condoId: string;
  name: string;
  openTime: string;
  closeTime: string;
  requiresApproval: boolean;
  maxDuration?: number;
}

export interface Reservation {
  id: string;
  condoId: string;
  areaId: string;
  areaName: string;
  date: string;
  startTime: string;
  endTime: string;
  residentId: string;
  residentName: string;
  apartment: string;
  status: 'confirmed' | 'pending' | 'rejected';
  viewedBySyndic?: boolean;
  viewedByResident?: boolean;
  rejectionReason?: string;
}

export interface Incident {
  id: string;
  condoId: string;
  title: string;
  description: string;
  date: string;
  status: 'open' | 'in_progress' | 'resolved';
  severity: 'low' | 'medium' | 'high';
  aiSuggestion?: string;
  approved: boolean;
  authorName: string;
  apartment: string;
  progressNote?: string;
  resolutionNote?: string;
  imageUrl?: string;
}

export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';
export type TransactionSource = 'manual' | 'reservation' | 'fine' | 'recurring';

export interface Transaction {
  id: string;
  condoId: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  status: TransactionStatus;
  
  // Dates
  dueDate: string; // Data de competência/vencimento
  paidDate?: string; // Data efetiva do pagamento
  createdAt: string;

  // Targeting & Origin
  targetUnit?: string; // Se for cobrança específica (ex: Apto 101)
  source: TransactionSource;
  sourceId?: string; // ID da reserva ou multa que gerou isso
  
  // Meta
  attachments?: string[]; // URLs de comprovantes
  notes?: string;
}

export interface CondoSettings {
    name: string;
    address: string;
    unitCount: number;
}

export interface Reminder {
    id: string;
    condoId: string;
    text: string;
    completed: boolean;
}

export type DocumentCategory = 'rules' | 'financial' | 'minutes' | 'general';

export interface CondoDocument {
    id: string;
    condoId: string;
    title: string;
    category: DocumentCategory;
    type: 'file' | 'link';
    url: string; // Base64 or External URL
    createdAt: string;
}

export interface Visitor {
    id: string;
    condoId: string;
    name: string;
    document?: string;
    type: 'visitor' | 'provider';
    targetApartment: string; // "101", "202"
    unitId?: string;
    status: 'expected' | 'inside' | 'exited';
    entryTime?: string;
    exitTime?: string;
    expectedDate?: string;
    photoUrl?: string;
}

export interface Order {
    id: string;
    condoId: string;
    description: string; // "Pacote Amazon", "Carta Registrada"
    targetApartment: string;
    unitId?: string;
    recipientName?: string; // Intended recipient
    status: 'pending' | 'delivered';
    receivedAt: string;
    deliveredAt?: string;
    receiverName?: string; // Who picked it up
}

export type ViewState = 'dashboard' | 'notices' | 'reservations' | 'incidents' | 'accounts' | 'residents' | 'settings' | 'super_admin' | 'documents' | 'concierge' | 'my_orders' | 'my_visitors' | 'access_log' | 'units';
