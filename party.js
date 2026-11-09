document.addEventListener("DOMContentLoaded", () => {
  let peer;
  let connection;
  let partyData = [];
  let timeBounds = { start: 0, end: 2026 };
  let currentGuess = 1000;
  
  // UI Elements
  const hostBtn = document.getElementById('hostBtn');
  const joinBtn = document.getElementById('joinBtn');
  const joinCodeInput = document.getElementById('joinCode');
  const lobbyScreen = document.getElementById('lobbyScreen');
  const gameScreen = document.getElementById('gameScreen');
  const roomCodeDisplay = document.getElementById('roomCodeDisplay');
  const activeEventCard = document.getElementById('activeEventCard');
  const lockPartyBtn = document.getElementById('lockPartyBtn');
  const yearDisplay = document.getElementById('yearSliderDisplay');
  const touchArea = document.getElementById('touchArea');

  // Lobby Slider Elements
  const startSlider = document.getElementById('startYear');
  const endSlider = document.getElementById('endYear');
  const startDisplay = document.getElementById('startDisplay');
  const endDisplay = document.getElementById('endDisplay');

  const generateCode = () => Math.random().toString(36).substring(2, 6).toUpperCase();

  fetch('data.json')
    .then(res => res.json())
    .then(data => partyData = data.party);

  function formatYear(val) {
    return val < 0 ? `${Math.abs(val)} BC` : `${val} AD`;
  }

  // Update Lobby Sliders
  startSlider.addEventListener('input', (e) => startDisplay.innerText = formatYear(e.target.value));
  endSlider.addEventListener('input', (e) => endDisplay.innerText = formatYear(e.target.value));

  function setTimeBounds(start, end) {
    timeBounds = { start: parseInt(start), end: parseInt(end) };
    document.getElementById('uiStartYear').innerText = formatYear(timeBounds.start);
    document.getElementById('uiEndYear').innerText = formatYear(timeBounds.end);
    currentGuess = Math.floor((timeBounds.start + timeBounds.end) / 2);
    yearDisplay.innerText = formatYear(currentGuess);
  }

  // VERTICAL TOUCH MATH
  touchArea.addEventListener('touchmove', (e) => {
    // Only drag if the card is visible
    if(activeEventCard.classList.contains('hidden')) return;
    
    e.preventDefault(); // Stop native scrolling
    const rect = touchArea.getBoundingClientRect();
    let touchY = e.touches[0].clientY - rect.top;
    
    // Clamp inside container bounds
    touchY = Math.max(0, Math.min(touchY, rect.height));
    
    // Move card visually
    activeEventCard.style.top = `${touchY}px`;
    activeEventCard.style.transform = `translateY(-50%)`;
    
    // Calculate math (Top = End Year, Bottom = Start Year)
    let percent = touchY / rect.height;
    currentGuess = Math.round(timeBounds.end - (percent * (timeBounds.end - timeBounds.start)));
    
    yearDisplay.innerText = formatYear(currentGuess);
  }, { passive: false });

  // HOST LOGIC
  hostBtn.addEventListener('click', () => {
    setTimeBounds(startSlider.value, endSlider.value);
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
    
    // Reset visual position to center
    activeEventCard.style.top = '50%';
    currentGuess = Math.floor((timeBounds.start + timeBounds.end) / 2);
    yearDisplay.innerText = formatYear(currentGuess);
  }

  lockPartyBtn.addEventListener('click', () => {
    alert(`You locked in: ${formatYear(currentGuess)}`);
    if (connection) connection.send({ type: 'locked', guess: currentGuess });
    lockPartyBtn.classList.add('hidden');
    activeEventCard.classList.add('hidden');
    activeEventCard.classList.remove('flex');
  });
});
