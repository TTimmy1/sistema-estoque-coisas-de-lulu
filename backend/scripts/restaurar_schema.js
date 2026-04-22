const fs = require('fs');
const data = fs.readFileSync('prisma/dev.db');
const SQL = require('sql.js');

SQL().then(SQL => {
  const db = new SQL.Database(data);

  // Recriar todas as tabelas e inserir dados salvos anteriormente
  db.exec(`
    CREATE TABLE IF NOT EXISTS Usuario (
      id TEXT PRIMARY KEY,
      nome TEXT,
      email TEXT UNIQUE,
      senha TEXT,
      criado_em DATETIME DEFAULT (datetime('now')),
      movimentacoes TEXT[]
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS Categoria (
      id TEXT PRIMARY KEY,
      nome TEXT UNIQUE,
      descricao TEXT,
      criado_em DATETIME DEFAULT (datetime('now')),
      produtos TEXT[]
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS Vendedor (
      id TEXT PRIMARY KEY,
      nome TEXT UNIQUE,
      criado_em DATETIME DEFAULT (datetime('now')),
      movimentacoes TEXT[],
      pedidos TEXT[]
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS Produto (
      id TEXT PRIMARY KEY,
      nome TEXT,
      descricao TEXT,
      sku TEXT UNIQUE,
      categoriaId TEXT,
      custo REAL,
      preco_venda REAL,
      qtd_estoque INTEGER DEFAULT 0,
      criado_em DATETIME DEFAULT (datetime('now')),
      atualizado_em DATETIME DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS Movimentacao (
      id TEXT PRIMARY KEY,
      usuarioId TEXT,
      produtoId TEXT,
      tipo TEXT,
      quantidade INTEGER,
      valor_unit REAL,
      valor_total REAL,
      observacao TEXT,
      criado_em DATETIME DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS Cliente (
      id TEXT PRIMARY KEY,
      nome TEXT,
      numero TEXT,
      criado_em DATETIME DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS Pedido (
      id TEXT PRIMARY KEY,
      texto TEXT,
      preco REAL,
      data_pedido DATETIME DEFAULT (datetime('now')),
      data_entrega DATETIME,
      status TEXT DEFAULT 'EM_PRODUCAO',
      clienteId TEXT,
      vendedorId TEXT,
      criado_em DATETIME DEFAULT (datetime('now')),
      atualizado_em DATETIME DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS Encomenda (
      id TEXT PRIMARY KEY,
      produtoId TEXT,
      produto TEXT,
      quantidade INTEGER,
      custo_unit REAL,
      custo_total REAL,
      status TEXT,
      clienteId TEXT,
      vendedorId TEXT,
      criado_em DATETIME DEFAULT (datetime('now')),
      pedido TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS _prisma_migrations (
      id TEXT PRIMARY KEY,
      migration_name TEXT,
      migration_hash TEXT,
      applied_steps_count INTEGER,
      migration_timestamp DATETIME DEFAULT (datetime('now'))
    )
  `);

  console.log('Esquema recriado');

  // Inserir dados de Usuarios (3)
  const insUsuario = db.prepare('INSERT OR IGNORE INTO Usuario (id, nome, email, senha, criado_em) VALUES (?, ?, ?, ?, ?)');
  insUsuario.run([
    'cmnzb9o6q0000gwiw40tjyrg5', 'timy', 'timoteo.s.g@gmail.com',
    '$2b$10$hidYsAHZOyo97VWq9CmyrOlwEZW6/a5qz70SrNDNU1vNlPzbV09ZG',
    '2026-04-15 00:27:27'
  ]);
  insUsuario.run([
    'cmo0cbnm90001gwiw0oq8qc6c', 'timoteo', 'claushsg@gmail.com',
    '$2b$10$U/TnA3tvZE.M6IH4lML2R.XuFl/ySSP6z09CYDu1tkBzcgeRlaQcq',
    '2026-04-15 17:44:45'
  ]);
  insUsuario.run([
    'cmo0mj4af0000gw90x8l19px3', 'Admin', 'admin@test.com',
    '$2b$10$nvlIDctpjZz2sFvETIbqzeihsW0cd/tfBfs7xH1w4UYFToxLi6ktC',
    '2026-04-15 22:30:29'
  ]);
  insUsuario.free();

  // Vendedor (1)
  const insVendedor = db.prepare('INSERT OR IGNORE INTO Vendedor (id, nome, criado_em) VALUES (?, ?, ?)');
  insVendedor.run(['cmo0eehgm0000gw0km9bj8osy', 'Timy', '2026-04-15 18:42:56']);
  insVendedor.free();

  // Categorias (2)
  const insCategoria = db.prepare('INSERT OR IGNORE INTO Categoria (id, nome, descricao, criado_em) VALUES (?, ?, ?, ?)');
  insCategoria.run(['cmo0d97o70000gw1gylcmkucr', 'Caneca Personalizada', 'caneca personalizada ', '2026-04-15 19:30:51']);
  insCategoria.run(['cmo0fe78i0004gwycyym5fq0t', 'Garrafa termica', '', '2026-04-15 20:30:51']);
  insCategoria.free();

  // Produtos (3)
  const insProduto = db.prepare('INSERT OR IGNORE INTO Produto (id, nome, sku, custo, preco_venda, qtd_estoque, criado_em, categoriaId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  insProduto.run([
    'cmo0dogx70001gwe8hfkxr10j', 'caceca', 'PRD-CAC62855', 30, 30, 2, '2026-04-15 19:42:42', 'cmo0d97o70000gw1gylcmkucr'
  ]);
  insProduto.run([
    'cmo0feqia0006gwyce7qo8kko', 'garrafa termica do stitch', 'PRD-GAR67952', 80, 11, 80, '2026-04-15 20:30:51', 'cmo0fe78i0004gwycyym5fq0t'
  ]);
  insProduto.run([
    'cmo0mm2a40002gw90p8wcs6b1', 'garrafa do stitch', 'PRD-GAR67110', 90, 90, 90, '2026-04-15 21:12:47', 'cmo0fe78i0004gwycyym5fq0t'
  ]);
  insProduto.free();

  // Movimentacoes (8)
  const insMov = db.prepare('INSERT OR IGNORE INTO Movimentacao (id, usuarioId, produtoId, tipo, quantidade, valor_unit, valor_total, observacao, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  insMov.run(['cmo0druqn0001gwjkd24uuyh6','cmo0cbnm90001gwiw0oq8qc6c','cmo0dogx70001gwe8hfkxr10j','ENTRADA',10,30,300,'caneca personalizada do stitch','2026-04-15 20:25:20']);
  insMov.run(['cmo0dsa5g0003gwjkrb385pgf','cmo0cbnm90001gwiw0oq8qc6c','cmo0dogx70001gwe8hfkxr10j','SAIDA_VENDA',2,30,60,'cliente victor','2026-04-15 20:25:40']);
  insMov.run(['cmo0ef09j0002gw0kliq9xmeh','cmo0cbnm90001gwiw0oq8qc6c','cmo0dogx70001gwe8hfkxr10j','SAIDA_VENDA',1,30,30,'victor','2026-04-15 20:26:40']);
  insMov.run(['cmo0el1sl0001gwycr4x91ejl','cmo0cbnm90001gwiw0oq8qc6c','cmo0dogx70001gwe8hfkxr10j','SAIDA_VENDA',4,30,120,'nome na garrafa THIAGO ','2026-04-15 20:28:02']);
  insMov.run(['cmo0f41te0003gwycpmp8t1a5','cmo0cbnm90001gwiw0oq8qc6c','cmo0feqia0006gwyce7qo8kko','ENTRADA',12,80,960,'sara','2026-04-15 20:31:56']);
  insMov.run(['cmo0fgi9f000agwycmp3omw29','cmo0cbnm90001gwiw0oq8qc6c','cmo0feqia0006gwyce7qo8kko','SAIDA_VENDA',1,80,80,'jamima','2026-04-15 20:32:30']);
  insMov.run(['cmo0mmw080004gw90ceua06dt','cmo0mj4af0000gw90x8l19px3','cmo0mm2a40002gw90p8wcs6b1','ENTRADA',3,90,270,'sara','2026-04-16 14:13:25']);
  insMov.run(['cmo0mo8i40006gw90ilmoethc','cmo0mj4af0000gw90x8l19px3','cmo0mm2a40002gw90p8wcs6b1','SAIDA_VENDA',1,90,90,'nome na garrafa THIAGO ','2026-04-16 14:14:28']);
  insMov.free();

  // Clientes
  const insCliente = db.prepare('INSERT OR IGNORE INTO Cliente (id, nome, numero, criado_em) VALUES (?, ?, ?, ?)');
  insCliente.run(['cmo0druqn0001gwjkd24uuyh6','nome na garrafa THIAGO ','14001010101010','2026-04-16 14:14:28']);
  insCliente.free();

  // Encomendas
  const insEncomenda = db.prepare('INSERT OR IGNORE INTO Encomenda (id, produtoId, produto, quantidade, custo_unit, custo_total, status, clienteId, vendedorId, criado_em, pedido) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  insEncomenda.run(['cmo0druqn0001gwjkd24uuyh6','cmo0dogx70001gwe8hfkxr10j','caneca personalizada do stitch',10,30,300,'PENDENTE','cmo0druqn0001gwjkd24uuyh6','cmo0eehgm0000gw0km9bj8osy','2026-04-15 20:25:20','Encomenda personalizada']);
  insEncomenda.run(['cmo0dsa5g0003gwjkrb385pgf','cmo0dogx70001gwe8hfkxr10j','caneca do stitch',2,30,60,'A_CAMINHO','cmo0druqn0001gwjkd24uuyh6','cmo0eehgm0000gw0km9bj8osy','2026-04-15 20:25:40','Encomenda personalizada']);
  insEncomenda.run(['cmo0ef09j0002gw0kliq9xmeh','cmo0dogx70001gwe8hfkxr10j','caneca do stitch',1,30,30,'RECEBIDA','cmo0druqn0001gwjkd24uuyh6','cmo0eehgm0000gw0km9bj8osy','2026-04-15 20:26:40','Encomenda personalizada']);
  insEncomenda.run(['cmo0el1sl0001gwycr4x91ejl','cmo0dogx70001gwe8hfkxr10j','caneca do stitch',4,30,120,'CANCELADA','cmo0druqn0001gwjkd24uuyh6','cmo0eehgm0000gw0km9bj8osy','2026-04-15 20:28:02','Encomenda personalizada']);
  insEncomenda.run(['cmo0f41te0003gwycpmp8t1a5','cmo0feqia0006gwyce7qo8kko','caneca personalizada',12,80,960,'PENDENTE','cmo0druqn0001gwjkd24uuyh6','cmo0eehgm0000gw0km9bj8osy','2026-04-15 20:31:56','Encomenda personalizada']);
  insEncomenda.run(['cmo0fgi9f000agwycmp3omw29','cmo0feqia0006gwyce7qo8kko','caneca do stitch',1,80,80,'RECEBIDA','cmo0druqn0001gwjkd24uuyh6','cmo0eehgm0000gw0km9bj8osy','2026-04-15 20:32:30','Encomenda personalizada']);
  insEncomenda.run(['cmo0mmw080004gw90ceua06dt','cmo0mj4af0000gw90x8l19px3','cmo0mm2a40002gw90p8wcs6b1','ENTRADA',3,90,270,'sara','cmo0eehgm0000gw0km9bj8osy','2026-04-16 14:13:25','Encomenda personalizada']);
  insEncomenda.run(['cmo0mo8i40006gw90ilmoethc','cmo0mj4af0000gw90x8l19px3','cmo0mm2a40002gw90p8wcs6b1','SAIDA_VENDA',1,90,90,'nome na garrafa THIAGO ','cmo0eehgm0000gw0km9bj8osy','2026-04-16 14:14:28','Encomenda personalizada']);
  insEncomenda.free();

  // Atualizar a tabela Encomenda com a nova coluna
  db.exec(`
    CREATE TABLE Encomenda_new (
      id TEXT PRIMARY KEY,
      produtoId TEXT,
      produto TEXT,
      quantidade INTEGER,
      custo_unit REAL,
      custo_total REAL,
      status TEXT,
      clienteId TEXT,
      vendedorId TEXT,
      criado_em DATETIME DEFAULT (datetime('now')),
      pedido TEXT
    )
  `);

  db.exec(`
    INSERT INTO Encomenda_new (id, produtoId, produto, quantidade, custo_unit, custo_total, status, clienteId, vendedorId, criado_em, pedido)
    SELECT id, produtoId, produto, quantidade, custo_unit, custo_total, status, clienteId, vendedorId, criado_em, 'Encomenda personalizada'
    FROM Encomenda
  `);

  db.exec('DROP TABLE Encomenda');
  db.exec('ALTER TABLE Encomenda_new RENAME TO Encomenda');

  // Confirmar o resultado
  const res = db.exec('SELECT * FROM Encomenda');
  console.log('\\nEncomendas restauradas:');
  res[0].values.forEach(v => {
    console.log('  ID:', v[0].substring(0,8)+'... | Pedido:', v[10]);
  });

}).catch(err => {
  console.error('Erro:', err);
});