# 🚀 Deploy BESS-Pro - AWS EC2 t4g (ARM64) com Docker e Nginx

## 🏗️ Especificações da Instância t4g

### Sobre t4g (AWS Graviton2 - ARM64)
- **Arquitetura**: ARM64 (aarch64)
- **Processador**: AWS Graviton2
- **Vantagens**: Melhor performance/custo, menor consumo energético
- **Tipos recomendados**: t4g.medium, t4g.large, t4g.xlarge

### Configuração Recomendada
- **Tipo**: t4g.medium (2 vCPU, 4 GB RAM)
- **OS**: Ubuntu 22.04 LTS ARM64
- **Storage**: 20 GB+ GP3 SSD
- **Security Group**: 
  - SSH (22) - Seu IP
  - HTTP (80) - 0.0.0.0/0
  - HTTPS (443) - 0.0.0.0/0

## 🔧 Setup da Instância t4g

### 1. Conexão e Verificação
```bash
# Conectar à instância
ssh -i your-key.pem ubuntu@your-ec2-ip

# Verificar arquitetura
uname -m
# Deve retornar: aarch64
```

### 2. Setup Automatizado para ARM64
```bash
# Clonar projeto
git clone https://github.com/your-username/bess-pro.git
cd bess-pro

# Executar setup específico para ARM64
chmod +x scripts/setup-server-arm64.sh
./scripts/setup-server-arm64.sh

# Logout e login para aplicar grupo Docker
exit
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### 3. Verificar Instalação
```bash
# Verificar Docker
docker --version
docker info | grep "Architecture"
# Deve mostrar: aarch64

# Verificar Docker Compose
docker-compose --version

# Verificar se pode puxar imagens ARM64
docker run --rm --platform=linux/arm64 hello-world
```

## 🐳 Diferenças ARM64 vs x86

### Imagens Docker
```yaml
# ❌ Não especifica plataforma (pode falhar)
FROM node:20-alpine

# ✅ Especifica ARM64 explicitamente
FROM --platform=linux/arm64 node:20-alpine
```

### Docker Compose
```yaml
services:
  backend:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile.prod
    platform: linux/arm64  # ← Importante para ARM64
```

### Variáveis de Ambiente
```bash
# Definir plataforma padrão
export DOCKER_DEFAULT_PLATFORM=linux/arm64

# Para builds específicos
DOCKER_DEFAULT_PLATFORM=linux/arm64 docker-compose up --build
```

## 📦 Imagens Compatíveis com ARM64

### ✅ Imagens que funcionam nativamente:
- `mongo:7.0` - Suporte oficial ARM64
- `redis:7.2-alpine` - Suporte oficial ARM64
- `nginx:alpine` - Suporte oficial ARM64
- `node:20-alpine` - Suporte oficial ARM64

### ⚠️ Imagens que podem precisar de versão específica:
- Algumas imagens de terceiros
- Versões mais antigas de algumas imagens

## 🚀 Deploy no t4g

### 1. Configurar Variáveis de Ambiente
```bash
cd bess-pro

# Copiar template
cp .env.production .env.production.local

# Editar com valores reais
nano .env.production
```

### 2. Configurar Nginx
```bash
# Copiar configuração
sudo cp nginx/bess-pro.conf /etc/nginx/sites-available/bess-pro
sudo ln -s /etc/nginx/sites-available/bess-pro /etc/nginx/sites-enabled/

# Editar domínio
sudo nano /etc/nginx/sites-available/bess-pro

# Remover default
sudo rm /etc/nginx/sites-enabled/default

# Testar e recarregar
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Deploy da Aplicação
```bash
# Deploy com suporte ARM64
./scripts/deploy.sh
```

## ⚡ Otimizações Específicas para t4g

### 1. Configuração Docker Daemon
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "experimental": true,
  "features": {
    "buildkit": true
  }
}
```

### 2. Parâmetros de Kernel
```bash
# Otimizações aplicadas automaticamente pelo script
vm.swappiness=10
vm.vfs_cache_pressure=50
net.core.rmem_max=134217728
net.core.wmem_max=134217728
```

### 3. Limits de Container
```yaml
# Em docker-compose.prod.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1g
          cpus: '1.0'
        reservations:
          memory: 512m
          cpus: '0.5'
```

## 🔍 Monitoramento ARM64

### Comandos Úteis
```bash
# CPU e arquitetura
lscpu
cat /proc/cpuinfo | grep "model name"

# Uso de recursos
htop
docker stats

# Temperatura (se disponível)
cat /sys/class/thermal/thermal_zone*/temp

# Performance de I/O
iotop
iostat -x 1
```

### Métricas Importantes para t4g
- **CPU Credits**: t4g usa burst credits
- **Memory**: ARM64 é mais eficiente com memória
- **Network**: Performance de rede varia por tipo de instância

## 🐛 Troubleshooting ARM64

### Problemas Comuns

#### 1. Build Failure - Arquitetura Não Suportada
```bash
# Erro: The requested image's platform (linux/amd64) does not match
# Solução: Forçar ARM64
export DOCKER_DEFAULT_PLATFORM=linux/arm64
docker-compose up --build
```

#### 2. Imagem Não Encontrada
```bash
# Verificar se imagem suporta ARM64
docker manifest inspect node:20-alpine

# Procurar alternativas ARM64
docker search --filter=is-official=true node
```

#### 3. Performance Issues
```bash
# Verificar CPU credits
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUCreditBalance \
  --dimensions Name=InstanceId,Value=i-1234567890abcdef0 \
  --statistics Average \
  --start-time 2023-01-01T00:00:00Z \
  --end-time 2023-01-01T23:59:59Z \
  --period 3600
```

### Logs de Debug
```bash
# Build logs detalhados
BUILDKIT_PROGRESS=plain docker-compose up --build

# Logs de runtime
docker-compose logs -f --tail=100

# System logs
sudo journalctl -u docker -f
```

## 💰 Vantagens do t4g

### Performance/Custo
- **20-40% melhor** performance/preço vs t3
- **Menor consumo energético**
- **Performance consistente** com Graviton2

### Limitações
- **Compatibilidade**: Nem todo software suporta ARM64
- **Imagens Docker**: Algumas podem não estar disponíveis
- **Debugging**: Ferramentas podem ter diferenças

## 🔧 Comandos de Manutenção ARM64

### Build Multi-arch Local (se necessário)
```bash
# Configurar buildx para multi-arch
docker buildx create --use
docker buildx build --platform linux/arm64,linux/amd64 -t myapp .
```

### Backup Otimizado
```bash
# Backup com compressão otimizada para ARM64
tar -czf backup.tar.gz --use-compress-program="pigz -9" /path/to/data
```

### Monitoring Script
```bash
#!/bin/bash
# monitoring-arm64.sh
echo "=== ARM64 System Status ==="
echo "Architecture: $(uname -m)"
echo "CPU: $(nproc) cores"
echo "Memory: $(free -h | grep Mem | awk '{print $3"/"$2}')"
echo "Docker: $(docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}')"
```

---

## 📞 Suporte Específico t4g

### Issues Conhecidos
1. **Node.js native modules**: Podem precisar rebuild
2. **Binary dependencies**: Verificar compatibilidade ARM64
3. **Performance profiling**: Ferramentas podem diferir

### Resources
- [AWS Graviton Technical Guide](https://github.com/aws/aws-graviton-getting-started)
- [Docker ARM64 Best Practices](https://docs.docker.com/build/building/multi-platform/)
- [Node.js ARM64 Support](https://nodejs.org/en/download/)

---

✅ **Aplicação disponível em**: https://yourdomain.com  
🔍 **Health Check**: https://yourdomain.com/api/v1/health  
📊 **Monitoramento**: `htop`, `docker stats`, AWS CloudWatch