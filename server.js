const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = 3000;

// ===== MIDDLEWARES =====
app.use(express.json());
app.use(cors());
app.use(express.static('.')); // Serve os ficheiros HTML, CSS e JS da pasta atual

// ===== LIGAÇÃO AO MONGODB ATLAS =====
// Substitui a string abaixo pela tua string oficial de ligação ao MongoDB Atlas se necessário
const MONGO_URI = 'SUA_STRING_DE_LIGACAO_DO_MONGODB_ATLAS'; 

mongoose.connect(MONGO_URI)
  .then(() => console.log('Conectado ao MongoDB Atlas com sucesso!'))
  .catch(err => console.error('Erro ao conectar ao MongoDB Atlas:', err));

// ===== SCHEMA E MODELO DE UTILIZADOR =====
const usuarioSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  tipo: { type: String, default: 'cliente' }
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

// ===== ROTA DE CADASTRO =====
app.post('/api/cadastro', async (req, res) => {
  try {
    const { nome, email, senha, tipo } = req.body;
    
    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ mensagem: 'Este e-mail já está registado.' });
    }

    const novoUsuario = new Usuario({ nome, email, senha, tipo });
    await novoUsuario.save();

    res.status(201).json({ mensagem: 'Conta criada com sucesso!' });
  } catch (error) {
    console.error('Erro no cadastro:', error);
    res.status(500).json({ mensagem: 'Erro interno no servidor ao cadastrar.' });
  }
});

// ===== ROTA DE LOGIN =====
app.post('/api/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Procura o utilizador com o e-mail e palavra-passe correspondentes
    const usuario = await Usuario.findOne({ email, senha });
    if (!usuario) {
      return res.status(401).json({ mensagem: 'E-mail ou palavra-passe incorretos!' });
    }

    // Responde com sucesso e os dados do utilizador em formato JSON puro
    res.status(200).json({
      mensagem: 'Login efetuado com sucesso!',
      utilizador: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ mensagem: 'Erro interno no servidor ao fazer login.' });
  }
});

// ===== INICIAR O SERVIDOR =====
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});