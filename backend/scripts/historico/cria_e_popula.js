const SQL = require('sql.js');
const fs = require('fs');

SQL().then(SQL => {
  const db = new SQL.Database();

  // Criar tabelas
  db.exec(`CREATE TABLE Usuario (id TEXT PRIMARY KEY, nome TEXT, email TEXT UNIQUE, senha TEXT, criado_em DATETIME DEFAULT (datetime('now')), movimentacoes TEXT)`);
  db.exec(`CREATE TABLE Categoria (id TEXT PRIMARY KEY, nome TEXT UNIQUE, descricao TEXT, criado_em DATETIME DEFAULT (datetime('now')), produtos TEXT)`);
  db.exec(`CREATE TABLE Vendedor (id TEXT PRIMARY KEY, nome TEXT UNIQUE, criado_em DATETIME DEFAULT (datetime('now')), movimentacoes TEXT, pedidos TEXT)`);
  db.exec(`CREATE TABLE Produto (id TEXT PRIMARY KEY, nome TEXT, sku TEXT UNIQUE, custo REAL, preco_venda REAL, qtd_estoque INTEGER DEFAULT 0, criado_em DATETIME DEFAULT (datetime('now')), movimentacoes TEXT)`);
  db.exec(`CREATE TABLE Movimentacao (id TEXT PRIMARY KEY, usuarioId TEXT, produtoId TEXT, tipo TEXT, quantidade INTEGER, valor_unit REAL, valor_total REAL, observacao TEXT, criado_em DATETIME DEFAULT (datetime('now')))`);
  db.exec(`CREATE TABLE Cliente (id TEXT PRIMARY KEY, nome TEXT, numero TEXT, criado_em DATETIME DEFAULT (datetime('now')))`);
  db.exec(`CREATE TABLE Pedido (id TEXT PRIMARY KEY, texto TEXT, preco REAL, data_pedido DATETIME DEFAULT (datetime('now')), data_entrega DATETIME, status TEXT DEFAULT 'EM_PRODUCAO', clienteId TEXT, vendedorId TEXT, criado_em DATETIME DEFAULT (datetime('now')), atualizado_em DATETIME DEFAULT (datetime('now')))`);
  db.exec(`CREATE TABLE Encomenda (id TEXT PRIMARY KEY, produtoId TEXT, produto TEXT, quantidade INTEGER, custo_unit REAL, custo_total REAL, status TEXT, clienteId TEXT, vendedorId TEXT, criado_em DATETIME DEFAULT (datetime('now')), pedido TEXT)`);
  db.exec(`CREATE TABLE _prisma_migrations (id TEXT PRIMARY KEY, migration_name TEXT, migration_hash TEXT, applied_steps_count INTEGER, migration_timestamp DATETIME DEFAULT (datetime('now')))`);

  // Inserir dados Usuarios
  db.exec(`INSERT INTO Usuario VALUES
    ('cmnzb9o6q0000gwiw40tjyrg5','timy','timoteo.s.g@gmail.com','\$2b\$10\$hidYsAHZOyo97VWq9CmyrOlwEZW6/a5qz70SrNDNU1vNlPzbV09ZG','2026-04-15 00:27:27',NULL);
    ('cmo0cbnm90001gwiw0oq8qc6c','timoteo','claushsg@gmail.com','\$2b\$10\$U/TnA3tvZE.M6IH4lML2R.XuFl/ySSP6z09CYDu1tkBzcgeRlaQcq','2026-04-15 17:44:45',NULL);
    ('cmo0mj4af0000gw90x8l19px3','Admin','admin@test.com','\$2b\$10\$nvlIDctpjZz2sFvETIbqzeihsW0cd/tfBfs7xH1w4UYFToxLi6ktC','2026-04-15 22:30:29',NULL);
  `);

  // Vendedor
  db.exec(`INSERT INTO Vendedor VALUES ('cmo0eehgm0000gw0km9bj8osy','Timy','2026-04-15 18:42:56','','');`);

  // Categorias
  db.exec(`INSERT INTO Categoria VALUES
    ('cmo0d97o70000gw1gylcmkucr','Caneca Personalizada','caneca personalizada ','2026-04-15 19:30:51','');
    ('cmo0fe78i0004gwycyym5fq0t','Garrafa termica','',2026-04-15 20:30:51,'');
  `);

  // Produtos
  db.exec(`INSERT INTO Produto VALUES
    ('cmo0dogx70001gwe8hfkxr10j','caceca','PRD-CAC62855',30,30,2,'2026-04-15 19:42:42','2026-04-15 19:42:42',NULL);
    ('cmo0feqia0006gwyce7qo8kko','garrafa termica do stitch','PRD-GAR67952',80,11,80,'2026-04-15 20:30:51','2026-04-15 20:30:51',NULL);
    ('cmo0mm2a40002gw90p8wcs6b1','garrafa do stitch','PRD-GAR67110',90,90,90,'2026-04-15 21:12:47','2026-04-15 21:12:47',NULL);
  `);

  // Movimentacoes
  db.exec(`INSERT INTO Movimentacao VALUES
    ('cmo0druqn0001gwjkd24uuyh6','cmo0cbnm90001gwiw0oq8qc6c','cmo0dogx70001gwe8hfkxr10j','ENTRADA',10,30,300,'caneca personalizada do stitch','2026-04-15 20:25:20');
    ('cmo0dsa5g0003gwjkrb385pgf','cmo0cbnm90001gwiw0oq8qc6c','cmo0dogx70001gwe8hfkxr10j','SAIDA_VENDA',2,30,60,'cliente victor','2026-04-15 20:25:40');
    ('cmo0ef09j0002gw0kliq9xmeh','cmo0cbnm90001gwiw0oq8qc6c','cmo0dogx70001gwe8hfkxr10j','SAIDA_VENDA',1,30,30,'victor','2026-04-15 20:26:40');
    ('cmo0el1sl0001gwycr4x91ejl','cmo0cbnm90001gwiw0oq8qc6c','cmo0dogx70001gwe8hfkxr10j','SAIDA_VENDA',4,30,120,'nome na garrafa THIAGO ','2026-04-15 20:28:02');
    ('cmo0f41te0003gwycpmp8t1a5','cmo0cbnm90001gwiw0oq8qc6c','cmo0feqia0006gwyce7qo8kko','ENTRADA',12,80,960,'sara','2026-04-15 20:31:56','2026-04-15 20:31:56');
    ('cmo0fgi9f000agwycmp3omw29','cmo0cbnm90001gwiw0oq8qc6c','cmo0feqia0006gwyce7qo8kko','SAIDA_VENDA',1,80,80,'jamima','2026-04-15 20:32:30','2026-04-15 20:32:30');
    ('cmo0mmw080004gw90ceua06dt','cmo0mj4af0000gw90x8l19px3','cmo0mm2a40002gw90p8wcs6b1','ENTRADA',3,90,270,'sara','2026-04-16 14:13:25','2026-04-16 14:13:25');
    ('cmo0mo8i40006gw90ilmoethc','cmo0mj4af0000gw90x8l19px3','cmo0mm2a40002gw90p8wcs6b1','SAIDA_VENDA',1,90,90,'nome na garrafa THIAGO ','2026-04-16 14:14:28','2026-04-16 14:14:28');
  `);

  // Clientes
  db.exec(`INSERT INTO Cliente VALUES
    ('cmo0druqn0001gwjkd24uuyh6','nome na garrafa THIAGO ','14001010101010','2026-04-16 14:14:28');
  `);

  // Encomendas
  db.exec(`INSERT INTO Encomenda VALUES
    ('cmo0druqn0001gwjkd24uuyh6','cmo0dogx70001gwe8hfkxr10j','caneca personalizada do stitch',10,30,300,'PENDENTE','cmo0druqn0001gwjkd24uuyh6','cmo0eehgm0000gw0km9bj8osy','2026-04-15 20:25:20','Encomenda personalizada');
    ('cmo0dsa5g0003gwjkrb385pgf','cmo0dogx70001gwe8hfkxr10j','caneca do stitch',2,30,60,'A_CAMINHO','cmo0druqn0001gwjkd24uuyh6','cmo0eehgm0000gw0km9bj8osy','2026-04-15 20:25:40','Encomenda personalizada');
    ('cmo0ef09j0002gw0kliq9xmeh','cmo0dogx70001gwe8hfkxr10j','caneca do stitch',1,30,30,'RECEBIDA','cmo0druqn0001gwjkd24uuyh6','cmo0eehgm0000gw0km9bj8osy','2026-04-15 20:26:40','Encomenda personalizada');
    ('cmo0el1sl0001gwycr4x91ejl','cmo0dogx70001gwe8hfkxr10j','caneca do stitch',4,30,120,'CANCELADA','cmo0druqn0001gwjkd24uuyh6','cmo0eehgm0000gw0km9bj8osy','2026-04-15 20:28:02','Encomenda personalizada');
    ('cmo0f41te0003gwycpmp8t1a5','cmo0feqia0006gwyce7qo8kko','caneca personalizada',12,80,960,'PENDENTE','cmo0druqn0001gwjkd24uuyh6','cmo0eehgm0000gw0km9bj8osy','2026-04-15 20:31:56','Encomenda personalizada');
    ('cmo0fgi9f000agwycmp3omw29','cmo0feqia0006gwyce7qo8kko','caneca do stitch',1,80,80,'RECEBIDA','cmo0druqn0001gwjkd24uuyh6','cmo0eehgm0000gw0km9bj8osy','2026-04-15 20:32:30','Encomenda personalizada');
    ('cmo0mmw080004gw90ceua06dt','cmo0mj4af0000gw90x8l19px3','cmo0mm2a40002gw90p8wcs6b1','ENTRADA',3,90,270,'sara','cmo0eehgm0000gw0km9bj8osy','2026-04-16 14:13:25','Encomenda personalizada');
    ('cmo0mo8i40006gw90ilmoethc','cmo0mj4af0000gw90x8l19px3','cmo0mm2a40002gw90p8wcs6b1','SAIDA_VENDA',1,90,90,'nome na garrafa THIAGO ','cmo0eehgm0000gw0km9bj8osy','2026-04-16 14:14:28','Encomenda personalizada');
  `);

  // Atualizar Encomenda com coluna pedido
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

  db.exec(`INSERT INTO Encomenda_new SELECT *, 'Encomenda personalizada' FROM Encomenda;`);
  db.exec(`DROP TABLE Encomenda;`);
  db.exec(`ALTER TABLE Encomenda_new RENAME TO Encomenda;`);

  const out = db.export();
  fs.writeFileSync('prisma/dev.db', out);
  console.log('Banco criado e populado com sucesso!');

}).catch(err => {
  console.error('Erro:', err);
});