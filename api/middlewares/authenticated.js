'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret = 'clave_secreta_curso_Freyla_angular';

exports.ensureAuth = function(req, res, next){
    // Verificar que existe la cabecera de autorización
    if(!req.headers.authorization){
        return res.status(403).send({message: 'La petición no tiene la cabecera de autenticación'});
    }

    // Obtener el token y eliminar comillas si es necesario
    var token = req.headers.authorization.replace(/['"]+/g, '');

    try {
        // Intentamos decodificar el token
        var payload = jwt.decode(token, secret);

        // Comprobamos si el token ha expirado
        if (payload.exp <= moment().unix()) {
            return res.status(401).send({
                message: 'El token ha expirado'
            });
        }

        // Agregar los datos del usuario al objeto request
        req.user = payload;

        // Llamamos al siguiente middleware
        next();

    } catch (ex) {
        // Si ocurre un error con la decodificación del token
        return res.status(401).send({
            message: 'El token no es válido o ha sido alterado'
        });
    }
}
