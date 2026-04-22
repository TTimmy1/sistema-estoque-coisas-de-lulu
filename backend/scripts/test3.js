const crypto = require('crypto');
function createToken() {
  const header = Buffer.from(JSON.stringify({alg: 'HS256', typ: 'JWT'})).toString('base64url');
  const payload = Buffer.from(JSON.stringify({id: 'test', iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000)+3600})).toString('base64url');
  const signature = crypto.createHmac('sha256', 'dev-secret-key-change-in-prod-2026').update(header + '.' + payload).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

(async () => {
  try {
    const token = createToken();
    const res = await fetch('http://localhost:3333/api/encomendas', {
      method: "POST",
      headers: {
        Authorization: 'Bearer ' + token,
        'x-loja-id': 'cmo378w940000xn2djjs0qe7t',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pedido: 'Test',
        nome_cliente: undefined,
        telefone_cliente: undefined,
        quantidade: 1,
        valor_unit: undefined,
        valor_total: undefined,
        status: 'EM_ANDAMENTO',
        previsao_entrega: undefined,
        vendedorId: 'some-cuid-here'
      })
    });
    const json = await res.json();
    console.log("STATUS:", res.status);
    console.log("RESPONSE:", json);
  } catch(e) {
    console.error(e)
  }
})();
