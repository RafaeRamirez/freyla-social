'use strict';

const bcrypt = require('bcryptjs');
const mongoosePaginate = require('mongoose-pagination');
const fs = require('fs');
const path = require('path');

const Follow = require('../models/follow');
const jwt = require('../services/jwt');
const User = require('../models/user');
const Publication = require('../models/publication');

// MÉTODOS DE PRUEBA
function home(req, res) {
  return res.status(200).send({ message: 'Hola mundo desde el servidor de NodeJS' });
}

function pruebas(req, res) {
  return res.status(200).send({ message: 'Acción de pruebas', body: req.body });
}

// REGISTRO DE USUARIO
function saveUser(req, res) {
  const params = req.body;
  const user = new User();

  if (params.name && params.surname && params.nick && params.email && params.password) {
    user.name = params.name;
    user.surname = params.surname;
    user.nick = params.nick.toLowerCase();
    user.email = params.email.toLowerCase();
    user.role = 'ROLE_USER';
    user.image = null;

    User.findOne({
      $or: [{ email: user.email }, { nick: user.nick }]
    }).exec((err, existingUser) => {
      if (err) return res.status(500).send({ message: 'Error al comprobar duplicados' });
      if (existingUser) return res.status(409).send({ message: 'Usuario ya existe' });

      bcrypt.hash(params.password, 10, (err, hash) => {
        if (err) return res.status(500).send({ message: 'Error al encriptar contraseña' });

        user.password = hash;
        user.save((err, userStored) => {
          if (err) return res.status(500).send({ message: 'Error al guardar usuario' });
          if (!userStored) return res.status(404).send({ message: 'No se ha registrado el usuario' });

          userStored.password = undefined;
          return res.status(200).send({ user: userStored });
        });
      });
    });
  } else {
    return res.status(400).send({ message: 'Faltan campos obligatorios' });
  }
}

// LOGIN DE USUARIO
function loginUser(req, res) {
  const { email, password, gettoken } = req.body;

  User.findOne({ email: email.toLowerCase() }, (err, user) => {
    if (err) return res.status(500).send({ message: 'Error en la petición' });
    if (!user) return res.status(404).send({ message: 'Usuario no encontrado' });

    bcrypt.compare(password, user.password, (err, check) => {
      if (check) {
        user.password = undefined;
        if (gettoken) {
          return res.status(200).send({ token: jwt.createToken(user) });
        } else {
          return res.status(200).send({ user });
        }
      } else {
        return res.status(401).send({ message: 'Contraseña incorrecta' });
      }
    });
  });
}

// OBTENER USUARIO POR ID
function getUser(req, res) {
  const userId = req.params.id;

  User.findById(userId, async (err, user) => {
    if (err) return res.status(500).send({ message: 'Error en la petición' });
    if (!user) return res.status(404).send({ message: 'Usuario no existe' });

    try {
      const value = await followThisUser(req.user.sub, userId);
      user.password = undefined;
      return res.status(200).send({
        user,
        following: value.following,
        followed: value.followed
      });
    } catch (error) {
      return res.status(500).send({ message: 'Error al comprobar seguimiento' });
    }
  });
}

async function followThisUser(identity_user_id, user_id) {
  const following = await Follow.findOne({ user: identity_user_id, followed: user_id });
  const followed = await Follow.findOne({ user: user_id, followed: identity_user_id });

  return {
    following: !!following,
    followed: !!followed
  };
}

// OBTENER USUARIOS PAGINADOS
function getUsers(req, res) {
  const page = parseInt(req.params.page) || 1;
  const itemsPerPage = 5;
  const userId = req.user.sub;

  User.find().sort('_id').paginate(page, itemsPerPage, (err, users, total) => {
    if (err) return res.status(500).send({ message: 'Error en la petición' });
    if (!users) return res.status(404).send({ message: 'No hay usuarios disponibles' });

    followUserIds(userId).then((value) => {
      return res.status(200).send({
        users,
        users_following: value.following,
        users_follow_me: value.followed,
        total,
        pages: Math.ceil(total / itemsPerPage)
      });
    });
  });
}

async function followUserIds(user_id) {
  const following = await Follow.find({ user: user_id }).select('followed -_id');
  const followed = await Follow.find({ followed: user_id }).select('user -_id');

  return {
    following: following.map(f => f.followed),
    followed: followed.map(f => f.user)
  };
}

// CONTADORES
function getCounters(req, res) {
  const userId = req.params.id || req.user.sub;

  getCountFollow(userId)
    .then(value => res.status(200).send(value))
    .catch(error => res.status(500).send({ message: 'Error al obtener contadores', error }));
}

async function getCountFollow(user_id) {
  const following = await Follow.countDocuments({ user: user_id });
  const followed = await Follow.countDocuments({ followed: user_id });
  const publications = await Publication.countDocuments({ user: user_id });

  return { following, followed, publications };
}

// ACTUALIZAR USUARIO
function updateUser(req, res) {
  const userId = req.params.id;
  const update = req.body;

  delete update.password;

  if (userId !== req.user.sub) {
    return res.status(403).send({ message: 'No tienes permisos para actualizar este usuario' });
  }

  User.findOne({
    $and: [
      {
        $or: [
          { email: update.email?.toLowerCase() },
          { nick: update.nick?.toLowerCase() }
        ]
      },
      { _id: { $ne: userId } }
    ]
  }).exec((err, existingUser) => {
    if (err) return res.status(500).send({ message: 'Error en la comprobación de duplicados' });
    if (existingUser) return res.status(409).send({ message: 'Email o nick ya están en uso' });

    User.findByIdAndUpdate(userId, update, { new: true }, (err, userUpdated) => {
      if (err) return res.status(500).send({ message: 'Error al actualizar' });
      if (!userUpdated) return res.status(404).send({ message: 'Usuario no encontrado' });

      userUpdated.password = undefined;
      return res.status(200).send({ user: userUpdated });
    });
  });
}

// SUBIR IMAGEN
function uploadImage(req, res) {
  const userId = req.params.id;

  if (!req.file) return res.status(400).send({ message: 'No se ha subido ninguna imagen' });

  if (userId !== req.user.sub) {
    return removeFile(res, req.file.path, 'No tienes permiso para subir esta imagen');
  }

  const fileName = req.file.filename;
  const fileExt = path.extname(fileName).toLowerCase().replace('.', '');
  const validExts = ['png', 'jpg', 'jpeg', 'gif'];

  if (!validExts.includes(fileExt)) {
    return removeFile(res, req.file.path, 'Extensión no permitida');
  }

  User.findByIdAndUpdate(userId, { image: fileName }, { new: true }, (err, userUpdated) => {
    if (err) return res.status(500).send({ message: 'Error al guardar imagen' });
    if (!userUpdated) return res.status(404).send({ message: 'Usuario no encontrado' });

    return res.status(200).send({ user: userUpdated });
  });
}

function removeFile(res, filePath, message) {
  fs.unlink(filePath, err => {
    if (err) console.error('Error al borrar el archivo:', err);
    return res.status(400).send({ message });
  });
}

// OBTENER IMAGEN
function getImageFile(req, res) {
  const imageFile = req.params.imageFile;
  const filePath = './uploads/users/' + imageFile;

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (!err) {
      return res.sendFile(path.resolve(filePath));
    } else {
      return res.status(404).send({ message: 'La imagen no existe' });
    }
  });
}

// EXPORTAR
module.exports = {
  home,
  pruebas,
  saveUser,
  loginUser,
  getUser,
  getUsers,
  getCounters,
  updateUser,
  uploadImage,
  getImageFile
};
``
