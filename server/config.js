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
  },

  biomes: {
    snow: {
      yStart: 0,
      yEnd: 1500,
      speedMultiplier: 0.6
    },
    desert: {
      yStart: 3500,
      yEnd: 5000,
      speedMultiplier: 1.0
    },
    river: {
      yStart: 2400,
      yEnd: 2600,
      speedMultiplier: 0.9,
      current: {
        x: 0.8,
        y: 0
      }
    },
    sandBanks: {
      yStart: 2200,
      yEnd: 2400,
      speedMultiplier: 1.0
    },
    sandBanksBottom: {
      yStart: 2600,
      yEnd: 2800,
      speedMultiplier: 1.0
    }
  }
};
