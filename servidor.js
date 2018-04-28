const port = (process.env.PORT || 5000);
const express = require('express');
const MensagensDAO = require('./mensagensDAO');
const showdown = require('showdown');
const converter = new showdown.Converter({
    simplifiedAutoLink: true,
    simpleLineBreaks: false
});

let app = express();

app.use(express.static(__dirname + '/dist'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/dist/index.html')
})

let server, socket;

let msgDB = new MensagensDAO((socket) => {
    userMap = Object.create(null);
    server = app.listen(port, () => console.log('Servidor subiu.'))
    socket = require('socket.io').listen(server)

    socket.on('connection', function (socket) {
        msgDB.getMsgs((err, msgs) => {
            for (let msg of msgs) {
                msg.msg = converter.makeHtml(msg.msg);
            }
            socket.emit('ready', { id: socket.client.id, msgs });
        })

        socket.on('usuarioSeConectou', (data) => {
            console.log('Usuário ' + data.nomeUsuario + ' se conectou (id: ' + data.id + ')')
            userMap[data.id] = data.nomeUsuario;
        })

        socket.on('novoUsuario', data => {
            console.log('Tentando adicionar usuário ' + data.nomeUsuario)
            msgDB.inserirUsuario({ usuario: data.nomeUsuario }, (err, results) => {
                socket.emit('resultCadastro', { err, res: results, usuario: data.nomeUsuario })
                console.error(err)
                if (!err) {
                    console.info(`Usuário ${data.nomeUsuario} cadastrado!`)
                    userMap[data.id] = data.nomeUsuario;
                    data.msg = msgBoasVindas()
                    socket.broadcast.emit('usuarioEntrou', data)
                }
            })
        })

        socket.on('disconnect', function () {
            console.info('Usuário ' + userMap[socket.client.id] + ' desconectou');
            delete userMap[socket.client.id]
        });

        socket.on('msgParaServidor', function (data) {
            console.log('mensagem de ' + data.nomeUsuario + ': ' + data.msg)
            let msg = {
                usuario: data.nomeUsuario,
                timestamp: Date.now(),
                msg: data.msg
            };

            msgDB.inserirMsg(msg, (err, result) => {
                if (err) console.error(err);
                else console.log('Mensagem salva no BD')

            })

            data.msg = converter.makeHtml(data.msg);

            // Diálogo 
            socket.emit('msgParaCliente', {
                msgs: [{
                    usuario: data.nomeUsuario,
                    msg: data.msg,
                    autor: true
                }]
                
            });

            socket.broadcast.emit('msgParaCliente', {
                msgs: [{
                    usuario: data.nomeUsuario,
                    msg: data.msg,
                    autor: false
                }]
            });

            // Participantes
            /*if (parseInt(data.updapl) == 0) {
                socket.emit('participantesParaCliente', {
                    nomeUsuario: data.nomeUsuario
                });

                socket.broadcast.emit('participantesParaCliente', {
                    nomeUsuario: data.nomeUsuario
                });
            }*/
        });

    });
})

var msgsArray = [
    "{usuario} acabou de entrar na conversa - boa sorte e divirta-se!",
    "{usuario} acabou de entrar. Todo mundo, finjam que estão ocupados!",
    "{usuario} entrou na sua conversa. Cuidado.",
    "Meldels. {usuario} chegou.",
    "Um {usuario} selvagem apareceu.",
    "Vuuuush. {usuario} acabou de aterrissar.",
    "Preparem-se. {usuario} acabou de entrar na conversa.",
    "{usuario} acabou de entrar. Escondam seus Skilhos.",
    "{usuario} acabou de deslizar para essa conversa.",
    "Um {usuario} apareceu na conversa.",
    "Grande {usuario} apareceu!",
    "{usuario} pulou para a conversa. Canguru!!",
    "{usuario} apareceu. Segure minha cerveja.",
    "É um pássaro! É um avião! Ah não, é só {usuario}.",
    "É {usuario}! Louvado seja o sol! \\[T]/",
    "Ha! {usuario} entrou! Você ativou minha carta armadilha!",
    "Obrigada, querido! {usuario} está aqui!",
    "Hey! Listen! {usuario} entrou!",
    "Estávamos esperando por você, {usuario}",
    "É perigoso ir sozinho, leve {usuario} com você!",
    "Obrigada, querido! {usuario} está aqui!",
    "{usuario} está aqui, como previu a profecia.",
    "{usuario} chegou. A festa acabou.",
    "Jogador(a) {usuario} pronto(a)",
    "Alguém aí pediu um(a) {usuario}?",
    "{usuario} entrou. Fique um pouco e escute!",
    "Batatinha quando nasce espalha rama pelo chão, {usuario} chegou na área para trazer animação"
]

var msgBoasVindas = () => {
    numMsg = (Math.floor(Math.random() * msgsArray.length))
    return msgsArray[numMsg]
}