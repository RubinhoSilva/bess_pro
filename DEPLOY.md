# 🚀 Guia de Deploy BESS-Pro - AWS EC2 com Docker e Nginx

## 📋 Pré-requisitos

### AWS EC2
- **Tipo**: t3.medium ou superior (2 vCPU, 4 GB RAM)
- **OS**: Ubuntu 22.04 LTS
- **Storage**: 20 GB+ SSD
- **Security Group**: 
  - SSH (22) - Seu IP
  - HTTP (80) - 0.0.0.0/0
  - HTTPS (443) - 0.0.0.0/0

### Domínio
- Domínio configurado apontando para o IP da instância
- Certificado SSL (Let's Encrypt recomendado)

## 🔧 Passo a Passo

### 1. Configurar Instância EC2

#### 1.1 Conectar via SSH
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

#### 1.2 Executar Setup do Servidor
```bash
# Baixar projeto
git clone https://github.com/your-username/bess-pro.git
cd bess-pro

# Executar setup
./scripts/setup-server.sh
```

#### 1.3 Logout e Login (aplicar grupo Docker)
```bash
exit
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### 2. Configurar Variáveis de Ambiente

#### 2.1 Copiar e editar arquivo de produção
```bash
cd bess-pro
cp .env.production .env.production.local

# IMPORTANTE: Editar com valores reais
nano .env.production
```

#### 2.2 Variáveis obrigatórias para alterar:
```env
# Gerar secrets seguros (32+ caracteres)
JWT_SECRET_KEY=your-super-secure-256-bit-secret-key-here
JWT_REFRESH_SECRET_KEY=your-different-refresh-secret-key-here

# Configurar domínio
CORS_ORIGIN=https://yourdomain.com

# Configurar senhas de banco
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=your-secure-mongo-password
REDIS_PASSWORD=your-secure-redis-password
```

### 3. Configurar Nginx

#### 3.1 Copiar configuração
```bash
sudo cp nginx/bess-pro.conf /etc/nginx/sites-available/bess-pro
sudo ln -s /etc/nginx/sites-available/bess-pro /etc/nginx/sites-enabled/

# Editar domínio na configuração
sudo nano /etc/nginx/sites-available/bess-pro
```

#### 3.2 Remover configuração padrão
```bash
sudo rm /etc/nginx/sites-enabled/default
```

#### 3.3 Testar e recarregar
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Deploy da Aplicação

```bash
./scripts/deploy.sh
```

### 5. Configurar SSL (Let's Encrypt)

#### 5.1 Instalar Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

#### 5.2 Obter certificado
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### 5.3 Configurar renovação automática
```bash
sudo crontab -e
# Adicionar linha:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔍 Verificação

### Testar Aplicação
```bash
# API Health
curl http://yourdomain.com/api/v1/health

# Frontend
curl http://yourdomain.com

# Status dos containers
docker-compose -f docker-compose.prod.yml ps
```

### Logs
```bash
# Todos os serviços
docker-compose -f docker-compose.prod.yml logs -f

# Serviço específico
docker-compose -f docker-compose.prod.yml logs -f backend
```

## 🔒 Segurança

### Hardening Básico
```bash
# Alterar porta SSH (opcional)
sudo nano /etc/ssh/sshd_config
# Port 2222

# Desabilitar login root
# PermitRootLogin no

# Reiniciar SSH
sudo systemctl restart sshd

# Atualizar firewall se mudou porta SSH
sudo ufw allow 2222
sudo ufw delete allow ssh
```

### Monitoramento
```bash
# Instalar htop para monitoramento
sudo apt install htop

# Ver uso de recursos
htop
docker stats
```

## 📊 Backup e Manutenção

### Backup Manual
```bash
./scripts/backup.sh
```

### Backup Automático (já configurado)
```bash
# Verificar crontab
crontab -l
```

### Atualizações
```bash
# Atualizar código
cd /home/ubuntu/bess-pro
git pull origin master
./scripts/deploy.sh
```

## 🚨 Troubleshooting

### Containers não iniciam
```bash
# Ver logs detalhados
docker-compose -f docker-compose.prod.yml logs

# Verificar recursos
df -h
free -h
```

### Problemas de conectividade
```bash
# Verificar portas
sudo netstat -tlnp | grep -E ':(80|443|8010|3003)'

# Verificar firewall
sudo ufw status
```

### Problemas de SSL
```bash
# Verificar certificado
sudo certbot certificates

# Testar renovação
sudo certbot renew --dry-run
```

## 📝 Comandos Úteis

### Docker
```bash
# Rebuild completo
docker-compose -f docker-compose.prod.yml down
docker system prune -a
docker-compose -f docker-compose.prod.yml up -d --build

# Backup de volume
docker run --rm -v bess-pro_mongodb_prod_data:/data -v $(pwd):/backup alpine tar czf /backup/mongodb-backup.tar.gz -C /data .
```

### Nginx
```bash
# Testar configuração
sudo nginx -t

# Recarregar
sudo systemctl reload nginx

# Status
sudo systemctl status nginx
```

### Sistema
```bash
# Uso de disco
df -h
du -sh /home/ubuntu/bess-pro

# Logs do sistema
sudo journalctl -f
```

## 🔄 CI/CD (Opcional)

Para automatizar deploys, considere usar GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ master ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - name: Deploy to EC2
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ubuntu
        key: ${{ secrets.KEY }}
        script: |
          cd /home/ubuntu/bess-pro
          git pull origin master
          ./scripts/deploy.sh
```

## 📞 Suporte

Para problemas:
1. Verificar logs dos containers
2. Conferir configurações de rede
3. Validar variáveis de ambiente
4. Verificar recursos do servidor (CPU, RAM, Disk)

---

✅ **Aplicação disponível em**: https://yourdomain.com  
🔍 **Health Check**: https://yourdomain.com/api/v1/health  
📊 **Monitoramento**: `docker stats` e `htop`