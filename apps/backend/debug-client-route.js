// Teste simples para debug da rota de clientes
const express = require('express');
const app = express();

app.get('/debug/clients', (req, res) => {
  console.log('Simple route hit');
  res.json({ success: true, message: 'Simple route works' });
});

app.listen(3001, () => {
  console.log('Debug server running on port 3001');
  
  // Test the route
  setTimeout(() => {
    const http = require('http');
    http.get('http://localhost:3001/debug/clients', (res) => {
      console.log('Test successful, status:', res.statusCode);
      process.exit(0);
    }).on('error', (err) => {
      console.error('Test failed:', err);
      process.exit(1);
    });
  }, 100);
});