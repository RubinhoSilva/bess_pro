const fs = require('fs');
const path = require('path');

/**
 * Script para corrigir caminhos relativos no index.esm.js
 * Este script ajusta os caminhos de importação para funcionar corretamente
 * quando o arquivo está na raiz do diretório dist/
 */

const indexPath = path.join(__dirname, '../dist/index.esm.js');

if (fs.existsSync(indexPath)) {
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Substituir todos os caminhos relativos que começam com './types/' por './esm/types/'
  content = content.replace(/from '\.\/types\//g, "from './esm/types/");
  
  // Substituir outros caminhos relativos que precisam de ajuste
  content = content.replace(/from '\.\/adapters\//g, "from './esm/adapters/");
  content = content.replace(/from '\.\/config\//g, "from './esm/config/");
  content = content.replace(/from '\.\/validation\//g, "from './esm/validation/");
  
  fs.writeFileSync(indexPath, content);
  console.log('✅ Caminhos relativos corrigidos no index.esm.js');
} else {
  console.log('❌ Arquivo index.esm.js não encontrado');
}