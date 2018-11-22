const MongoClient = require('mongodb').MongoClient
const log = require('fancy-log')

class MensagensDAO {
  constructor() {
    this.msgDB = null
    this.connectionUrl = process.env.MONGODB_URL,
    this.nomeDB = this.connectionUrl ? this.connectionUrl.split('/').pop() : null

    if (!this.connectionUrl) {
      log.warn('Váriável de ambiente com o URL de conexão com o banco de dados não foi definido!\n' +
        'O aplicativo funcionará normalmente, mas as mensagens não serão salvas.')
    }
  }

  connect() {
    return new Promise(async (resolve, reject) => {
      if (this.connectionUrl) {
        const database = await MongoClient.connect(this.connectionUrl, {
          useNewUrlParser: true
        })
          .catch(reject)
        log.info('Conectado ao banco de dados')
        this.msgDB = database.db(this.nomeDB)
        resolve(this.msgDB)
      } else {
        this.dbOffline = true
        reject({
          erro: 'Não foi definido um banco de dados.',
          dbOffline: true
        })
      }
    })
  }

  inserirUsuario(usuario) {
    if (!this.dbOffline) {
      return new Promise((resolve, reject) => {
        let usuariosArr = this.msgDB.collection('usuarios').find({
          usuario: { $eq: usuario.usuario }
        }).toArray()
          .catch(reject)
        if (usuariosArr[0] != undefined) {
          reject('O usuário já existe.')
        } else {
          let result = this.msgDB.collection('usuarios').insertOne(usuario)
            .catch(reject)
          resolve(result)
        }
      })
    }
  }
    
  async getMsgs() {
    return await this.msgDB
      .collection('mensagens')
      .find()
      .toArray()
  }

  async inserirMsg(msg) {
    if (!this.dbOffline) {
      return await this.msgDB.collection('mensagens').insertOne(msg)
    }
  }
}

module.exports = MensagensDAO
