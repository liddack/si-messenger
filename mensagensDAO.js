const connectionUrl = process.env.si_messenger_dburl,
      MongoClient = require('mongodb').MongoClient,
      log = require('fancy-log'),
      nomeDB = connectionUrl ? connectionUrl.split('/').pop() : null;
if (!connectionUrl) {
    log.warn('Váriável de ambiente com o URL de conexão com o banco de dados não foi definido!\n'
        + 'O aplicativo funcionará normalmente, mas as mensagens não serão salvas.');
}

class MensagensDAO {
    constructor(callback) {
        if (connectionUrl) {
            MongoClient.connect(connectionUrl, (err, database) => {
                if (err) {
                    if (callback) callback(err);
                    throw err;
                }

                log.info('Conectado ao banco de dados');
                this.msgDB = database.db(nomeDB);
                callback(this.msgDB);
            });
        } else {
            callback({
                erro: 'Não foi definido um banco de dados.',
                dbOffline: true
            });
        }
    }

    inserirUsuario(usuario, callback) {
        this.msgDB.collection('usuarios').find({
            usuario: { $eq: usuario.usuario }
        }).toArray((err, result) => {
            if (result[0] != undefined) {
                if (callback) callback("O usuário já existe.");
            } else {
                this.msgDB.collection('usuarios').insert(usuario, function (err, result) {
                    if (callback) callback(err, result);
                });
            }
        });
    }
    
    getMsgs(callback) {
        this.msgDB.collection('mensagens').find().toArray((err, results) => {
            if (err) {
                if (callback) callback(err);
                throw err;
            }
            if (callback) callback(null, results)
        })
    }

    inserirMsg(msg, callback) {
        this.msgDB.collection('mensagens').insert(msg, function (err, result) {
            if (callback) callback(err, result);
        });
    }
}

module.exports = MensagensDAO
