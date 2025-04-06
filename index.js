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
