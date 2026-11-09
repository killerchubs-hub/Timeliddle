document.addEventListener("DOMContentLoaded", () => {
  let peer;
  let connection;
  let partyData = [];
  let timeBounds = { start: 0, end: 2026 };
  
  const hostBtn = document.getElementById('hostBtn');
  const joinBtn = document.getElementById('joinBtn');
  const joinCodeInput = document.getElementById('joinCode');
  const lobbyScreen = document.getElementById('lobbyScreen');
  const gameScreen = document.getElementById('gameScreen');
  const roomCodeDisplay = document.getElementById('roomCodeDisplay');
  const activeEventCard = document.getElementById('activeEventCard');
  const lockPartyBtn = document.getElementById('lockPartyBtn');
  
  // Game Slider
  const gameplaySlider = document.getElementById('gameplaySlider');
  const yearSliderDisplay = document.getElementById('yearSliderDisplay');

  const generateCode = () => Math.random().toString(36).substring(2, 6).toUpperCase();

  fetch('data.json')
    .then(res => res.json())
    .then(data => partyData = data.party);

  function formatYear(val) {
    return val < 0 ? `${Math.abs(val)} BC` : `${val} AD`;
  }

  // Update text instantly as user scrubs gameplay slider
  gameplaySlider.addEventListener('input', (e) => {
    yearSliderDisplay.innerText = formatYear(e.target.value);
  });

  function setTimeBounds(start, end) {
    timeBounds = { start: parseInt(start), end: parseInt(end) };
    
    // Update visual track
    document.getElementById('uiStartYear').innerText = formatYear(timeBounds.start);
    document.getElementById('uiEndYear').innerText = formatYear(timeBounds.end);
    
    // Lock the gameplay slider limits
    gameplaySlider.min = timeBounds.start;
    gameplaySlider.max = timeBounds.end;
    gameplaySlider.value = Math.floor((timeBounds.start + timeBounds.end) / 2);
    
    // Display starting value
    yearSliderDisplay.innerText = formatYear(gameplaySlider.value);
  }

  // HOST LOGIC
  hostBtn.addEventListener('click', () => {
    const sYear = document.getElementById('startYear').value;
    const eYear = document.getElementById('endYear').value;
    setTimeBounds(sYear, eYear);

    const roomCode = generateCode();
    peer = new Peer(roomCode); 
    
    peer.on('open', (id) => startPartyUI(id));

    peer.on('connection', (conn) => {
      connection = conn;
      conn.on('open', () => {
        conn.send({ type: 'setup', bounds: timeBounds });
        setTimeout(() => {
          if(partyData.length > 0) {
            conn.send({ type: 'start', event: partyData[0] });
            displayActiveEvent(partyData[0]);
          }
        }, 500);
      });
      
      conn.on('data', (data) => {
        if (data.type === 'locked') alert(`Guest locked in: ${formatYear(data.guess)}`);
      });
    });
  });

  // JOIN LOGIC
  joinBtn.addEventListener('click', () => {
    const code = joinCodeInput.value.trim().toUpperCase();
    if (!code) return;
    
    peer = new Peer();
    peer.on('open', () => {
      connection = peer.connect(code);
      startPartyUI(code);

      connection.on('data', (data) => {
        if (data.type === 'setup') setTimeBounds(data.bounds.start, data.bounds.end);
        if (data.type === 'start') displayActiveEvent(data.event);
        if (data.type === 'locked') alert(`Host locked in: ${formatYear(data.guess)}`);
      });
    });
  });

  function startPartyUI(code) {
    lobbyScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    roomCodeDisplay.innerText = `ROOM: ${code}`;
  }

  function displayActiveEvent(eventData) {
    activeEventCard.classList.remove('hidden');
    activeEventCard.classList.add('flex');
    lockPartyBtn.classList.remove('hidden');
    
    document.getElementById('partyEmoji').innerText = eventData.emoji;
    document.getElementById('partyEventName').innerText = eventData.name;
    
    gameplaySlider.value = Math.floor((timeBounds.start + timeBounds.end) / 2);
    yearSliderDisplay.innerText = formatYear(gameplaySlider.value);
  }

  lockPartyBtn.addEventListener('click', () => {
    const finalGuess = gameplaySlider.value;
    alert(`You locked in: ${formatYear(finalGuess)}`);
    if (connection) connection.send({ type: 'locked', guess: finalGuess });
    
    lockPartyBtn.classList.add('hidden');
    activeEventCard.classList.add('hidden');
    activeEventCard.classList.remove('flex');
  });
});
