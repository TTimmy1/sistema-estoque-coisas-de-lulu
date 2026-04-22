const fs = require('fs');
const data = fs.readFileSync('prisma/dev.db');
const SQL = require('sql.js');

SQL().then(SQL => {
  const db = new SQL.Database(data);

  // Adicionar coluna 'pedido' se não existir
  try {
    db.exec('ALTER TABLE Encomenda ADD COLUMN pedido TEXT');
    console.log('Coluna "pedido" adicionada com sucesso');
  } catch(e) {
    console.log('Coluna já existe ou erro:', e.message);
  }

  // Atualizar registros existentes
  db.exec("UPDATE Encomenda SET pedido = 'Encomenda personalizada' WHERE pedido IS NULL OR pedido = ''");
  console.log('Registros atualizados');

  // Verificar resultado
  const rows = db.exec('SELECT id, pedido FROM Encomenda');
  console.log('\nEncomendas atualizadas:');
  rows[0].values.forEach(v => {
    console.log('  ID:', v[0].substring(0,8)+'... | Pedido:', v[1]);
  });

}).catch(console.error);