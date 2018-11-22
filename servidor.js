const port = (process.env.PORT || 5000)
const express = require('express')
const MensagensDAO = require('./mensagensDAO')
const msgDAO = new MensagensDAO()
const showdown = require('showdown')
const io = require('socket.io')
const converter = new showdown.Converter({
  simplifiedAutoLink: true,
  simpleLineBreaks: false
})

let app = express()

app.use(express.static(__dirname + '/dist'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/dist/index.html')
})

let server, socket
let userMap = Object.create(null)

msgDAO.connect()
  .then(init)
  .catch(console.error)

// Função de inicialização
function init() {
  server = app.listen(port, () => console.log('Servidor subiu.'))
  socket = io.listen(server)

  socket.on('connection', (socketConn) => {
    if (msgDAO.dbOffline) {
      socketConn.emit('ready', {
        id: socketConn.client.id,
        msgs: []
      })
    } else {
      msgDAO.getMsgs()
        .then(msgs => {
          for (let msg of msgs) {
            msg.msg = converter.makeHtml(msg.msg)
          }
          socketConn.emit('ready', {
            id: socketConn.client.id,
            msgs
          })
        })
        .catch(console.error)
    }

    socketConn.on('usuarioSeConectou', usuarioSeConectou.bind(socketConn))
    socketConn.on('novoUsuario', novoUsuario.bind(socketConn))
    socketConn.on('disconnect', disconnect.bind(socketConn))
    socketConn.on('msgParaServidor', msgParaServidor.bind(socketConn))
  })
}

// Funções principais
function usuarioSeConectou (data) {
  console.log('Usuário ' + data.nomeUsuario + ' se conectou (id: ' + data.id + ')')
  userMap[data.id] = data.nomeUsuario
}

function anunciar(data, socket) {
  console.info(`Usuário ${data.nomeUsuario} ${msgDAO.dbOffline ? 'registrado' : 'cadastrado'}!`)
  userMap[data.id] = data.nomeUsuario
  data.msg = msgBoasVindas()
  socket.broadcast.emit('usuarioEntrou', data)
}

function novoUsuario(data) {
  let socket = this
  console.log('Tentando adicionar usuário ' + data.nomeUsuario)
  if (msgDAO.dbOffline) {
    socket.emit('resultCadastro', {
      err: null,
      res: null,
      usuario: data.nomeUsuario
    })
    anunciar(data, socket)
  } else {
    msgDAO.inserirUsuario({
      usuario: data.nomeUsuario
    }).then(res => {
      socket.emit('resultCadastro', {
        err: null,
        res,
        usuario: data.nomeUsuario
      })
      anunciar(data, socket)
    })
      .catch(console.error)
  }
}

function disconnect() {
  let socket = Object.assign({}, this)
  console.info('Usuário ' + userMap[socket.client.id] + ' desconectou')
  delete userMap[socket.client.id]
}

function msgParaServidor(data) {
  let socket = this
  console.log('mensagem de ' + data.nomeUsuario + ': ' + data.msg)
  let msg = {
    usuario: data.nomeUsuario,
    timestamp: Date.now(),
    msg: data.msg
  }
  msgDAO.inserirMsg(msg)
    .catch(console.error)
  data.msg = converter.makeHtml(data.msg)
  // Diálogo 
  socket.emit('msgParaCliente', {
    msgs: [{
      usuario: data.nomeUsuario,
      msg: data.msg,
      autor: true
    }]

  })
  socket.broadcast.emit('msgParaCliente', {
    msgs: [{
      usuario: data.nomeUsuario,
      msg: data.msg,
      autor: false
    }]
  })
}

const msgsArray = [
  '{usuario} acabou de entrar na conversa - boa sorte e divirta-se!',
  '{usuario} acabou de entrar. Todo mundo, finjam que estão ocupados!',
  '{usuario} entrou na sua conversa. Cuidado.',
  'Meldels. {usuario} chegou.',
  'Um {usuario} selvagem apareceu.',
  'Vuuuush. {usuario} acabou de aterrissar.',
  'Preparem-se. {usuario} acabou de entrar na conversa.',
  '{usuario} acabou de entrar. Escondam seus Skilhos.',
  '{usuario} acabou de deslizar para essa conversa.',
  'Um {usuario} apareceu na conversa.',
  'Grande {usuario} apareceu!',
  '{usuario} pulou para a conversa. Canguru!!',
  '{usuario} apareceu. Segure minha cerveja.',
  'É um pássaro! É um avião! Ah não, é só {usuario}.',
  'É {usuario}! Louvado seja o sol! \\[T]/',
  'Ha! {usuario} entrou! Você ativou minha carta armadilha!',
  'Obrigada, querido! {usuario} está aqui!',
  'Hey! Listen! {usuario} entrou!',
  'Estávamos esperando por você, {usuario}',
  'É perigoso ir sozinho, leve {usuario} com você!',
  'Obrigada, querido! {usuario} está aqui!',
  '{usuario} está aqui, como previu a profecia.',
  '{usuario} chegou. A festa acabou.',
  'Jogador(a) {usuario} pronto(a)',
  'Alguém aí pediu um(a) {usuario}?',
  '{usuario} entrou. Fique um pouco e escute!',
  'Batatinha quando nasce espalha rama pelo chão, {usuario} chegou na área para trazer animação'
]

const msgBoasVindas = () => {
  const numMsg = (Math.floor(Math.random() * msgsArray.length))
  return msgsArray[numMsg]
}

module.exports = {
  usuarioSeConectou,
  novoUsuario,
  disconnect,
  msgParaServidor
}