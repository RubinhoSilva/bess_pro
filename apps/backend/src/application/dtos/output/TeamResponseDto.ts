export interface TeamResponseDto {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  ownerEmail: string;
  ownerName?: string;
  ownerRole?: string;
  isActive: boolean;
  planType: string;
  maxUsers: number;
  companyProfileId?: string;
  currentUsers?: number;
  createdAt: Date;
  updatedAt: Date;
}