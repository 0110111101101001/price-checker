const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const expoPushEndpoint = 'https://exp.host/--/api/v2/push/send';

async function buscarPrecoSimulado(produto) {
  return parseFloat((Math.random() * 100).toFixed(2));
}

app.get('/verificar-precos', async (req, res) => {
  const produtosSnapshot = await db.collection('produtos').get();
  const notificacoes = [];
app.post('/cadastrar-produto', async (req, res) => {
  const { nome, preco, uid } = req.body;

  if (!nome || !preco || !uid) {
    return res.status(400).json({ status: 'Dados incompletos' });
  }

  await db.collection('produtos').add({
    nome,
    preco,
    uid,
  });

  res.json({ status: 'Produto cadastrado com sucesso!' });
});

  for (const doc of produtosSnapshot.docs) {
    const produto = doc.data();
    const precoAtual = await buscarPrecoSimulado(produto);

    if (precoAtual <= produto.preco) {
      const userDoc = await db.collection('usuarios').doc(produto.uid).get();
      const userData = userDoc.data();

      if (userData && userData.pushToken) {
        notificacoes.push({
          to: userData.pushToken,
          title: 'Oferta encontrada!',
          body: `${produto.nome} está por R$${precoAtual}!`,
        });
      }
    }
  }

  for (const n of notificacoes) {
    await axios.post(expoPushEndpoint, n);
  }

  res.send({ status: 'Verificação concluída', notificacoesEnviadas: notificacoes.length });
});
app.get('/', (req, res) => {
  res.send('API funcionando! 🚀');
});
app.post('/cadastrar-produto', async (req, res) => {
  const { nome, preco, uid } = req.body;

  await db.collection('produtos').add({
    nome,
    preco,
    uid,
  });

  res.send({ status: 'Produto cadastrado com sucesso!' });
});

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));
