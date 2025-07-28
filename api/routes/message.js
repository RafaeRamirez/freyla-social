





'use strict';

const express = require('express');
const MessageController = require('../controllers/message');
const md_auth = require('../middlewares/authenticated');

const api = express.Router();

api.get('/probando-md', md_auth.ensureAuth, MessageController.probando);
api.post('/message', md_auth.ensureAuth, MessageController.saveMessage);
api.get('/my-messages/:page?', md_auth.ensureAuth, MessageController.getReceivedMessages);
api.get('/messages/:page?', md_auth.ensureAuth, MessageController.getEmittedMessages);
api.get('/unviewed-messages/', md_auth.ensureAuth, MessageController.getUnviewedMessages);
api.get('/set-Viewed-messages/', md_auth.ensureAuth, MessageController.setViewedMessages);

module.exports = api;