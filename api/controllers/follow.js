'use strict'

const mongoosePaginate = require('mongoose-pagination');

const Follow = require('../models/follow'); // Modelo Follow correctamente importado
const User = require('../models/user'); // Importación de User, aunque parece que no se utiliza
const follow = require('../models/follow');

// Función para guardar un follow
function saveFollow(req, res) {
    const params = req.body;

    // Crear una nueva instancia del modelo Follow
    const follow = new Follow();
    follow.user = req.user.sub; // ID del usuario autenticado
    follow.followed = params.followed; // ID del usuario a seguir

    // Guardar el seguimiento en la base de datos
    follow.save((err, followStored) => {
        if (err) return res.status(500).send({ message: 'Error al guardar el seguimiento' });
        if (!followStored) return res.status(404).send({ message: 'El seguimiento no se ha guardado' });

        return res.status(200).send({ follow: followStored });
    });
}

// Función para eliminar un follow
function deleteFollow(req, res) {
    const userId = req.user.sub;
    const followId = req.params.id; // Corregido: debe ser followId en lugar de follow

    Follow.findOneAndRemove({ user: userId, followed: followId }, (err) => {
        if (err) return res.status(500).send({ message: 'Error al dejar de seguir' });

        return res.status(200).send({ message: 'El follow se ha eliminado correctamente' });
    });
}

// Función para obtener los usuarios que sigue un usuario
function getFollowingUsers(req, res) {
    let userId = req.user.sub;

    // Si se pasa un ID como parámetro, lo usamos
    if (req.params.id && req.params.page) {
        userId = req.params.id;
    }

    let page = 1;
    if (req.params.page) {
        page = req.params.page;
    }else{

        page = req.params.id;
    }

    const itemsPerPage = 4;

    // Corregido: Utilizar el modelo Follow correctamente
    Follow.find({ user: userId })
        .populate({ path: 'followed' }) // Añadimos información del usuario seguido
        .paginate(page, itemsPerPage, (err, follows, total) => {
            if (err) return res.status(500).send({ message: 'Error en el servidor' });

            if (!follows || follows.length === 0) {
                return res.status(404).send({ message: 'No estás siguiendo a ningún usuario' });
            }

            return res.status(200).send({
                total,
                pages: Math.ceil(total / itemsPerPage),
                follows
            });
        });
}
function getFollowedUsers(req, res){
    let userId = req.user.sub;

    // Si se pasa un ID como parámetro, lo usamos
    if (req.params.id && req.params.page) {
        userId = req.params.id;
    }

    let page = 1;
    if (req.params.page) {
        page = req.params.page;
    }else{

        page = req.params.id;
    }

    const itemsPerPage = 4;

    // Corregido: Utilizar el modelo Follow correctamente
    Follow.find({ followed: userId })
        .populate('user') // Añadimos información del usuario seguido
        .paginate(page, itemsPerPage, (err, follows, total) => {
            if (err) return res.status(500).send({ message: 'Error en el servidor' });

            if (!follows || follows.length === 0) {
                return res.status(404).send({ message: 'No te sigue a ningún usuario' });
            }

            return res.status(200).send({
                total,
                pages: Math.ceil(total / itemsPerPage),
                follows
            });
        });
}
// Devolver listado de usurio 
function getMyfollows(req, res) {
    const userId = req.user.sub;

    // Inicializamos la consulta base
    let find = Follow.find({ user: userId });

    // Si hay un parámetro `followed`, modificamos la consulta
    if (req.params.followed) {
        find = Follow.find({ followed: userId });
    }

    // Ejecutamos la consulta con `.exec()` en lugar de `.exe()`
    find.populate('user followed').exec((err, follows) => {
        if (err) {
            return res.status(500).send({ message: 'Error en el servidor' });
        }

        if (!follows || follows.length === 0) {
            return res.status(404).send({ message: 'No sigues a ningún usuario' });
        }

        return res.status(200).send({ follows });
    });
}



// Exportamos las funciones
module.exports = {
    saveFollow,
    deleteFollow,
    getFollowingUsers,
    getFollowedUsers,
    getMyfollows
   
};
