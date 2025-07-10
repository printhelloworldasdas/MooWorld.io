const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const minimap = document.getElementById("minimap");
const minimapCtx = minimap.getContext("2d");

const leaderboardList = document.getElementById("leaderboardList");

// Configuración del mapa y biomas
window.gameConfig = {
  width: 5000,
  height: 5000,
  gridSize: 50,
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

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  minimap.width = 200;
  minimap.height = 200;
}
resize();
window.addEventListener("resize", resize);

const socket = new WebSocket("ws://localhost:3000");

let player = {
  id: null,
  username: "",
  x: 0,
  y: 0,
  radius: 36,
  speed: 3
};

let keys = {};
let players = {};
let mousePos = { x: 0, y: 0 };

canvas.addEventListener("mousemove", (e) => {
  mousePos.x = e.clientX;
  mousePos.y = e.clientY;
});

document.getElementById("playBtn").onclick = () => {
  let username = document.getElementById("username").value.trim();
  if (!username) username = "Unknown";
  player.username = username;

  document.getElementById("menu").style.display = "none";
  canvas.style.display = "block";
  document.getElementById("leaderboard").style.display = "block";
  document.getElementById("minimap").style.display = "block";

  socket.send(JSON.stringify({ type: "join", username }));
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === "init") {
    player.id = data.id;
    player.x = data.x;
    player.y = data.y;
    requestAnimationFrame(gameLoop);
    setInterval(() => {
      socket.send(JSON.stringify({ type: "move", x: player.x, y: player.y }));
    }, 1000 / 20);
  }
  if (data.type === "state") {
    players = data.players;
    updateLeaderboard();
  }
};

window.addEventListener("keydown", (e) => (keys[e.key.toLowerCase()] = true));
window.addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));

function getCurrentBiome(y) {
  const biomes = window.gameConfig.biomes;
  for (const name in biomes) {
    const b = biomes[name];
    if (y >= b.yStart && y <= b.yEnd) return b;
  }
  return { speedMultiplier: 1.0 };
}

function movePlayer() {
  const biome = getCurrentBiome(player.y);
  const speed = player.speed * (biome.speedMultiplier || 1);

  if (keys["w"]) player.y = Math.max(player.radius, player.y - speed);
  if (keys["s"]) player.y = Math.min(window.gameConfig.height - player.radius, player.y + speed);
  if (keys["a"]) player.x = Math.max(player.radius, player.x - speed);
  if (keys["d"]) player.x = Math.min(window.gameConfig.width - player.radius, player.x + speed);

  if (biome.current) {
    player.x += biome.current.x;
    player.y += biome.current.y;
  }
}

function drawGrid() {
  const gridSize = window.gameConfig.gridSize;
  ctx.strokeStyle = "rgba(0,0,0,0.1)";
  const offsetX = player.x - canvas.width / 2;
  const offsetY = player.y - canvas.height / 2;
  for (let x = -offsetX % gridSize; x < canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = -offsetY % gridSize; y < canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function drawBiomes() {
  const { biomes } = window.gameConfig;
  const offsetY = player.y - canvas.height / 2;

  for (const name in biomes) {
    const b = biomes[name];
    let color = "#87ce6f";
    if (name === "snow") color = "#e0f7fa";
    if (name === "desert") color = "#edc9af";
    if (name === "river") color = "#4da6ff";
    if (name.includes("sandBanks")) color = "#f4e2d8";

    const yStart = b.yStart - offsetY;
    const height = b.yEnd - b.yStart;

    ctx.fillStyle = color;
    ctx.fillRect(0, yStart, canvas.width, height);
  }
}

function getHandAngle(screenX, screenY) {
  const dx = mousePos.x - screenX;
  const dy = mousePos.y - screenY;
  return Math.atan2(dy, dx);
}

function drawPlayerBodyAndHands(screenX, screenY, radius) {
  const handRadius = 12;
  const handDistance = radius * 0.75;
  const handSeparation = 60;

  const angle = getHandAngle(screenX, screenY);
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const perpX = Math.cos(angle + Math.PI / 2);
  const perpY = Math.sin(angle + Math.PI / 2);

  const handLeftX = screenX + dx * handDistance + perpX * (-handSeparation / 2);
  const handLeftY = screenY + dy * handDistance + perpY * (-handSeparation / 2);
  const handRightX = screenX + dx * handDistance + perpX * (handSeparation / 2);
  const handRightY = screenY + dy * handDistance + perpY * (handSeparation / 2);

  ctx.fillStyle = "#BF8F54";
  ctx.strokeStyle = "#35354D";
  ctx.lineWidth = 5;

  ctx.beginPath();
  ctx.arc(handLeftX, handLeftY, handRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(handRightX, handRightY, handRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#BF8F54";
  ctx.beginPath();
  ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#35354D";
  ctx.lineWidth = 5;
  ctx.stroke();
}

function drawPlayers() {
  for (let id in players) {
    if (id === player.id) continue;
    const p = players[id];
    const screenX = p.x - player.x + canvas.width / 2;
    const screenY = p.y - player.y + canvas.height / 2;

    drawPlayerBodyAndHands(screenX, screenY, 38);

    ctx.fillStyle = "#fff";
    ctx.font = "18px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(p.username || "Unknown", screenX, screenY - 45);
  }
}

function drawPlayer() {
  const screenX = canvas.width / 2;
  const screenY = canvas.height / 2;

  drawPlayerBodyAndHands(screenX, screenY, player.radius);

  ctx.fillStyle = "#fff";
  ctx.font = "18px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(player.username, screenX, screenY - player.radius - 12);
}

function updateLeaderboard() {
  const sortedPlayers = Object.values(players).sort((a, b) => a.username.localeCompare(b.username));

  leaderboardList.innerHTML = "";
  for (let i = 0; i < Math.min(sortedPlayers.length, 10); i++) {
    const p = sortedPlayers[i];
    const li = document.createElement("li");
    li.textContent = p.username || "Unknown";
    if (p.id === player.id) li.style.fontWeight = "bold";
    leaderboardList.appendChild(li);
  }
}

function drawMinimap() {
  const mapWidth = minimap.width;
  const mapHeight = minimap.height;

  minimapCtx.clearRect(0, 0, mapWidth, mapHeight);
  minimapCtx.fillStyle = "#222";
  minimapCtx.fillRect(0, 0, mapWidth, mapHeight);

  const scaleX = mapWidth / window.gameConfig.width;
  const scaleY = mapHeight / window.gameConfig.height;

  for (let id in players) {
    const p = players[id];
    const miniX = p.x * scaleX;
    const miniY = p.y * scaleY;

    minimapCtx.beginPath();
    minimapCtx.fillStyle = id === player.id ? "lime" : "red";
    minimapCtx.arc(miniX, miniY, 5, 0, Math.PI * 2);
    minimapCtx.fill();
  }
}

function drawDarkBorders() {
  const darkColor = "rgba(0, 0, 0, 0.6)";
  const mapWidth = window.gameConfig.width;
  const mapHeight = window.gameConfig.height;

  const leftLimit = player.x - canvas.width / 2;
  const rightLimit = player.x + canvas.width / 2;
  const topLimit = player.y - canvas.height / 2;
  const bottomLimit = player.y + canvas.height / 2;

  ctx.fillStyle = darkColor;

  if (leftLimit < 0) ctx.fillRect(0, 0, -leftLimit, canvas.height);
  if (rightLimit > mapWidth) ctx.fillRect(canvas.width - (rightLimit - mapWidth), 0, rightLimit - mapWidth, canvas.height);
  if (topLimit < 0) ctx.fillRect(0, 0, canvas.width, -topLimit);
  if (bottomLimit > mapHeight) ctx.fillRect(0, canvas.height - (bottomLimit - mapHeight), canvas.width, bottomLimit - mapHeight);
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBiomes();
  drawDarkBorders();
  drawGrid();
  movePlayer();
  drawPlayers();
  drawPlayer();
  drawMinimap();

  requestAnimationFrame(gameLoop);
}
