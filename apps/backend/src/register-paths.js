// Path resolution setup for production
const path = require('path');
const Module = require('module');

// Define path mappings
const paths = {
  '@/': path.join(__dirname, './'),
  '@/application': path.join(__dirname, './application'),
  '@/domain': path.join(__dirname, './domain'),
  '@/infrastructure': path.join(__dirname, './infrastructure'),
  '@/presentation': path.join(__dirname, './presentation'),
  '@/shared': path.join(__dirname, './shared'),
  '@/config': path.join(__dirname, './config')
};

// Override require resolution
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function (request, parent, isMain) {
  // Check if request starts with @/
  for (const [alias, aliasPath] of Object.entries(paths)) {
    if (request.startsWith(alias)) {
      const newRequest = request.replace(alias, aliasPath);
      return originalResolveFilename.call(this, newRequest, parent, isMain);
    }
  }
  
  // Default behavior
  return originalResolveFilename.call(this, request, parent, isMain);
};

console.log('✅ Path aliases registered successfully');