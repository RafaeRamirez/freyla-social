'use strict'

const mongoose = require('mongoose');
const app = require('./app');
const port = 3000; // Puerto del servidor

// Configuración de mongoose
mongoose.set('strictQuery', true); // Habilitar o deshabilitar consultas estrictas (opcional)

// Conexión a la base de datos usando IPv4
mongoose
    .connect('mongodb://127.0.0.1:27017/curso_Freyla', {
        useNewUrlParser: true,
        useUnifiedTopology: true, // Recomendado para manejar conexiones más modernas
        // Asegúrate de que las configuraciones estén correctas
    })
    .then(() => {
        console.log('✅ Conexión a la base de datos "curso_Freyla" establecida con éxito.');

        // Crear servidor
        app.listen(port, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
        });
    })
    .catch(err => {
        // Aquí puedes imprimir más detalles del error para facilitar la depuración
        console.error('❌ Error al conectar con la base de datos:', err.message || err);
    });




