const port = (process.env.PORT || 5000),
      express = require('express'),
      MensagensDAO = require('./mensagensDAO')

let app = express();

app.use(express.static(__dirname + '/dist'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/dist/index.html')
})

let server, socket;

let msgDB = new MensagensDAO((socket) => {
    userMap = {};
    server = app.listen(port, () => console.log('Servidor subiu.'))
    socket = require('socket.io').listen(server)

    socket.on('connection', function (socket) {
        msgDB.getMsgs((err, msgs) => {
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
            }

            msgDB.inserirMsg(msg, (err, result) => {
                if (err) console.error(err);
                else console.log('Mensagem salva no BD')

            })

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
    "[!!{username}!!](usernameOnClick) acabou de entrar na conversa - boa sorte e divirta-se!",
    "[!!{username}!!](usernameOnClick) acabou de entrar. Todo mundo, finjam que estão ocupados!",
    "[!!{username}!!](usernameOnClick) entrou na sua conversa. Cuidado.",
    "Meldels. [!!{username}!!](usernameOnClick) chegou.",
    "Um [!!{username}!!](usernameOnClick) selvagem apareceu.",
    "Vuuuush. [!!{username}!!](usernameOnClick) acabou de aterrissar.",
    "Preparem-se. [!!{username}!!](usernameOnClick) acabou de entrar na conversa.",
    "[!!{username}!!](usernameOnClick) acabou de entrar. Escondam seus Skilhos.",
    "[!!{username}!!](usernameOnClick) acabou de deslizar para essa conversa.",
    "Um [!!{username}!!](usernameOnClick) apareceu na conversa.",
    "Grande [!!{username}!!](usernameOnClick) apareceu!",
    "[!!{username}!!](usernameOnClick) pulou para a conversa. Canguru!!",
    "[!!{username}!!](usernameOnClick) apareceu. Segure minha cerveja.",
    "É um pássaro! É um avião! Ah não, é só [!!{username}!!](usernameOnClick).",
    "É [!!{username}!!](usernameOnClick)! Louvado seja o sol! \\[T]/",
    "Ha! [!!{username}!!](usernameOnClick) entrou! Você ativou minha carta armadilha!",
    "Obrigada, querido! [!!{username}!!](usernameOnClick) está aqui!",
    "Hey! Listen! [!!{username}!!](usernameOnClick) entrou!",
    "Estávamos esperando por você, [!!{username}!!](usernameOnClick)",
    "É perigoso ir sozinho, leve [!!{username}!!](usernameOnClick) com você!",
    "Obrigada, querido! [!!{username}!!](usernameOnClick) está aqui!",
    "[!!{username}!!](usernameOnClick) está aqui, como previu a profecia.",
    "[!!{username}!!](usernameOnClick) chegou. A festa acabou.",
    "Jogador(a) [!!{username}!!](usernameOnClick) pronto(a)",
    "Alguém aí pediu um(a) [!!{username}!!](usernameOnClick)?",
    "[!!{username}!!](usernameOnClick) entrou. Fique um pouco e escute!",
    "Batatinha quando nasce espalha rama pelo chão, [!!{username}!!](usernameOnClick) chegou na área para trazer animação"
]

var msgBoasVindas = () => {
    numMsg = (Math.floor(Math.random() * msgsArray.length))
    return msgsArray[numMsg]
}