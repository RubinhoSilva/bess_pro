import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

/**
 * Middleware de segurança com headers de proteção
 */
export function securityMiddleware() {
  return helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        manifestSrc: ["'self'"]
      }
    },
    
    // Cross-Origin Embedder Policy
    crossOriginEmbedderPolicy: false,
    
    // HSTS - Force HTTPS
    hsts: {
      maxAge: 31536000, // 1 ano
      includeSubDomains: true,
      preload: true
    },
    
    // Hide X-Powered-By header
    hidePoweredBy: true,
    
    // X-Frame-Options
    frameguard: { action: 'deny' },
    
    // X-Content-Type-Options
    noSniff: true,
    
    // Referrer Policy
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    
    // X-XSS-Protection
    xssFilter: true
  });
}

/**
 * Headers customizados de segurança
 */
export function customSecurityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Remove informações do servidor
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  
  // Headers de segurança customizados
  res.setHeader('X-API-Version', '1.0');
  res.setHeader('X-Request-ID', req.headers['x-request-id'] || generateRequestId());
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Feature Policy (Permissions Policy)
  res.setHeader('Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=()'
  );
  
  next();
}

/**
 * CORS configurado de forma segura
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3003'];
  const origin = req.headers.origin;
  
  // Verificar origem permitida
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  // Headers permitidos
  res.setHeader('Access-Control-Allow-Headers', 
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Request-ID'
  );
  
  // Métodos permitidos
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  
  // Permitir credenciais
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Cache preflight por 24 horas
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Responder preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send();
    return;
  }
  
  next();
}

/**
 * Rate limiting headers
 */
export function rateLimitHeaders(req: Request, res: Response, next: NextFunction): void {
  // Estes headers serão configurados pelo express-rate-limit
  // Mas podemos adicionar headers customizados aqui
  res.setHeader('X-Rate-Limit-Policy', 'Standard');
  next();
}

/**
 * Sanitização de headers de entrada
 */
export function sanitizeHeaders(req: Request, res: Response, next: NextFunction): void {
  // Remove headers potencialmente perigosos
  delete req.headers['x-forwarded-host'];
  delete req.headers['x-real-ip'];
  
  // Validar User-Agent
  const userAgent = req.headers['user-agent'];
  if (userAgent && userAgent.length > 512) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_USER_AGENT',
        message: 'User-Agent header muito longo'
      }
    });
    return;
  }
  
  // Validar Content-Length
  const contentLength = req.headers['content-length'];
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB
    res.status(413).json({
      success: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Payload muito grande'
      }
    });
    return;
  }
  
  next();
}

/**
 * Gerar ID único para requisição
 */
function generateRequestId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Middleware para logging de segurança
 */
export function securityLogging(req: Request, res: Response, next: NextFunction): void {
  const securityInfo = {
    timestamp: new Date().toISOString(),
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    method: req.method,
    path: req.path,
    origin: req.headers.origin,
    referer: req.headers.referer
  };
  
  // Log suspicious activities
  if (isSuspiciousRequest(req)) {
    console.warn('Suspicious request detected:', securityInfo);
  }
  
  next();
}

/**
 * Detectar requisições suspeitas
 */
function isSuspiciousRequest(req: Request): boolean {
  const suspiciousPatterns = [
    /\.\./,  // Path traversal
    /<script/i,  // XSS attempts
    /union.*select/i,  // SQL injection
    /javascript:/i,  // JavaScript URLs
    /vbscript:/i,  // VBScript URLs
    /data:/i  // Data URLs
  ];
  
  const testStrings = [
    req.path,
    req.query.toString(),
    JSON.stringify(req.body || {}),
    req.headers['user-agent'] || '',
    req.headers.referer || ''
  ];
  
  return testStrings.some(str => 
    suspiciousPatterns.some(pattern => pattern.test(str))
  );
}