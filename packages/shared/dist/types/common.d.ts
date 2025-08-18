export interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user' | 'manager';
    createdAt: Date;
    updatedAt: Date;
}
export interface Lead {
    id: string;
    name: string;
    email: string;
    stage: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=common.d.ts.map