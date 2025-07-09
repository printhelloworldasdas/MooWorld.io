const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../client')));

// Datos del juego
const players = {};

io.on('connection', (socket) => {
    console.log('Nuevo jugador conectado:', socket.id);

    // Evento 'joinGame' recibido desde el menú
    socket.on('joinGame', (playerData) => {
        // Validar color (puedes añadir más reglas si quieres)
        const defaultColor = '#8B4513'; // Marrón por defecto
        const color = playerData.color || defaultColor;

        // Crear jugador
        players[socket.id] = {
            id: socket.id,
            name: playerData.name || 'Jugador',
            color: color,
            x: Math.random() * 800,
            y: Math.random() * 600,
            health: 100,
            score: 0
        };

        // Enviar datos iniciales al nuevo jugador
        socket.emit('init', {
            player: players[socket.id],
            otherPlayers: Object.values(players).filter(p => p.id !== socket.id)
        });

        // Notificar a otros jugadores
        socket.broadcast.emit('newPlayer', players[socket.id]);
    });

    // Movimiento del jugador
    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            socket.broadcast.emit('playerMoved', {
                id: socket.id,
                x: data.x,
                y: data.y
            });
        }
    });

    // Desconexión
    socket.on('disconnect', () => {
        if (players[socket.id]) {
            console.log('Jugador desconectado:', players[socket.id].name);
            delete players[socket.id];
            io.emit('playerDisconnected', socket.id);
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
