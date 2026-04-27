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

/**
 * 크리에이터 포인트(CP) 거래 내역
 * 다른 유저가 프롬프트를 열람하면 작가에게 70CP가 지급됨
 * 10,000CP 이상 시 네이버페이로 전환 가능
 */
export interface CreatorPointTransaction {
  id: string;
  creatorId: string;
  type: 'earn';
  amount: number;
  reason: 'prompt_view';
  artworkId: string;
  viewerUserId: string;
  createdAt: Date;
}
