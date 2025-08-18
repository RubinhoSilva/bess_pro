const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3001; // Sua porta atual, pode ser 3000 se preferir e não estiver em uso

// Define a pasta raiz dos arquivos estáticos.
// O 'npm run build' criou a pasta 'dist', então vamos usar ela.
const STATIC_FILES_DIR = 'dist';

const server = http.createServer((req, res) => {
    // Obter o caminho completo do arquivo solicitado.
    // Ele vai procurar D:\Meu site BESS Pro\...\dist\ + o que o navegador pediu.
    let filePath = path.join(__dirname, STATIC_FILES_DIR, req.url);

    // Se a requisição for para a raiz (ex: http://localhost:3001/),
    // serve o index.html que está dentro da pasta 'dist'.
    if (req.url === '/') {
        filePath = path.join(__dirname, STATIC_FILES_DIR, 'index.html');
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.ico': 'image/x-icon'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                // Se o arquivo não for encontrado, e como é uma SPA,
                // serve o index.html da pasta 'dist' para que o roteamento do lado do cliente funcione.
                fs.readFile(path.join(__dirname, STATIC_FILES_DIR, 'index.html'), (err, notFoundContent) => {
                    if (err) {
                        // Se nem mesmo o index.html puder ser lido (erro grave)
                        res.writeHead(500);
                        res.end('Erro interno do servidor ao ler index.html: ' + err.code);
                    } else {
                        // Serve index.html com status 200 OK
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(notFoundContent, 'utf-8');
                    }
                });
            } else {
                // Outros erros de servidor (permissão, etc.)
                res.writeHead(500);
                res.end('Erro do servidor: ' + error.code + ' ..\n');
            }
        } else {
            // Sucesso: arquivo encontrado e lido
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}/`);
});