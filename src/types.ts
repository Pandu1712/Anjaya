export type UserRole = "user" | "serviceman" | "admin";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber: string | null;
  role: UserRole;
  createdAt: any;
  isApproved?: boolean; // for serviceman
}

export interface Service {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  extraCost: number;
  category: string;
  imageUrl: string;
}

export interface Booking {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  address: string;
  city: string;
  pincode: string;
  serviceId: string;
  serviceName: string;
  serviceDate: string;
  serviceTime: string;
  notes: string;
  status: "pending" | "assigned" | "in-progress" | "completed" | "cancelled";
  providerId?: string;
  providerName?: string;
  totalCost: number;
  advancePaid: number;
  remainingPaid: boolean;
  createdAt: any;
}
