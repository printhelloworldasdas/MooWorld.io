const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const socket = new WebSocket("ws://localhost:3000");

let player = {
  id: null,
  username: "",
  x: 0,
  y: 0,
  radius: 20,
  speed: 3,
};

let keys = {};
let players = {};

document.getElementById("playBtn").onclick = () => {
  const username = document.getElementById("username").value.trim();
  if (!username) return;

  player.username = username;
  document.getElementById("menu").style.display = "none";
  canvas.style.display = "block";

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
        y: player.y
      }));
    }, 1000 / 20);
  }

  if (data.type === "state") {
    players = data.players;
  }
};

window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

function drawGrid() {
  const gridSize = 50;
  ctx.strokeStyle = "rgba(0,0,0,0.1)";
  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function movePlayer() {
  if (keys["w"]) player.y -= player.speed;
  if (keys["s"]) player.y += player.speed;
  if (keys["a"]) player.x -= player.speed;
  if (keys["d"]) player.x += player.speed;
}

function drawPlayers() {
  for (let id in players) {
    const p = players[id];
    if (id === player.id) continue;

    ctx.fillStyle = "orange";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#000";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(p.username, p.x, p.y - 25);
  }
}

function drawPlayer() {
  ctx.fillStyle = "#3498db";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.font = "16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(player.username, player.x, player.y - player.radius - 10);
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  movePlayer();
  drawPlayers();
  drawPlayer();
  requestAnimationFrame(gameLoop);
}
