export interface Artwork {
  id: string;
  authorId: string;
  authorNickname: string;
  authorProfileImageUrl: string | null;
  title: string;
  description: string;
  imageUrls: string[];
  thumbnailUrl: string;
  tags: string[];
  tool: string;
  likesCount: number;
  reportCount: number;
  isHidden: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArtworkFormData {
  title: string;
  description: string;
  images: string[];
  tags: string[];
  tool: string;
  authorNickname: string;
  authorProfileImageUrl: string | null;
}

export interface ArtworkUpdateData {
  title?: string;
  description?: string;
  tags?: string[];
  tool?: string;
}
