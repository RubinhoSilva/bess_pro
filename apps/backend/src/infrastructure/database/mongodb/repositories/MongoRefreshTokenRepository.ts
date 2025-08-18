import { Model } from 'mongoose';
import { RefreshToken } from '../../../../domain/entities/RefreshToken';
import { UserId } from '../../../../domain/value-objects/UserId';
import { IRefreshTokenRepository } from '../../../../domain/repositories/IRefreshTokenRepository';
import { RefreshTokenDocument, RefreshTokenModel } from '../schemas/RefreshTokenSchema';

export class MongoRefreshTokenRepository implements IRefreshTokenRepository {
  private model: Model<RefreshTokenDocument>;

  constructor() {
    this.model = RefreshTokenModel;
  }

  async save(refreshToken: RefreshToken): Promise<RefreshToken> {
    const doc = new this.model({
      _id: refreshToken.getId(),
      userId: refreshToken.getUserId().getValue(),
      token: refreshToken.getToken(),
      expiresAt: refreshToken.getExpiresAt(),
      deviceInfo: refreshToken.getDeviceInfo(),
      ipAddress: refreshToken.getIpAddress(),
      userAgent: refreshToken.getUserAgent(),
      createdAt: refreshToken.getCreatedAt(),
      isRevoked: refreshToken.getIsRevoked()
    });

    await doc.save();
    return refreshToken;
  }

  async findById(id: string): Promise<RefreshToken | null> {
    const doc = await this.model.findById(id).lean();
    if (!doc) return null;
    
    return this.mapToEntity(doc);
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const doc = await this.model.findOne({ token }).lean();
    if (!doc) return null;
    
    return this.mapToEntity(doc);
  }

  async findActiveByUserId(userId: UserId): Promise<RefreshToken[]> {
    const docs = await this.model.find({
      userId: userId.getValue(),
      isRevoked: false,
      expiresAt: { $gt: new Date() }
    }).lean();

    return docs.map(doc => this.mapToEntity(doc));
  }

  async findByUserIdAndDevice(
    userId: UserId,
    deviceInfo: string,
    ipAddress: string,
    userAgent: string
  ): Promise<RefreshToken[]> {
    const docs = await this.model.find({
      userId: userId.getValue(),
      deviceInfo,
      ipAddress,
      userAgent,
      isRevoked: false,
      expiresAt: { $gt: new Date() }
    }).lean();

    return docs.map(doc => this.mapToEntity(doc));
  }

  async revokeToken(token: string): Promise<void> {
    await this.model.updateOne(
      { token },
      { $set: { isRevoked: true } }
    );
  }

  async revokeAllUserTokens(userId: UserId): Promise<void> {
    await this.model.updateMany(
      { userId: userId.getValue() },
      { $set: { isRevoked: true } }
    );
  }

  async revokeAllUserTokensExcept(userId: UserId, currentToken: string): Promise<void> {
    await this.model.updateMany(
      { 
        userId: userId.getValue(),
        token: { $ne: currentToken }
      },
      { $set: { isRevoked: true } }
    );
  }

  async deleteExpiredTokens(): Promise<void> {
    await this.model.deleteMany({
      $or: [
        { expiresAt: { $lte: new Date() } },
        { isRevoked: true }
      ]
    });
  }

  async countActiveByUserId(userId: UserId): Promise<number> {
    return await this.model.countDocuments({
      userId: userId.getValue(),
      isRevoked: false,
      expiresAt: { $gt: new Date() }
    });
  }

  async findTokensExpiringWithin(hours: number): Promise<RefreshToken[]> {
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() + hours);

    const docs = await this.model.find({
      isRevoked: false,
      expiresAt: {
        $gte: new Date(),
        $lte: expirationTime
      }
    }).lean();

    return docs.map(doc => this.mapToEntity(doc));
  }

  async findRecentTokensByIp(ipAddress: string, hoursBack: number): Promise<RefreshToken[]> {
    const timeLimit = new Date();
    timeLimit.setHours(timeLimit.getHours() - hoursBack);

    const docs = await this.model.find({
      ipAddress,
      createdAt: { $gte: timeLimit }
    }).lean();

    return docs.map(doc => this.mapToEntity(doc));
  }

  async getUserTokenStats(userId: UserId): Promise<{
    totalTokens: number;
    activeTokens: number;
    expiredTokens: number;
    revokedTokens: number;
    devicesCount: number;
    lastLoginAt: Date | null;
  }> {
    const userIdValue = userId.getValue();
    const now = new Date();

    const [stats] = await this.model.aggregate([
      { $match: { userId: userIdValue } },
      {
        $group: {
          _id: '$userId',
          totalTokens: { $sum: 1 },
          activeTokens: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$isRevoked', false] },
                    { $gt: ['$expiresAt', now] }
                  ]
                },
                1,
                0
              ]
            }
          },
          expiredTokens: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$isRevoked', false] },
                    { $lte: ['$expiresAt', now] }
                  ]
                },
                1,
                0
              ]
            }
          },
          revokedTokens: {
            $sum: { $cond: [{ $eq: ['$isRevoked', true] }, 1, 0] }
          },
          devicesCount: { $addToSet: '$deviceInfo' },
          lastLoginAt: { $max: '$createdAt' }
        }
      },
      {
        $project: {
          totalTokens: 1,
          activeTokens: 1,
          expiredTokens: 1,
          revokedTokens: 1,
          devicesCount: { $size: '$devicesCount' },
          lastLoginAt: 1
        }
      }
    ]);

    return stats || {
      totalTokens: 0,
      activeTokens: 0,
      expiredTokens: 0,
      revokedTokens: 0,
      devicesCount: 0,
      lastLoginAt: null
    };
  }

  async findSuspiciousActivity(userId: UserId, timeWindowHours: number): Promise<{
    uniqueIps: number;
    tokensCreated: number;
    suspiciousScore: number;
  }> {
    const timeLimit = new Date();
    timeLimit.setHours(timeLimit.getHours() - timeWindowHours);

    const [stats] = await this.model.aggregate([
      {
        $match: {
          userId: userId.getValue(),
          createdAt: { $gte: timeLimit }
        }
      },
      {
        $group: {
          _id: '$userId',
          uniqueIps: { $addToSet: '$ipAddress' },
          tokensCreated: { $sum: 1 }
        }
      },
      {
        $project: {
          uniqueIps: { $size: '$uniqueIps' },
          tokensCreated: 1,
          suspiciousScore: {
            $multiply: [
              { $size: '$uniqueIps' },
              { $divide: ['$tokensCreated', timeWindowHours] }
            ]
          }
        }
      }
    ]);

    return stats || {
      uniqueIps: 0,
      tokensCreated: 0,
      suspiciousScore: 0
    };
  }

  async update(refreshToken: RefreshToken): Promise<RefreshToken> {
    await this.model.updateOne(
      { _id: refreshToken.getId() },
      {
        $set: {
          isRevoked: refreshToken.getIsRevoked()
        }
      }
    );
    return refreshToken;
  }

  async delete(id: string): Promise<void> {
    await this.model.deleteOne({ _id: id });
  }

  async findAll(): Promise<RefreshToken[]> {
    const docs = await this.model.find().lean();
    return docs.map(doc => this.mapToEntity(doc));
  }

  async exists(id: string): Promise<boolean> {
    const doc = await this.model.findById(id).lean();
    return !!doc;
  }

  private mapToEntity(doc: any): RefreshToken {
    return RefreshToken.create({
      id: doc._id,
      userId: doc.userId,
      token: doc.token,
      expiresAt: doc.expiresAt,
      deviceInfo: doc.deviceInfo,
      ipAddress: doc.ipAddress,
      userAgent: doc.userAgent
    });
  }
}