export interface User {
    id: string;
    email: string;
    name: string;
    company?: string;
    role: UserRole;
    subscription: SubscriptionStatus;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum UserRole {
    ADMIN = "admin",
    USER = "user",
    MANAGER = "manager"
}
export declare enum SubscriptionStatus {
    TRIALING = "trialing",
    ACTIVE = "active",
    INACTIVE = "inactive",
    CANCELED = "canceled"
}
//# sourceMappingURL=user.types.d.ts.map