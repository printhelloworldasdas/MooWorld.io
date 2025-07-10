const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const minimap = document.getElementById("minimap");
const minimapCtx = minimap.getContext("2d");

const leaderboardList = document.getElementById("leaderboardList");

// Configuración del mapa, la puedes definir aquí o recibirla desde el servidor
window.gameConfig = {
  width: 5000,
  height: 5000,
  gridSize: 50,
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
  speed: 3,
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

  // Ocultar menú y mostrar canvas + UI
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

function movePlayer() {
  // Limitar movimiento para no salirse del mapa
  if (keys["w"]) player.y = Math.max(player.radius, player.y - player.speed);
  if (keys["s"]) player.y = Math.min(window.gameConfig.height - player.radius, player.y + player.speed);
  if (keys["a"]) player.x = Math.max(player.radius, player.x - player.speed);
  if (keys["d"]) player.x = Math.min(window.gameConfig.width - player.radius, player.x + player.speed);
}

// Función para obtener ángulo desde el centro hacia el mouse
function getHandAngle(screenX, screenY) {
  const dx = mousePos.x - screenX;
  const dy = mousePos.y - screenY;
  return Math.atan2(dy, dx);
}

function drawPlayerBodyAndHands(screenX, screenY, radius) {
  const handRadius = 12;
  const handDistance = radius * 0.75; // distancia adelante del cuerpo
  const handSeparation = 60; // separación lateral entre manos

  const angle = getHandAngle(screenX, screenY);

  // Calcular vectores
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const perpX = Math.cos(angle + Math.PI / 2);
  const perpY = Math.sin(angle + Math.PI / 2);

  // Posiciones manos
  const handLeftX = screenX + dx * handDistance + perpX * (-handSeparation / 2);
  const handLeftY = screenY + dy * handDistance + perpY * (-handSeparation / 2);
  const handRightX = screenX + dx * handDistance + perpX * (handSeparation / 2);
  const handRightY = screenY + dy * handDistance + perpY * (handSeparation / 2);

  // Dibujar manos primero
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

  // Dibujar cuerpo encima
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

  const worldSizeX = window.gameConfig.width;
  const worldSizeY = window.gameConfig.height;

  const scaleX = mapWidth / worldSizeX;
  const scaleY = mapHeight / worldSizeY;

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

// Dibuja sombreado oscuro en los bordes del mapa para indicar límite
function drawDarkBorders() {
  const darkColor = "rgba(0, 0, 0, 0.6)";
  const mapWidth = window.gameConfig.width;
  const mapHeight = window.gameConfig.height;

  const leftLimit = player.x - canvas.width / 2;
  const rightLimit = player.x + canvas.width / 2;
  const topLimit = player.y - canvas.height / 2;
  const bottomLimit = player.y + canvas.height / 2;

  ctx.fillStyle = darkColor;

  // Izquierda
  if (leftLimit < 0) {
    ctx.fillRect(0, 0, -leftLimit, canvas.height);
  }
  // Derecha
  if (rightLimit > mapWidth) {
    ctx.fillRect(canvas.width - (rightLimit - mapWidth), 0, rightLimit - mapWidth, canvas.height);
  }
  // Arriba
  if (topLimit < 0) {
    ctx.fillRect(0, 0, canvas.width, -topLimit);
  }
  // Abajo
  if (bottomLimit > mapHeight) {
    ctx.fillRect(0, canvas.height - (bottomLimit - mapHeight), canvas.width, bottomLimit - mapHeight);
  }
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Fondo césped
  ctx.fillStyle = "#87ce6f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawDarkBorders();

  drawGrid();
  movePlayer();
  drawPlayers();
  drawPlayer();

  drawMinimap();

  requestAnimationFrame(gameLoop);
}
