export interface AppConfig {
  database: {
    mongoUri: string;
    dbName: string;
    maxPoolSize?: number;
    minPoolSize?: number;
  };
  jwt: {
    secretKey: string;
    refreshSecretKey: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  email: {
    provider: 'nodemailer' | 'sendgrid';
    nodemailer?: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
      from: string;
    };
    sendgrid?: {
      apiKey: string;
      from: string;
      templates: {
        welcome: string;
        passwordReset: string;
        projectInvite: string;
      };
    };
  };
  storage: {
    provider: 's3' | 'local';
    s3?: {
      accessKeyId: string;
      secretAccessKey: string;
      region: string;
      bucket: string;
      cloudFrontUrl?: string;
    };
    local?: {
      uploadDir: string;
      baseUrl: string;
    };
  };
  cache: {
    provider: 'redis' | 'memory';
    redis?: {
      host: string;
      port: number;
      password?: string;
      db?: number;
      keyPrefix?: string;
    };
  };
  externalApis: {
    pvgis: {
      baseUrl: string;
    };
    payment?: {
      stripeSecretKey: string;
      webhookSecret: string;
    };
  };
  app: {
    port: number;
    env: string;
    corsOrigin: string[];
  };
  websockets: {
    enabled: boolean;
    path: string;
  };
}

export function loadConfig(): AppConfig {
  return {
    database: {
      mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
      dbName: process.env.DB_NAME || 'bess_pro',
      maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE || '10'),
      minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE || '5'),
    },
    jwt: {
      secretKey: process.env.JWT_SECRET || 'your-secret-key',
      refreshSecretKey: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
      expiresIn: process.env.JWT_EXPIRES_IN || '2h',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    },
    email: {
      provider: (process.env.EMAIL_PROVIDER as 'nodemailer' | 'sendgrid') || 'nodemailer',
      nodemailer: {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER || '',
          pass: process.env.EMAIL_PASS || '',
        },
        from: process.env.EMAIL_FROM || 'noreply@besspro.com',
      },
      sendgrid: {
        apiKey: process.env.SENDGRID_API_KEY || '',
        from: process.env.SENDGRID_FROM || 'noreply@besspro.com',
        templates: {
          welcome: process.env.SENDGRID_TEMPLATE_WELCOME || '',
          passwordReset: process.env.SENDGRID_TEMPLATE_PASSWORD_RESET || '',
          projectInvite: process.env.SENDGRID_TEMPLATE_PROJECT_INVITE || '',
        },
      },
    },
    storage: {
      provider: (process.env.STORAGE_PROVIDER as 's3' | 'local') || 'local',
      s3: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        region: process.env.AWS_REGION || 'us-east-1',
        bucket: process.env.S3_BUCKET || 'bess-pro-files',
        cloudFrontUrl: process.env.CLOUDFRONT_URL,
      },
      local: {
        uploadDir: process.env.UPLOAD_DIR || './uploads',
        baseUrl: process.env.UPLOAD_BASE_URL || 'http://localhost:3000/uploads',
      },
    },
    cache: {
      provider: (process.env.CACHE_PROVIDER as 'redis' | 'memory') || 'memory',
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        keyPrefix: process.env.REDIS_KEY_PREFIX || 'bess:',
      },
    },
    externalApis: {
      pvgis: {
        baseUrl: process.env.PVGIS_BASE_URL || 'https://re.jrc.ec.europa.eu/api/v5_2',
      },
      payment: {
        stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
      },
    },
    app: {
      port: parseInt(process.env.PORT || '8010'),
      env: process.env.NODE_ENV || 'development',
      corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3003'],
    },
    websockets: {
      enabled: process.env.WEBSOCKETS_ENABLED === 'true',
      path: process.env.WEBSOCKETS_PATH || '/socket.io',
    },
  };
}