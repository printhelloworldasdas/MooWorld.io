const WebSocket = require("ws");
const config = require("./config");
const { v4: uuidv4 } = require("uuid");

const wss = new WebSocket.Server({ port: config.server.port });
console.log(`MooWorld.io servidor iniciado en puerto ${config.server.port}`);

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
          y: spawnY
        };

        ws.send(JSON.stringify({
          type: "init",
          id: playerId,
          x: spawnX,
          y: spawnY
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

// Loop de sincronización
setInterval(() => {
  const state = {
    type: "state",
    players
  };
  const stateStr = JSON.stringify(state);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(stateStr);
    }
  });
}, 1000 / config.game.tickRate);
