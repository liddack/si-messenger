import $ from "jquery"
import Cookies from "js-cookie"
import io from "socket.io-client"
import autosize from "autosize"

$(document).ready(() => {
    // Inicializa o Socket.io, que é responsável pela troca de mensagens
    // instantânea entre os vários clientes
    const socket = io(window.location.href);
    // Usa o js-cookie pra ver se já há um nome de usuário presente no navegador e
    // se tiver, armazena na variável 'nomeUsuario'. Se não tiver, ele atribui um valor 
    // chamado 'undefined', que funciona como 'false' em um if.
    var nomeUsuario = Cookies.get('nome-usuario')

    autosize(document.getElementById('msg'))

    // Caso o socket não consiga se conectar ao servidor, é mostrada uma janela de erro
    socket.on('connect_error', function(data) {
        $('.spinner').hide()
        $('#principal').hide()
        $('#splash').hide()
        $('#erro-conexao').show()
    })

    // Executa o código abaixo caso o socket consiga se conectar
    socket.on('ready', function(data) {
        console.debug(data.msgs)
        renderizarMensagens(data.msgs)
        // Verifica se há algum valor válido em 'nomeUsuario'. Se contiver um valor que
        // não seja 'false', 'null' ou 'undefined', manda abrir a janela de conversa
        // e emite um evento pro servidor, chamado 'usuarioSeConectou', com o id da
        // conexão e o nomeUsuario
        if (nomeUsuario) {
            $('#erro-conexao').hide()
            $('.spinner').hide()
            $('#principal').show()
            socket.emit('usuarioSeConectou', { id: data.id, nomeUsuario: nomeUsuario });
        }
        // Caso o valor seja 'undefined' (ou seja, se não tiver nome de usuário)
        // é mostrada a tela de boas vindas.
        else {
            $('.spinner').hide()
            $('#splash').show()
        }
        
        // O código abaixo roda quando o usuário clica no botão de entrar no aplicativo
        $('form.usuario').submit(function(e) {
            // Evita a página de recarregar sozinha (a ação padrão de enviar (submit) um form é 
            // recarregar a página)
            e.preventDefault()
            // Pega o nome de usuário que o usuário digitou
            var usuarioTxt = document.getElementById('usuario').value
            // Se o nome de usuário tiver menos que 3 caracteres, manda esse erro aí
            if (usuarioTxt.length < 3) {
                alert('O nome de usuário deve ter pelo menos 3 caracteres.')
            }
            // Senão ele manda abrir a tela de mensagens com uma transição suave,
            // salva o nome de usuário nos cookies do navegador
            // e emite um evento pro servidor (o mesmo de ainda agora)
            else {
                socket.emit('novoUsuario', { id: data.id, nomeUsuario: usuarioTxt });
            }
        })
        
        socket.on('resultCadastro', function (data) {
            if (data.err) alert(data.err)
            else {
                $('#splash').fadeOut()
                $('#principal').delay(600).fadeIn()
                Cookies.set('nome-usuario', data.usuario, { expires: 90, path: '' });
                nomeUsuario = data.usuario;
            }
        })
    })

    // Socket bagulhos
    $('form.div-mensagem').submit(function(e) {
        e.preventDefault();
        var msg = $('#msg').val()
        if (msg.length > 0) {
            socket.emit(
                'msgParaServidor',
                {
                    nomeUsuario: nomeUsuario,
                    msg: $('#msg').val()
                }
            )
            $('#msg').val('').css('height', 'unset')
        }
    })

    var shiftPressionado = false
    $(window).keydown(function (e) {
        if (e.keyCode == 16) { // esse 16 é a tecla shift
            shiftPressionado = true;
        }
    }).keyup(function (e) {
        if (e.keyCode == 16) { // esse 16 é a tecla shift
            shiftPressionado = false;
        }
    })

    $('#msg').keypress(function (e) {
        if (e.which == 13 && shiftPressionado == false) {
            e.preventDefault();
            $('form.div-mensagem').submit()
        }
    });

    socket.on('usuarioEntrou', function(data) {
        let msg = data.msg.replace('{usuario}', `<strong>${data.nomeUsuario}</strong>`)
        $('#historico').append(`<div class="info">${msg}</div>`)
    });

    socket.on('msgParaCliente', function(data) {
        console.debug(data)
        renderizarMensagens(data.msgs)
    });

    function renderizarMensagens(msgs) {
        if (msgs.length > 0 &&  $(`#msg-${msgs[0].timestamp}`).length) {
            $('#historico').empty();
        }
        for (let msg of msgs) {
            let textoEmLinhas = msg.msg.replace(new RegExp("\n", 'g'), "<br/>");

            var html = '';

            html += `<div class="mensagem-wrapper-ext" id="msg-${msg.timestamp ? msg.timestamp : Date.now()}">`
            if (msg.autor || msg.usuario === nomeUsuario) {
                html += `<div class="mensagem-wrapper propria">`
            } else {
                html += `<div class="mensagem-wrapper">` +
                    `<div class="autor">${msg.usuario}</div>`
            }
            html += `<div class="mensagem">${textoEmLinhas}</div>` +
                '</div>' +
                '</div>'

            $('#historico').append(html).scrollTop($('#historico').scrollTop() + $('#historico').height());
        }
        
    }
});
