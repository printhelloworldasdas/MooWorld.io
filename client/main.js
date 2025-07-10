const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const minimap = document.getElementById("minimap");
const minimapCtx = minimap.getContext("2d");
const leaderboardList = document.getElementById("leaderboardList");

// Configuración del mapa y biomas
window.gameConfig = {
  width: 8000,
  height: 8000,
  gridSize: 50,
  biomes: {
    snow: { yStart: 0, yEnd: 1500, speedMultiplier: 0.6 },
    desert: { yStart: 6500, yEnd: 8000, speedMultiplier: 1.0 },
    river: { yStart: 3700, yEnd: 3900, speedMultiplier: 0.9, current: { x: 0.8, y: 0 } },
    sandBanks: { yStart: 3500, yEnd: 3700, speedMultiplier: 1.0 },
    sandBanksBottom: { yStart: 3900, yEnd: 4100, speedMultiplier: 1.0 }
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
  speed: 3,
  mouseX: 0, // Coordenadas del mundo
  mouseY: 0
};
let keys = {};
let players = {};
let mousePos = { x: 0, y: 0 }; // Coordenadas de pantalla

// CORREGIDO: Convertir coordenadas de pantalla a coordenadas del mundo
canvas.addEventListener("mousemove", (e) => {
  mousePos.x = e.clientX;
  mousePos.y = e.clientY;
  
  // Convertir a coordenadas del mundo
  player.mouseX = e.clientX - canvas.width / 2 + player.x;
  player.mouseY = e.clientY - canvas.height / 2 + player.y;
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
      socket.send(JSON.stringify({
        type: "move",
        x: player.x,
        y: player.y,
        mouseX: player.mouseX,
        mouseY: player.mouseY,
        username: player.username
      }));
    }, 1000 / 20);
  }
  if (data.type === "state") {
    players = {};
    for (const id in data.players) {
      if (id !== player.id) {
        players[id] = data.players[id];
        if (!players[id].username) players[id].username = "Unknown";
      }
    }
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
  
  // Guardar posición anterior para detectar movimiento
  const oldX = player.x;
  const oldY = player.y;
  
  if (keys["w"]) player.y = Math.max(player.radius, player.y - speed);
  if (keys["s"]) player.y = Math.min(window.gameConfig.height - player.radius, player.y + speed);
  if (keys["a"]) player.x = Math.max(player.radius, player.x - speed);
  if (keys["d"]) player.x = Math.min(window.gameConfig.width - player.radius, player.x + speed);
  if (biome.current) {
    player.x += biome.current.x;
    player.y += biome.current.y;
  }
  
  // NUEVO: Actualizar coordenadas del mouse cuando el jugador se mueva
  if (oldX !== player.x || oldY !== player.y) {
    // Recalcular las coordenadas del mouse basándose en la nueva posición del jugador
    player.mouseX = mousePos.x - canvas.width / 2 + player.x;
    player.mouseY = mousePos.y - canvas.height / 2 + player.y;
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

function drawPlayerBodyAndHands(screenX, screenY, radius, targetX, targetY) {
  const handRadius = 12;
  const handDistance = radius * 0.75;
  const handSeparation = 60;
  
  // CORREGIDO: Usar mousePos como fallback si no hay targetX/targetY
  const finalTargetX = targetX !== undefined ? targetX : mousePos.x;
  const finalTargetY = targetY !== undefined ? targetY : mousePos.y;
  
  const angle = Math.atan2(finalTargetY - screenY, finalTargetX - screenX);
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const perpX = Math.cos(angle + Math.PI / 2);
  const perpY = Math.sin(angle + Math.PI / 2);
  
  const handLeftX = screenX + dx * handDistance + perpX * (-handSeparation / 2);
  const handLeftY = screenY + dy * handDistance + perpY * (-handSeparation / 2);
  const handRightX = screenX + dx * handDistance + perpX * (handSeparation / 2);
  const handRightY = screenY + dy * handDistance + perpY * (handSeparation / 2);
  
  // Dibujar manos
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
  
  // Dibujar cuerpo
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
    const p = players[id];
    const screenX = p.x - player.x + canvas.width / 2;
    const screenY = p.y - player.y + canvas.height / 2;
    
    // CORREGIDO: Calcular correctamente la posición del mouse en pantalla
    let targetX, targetY;
    if (p.mouseX !== undefined && p.mouseY !== undefined) {
      // Convertir coordenadas del mundo a coordenadas de pantalla
      targetX = p.mouseX - player.x + canvas.width / 2;
      targetY = p.mouseY - player.y + canvas.height / 2;
    }
    
    drawPlayerBodyAndHands(screenX, screenY, 36, targetX, targetY);
    
    const username = p.username || "Unknown";
    ctx.fillStyle = "#fff";
    ctx.font = "18px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(username, screenX, screenY - 45);
  }
}

function drawMinimap() {
  minimapCtx.clearRect(0, 0, minimap.width, minimap.height);
  const b = window.gameConfig.biomes;
  const scaleX = minimap.width / window.gameConfig.width;
  const scaleY = minimap.height / window.gameConfig.height;
  
  function fillRectScaled(x, y, w, h, color) {
    minimapCtx.fillStyle = color;
    minimapCtx.fillRect(x * scaleX, y * scaleY, w * scaleX, h * scaleY);
  }
  
  fillRectScaled(0, b.snow.yStart, window.gameConfig.width, b.snow.yEnd - b.snow.yStart, "#e0f7fa");
  fillRectScaled(0, b.desert.yStart, window.gameConfig.width, b.desert.yEnd - b.desert.yStart, "#edc9af");
  fillRectScaled(0, b.river.yStart, window.gameConfig.width, b.river.yEnd - b.river.yStart, "#4da6ff");
  fillRectScaled(0, b.sandBanks.yStart, window.gameConfig.width, b.sandBanks.yEnd - b.sandBanks.yStart, "#f4e2d8");
  fillRectScaled(0, b.sandBanksBottom.yStart, window.gameConfig.width, b.sandBanksBottom.yEnd - b.sandBanksBottom.yStart, "#f4e2d8");
  
  // Dibujar jugador actual
  minimapCtx.fillStyle = "#00ff00";
  minimapCtx.beginPath();
  minimapCtx.arc(player.x * scaleX, player.y * scaleY, 4, 0, 2 * Math.PI);
  minimapCtx.fill();
}

function updateLeaderboard() {
  const playerList = Object.values(players);
  playerList.push(player);
  playerList.sort((a, b) => a.username.localeCompare(b.username));
  leaderboardList.innerHTML = "";
  playerList.forEach((p) => {
    const li = document.createElement("li");
    li.textContent = p.username || "Unknown";
    leaderboardList.appendChild(li);
  });
}

function gameLoop() {
  movePlayer();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBiomes();
  drawGrid();
  drawPlayers();
  
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  drawPlayerBodyAndHands(centerX, centerY, player.radius);
  
  drawMinimap();
  requestAnimationFrame(gameLoop);
}
