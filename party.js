document.addEventListener("DOMContentLoaded", () => {
  let peer;
  let connection;
  let isHost = false;
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
  const slider = document.getElementById('partyYearSlider');
  const sliderDisplay = document.getElementById('yearSliderDisplay');

  const generateCode = () => Math.random().toString(36).substring(2, 6).toUpperCase();

  fetch('data.json')
    .then(res => res.json())
    .then(data => partyData = data.party);

  function formatYear(val) {
    return val < 0 ? `${Math.abs(val)} BC` : `${val} AD`;
  }

  slider.addEventListener('input', (e) => {
    sliderDisplay.innerText = formatYear(e.target.value);
  });

  function setTimeBounds(start, end) {
    timeBounds = { start: parseInt(start), end: parseInt(end) };
    
    document.getElementById('uiStartYear').innerText = formatYear(timeBounds.start);
    document.getElementById('uiEndYear').innerText = formatYear(timeBounds.end);
    
    slider.min = timeBounds.start;
    slider.max = timeBounds.end;
    slider.value = Math.floor((timeBounds.start + timeBounds.end) / 2);
    
    document.getElementById('sliderMin').innerText = document.getElementById('uiStartYear').innerText;
    document.getElementById('sliderMax').innerText = document.getElementById('uiEndYear').innerText;
    
    sliderDisplay.innerText = formatYear(slider.value);
  }

  hostBtn.addEventListener('click', () => {
    const startInput = document.getElementById('startYear').value || 0;
    const endInput = document.getElementById('endYear').value || 2026;
    setTimeBounds(startInput, endInput);

    const roomCode = generateCode();
    isHost = true;
    peer = new Peer(roomCode); 
    
    peer.on('open', (id) => {
      startPartyUI(id);
    });

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
    
    slider.value = Math.floor((timeBounds.start + timeBounds.end) / 2);
    sliderDisplay.innerText = formatYear(slider.value);
  }

  lockPartyBtn.addEventListener('click', () => {
    const guess = slider.value;
    alert(`You locked in: ${formatYear(guess)}`);
    if (connection) connection.send({ type: 'locked', guess: guess });
    lockPartyBtn.classList.add('hidden');
    activeEventCard.classList.add('hidden');
    activeEventCard.classList.remove('flex');
  });
});
