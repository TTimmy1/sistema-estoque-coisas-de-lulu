const SQL = require('sql.js');
SQL().then(SQL => {
  const db = new SQL.Database();
  db.exec('CREATE TABLE Produto (id TEXT PRIMARY KEY, nome TEXT, sku TEXT UNIQUE, custo REAL, preco_venda REAL, qtd_estoque INTEGER DEFAULT 0, criado_em DATETIME, movimentacoes TEXT)');
  console.log('Tabela criada');
  db.exec('PRAGMA table_info(Produto)');
  // Não dá pra ver com sql.js direto? Vamos tentar inserir com apenas 8 valores
  db.exec('INSERT INTO Produto VALUES ("teste","teste","SKU001",10,20,5,"2026-04-15 00:00:00",NULL)');
  console.log('Inserido');
}).catch(console.error);
