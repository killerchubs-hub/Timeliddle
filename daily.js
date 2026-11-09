document.addEventListener("DOMContentLoaded", () => {
  let dailyPuzzle = [];
  let yearLockEvents = [];
  let poolItems = [];
  let slotItems = [null, null, null, null, null];
  
  let selectedSource = null; 
  let gameState = 1; // 1: Timeline, 2: Year Lock Intro, 3: Year Lock Loop, 4: Summary
  let currentDay = 1;
  
  let timelineScore = 0;
  let precisionScore = 0;
  let currentEventIndex = 0;

  const poolContainer = document.getElementById('cardPool');
  const slotsContainer = document.getElementById('slotContainer');
  const actionBtn = document.getElementById('actionBtn');
  const menuBtn = document.getElementById('menuBtn');
  const closeMenuBtn = document.getElementById('closeMenuBtn');
  const menuModal = document.getElementById('menuModal');
  
  const yearSlider = document.getElementById('yearSlider');
  const yearSliderDisplay = document.getElementById('yearSliderDisplay');

  if (menuBtn) menuBtn.addEventListener('click', () => { menuModal.classList.remove('hidden'); menuModal.classList.add('flex'); });
  if (closeMenuBtn) closeMenuBtn.addEventListener('click', () => { menuModal.classList.add('hidden'); menuModal.classList.remove('flex'); });

  function formatYear(val) { return val < 0 ? `${Math.abs(val)} BC` : `${val} AD`; }

  fetch('data.json')
    .then(response => response.json())
    .then(data => {
      const start = new Date(new Date().getFullYear(), 0, 0);
      currentDay = Math.floor((new Date() - start) / (1000 * 60 * 60 * 24));
      
      const badge = document.getElementById('dailyNumberBadge');
      if (badge) badge.innerText = `#${currentDay}`;
      
      const puzzleData = data.daily.find(d => d.day === currentDay) || data.daily[0];
      
      dailyPuzzle = [...puzzleData.items];
      // Ensure data.json has yearLock as an array of 3 objects
      yearLockEvents = Array.isArray(puzzleData.yearLock) ? puzzleData.yearLock : [puzzleData.yearLock];
      poolItems = [...dailyPuzzle].sort(() => Math.random() - 0.5);
      
      renderBoard();
    });

  // --- ROUND 1 LOGIC ---
  function renderBoard() {
    poolContainer.innerHTML = '';
    slotsContainer.innerHTML = '';

    poolItems.forEach(item => {
      const card = document.createElement('div');
      const isSelected = selectedSource && selectedSource.type === 'pool' && selectedSource.id === item.id;
      card.className = `w-full h-14 border rounded-xl flex items-center px-4 transition-all cursor-pointer shadow-sm ${
        isSelected ? 'glow-active text-amber-400' : 'bg-[#1e293b] border-slate-700 text-slate-200'
      }`;
      card.innerHTML = `<span class="text-base mr-2">${item.emoji}</span><span class="text-xs font-bold truncate">${item.name}</span>`;
      
      card.addEventListener('click', () => {
        if (gameState !== 1) return;
        if (!selectedSource) { selectedSource = { type: 'pool', id: item.id }; } 
        else if (selectedSource.type === 'pool' && selectedSource.id === item.id) { selectedSource = null; } 
        else if (selectedSource.type === 'pool') { selectedSource = { type: 'pool', id: item.id }; } 
        else if (selectedSource.type === 'slot') {
          const slotItem = slotItems[selectedSource.index];
          const poolItemIndex = poolItems.findIndex(i => i.id === item.id);
          poolItems[poolItemIndex] = slotItem;
          slotItems[selectedSource.index] = item;
          selectedSource = null;
        }
        renderBoard();
        checkCompletion();
      });
      poolContainer.appendChild(card);
    });

    if (poolItems.length === 0 && gameState === 1) {
      poolContainer.innerHTML = `<span class="text-[10px] text-slate-500 font-bold uppercase mx-auto mt-2">All items ready. Lock in!</span>`;
    }

    slotItems.forEach((item, index) => {
      const slot = document.createElement('div');
      if (item) {
        if (gameState > 1) {
          let isCorrect = true;
          for (let i = 0; i < index; i++) if (slotItems[i].year > item.year) isCorrect = false;
          for (let i = index + 1; i < slotItems.length; i++) if (slotItems[i].year < item.year) isCorrect = false;

          slot.className = `w-full h-14 border rounded-xl flex items-center px-4 justify-between shadow-md ${
            isCorrect ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200' : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
          }`;
          slot.innerHTML = `<div class="flex items-center truncate"><span class="text-base mr-2">${item.emoji}</span><span class="text-xs font-bold truncate">${item.name}</span></div><span class="ml-2 mono text-[10px] opacity-70 shrink-0">${formatYear(item.year)}</span>`;
        } else {
          const isSelected = selectedSource && selectedSource.type === 'slot' && selectedSource.index === index;
          slot.className = `w-full h-14 border rounded-xl flex items-center px-4 cursor-pointer shadow-sm transition-all ${
            isSelected ? 'glow-active text-amber-400' : 'bg-[#1e293b] border-slate-500 text-slate-200'
          }`;
          slot.innerHTML = `<span class="text-base mr-2">${item.emoji}</span><span class="text-xs font-bold truncate">${item.name}</span>`;
          
          slot.addEventListener('click', () => {
            if(gameState !== 1) return;
            if (!selectedSource) { selectedSource = { type: 'slot', index: index }; } 
            else if (selectedSource.type === 'slot' && selectedSource.index === index) { selectedSource = null; } 
            else if (selectedSource.type === 'pool') {
              const poolItemIndex = poolItems.findIndex(i => i.id === selectedSource.id);
              const poolItem = poolItems[poolItemIndex];
              poolItems.splice(poolItemIndex, 1);
              poolItems.push(item);
              slotItems[index] = poolItem;
              selectedSource = null;
            } else if (selectedSource.type === 'slot') {
              const temp = slotItems[selectedSource.index];
              slotItems[selectedSource.index] = item;
              slotItems[index] = temp;
              selectedSource = null;
            }
            renderBoard();
            checkCompletion();
          });
        }
      } else {
        const isHighlight = selectedSource !== null;
        slot.className = `w-full h-14 border-2 border-dashed rounded-xl flex items-center px-4 cursor-pointer transition-all ${
          isHighlight ? 'bg-amber-500/10 border-amber-500/50' : 'border-slate-800 bg-slate-900/50'
        }`;
        slot.innerHTML = `<span class="text-[10px] font-bold uppercase tracking-wider ${isHighlight ? 'text-amber-400' : 'text-slate-600'}">Position ${index + 1}</span>`;
        
        slot.addEventListener('click', () => {
          if (gameState !== 1 || !selectedSource) return;
          if (selectedSource.type === 'pool') {
            const poolItemIndex = poolItems.findIndex(i => i.id === selectedSource.id);
            slotItems[index] = poolItems[poolItemIndex];
            poolItems.splice(poolItemIndex, 1);
          } else if (selectedSource.type === 'slot') {
            slotItems[index] = slotItems[selectedSource.index];
            slotItems[selectedSource.index] = null;
          }
          selectedSource = null;
          renderBoard();
          checkCompletion();
        });
      }
      slotsContainer.appendChild(slot);
    });
  }

  function checkCompletion() {
    const isFull = slotItems.every(item => item !== null);
    if (actionBtn && gameState === 1) actionBtn.disabled = !isFull;
  }

  // --- ROUND 2 LOGIC (SLIDER LOOP) ---
  function setupYearLock(index) {
    if (index >= yearLockEvents.length) {
      endGame();
      return;
    }
    const ev = yearLockEvents[index];
    document.getElementById('yearLockTracker').innerText = `Event ${index + 1} of ${yearLockEvents.length}`;
    document.getElementById('yearLockEventText').innerText = `"${ev.name}"`;
    document.getElementById('yearLockEmoji').innerText = ev.emoji || "❓";
    
    // Dynamic slider range
    let min = Math.floor((ev.year - 150) / 10) * 10;
    let max = Math.ceil((ev.year + 150) / 10) * 10;
    if (ev.year < 0) { min = ev.year - 500; max = ev.year + 500; }
    if (max > 2026) max = 2026;
    
    yearSlider.min = min;
    yearSlider.max = max;
    yearSlider.value = Math.floor((min + max) / 2);
    
    document.getElementById('yearLockMin').innerText = formatYear(min);
    document.getElementById('yearLockMax').innerText = formatYear(max);
    yearSliderDisplay.innerText = formatYear(yearSlider.value);
    
    actionBtn.innerText = "Lock Precision Guess";
    actionBtn.className = "w-full py-4 mt-6 bg-cyan-500 text-slate-950 font-black uppercase tracking-wider text-xs rounded-xl shadow-lg glow-cyan active:scale-95 transition-all";
    actionBtn.disabled = false;
  }

  yearSlider.addEventListener('input', (e) => {
    yearSliderDisplay.innerText = formatYear(e.target.value);
  });

  // --- GLOBAL BUTTON LOGIC ---
  if (actionBtn) {
    actionBtn.addEventListener('click', () => {
      
      // FINISH ROUND 1
      if (gameState === 1) {
        selectedSource = null;
        timelineScore = 0;
        
        slotItems.forEach((item, index) => {
          let isCorrect = true;
          for (let i = 0; i < index; i++) if (slotItems[i].year > item.year) isCorrect = false;
          for (let i = index + 1; i < slotItems.length; i++) if (slotItems[i].year < item.year) isCorrect = false;
          if (isCorrect) timelineScore += 200;
        });

        renderBoard(); 
        gameState = 2;
        
        actionBtn.innerText = `R1 Score: ${timelineScore}/1000 ➔ Start Year Lock 🎯`;
        actionBtn.className = "w-full py-4 mt-4 bg-cyan-500 text-slate-950 font-black uppercase tracking-wider text-xs rounded-xl shadow-lg glow-cyan active:scale-95 transition-all";
      } 
      
      // START ROUND 2
      else if (gameState === 2) {
        document.getElementById('game1Container').classList.add('hidden');
        document.getElementById('game2Container').classList.remove('hidden');
        document.getElementById('game2Container').classList.add('flex');
        
        gameState = 3;
        setupYearLock(0);
      }
      
      // EVALUATE EVENT AND LOOP
      else if (gameState === 3) {
        const guessedYear = parseInt(yearSlider.value);
        const actualYear = yearLockEvents[currentEventIndex].year;
        const diff = Math.abs(guessedYear - actualYear);
        
        // Exact Math: Max 1000, lose 3.5 per year off. Round it, min 0.
        let eventScore = Math.max(0, Math.round(1000 - (diff * 3.5)));
        precisionScore += eventScore;
        
        // Temporarily show feedback on the button and display
        actionBtn.disabled = true;
        yearSliderDisplay.innerText = `ACTUAL: ${formatYear(actualYear)}`;
        
        if (diff === 0) {
          actionBtn.innerText = `Bullseye! +${eventScore} pts 🎯`;
        } else {
          actionBtn.innerText = `Off by ${diff} yrs (+${eventScore} pts)`;
        }
        actionBtn.className = "w-full py-4 mt-6 bg-emerald-500 text-slate-900 font-black uppercase tracking-wider text-xs rounded-xl shadow-lg transition-all";
        
        // Wait 1.5 seconds, then load next event
        setTimeout(() => {
          currentEventIndex++;
          setupYearLock(currentEventIndex);
        }, 1500);
      }
    });
  }

  // --- SUMMARY SCREEN LOGIC ---
  function endGame() {
    gameState = 4;
    let totalScore = timelineScore + precisionScore; // Max 4000
    
    let title = "Oof! 💀";
    if (totalScore === 4000) title = "Flawless! 👑";
    else if (totalScore >= 3000) title = "Legendary! 🏆";
    else if (totalScore >= 2000) title = "Great Job! 🌟";
    else if (totalScore >= 1000) title = "Not Bad! 👍";
    document.getElementById('summaryTitle').innerText = title;
    
    document.getElementById('game2Container').classList.add('hidden');
    document.getElementById('game2Container').classList.remove('flex');
    document.getElementById('summaryContainer').classList.remove('hidden');
    document.getElementById('summaryContainer').classList.add('flex');
    
    document.getElementById('finalTimelineScore').innerText = `${timelineScore} / 1,000`;
    document.getElementById('finalPrecisionScore').innerText = `${precisionScore} / 3,000`;
    document.getElementById('finalTotalScore').innerText = `${totalScore} / 4,000`;
    
    actionBtn.classList.add('hidden'); 
    
    if (totalScore >= 2000) {
      let streak = parseInt(localStorage.getItem('timeline_streak') || 0);
      localStorage.setItem('timeline_streak', streak + 1);
      document.getElementById('streakCount').innerText = streak + 1;
    }
  }

  document.getElementById('copyBtn').addEventListener('click', () => {
    const totalScore = timelineScore + precisionScore;
    const text = `TimeLine Daily #${currentDay} ⏳\n📅 Timeline: ${timelineScore}/1000\n🎯 Precision: ${precisionScore}/3000\n🏆 Total: ${totalScore}/4000`;
    navigator.clipboard.writeText(text);
    alert('Score copied to clipboard!');
  });

  const savedStreak = localStorage.getItem('timeline_streak') || 0;
  const streakEl = document.getElementById('streakCount');
  if (streakEl) streakEl.innerText = savedStreak;
});
