const fs = require('fs');
const data = fs.readFileSync('prisma/dev.db');
const SQL = require('sql.js');

SQL().then(SQL => {
  // Carregar banco antigo
  const dbOld = new SQL.Database(data);

  // Criar novo banco com schema atualizado
  const dbNew = new SQL.Database();

  // Criar tabela Encomenda atualizada
  dbNew.exec(`
    CREATE TABLE Encomenda (
      id TEXT PRIMARY KEY,
      produtoId TEXT,
      produto TEXT,
      quantidade INT,
      custo_unit FLOAT,
      custo_total FLOAT,
      status TEXT,
      clienteId TEXT,
      vendedorId TEXT,
      criado_em DATETIME,
      pedido TEXT
    )
  `);

  // Copiar dados, adicionando valor padrão para pedido
  const rows = dbOld.exec('SELECT * FROM Encomenda');
  if (rows[0] && rows[0].values) {
    const insert = dbNew.prepare('INSERT INTO Encomenda (id, produtoId, produto, quantidade, custo_unit, custo_total, status, clienteId, vendedorId, criado_em, pedido) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    rows[0].values.forEach(v => {
      insert.run([
        v[0], v[1], v[2], v[3], v[4], v[5], v[6], v[7], v[8], v[9], 'Encomenda personalizada'
      ]);
    });
    insert.free();
  }

  // Verificar resultado
  const res = dbNew.exec('SELECT * FROM Encomenda');
  console.log('Encomendas na nova base:');
  if (res[0] && res[0].values) {
    res[0].values.forEach(v => {
      console.log(v[0].substring(0,8)+'... | Pedido:', v[10]);
    });
  }

  // Salvar nova base sobrescrevendo
  const updatedData = dbNew.export();
  fs.writeFileSync('prisma/dev.db', updatedData);
  console.log('Banco atualizado com sucesso!');

  dbOld.delete();
  dbNew.delete();
}).catch(console.error);