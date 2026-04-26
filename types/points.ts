export interface PointTransaction {
  id: string;
  userId: string;
  type: 'purchase' | 'spend';
  amount: number;
  price: number | null;
  reason: string | null;
  targetId: string | null;
  iapTransactionId: string | null;
  createdAt: Date;
}

export interface PointPackage {
  id: string;
  name: string;
  points: number;
  price: number;
  iapProductId: string;
  isActive: boolean;
  order: number;
}

export interface PromptUnlock {
  id: string;
  userId: string;
  artworkId: string;
  pointsSpent: number;
  createdAt: Date;
}
