document.addEventListener("DOMContentLoaded", () => {
  let dailyPuzzle = [];
  let yearLockData = null;
  let poolItems = [];
  let slotItems = [null, null, null, null, null];
  let selectedId = null;
  let gameState = 1; // 1: Timeline, 2: Year Lock, 3: Summary
  let timelineScore = 0;
  let currentDay = 1;

  const poolContainer = document.getElementById('cardPool');
  const slotsContainer = document.getElementById('slotContainer');
  const actionBtn = document.getElementById('actionBtn');
  const menuBtn = document.getElementById('menuBtn');
  const closeMenuBtn = document.getElementById('closeMenuBtn');
  const menuModal = document.getElementById('menuModal');
  
  // Year Lock Elements
  const yearSlider = document.getElementById('yearSlider');
  const yearSliderDisplay = document.getElementById('yearSliderDisplay');

  // Ensure Menu works globally at any game state
  if (menuBtn) menuBtn.addEventListener('click', () => { menuModal.classList.remove('hidden'); menuModal.classList.add('flex'); });
  if (closeMenuBtn) closeMenuBtn.addEventListener('click', () => { menuModal.classList.add('hidden'); menuModal.classList.remove('flex'); });

  function formatYear(val) {
    return val < 0 ? `${Math.abs(val)} BC` : `${val} AD`;
  }

  fetch('data.json')
    .then(response => response.json())
    .then(data => {
      const start = new Date(new Date().getFullYear(), 0, 0);
      currentDay = Math.floor((new Date() - start) / (1000 * 60 * 60 * 24));
      
      const badge = document.getElementById('dailyNumberBadge');
      if (badge) badge.innerText = `#${currentDay}`;
      
      const puzzleData = data.daily.find(d => d.day === currentDay) || data.daily[0];
      
      dailyPuzzle = [...puzzleData.items];
      yearLockData = puzzleData.yearLock;
      poolItems = [...dailyPuzzle].sort(() => Math.random() - 0.5);
      
      renderBoard();
      setupYearLock();
    });

  function setupYearLock() {
    if(!yearLockData) return;
    document.getElementById('yearLockEventText').innerText = `"${yearLockData.name}"`;
    
    // Set dynamic slider limits based on the event year
    let min = Math.floor((yearLockData.year - 150) / 10) * 10;
    let max = Math.ceil((yearLockData.year + 150) / 10) * 10;
    if (yearLockData.year < 0) { min = yearLockData.year - 500; max = yearLockData.year + 500; }
    if (max > 2026) max = 2026;
    
    yearSlider.min = min;
    yearSlider.max = max;
    yearSlider.value = Math.floor((min + max) / 2);
    
    document.getElementById('yearLockMin').innerText = formatYear(min);
    document.getElementById('yearLockMax').innerText = formatYear(max);
    yearSliderDisplay.innerText = formatYear(yearSlider.value);
    
    yearSlider.addEventListener('input', (e) => {
      yearSliderDisplay.innerText = formatYear(e.target.value);
    });
  }

  function renderBoard() {
    poolContainer.innerHTML = '';
    slotsContainer.innerHTML = '';

    poolItems.forEach(item => {
      const card = document.createElement('div');
      const isSelected = item.id === selectedId;
      
      card.className = `w-full h-14 border rounded-xl flex items-center px-4 transition-all cursor-pointer shadow-sm ${
        isSelected ? 'glow-active text-amber-400' : 'bg-[#1e293b] border-slate-700 text-slate-200'
      }`;
      card.innerHTML = `<span class="text-base mr-2">${item.emoji}</span><span class="text-xs font-bold truncate">${item.name}</span>`;
      
      card.addEventListener('click', () => {
        if (gameState !== 1) return;
        selectedId = isSelected ? null : item.id;
        renderBoard();
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
          // RELATIVE SCORING ALGORITHM
          // Card is considered correct if it doesn't break the chronological chain relative to the cards around it.
          let isCorrect = true;
          for (let i = 0; i < index; i++) if (slotItems[i].year > item.year) isCorrect = false;
          for (let i = index + 1; i < slotItems.length; i++) if (slotItems[i].year < item.year) isCorrect = false;

          slot.className = `w-full h-14 border rounded-xl flex items-center px-4 justify-between shadow-md ${
            isCorrect ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200' : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
          }`;
          slot.innerHTML = `<div class="flex items-center truncate"><span class="text-base mr-2">${item.emoji}</span><span class="text-xs font-bold truncate">${item.name}</span></div><span class="ml-2 mono text-[10px] opacity-70 shrink-0">${formatYear(item.year)}</span>`;
        } else {
          slot.className = "w-full h-14 bg-[#1e293b] border border-slate-500 rounded-xl flex items-center px-4 cursor-pointer shadow-sm active:scale-95 transition-transform";
          slot.innerHTML = `<span class="text-base mr-2">${item.emoji}</span><span class="text-xs font-bold text-slate-200 truncate">${item.name}</span>`;
          slot.addEventListener('click', () => {
            if(gameState !== 1) return;
            poolItems.push(item);
            slotItems[index] = null;
            selectedId = null;
            renderBoard();
            checkCompletion();
          });
        }
      } else {
        const isHighlight = selectedId !== null;
        slot.className = `w-full h-14 border-2 border-dashed rounded-xl flex items-center px-4 cursor-pointer transition-all ${
          isHighlight ? 'slot-highlight' : 'border-slate-800 bg-slate-900/50'
        }`;
        slot.innerHTML = `<span class="text-[10px] font-bold uppercase tracking-wider ${isHighlight ? 'text-amber-400' : 'text-slate-600'}">Position ${index + 1}</span>`;
        
        slot.addEventListener('click', () => {
          if (selectedId !== null && gameState === 1) {
            slotItems[index] = poolItems.find(i => i.id === selectedId);
            poolItems = poolItems.filter(i => i.id !== selectedId);
            selectedId = null;
            renderBoard();
            checkCompletion();
          }
        });
      }
      slotsContainer.appendChild(slot);
    });
  }

  function checkCompletion() {
    const isFull = slotItems.every(item => item !== null);
    if (actionBtn && gameState === 1) actionBtn.disabled = !isFull;
  }

  if (actionBtn) {
    actionBtn.addEventListener('click', () => {
      
      // PHASE 1 TO 2: Lock Timeline, Score relatively, Show Game 2 Button
      if (gameState === 1) {
        selectedId = null;
        
        slotItems.forEach((item, index) => {
          let isCorrect = true;
          for (let i = 0; i < index; i++) if (slotItems[i].year > item.year) isCorrect = false;
          for (let i = index + 1; i < slotItems.length; i++) if (slotItems[i].year < item.year) isCorrect = false;
          if (isCorrect) timelineScore += 200;
        });

        renderBoard(); // Reveal colors
        
        gameState = 2;
        actionBtn.innerText = "Proceed to Year Lock 🎯";
        actionBtn.className = "w-full py-4 mt-6 bg-cyan-500 text-slate-950 font-black uppercase tracking-wider text-xs rounded-xl shadow-lg glow-cyan active:scale-95 transition-all";
      } 
      
      // PHASE 2 TO 3: Transition to Year Lock UI
      else if (gameState === 2) {
        document.getElementById('game1Container').classList.add('hidden');
        document.getElementById('game2Container').classList.remove('hidden');
        document.getElementById('game2Container').classList.add('flex');
        
        gameState = 3;
        actionBtn.innerText = "Lock Precision Guess";
      }
      
      // PHASE 3 TO END: Calculate Year Lock and Show Summary
      else if (gameState === 3) {
        const guessedYear = parseInt(yearSlider.value);
        const actualYear = yearLockData.year;
        const diff = Math.abs(guessedYear - actualYear);
        
        document.getElementById('game2Container').classList.add('hidden');
        document.getElementById('game2Container').classList.remove('flex');
        document.getElementById('summaryContainer').classList.remove('hidden');
        document.getElementById('summaryContainer').classList.add('flex');
        
        document.getElementById('finalTimelineScore').innerText = `${timelineScore} / 1,000`;
        document.getElementById('finalYearResult').innerText = `Guessed: ${formatYear(guessedYear)} | Actual: ${formatYear(actualYear)}\n(${diff === 0 ? 'Bullseye!' : diff + ' yrs off'})`;
        
        actionBtn.classList.add('hidden'); // Hide the primary action button on summary screen
        
        if (timelineScore === 1000) {
          let streak = parseInt(localStorage.getItem('timeline_streak') || 0);
          localStorage.setItem('timeline_streak', streak + 1);
          document.getElementById('streakCount').innerText = streak + 1;
        }
      }
    });
  }

  // Copy Results Logic
  document.getElementById('copyBtn').addEventListener('click', () => {
    const guessedYear = parseInt(yearSlider.value);
    const diff = Math.abs(guessedYear - yearLockData.year);
    const text = `TimeLine Daily #${currentDay} ⏳\n📅 Score: ${timelineScore}/1000\n🎯 Precision: ${diff} yrs off`;
    navigator.clipboard.writeText(text);
    alert('Score copied to clipboard!');
  });

  const savedStreak = localStorage.getItem('timeline_streak') || 0;
  const streakEl = document.getElementById('streakCount');
  if (streakEl) streakEl.innerText = savedStreak;
});
