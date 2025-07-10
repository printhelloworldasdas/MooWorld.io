module.exports = {
  map: {
    width: 8000,   // Aumentado ancho
    height: 8000,  // Aumentado alto
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
      yStart: 6500,  // Ajustado para mantener distancia en el mapa grande
      yEnd: 8000,
      speedMultiplier: 1.0
    },
    river: {
      yStart: 3700,  // Centrado verticalmente en el nuevo mapa (8000 / 2 = 4000, río 200px alto)
      yEnd: 3900,
      speedMultiplier: 0.9,
      current: {
        x: 0.8,
        y: 0
      }
    },
    sandBanks: {
      yStart: 3500,
      yEnd: 3700,
      speedMultiplier: 1.0
    },
    sandBanksBottom: {
      yStart: 3900,
      yEnd: 4100,
      speedMultiplier: 1.0
    }
  }
};
