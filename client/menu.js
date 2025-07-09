document.getElementById('playButton').addEventListener('click', () => {
    const playerName = document.getElementById('playerName').value.trim();
    const playerColor = document.getElementById('playerColor').value;

    if (!playerName) {
        alert("¡Escribe un nombre!");
        return;
    }

    // Guardar datos en localStorage
    localStorage.setItem('playerData', JSON.stringify({
        name: playerName,
        color: playerColor
    }));

    // Redirigir al juego
    window.location.href = "game.html";
});
