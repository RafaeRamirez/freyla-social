







'use strict';

const express = require('express');
const UserController = require('../controllers/user');
const md_auth = require('../middlewares/authenticated');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const api = express.Router();

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
    const fileExtension = path.extname(file.originalname).toLowerCase();
    crypto.randomBytes(16, (err, raw) => {
      if (err) return cb(err);
      const filename = raw.toString('hex') + Date.now() + fileExtension;
      cb(null, filename);
    });
  }
});

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
