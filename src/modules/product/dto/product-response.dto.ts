export interface ProductVideoResponseDto {
  _id: string;
  title: string;
  s3Links: string[];
  youtubeUrl?: string;
  isActive: boolean;
  uploadedAt: Date;
}

export interface ProductImageResponseDto {
  _id: string;
  title: string;
  s3Link: string;
  isActive: boolean;
  uploadedAt: Date;
}

export interface ProductFileResponseDto {
  _id: string;
  categoryId: string;
  categoryName?: string;
  fileType: 'PDF' | 'PPT';
  language: string;
  brochureName: string;
  s3Link: string;
  uploadedAt: Date;
}

export interface ProductMediaResponseDto {
  videos: ProductVideoResponseDto[];
  images: ProductImageResponseDto[];
}

export interface ReasonsToBuyResponseDto {
  reason1: string;
  reason2: string;
  reason3?: string;
  reason4?: string;
  reason5?: string;
}

export interface ProductResponseDto {
  _id: string;
  productCategoryId: string;
  productCategoryName?: string;
  channelIds: string[];
  channelNames?: string[];
  productName: string;
  status: 'active' | 'inactive';
  webLink?: string;
  applicationId?: string;
  productDescription?: string;
  reasonsToBuy: ReasonsToBuyResponseDto;
  media: ProductMediaResponseDto;
  files: ProductFileResponseDto[];
  createdBy: string;
  createdByName?: string;
  createdAt: Date;
  updatedAt: Date;
}
