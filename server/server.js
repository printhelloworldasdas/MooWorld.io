const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const config = require("./config");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Servir archivos estáticos del cliente
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
          username: data.username,
          x: spawnX,
          y: spawnY,
        };

        ws.send(JSON.stringify({
          type: "init",
          id: playerId,
          x: spawnX,
          y: spawnY,
        }));
      }

      if (data.type === "move" && playerId && players[playerId]) {
        players[playerId].x = data.x;
        players[playerId].y = data.y;
      }
    } catch (err) {
      console.error("Mensaje inválido:", msg);
    }
  });

  ws.on("close", () => {
    if (playerId && players[playerId]) {
      delete players[playerId];
    }
  });
});

// Enviar estado del juego
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
