<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>TimeLine Party</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="style.css">
  <script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>
</head>
<body class="scanlines flex flex-col h-[100dvh] overflow-hidden bg-[#07090e]">
  
  <header class="border-b border-slate-800 p-3 bg-[#0b0f19]/90 z-40 shrink-0">
    <div class="max-w-md mx-auto flex justify-between items-center">
      <button onclick="window.location.href='index.html'" class="w-10 h-10 bg-slate-900 border border-slate-700/80 rounded-xl flex items-center justify-center text-slate-300 font-bold active:scale-95 transition-transform">←</button>
      <div id="roomCodeDisplay" class="text-xs font-bold tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-xl border border-cyan-500/30">ROOM: ----</div>
    </div>
  </header>

  <!-- Lobby Screen -->
  <div id="lobbyScreen" class="flex-1 max-w-md w-full mx-auto p-4 flex flex-col justify-center gap-6 relative z-10">
    <div class="text-center space-y-2">
      <h2 class="text-3xl font-black text-white tracking-tight">Party Mode</h2>
      <p class="text-xs text-slate-400">Host a room or join a friend.</p>
    </div>

    <div class="bg-slate-900/80 p-5 rounded-3xl border border-slate-800 space-y-6 shadow-xl">
      <div>
        <div class="flex justify-between mb-2">
          <label class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Start Limit</label>
          <span id="startDisplay" class="text-xs font-mono font-bold text-cyan-400">0 AD</span>
        </div>
        <input type="range" id="startYear" min="-5000" max="1800" step="10" value="0" 
               oninput="document.getElementById('startDisplay').innerText = this.value < 0 ? Math.abs(this.value) + ' BC' : this.value + ' AD'"
               class="w-full h-2 bg-slate-800 rounded-lg appearance-none accent-cyan-400">
      </div>
      <div>
        <div class="flex justify-between mb-2">
          <label class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">End Limit</label>
          <span id="endDisplay" class="text-xs font-mono font-bold text-cyan-400">2026 AD</span>
        </div>
        <input type="range" id="endYear" min="1800" max="2026" step="1" value="2026" 
               oninput="document.getElementById('endDisplay').innerText = this.value < 0 ? Math.abs(this.value) + ' BC' : this.value + ' AD'"
               class="w-full h-2 bg-slate-800 rounded-lg appearance-none accent-cyan-400">
      </div>
      
      <button id="hostBtn" class="w-full py-4 bg-cyan-500 text-slate-950 font-black uppercase tracking-wider text-xs rounded-xl shadow-lg glow-cyan active:scale-95 transition-all">Create Room</button>
    </div>

    <div class="flex w-full gap-2 items-stretch mt-2">
      <input type="text" id="joinCode" placeholder="ENTER CODE" class="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 text-center text-amber-400 font-black uppercase mono tracking-widest outline-none focus:border-amber-400">
      <button id="joinBtn" class="py-4 px-6 bg-slate-800 text-amber-400 font-black uppercase text-xs rounded-xl border border-slate-700 active:scale-95 transition-all">Join</button>
    </div>
  </div>

  <!-- Game Screen -->
  <main id="gameScreen" class="hidden flex-1 max-w-md w-full mx-auto p-4 flex gap-4 relative z-10 h-full overflow-hidden">
    <!-- Visual Track -->
    <div class="w-10 h-full bg-slate-900/80 border border-slate-800 rounded-full flex flex-col justify-between items-center py-6 relative shadow-inner shrink-0">
      <span id="uiEndYear" class="mono text-[8px] font-bold text-slate-500">2026</span>
      <div class="flex-1 w-1 bg-slate-800 my-2 rounded-full relative"></div>
      <span id="uiStartYear" class="mono text-[8px] font-bold text-slate-500">0</span>
    </div>

    <!-- Active Area -->
    <div class="flex-1 flex flex-col h-full pb-4">
      <div id="activeEventCard" class="bg-[#1e293b] border border-cyan-500/50 p-4 rounded-2xl shadow-lg glow-cyan flex flex-col items-center justify-center w-full hidden mb-4 shrink-0">
        <div id="partyEmoji" class="text-3xl mb-1">❓</div>
        <div id="partyEventName" class="text-xs font-bold text-white text-center leading-tight">Waiting for host...</div>
      </div>
      
      <!-- Custom Numpad Container -->
      <div id="numpadContainer" class="flex-1 flex flex-col justify-end hidden">
        <div id="yearInputDisplay" class="text-4xl mono font-black text-cyan-400 bg-[#0b0f19] border-2 border-slate-700 w-full text-center py-4 rounded-xl mb-4 tracking-widest shadow-inner transition-colors">----</div>
        
        <div class="grid grid-cols-3 gap-2 w-full mb-4">
          <button class="num-btn py-3 bg-slate-800 rounded-xl font-mono font-bold text-xl text-white active:bg-cyan-500 active:text-slate-900 transition-colors">1</button>
          <button class="num-btn py-3 bg-slate-800 rounded-xl font-mono font-bold text-xl text-white active:bg-cyan-500 active:text-slate-900 transition-colors">2</button>
          <button class="num-btn py-3 bg-slate-800 rounded-xl font-mono font-bold text-xl text-white active:bg-cyan-500 active:text-slate-900 transition-colors">3</button>
          <button class="num-btn py-3 bg-slate-800 rounded-xl font-mono font-bold text-xl text-white active:bg-cyan-500 active:text-slate-900 transition-colors">4</button>
          <button class="num-btn py-3 bg-slate-800 rounded-xl font-mono font-bold text-xl text-white active:bg-cyan-500 active:text-slate-900 transition-colors">5</button>
          <button class="num-btn py-3 bg-slate-800 rounded-xl font-mono font-bold text-xl text-white active:bg-cyan-500 active:text-slate-900 transition-colors">6</button>
          <button class="num-btn py-3 bg-slate-800 rounded-xl font-mono font-bold text-xl text-white active:bg-cyan-500 active:text-slate-900 transition-colors">7</button>
          <button class="num-btn py-3 bg-slate-800 rounded-xl font-mono font-bold text-xl text-white active:bg-cyan-500 active:text-slate-900 transition-colors">8</button>
          <button class="num-btn py-3 bg-slate-800 rounded-xl font-mono font-bold text-xl text-white active:bg-cyan-500 active:text-slate-900 transition-colors">9</button>
          <button id="btnClr" class="py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl font-bold text-rose-400 active:bg-rose-500 active:text-white transition-colors">CLR</button>
          <button class="num-btn py-3 bg-slate-800 rounded-xl font-mono font-bold text-xl text-white active:bg-cyan-500 active:text-slate-900 transition-colors">0</button>
          <button id="btnMinus" class="py-3 bg-slate-800 rounded-xl font-mono font-bold text-xl text-white active:bg-cyan-500 active:text-slate-900 transition-colors">+/-</button>
        </div>
        
        <button id="lockPartyBtn" class="w-full py-4 bg-cyan-500 text-slate-950 font-black uppercase tracking-wider text-xs rounded-xl transition-all glow-cyan active:scale-95 shrink-0">Lock Guess</button>
      </div>
    </div>
  </main>

  <script src="party.js"></script>
</body>
</html>
