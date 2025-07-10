module.exports = {
  map: {
    width: 5000,
    height: 5000,
    gridSize: 50
  },

  game: {
    mode: "normal",
    maxPlayers: 100,
    tickRate: 20
  },

  player: {
    radius: 20,
    speed: 3,
    health: 100,
    spawnMargin: 100
  },

  server: {
    port: 3000
  }
};
