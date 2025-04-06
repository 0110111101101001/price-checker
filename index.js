require('dotenv').config(); // 👈 permite usar .env localmente

const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// 👇 servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// 👇 inicialização segura do Firebase
let db;

try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  db = admin.firestore();
  console.log("🔥 Firebase inicializado com sucesso!");
} catch (error) {
  console.error("❌ Erro ao inicializar o Firebase:", error.message);
}

// 👇 função de simulação de preço
async function buscarPrecoSimulado(produto) {
  return parseFloat((Math.random() * 100).toFixed(2));
}

// 👉 ROTA PARA CADASTRAR PRODUTO
app.post('/cadastrar-produto', async (req, res) => {
  if (!db) return res.status(500).json({ status: 'Firestore não está disponível' });

  const { nome, preco, uid } = req.body;

  if (!nome || !preco || !uid) {
    return res.status(400).json({ status: 'Dados incompletos' });
  }

  await db.collection('produtos').add({ nome, preco, uid });
  res.send({ status: 'Produto cadastrado com sucesso!' });
});

// 👉 NOVA ROTA PARA CADASTRAR PUSH TOKEN
app.post('/cadastrar-usuario', async (req, res) => {
  if (!db) return res.status(500).json({ status: 'Firestore não está disponível' });

  const { uid, pushToken } = req.body;

  if (!uid || !pushToken) {
    return res.status(400).json({ status: 'UID e pushToken são obrigatórios' });
  }

  await db.collection('usuarios').doc(uid).set({ pushToken });
  res.json({ status: 'Push token cadastrado com sucesso!' });
});

// 👉 ROTA PARA VERIFICAR PREÇOS E ENVIAR NOTIFICAÇÕES
app.get('/verificar-precos', async (req, res) => {
  if (!db) return res.status(500).json({ status: 'Firestore não está disponível' });

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
    await axios.post('https://exp.host/--/api/v2/push/send', n);
  }

  res.send({ status: 'Verificação concluída', notificacoesEnviadas: notificacoes.length });
});

// ROTA PADRÃO
app.get('/', (req, res) => {
  res.send('API funcionando! 🚀');
});

// ROTA EXTRA (opcional, parece repetida)
app.post('/cadastrar-token', async (req, res) => {
  if (!db) return res.status(500).json({ status: 'Firestore não está disponível' });

  const { uid, pushToken } = req.body;

  if (!uid || !pushToken) {
    return res.status(400).json({ status: 'Dados incompletos' });
  }

  await db.collection('usuarios').doc(uid).set({ pushToken });
  res.json({ status: 'Token cadastrado com sucesso!' });
});

// INICIA O SERVIDOR
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
