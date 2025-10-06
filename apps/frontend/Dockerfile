# Dockerfile para desenvolvimento - usando WASM Rollup para compatibilidade
FROM node:20-slim

# Instalar dependências necessárias
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Definir diretório de trabalho
WORKDIR /app

# Verificar se o usuário node já existe e criar se necessário
RUN id -u node >/dev/null 2>&1 || (groupadd --gid 1000 node \
  && useradd --uid 1000 --gid node --shell /bin/bash --create-home node)

# Copiar package.json e package-lock.json
COPY --chown=node:node apps/frontend/package*.json ./

# Instalar dependências (usando @rollup/wasm-node via overrides)
RUN npm install && npm cache clean --force

# Copiar tsconfig.base.json para o container primeiro
COPY --chown=node:node tsconfig.base.json ./
# Copiar código fonte mantendo estrutura apps/frontend/
COPY --chown=node:node apps/frontend/ ./apps/frontend/

# Criar diretório node_modules se não existir e corrigir permissões
RUN mkdir -p node_modules && chown -R node:node /app

# Mudar para usuário node
USER node

# Expor porta
EXPOSE 3003

# Mudar para diretório do frontend
WORKDIR /app/apps/frontend
# Comando de desenvolvimento
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3003"]