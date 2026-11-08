document.addEventListener("DOMContentLoaded", () => {
  let peer;
  let connection;
  let isHost = false;
  let partyData = [];
  
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

  // Generate a random 4-letter room code
  const generateCode = () => Math.random().toString(36).substring(2, 6).toUpperCase();

  // Load Party Data
  fetch('data.json')
    .then(res => res.json())
    .then(data => partyData = data.party);

  // Update slider UI visually
  slider.addEventListener('input', (e) => {
    sliderDisplay.innerText = `${e.target.value} AD`;
  });

  // HOST LOGIC
  hostBtn.addEventListener('click', () => {
    const roomCode = generateCode();
    isHost = true;
    peer = new Peer(roomCode); // Set exact ID to room code
    
    peer.on('open', (id) => {
      startPartyUI(id);
    });

    peer.on('connection', (conn) => {
      connection = conn;
      // Send the first event to the joined player
      conn.on('open', () => {
        conn.send({ type: 'start', event: partyData[0] });
        displayActiveEvent(partyData[0]);
      });
      
      conn.on('data', (data) => {
        if (data.type === 'locked') handleLockedGuess(data.guess);
      });
    });
  });

  // JOIN LOGIC
  joinBtn.addEventListener('click', () => {
    const code = joinCodeInput.value.toUpperCase();
    if (!code) return;
    
    peer = new Peer();
    peer.on('open', () => {
      connection = peer.connect(code);
      startPartyUI(code);

      connection.on('data', (data) => {
        if (data.type === 'start') displayActiveEvent(data.event);
        if (data.type === 'locked') handleLockedGuess(data.guess);
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
    lockPartyBtn.classList.remove('hidden');
    document.getElementById('partyEmoji').innerText = eventData.emoji;
    document.getElementById('partyEventName').innerText = eventData.name;
  }

  lockPartyBtn.addEventListener('click', () => {
    const guess = slider.value;
    handleLockedGuess(guess);
    if (connection) {
      connection.send({ type: 'locked', guess: guess });
    }
    // Hide controls until next turn
    lockPartyBtn.classList.add('hidden');
  });

  function handleLockedGuess(guess) {
    // In a full build, this function calculates proximity scoring and plots a dot on the vertical track.
    alert(`A guess of ${guess} AD was locked in!`);
  }
});
