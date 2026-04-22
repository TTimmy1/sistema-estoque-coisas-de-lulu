const SQL = require('sql.js');
SQL().then(SQL => {
  const db = new SQL.Database();
  db.exec("CREATE TABLE Usuario (id TEXT PRIMARY KEY, nome TEXT, email TEXT UNIQUE, senha TEXT, criado_em DATETIME, movimentacoes TEXT)");
  console.log('OK');
}).catch(console.error);
