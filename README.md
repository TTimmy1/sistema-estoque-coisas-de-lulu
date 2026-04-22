# Sistema de Controle de Estoque

Sistema web completo para gerenciamento de estoque com rastreabilidade total de entradas, saídas, valores e responsabilidades.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | Node.js + Express + TypeScript + Prisma |
| Frontend | React 18 + Vite + TailwindCSS |
| Banco | PostgreSQL 16 |
| Auth | JWT (jsonwebtoken + bcrypt) |
| Container | Docker + docker-compose |

## Banco de Dados

```
Usuario (1) ──── (N) Movimentacao (N) ──── (1) Produto (N) ──── (1) Categoria
```

- **Usuario**: id, nome, email, senha (hash), criado_em
- **Produto**: id, nome, descricao, sku, categoria_id, custo, preco_venda, qtd_estoque, criado_em
- **Categoria**: id, nome, descricao, criado_em
- **Movimentacao**: id, usuario_id, produto_id, tipo (ENTRADA/SAIDA_VENDA/SAIDA_DESCARTE), quantidade, valor_unit (congelado), valor_total, observacao, criado_em

## Como Rodar com Docker

```bash
# Subir todos os serviços
docker compose up -d --build

# Acessar
# Frontend: http://localhost
# Backend API: http://localhost:3333
# PostgreSQL: localhost:5432
```

## Como Rodar Localmente (Desenvolvimento)

### Backend
```bash
cd backend
cp .env.example .env   # edite o DATABASE_URL para seu Postgres local
npm install
npx prisma migrate dev
npm run dev            # http://localhost:3333
```

### Frontend
```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

## API RESTful

### Auth
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Registrar novo usuário |
| POST | `/api/auth/login` | Login (retorna JWT) |

### Produtos (requer autenticação)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/produtos` | Listar produtos (com busca) |
| GET | `/api/produtos/:id` | Detalhes do produto |
| POST | `/api/produtos` | Criar produto |
| PUT | `/api/produtos/:id` | Atualizar produto |
| DELETE | `/api/produtos/:id` | Remover produto |

### Movimentações (requer autenticação)
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/movimentacoes/entrada` | Registrar entrada de estoque |
| POST | `/api/movimentacoes/saida` | Registrar saída/venda/descarte |
| GET | `/api/movimentacoes` | Histórico com filtros e paginação |
| GET | `/api/movimentacoes/:id` | Detalhes da movimentação |
| GET | `/api/movimentacoes/dashboard` | Resumo do dashboard |

### Categorias (requer autenticação)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/categorias` | Listar categorias |
| POST | `/api/categorias` | Criar categoria |
| DELETE | `/api/categorias/:id` | Remover categoria |

### Exemplos de Uso

**Registrar entrada:**
```bash
curl -X POST http://localhost:3333/api/movimentacoes/entrada \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"produtoId":"uuid-aqui","quantidade":50,"custo":15.90,"observacao":"Fornecedor XYZ"}'
```

**Registrar venda:**
```bash
curl -X POST http://localhost:3333/api/movimentacoes/saida \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"produtoId":"uuid-aqui","quantidade":5,"tipo":"SAIDA_VENDA","observacao":"Cliente João"}'
```

## Regras de Negócio

1. **Entrada**: soma quantidade ao estoque, registra custo do lote, congela valor na movimentação
2. **Saída (Venda)**: congela o `preco_venda` vigente no momento da transação
3. **Saída (Descarte)**: congela o `custo` do produto
4. **Validação**: bloqueia saída se quantidade > estoque disponível
5. **Transação atômica**: movimentação e atualização de estoque ocorrem na mesma transação DB
6. **Timestamps automáticos**: todas as tabelas registram `criado_em` automaticamente
7. **Rastreabilidade**: toda movimentação amarrada ao `usuario_id` de quem executou
