'use strict';

const express = require('express');
const UserController = require('../controllers/user');
const md_auth = require('../middlewares/authenticated');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const User = require('../models/user');
const api = express.Router();

api.use(cors());

// Configuración de almacenamiento para multer
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const uploadPath = './uploads/users';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename(req, file, cb) {
    // Obtener la extensión del archivo en minúsculas
    const fileExtension = path.extname(file.originalname).toLowerCase();
    // Generar un nombre único utilizando crypto.randomBytes y la fecha actual
    crypto.randomBytes(16, (err, raw) => {
      if (err) return cb(err);
      const filename = raw.toString('hex') + Date.now() + fileExtension;
      cb(null, filename);
    });
  }
});

// Configuración de multer usando el storage definido
const upload = multer({ storage });

api.get('/home', UserController.home);
api.get('/pruebas', md_auth.ensureAuth, UserController.pruebas);
api.post('/registro', UserController.saveUser);
api.post('/login', UserController.loginUser);
api.get('/user/:id', md_auth.ensureAuth, UserController.getUser);
api.get('/users/:page?', md_auth.ensureAuth, UserController.getUsers);
api.get('/counters/:id?', md_auth.ensureAuth, UserController.getCounters);
api.put('/update-user/:id', md_auth.ensureAuth, UserController.updateUser);
api.post('/upload-image-user/:id', [md_auth.ensureAuth, upload.single('image')], UserController.uploadImage);
api.get('/get-image-user/:imageFile', UserController.getImageFile);

module.exports = api;
