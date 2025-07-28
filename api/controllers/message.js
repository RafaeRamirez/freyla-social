'use strict'
var moment = require('moment');
var mogoosePaginate = require('mongoose-pagination');

var User = require('../models/user');
var Follow = require('../models/follow');
var Message = require('../models/message');
const message = require('../models/message');

function probando(req, res){
    res.status(200).send({message: 'Hola que tal desde los mensajes'});

}
function saveMessage(req, res) {
    const params = req.body;

    // Verificar que los campos obligatorios estén presentes
    if (!params.text || !params.receiver) {
        return res.status(400).send({ message: 'Envia los campos necesarios: texto y receptor' });
    }

    // Crear una nueva instancia del mensaje
    const message = new Message();
    message.emitter = req.user.sub; // ID del usuario autenticado
    message.receiver = params.receiver; // ID del receptor
    message.text = params.text; // Texto del mensaje
    message.created_at = moment().unix(); // Fecha de creación en formato Unix
    message.viewed = 'false'; //valor de message 


    // Guardar el mensaje en la base de datos
    message.save((err, messageStored) => {
        if (err) {
            return res.status(500).send({ message: 'Error en la petición al guardar el mensaje' });
        }

        if (!messageStored) {
            return res.status(500).send({ message: 'No se pudo guardar el mensaje' });
        }

        // Respuesta exitosa
        return res.status(200).send({ message: messageStored });
    });
}
 function getReceivedMessages(req, res){
    var userId = req.user.sub;

    var page  = 1;
    if(req.params.page){
        page = req.params.page;

         
    }

    var itemsPerpage = 4;

    Message.find({ receiver: userId}).populate('emitter', 'name surname image nick _id').paginate(page, itemsPerpage, (err, messages, total) => {
        
        if (err) {
            return res.status(500).send({ message: 'Error en la petición al guardar el mensaje' });
        }
        if (!messages) {
            return res.status(404).send({ message: 'No hay mensaje' });

        }

        return res.status(200).send({
            total: total,
            pages: Math.ceil(total/itemsPerpage),
            messages

        });
    });
 }


 function getEmmitdMessages(req, res){
    var userId = req.user.sub;

    var page  = 1;
    if(req.params.page){
        page = req.params.page;

         
    }

    var itemsPerpage = 4;

    Message.find({ emitter: userId}).populate('emitter receiver', 'name surname image nick _id').paginate(page, itemsPerpage, (err, messages, total) => {
        
        if (err) {
            return res.status(500).send({ message: 'Error en la petición al guardar el mensaje' });
        }
        if (!messages) {
            return res.status(404).send({ message: 'No hay mensaje' });

        }

        return res.status(200).send({
            total: total,
            pages: Math.ceil(total/itemsPerpage),
            messages

        });
    });
 }

 function getUniewedMessages(req, res){
        var userId = req.user.sub;

        Message.count({receiver:userId, viewed:'false'}).exec((err, count) => {
            if (err) {
                return res.status(500).send({ message: 'Error en la petición al guardar el mensaje' });   }
                return  res.status(200).send({
                     'unwiewed': count

                });

        });


 }

function setViewedMessages(req, res){
    var userId = req.user.sub;

    Message.update({receiver: userId, viewed: 'false'}, {viewed: 'true'}, {"multi": true}, (err, MessageUpdated) => {
      if(err)  return res.status(500).send({ message: 'Error en la petición al guardar el mensaje' });
      return res.status(200).send({
            message: MessageUpdated
 
      });


    });

}

module.exports = {
    probando,
    saveMessage,
    getReceivedMessages,
    getEmmitdMessages,
    getUniewedMessages,
    setViewedMessages


}