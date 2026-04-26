export interface User {
  id: string;
  email: string;
  nickname: string;
  normalizedNickname: string;
  bio: string;
  profileImageUrl: string | null;
  followersCount: number;
  followingCount: number;
  artworksCount: number;
  bookmarksCount: number;
  pointBalance: number;
  loginProvider: 'email' | 'google' | 'apple';
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfileUpdate {
  nickname?: string;
  bio?: string;
  profileImageUrl?: string | null;
}

export interface SignUpInput {
  email: string;
  password: string;
  nickname: string;
}
