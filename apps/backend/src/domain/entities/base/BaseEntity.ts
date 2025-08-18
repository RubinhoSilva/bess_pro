import { ISoftDeletable, SoftDeleteProps } from './ISoftDeletable';

export abstract class BaseEntity implements ISoftDeletable {
  protected _isDeleted: boolean;
  protected _deletedAt: Date | null;
  protected _createdAt: Date;
  protected _updatedAt: Date;

  constructor(props?: SoftDeleteProps & { createdAt?: Date; updatedAt?: Date }) {
    this._isDeleted = props?.isDeleted || false;
    this._deletedAt = props?.deletedAt || null;
    this._createdAt = props?.createdAt || new Date();
    this._updatedAt = props?.updatedAt || new Date();
  }

  isDeleted(): boolean {
    return this._isDeleted;
  }

  delete(): void {
    this._isDeleted = true;
    this._deletedAt = new Date();
    this.markAsUpdated();
  }

  restore(): void {
    this._isDeleted = false;
    this._deletedAt = null;
    this.markAsUpdated();
  }

  getDeletedAt(): Date | null {
    return this._deletedAt;
  }

  getCreatedAt(): Date {
    return this._createdAt;
  }

  getUpdatedAt(): Date {
    return this._updatedAt;
  }

  protected markAsUpdated(): void {
    this._updatedAt = new Date();
  }

  // Abstract methods that child classes must implement
  abstract getId(): string;
}