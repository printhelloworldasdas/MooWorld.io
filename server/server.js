const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const config = require("./config");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, "../client")));

const players = {};

wss.on("connection", (ws) => {
  let playerId = null;
  
  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);
      
      if (data.type === "join") {
        playerId = uuidv4();
        const spawnX = Math.random() * (config.map.width - 2 * config.player.spawnMargin) + config.player.spawnMargin;
        const spawnY = Math.random() * (config.map.height - 2 * config.player.spawnMargin) + config.player.spawnMargin;
        
        players[playerId] = {
          id: playerId,
          username: data.username || "Unknown",
          x: spawnX,
          y: spawnY,
          mouseX: spawnX, // Inicializar con posición del jugador
          mouseY: spawnY
        };
        
        ws.send(JSON.stringify({
          type: "init",
          id: playerId,
          x: spawnX,
          y: spawnY,
        }));
      }
      
      if (data.type === "move" && playerId && players[playerId]) {
        // CORREGIDO: Validar que las coordenadas sean números válidos
        if (typeof data.x === 'number' && typeof data.y === 'number') {
          players[playerId].x = data.x;
          players[playerId].y = data.y;
        }
        
        // CORREGIDO: Validar coordenadas del mouse
        if (typeof data.mouseX === 'number' && typeof data.mouseY === 'number') {
          players[playerId].mouseX = data.mouseX;
          players[playerId].mouseY = data.mouseY;
        }
        
        if (data.username) {
          players[playerId].username = data.username;
        }
      }
    } catch (err) {
      console.error("Mensaje inválido:", msg);
    }
  });
  
  ws.on("close", () => {
    if (playerId && players[playerId]) {
      delete players[playerId];
      console.log(`Jugador ${playerId} desconectado`);
    }
  });
});

// Enviar estado del juego a todos los clientes
setInterval(() => {
  const state = {
    type: "state",
    players,
  };
  const json = JSON.stringify(state);
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  });
}, 1000 / config.game.tickRate);

server.listen(config.server.port, () => {
  console.log(`✅ Servidor activo en http://localhost:${config.server.port}`);
});
