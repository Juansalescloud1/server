const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARES =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());
app.use(express.static('.'));

// ===== LIGAÇÃO AO MONGODB ATLAS =====
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://juannsales98_db_user:154545454fwfw3rvfgtt@livrariaon.ed8lz3m.mongodb.net/?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Conectado ao MongoDB Atlas com sucesso!'))
  .catch(err => console.error('Erro ao conectar ao MongoDB Atlas:', err));

// ===== SCHEMA E MODELO DE UTILIZADOR =====
const usuarioSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  tipo: { type: String, default: 'cliente' },
  telefone: { type: String, default: '' },
  foto: { type: String, default: '' },
  endereco: {
    rua: { type: String, default: '' },
    numero: { type: String, default: '' },
    bairro: { type: String, default: '' },
    cidade: { type: String, default: '' },
    cep: { type: String, default: '' }
  }
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

// ===== SCHEMA E MODELO DE PEDIDO =====
const pedidoSchema = new mongoose.Schema({
  usuarioId: { type: String, required: true },
  nomeCliente: { type: String, default: '' },
  idPedido: { type: String, required: true },
  data: { type: String, required: true },
  itens: { type: Array, required: true },
  total: { type: Number, required: true },
  status: { type: String, default: 'Em Separação' }
});

const Pedido = mongoose.model('Pedido', pedidoSchema);

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

    const usuario = await Usuario.findOne({ email, senha });
    if (!usuario) {
      return res.status(401).json({ mensagem: 'E-mail ou palavra-passe incorretos!' });
    }

    res.status(200).json({
      mensagem: 'Login efetuado com sucesso!',
      utilizador: {
        _id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo,
        telefone: usuario.telefone,
        foto: usuario.foto,
        endereco: usuario.endereco
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ mensagem: 'Erro interno no servidor ao fazer login.' });
  }
});

// ===== ROTA DE ATUALIZAÇÃO DE PERFIL =====
app.put('/api/usuario/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, telefone, foto, senhaAtual, novaSenha, endereco } = req.body;

    const usuario = await Usuario.findById(id);
    if (!usuario) {
      return res.status(404).json({ mensagem: 'Utilizador não encontrado.' });
    }

    if (novaSenha && novaSenha.trim() !== '') {
      if (usuario.senha !== senhaAtual) {
        return res.status(400).json({ mensagem: 'A senha atual está incorreta.' });
      }
      usuario.senha = novaSenha;
    }

    usuario.nome = nome || usuario.nome;
    usuario.telefone = telefone !== undefined ? telefone : usuario.telefone;
    usuario.foto = foto !== undefined ? foto : usuario.foto;
    if (endereco) {
      usuario.endereco = {
        rua: endereco.rua !== undefined ? endereco.rua : usuario.endereco.rua,
        numero: endereco.numero !== undefined ? endereco.numero : usuario.endereco.numero,
        bairro: endereco.bairro !== undefined ? endereco.bairro : usuario.endereco.bairro,
        cidade: endereco.cidade !== undefined ? endereco.cidade : usuario.endereco.cidade,
        cep: endereco.cep !== undefined ? endereco.cep : usuario.endereco.cep
      };
    }

    await usuario.save();

    res.status(200).json({
      mensagem: 'Perfil atualizado com sucesso!',
      utilizador: {
        _id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo,
        telefone: usuario.telefone,
        foto: usuario.foto,
        endereco: usuario.endereco
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ mensagem: 'Erro interno ao atualizar perfil.' });
  }
});

// ===== ROTAS DE PEDIDOS =====

// Criar um novo pedido
app.post('/api/pedidos', async (req, res) => {
  try {
    const novoPedido = new Pedido(req.body);
    await novoPedido.save();
    res.status(201).json({ mensagem: 'Pedido criado com sucesso!', pedido: novoPedido });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ mensagem: 'Erro interno ao criar pedido.' });
  }
});

// Listar pedidos
app.get('/api/pedidos', async (req, res) => {
  try {
    const { usuarioId } = req.query;
    let filtro = usuarioId ? { usuarioId } : {};
    const pedidos = await Pedido.find(filtro);
    res.status(200).json(pedidos);
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    res.status(500).json({ mensagem: 'Erro interno ao buscar pedidos.' });
  }
});

// Atualizar o status de um pedido
app.put('/api/pedidos/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const pedidoAtualizado = await Pedido.findOneAndUpdate(
      { idPedido: req.params.id },
      { status },
      { new: true }
    );
    if (!pedidoAtualizado) {
      return res.status(404).json({ mensagem: 'Pedido não encontrado.' });
    }
    res.status(200).json({ mensagem: 'Status atualizado com sucesso!', pedido: pedidoAtualizado });
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    res.status(500).json({ mensagem: 'Erro interno ao atualizar status.' });
  }
});

// ===== INICIAR O SERVIDOR / EXPORTAR PARA A VERCEL =====
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

module.exports = app;