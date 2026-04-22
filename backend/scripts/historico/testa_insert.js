const SQL = require('sql.js');
SQL().then(SQL => {
  const db = new SQL.Database();
  db.exec('CREATE TABLE Produto (id TEXT PRIMARY KEY, nome TEXT, sku TEXT UNIQUE, custo REAL, preco_venda REAL, qtd_estoque INTEGER DEFAULT 0, criado_em DATETIME, movimentacoes TEXT)');
  db.exec('INSERT INTO Produto VALUES ("cmo0dogx70001gwe8hfkxr10j","caceca","PRD-CAC62855",30,30,2,"2026-04-15 19:42:42","2026-04-15 19:42:42",NULL)');
  console.log('Inseriu!');
}).catch(console.error);
