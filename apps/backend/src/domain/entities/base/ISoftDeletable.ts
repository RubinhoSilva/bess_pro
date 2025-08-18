export interface ISoftDeletable {
  isDeleted(): boolean;
  delete(): void;
  restore(): void;
  getDeletedAt(): Date | null;
}

export interface SoftDeleteProps {
  isDeleted?: boolean;
  deletedAt?: Date | null;
}