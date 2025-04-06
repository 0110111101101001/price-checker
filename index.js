const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const axios = require('axios');
const path = require('path'); // 👈 importação do 'path' (estava faltando!)

const app = express();
app.use(cors());
app.use(express.json());

// 👇 servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

const serviceAccount = require('./serviceAccountKey.json'); // 👈 você tinha duplicado isso, mantive só uma vez

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const expoPushEndpoint = 'https://exp.host/--/api/v2/push/send';

async function buscarPrecoSimulado(produto) {
  return parseFloat((Math.random() * 100).toFixed(2));
}

// 👉 ROTA PARA CADASTRAR PRODUTO
app.post('/cadastrar-produto', async (req, res) => {
  const { nome, preco, uid } = req.body;

  if (!nome || !preco || !uid) {
    return res.status(400).json({ status: 'Dados incompletos' });
  }

  await db.collection('produtos').add({ nome, preco, uid });
  res.send({ status: 'Produto cadastrado com sucesso!' });
});

// 👉 NOVA ROTA PARA CADASTRAR PUSH TOKEN
app.post('/cadastrar-usuario', async (req, res) => {
  const { uid, pushToken } = req.body;

  if (!uid || !pushToken) {
    return res.status(400).json({ status: 'UID e pushToken são obrigatórios' });
  }

  await db.collection('usuarios').doc(uid).set({ pushToken });
  res.json({ status: 'Push token cadastrado com sucesso!' });
});

// 👉 ROTA PARA VERIFICAR PREÇOS E ENVIAR NOTIFICAÇÕES
app.get('/verificar-precos', async (req, res) => {
  const produtosSnapshot = await db.collection('produtos').get();
  const notificacoes = [];

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

// ROTA PADRÃO
app.get('/', (req, res) => {
  res.send('API funcionando! 🚀');
});

// ROTA EXTRA (opcional, parece repetida)
app.post('/cadastrar-token', async (req, res) => {
  const { uid, pushToken } = req.body;

  if (!uid || !pushToken) {
    return res.status(400).json({ status: 'Dados incompletos' });
  }

  await db.collection('usuarios').doc(uid).set({ pushToken });
  res.json({ status: 'Token cadastrado com sucesso!' });
});

// INICIA O SERVIDOR
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

