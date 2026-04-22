const SQL = require('sql.js');
SQL().then(SQL => {
  const db = new SQL.Database();
  db.exec('CREATE TABLE PedidoInfo (id TEXT PRIMARY KEY, texto TEXT, preco REAL, data_pedido DATETIME, data_entrega DATETIME, estado TEXT, clienteId TEXT, vendedorId TEXT, criado_em DATETIME, atualizado_em DATETIME)');
  console.log('Criou PedidoInfo');
}).catch(console.error);
