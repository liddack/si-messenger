let notificar = (titulo = 'Teste', corpo = 'Só um teste meu maroto') => {
    if (pedirPermissao()) {
        let notification = new Notification(titulo, {
            tag: 'si-messenger',
            body: corpo
        });
    }
}

let pedirPermissao = () => {
    if ("Notification" in window) {
        if (Notification.permission == "default") {
            Notification.requestPermission(permission => {
                if (permission == "granted") {
                    return true
                } else {
                    return false
                }
            })
        } else if (Notification.permission == "denied") {
            return false
        } else {
            return true
        }
    } else {
        return false
    }
}

module.exports = {pedirPermissao, notificar}