
'use strict';


const mongoose = require('mongoose');
const app = require('./app');
const port = process.env.PORT || 3000; // Permite definir el puerto por variable de entorno


// Configuración de mongoose
mongoose.set('strictQuery', true); // Habilitar o deshabilitar consultas estrictas (opcional)

// Conexión a la base de datos usando IPv4
mongoose.connect('mongodb://127.0.0.1:27017/curso_Freyla', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
        console.log('✅ Conexión a la base de datos "curso_Freyla" establecida con éxito.');
        // Crear servidor solo si la conexión es exitosa
        app.listen(port, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
        });
    })
    .catch((err) => {
        // Imprimir detalles del error para facilitar la depuración
        console.error('❌ Error al conectar con la base de datos:', err);
        process.exit(1); // Finaliza el proceso si no se puede conectar
    });




