'user strict'

var express = require('express');
var  PublicationController =  require('../controllers/publication');
var api = express.Router();
var md_auth = require('../middlewares/authenticated');

var multer = require('multer');

var mul_upload = multer({dest: './uploads/publications'});

api.get('/probando-pub', md_auth.ensureAuth,  PublicationController.probando);
api.post('/publication', md_auth.ensureAuth,  PublicationController.savePublication);
api.get('/publications/:page?', md_auth.ensureAuth,  PublicationController.getPublications);
api.get('/publications/:page?', md_auth.ensureAuth,  PublicationController.getPublications);
api.get('/publication/:id?', md_auth.ensureAuth,  PublicationController.getPublication);
api.delete('/publication/:id', md_auth.ensureAuth,  PublicationController.deletePublication);
api.post('/upload-image-pub/:id', [md_auth.ensureAuth, mul_upload.single('image')],  PublicationController.uploadImage);
api.get('/get-image-pub/:imageFile', PublicationController.getImageFile);




module.exports =api;