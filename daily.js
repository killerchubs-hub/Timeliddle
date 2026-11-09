document.addEventListener("DOMContentLoaded", () => {
  let dailyPuzzle = [];
  let poolItems = [];
  let slotItems = [null, null, null, null, null];
  let selectedId = null;
  let isLocked = false;
  let score = 0;

  const poolContainer = document.getElementById('cardPool');
  const slotsContainer = document.getElementById('slotContainer');
  const actionBtn = document.getElementById('actionBtn');

  // Load Data
  fetch('data.json')
    .then(response => response.json())
    .then(data => {
      const start = new Date(new Date().getFullYear(), 0, 0);
      const dayOfYear = Math.floor((new Date() - start) / (1000 * 60 * 60 * 24));
      
      const badge = document.getElementById('dailyNumberBadge');
      if (badge) badge.innerText = `#${dayOfYear}`;
      
      const puzzleData = data.daily.find(d => d.day === dayOfYear) || data.daily[0];
      dailyPuzzle = [...puzzleData.items];
      poolItems = [...dailyPuzzle].sort(() => Math.random() - 0.5);
      
      renderBoard();
    });

  function renderBoard() {
    poolContainer.innerHTML = '';
    slotsContainer.innerHTML = '';

    // Render Pool
    poolItems.forEach(item => {
      const card = document.createElement('div');
      const isSelected = item.id === selectedId;
      
      card.className = `w-full h-14 border rounded-xl flex items-center px-4 transition-all cursor-pointer shadow-sm ${
        isSelected ? 'glow-active text-amber-400' : 'bg-[#1e293b] border-slate-700 text-slate-200'
      }`;
      card.innerHTML = `<span class="text-base mr-2">${item.emoji}</span><span class="text-xs font-bold truncate">${item.name}</span>`;
      
      card.addEventListener('click', () => {
        if (isLocked) return;
        selectedId = isSelected ? null : item.id;
        renderBoard();
      });
      
      poolContainer.appendChild(card);
    });

    if (poolItems.length === 0 && !isLocked) {
      poolContainer.innerHTML = `<span class="text-[10px] text-slate-500 font-bold uppercase mx-auto mt-2">All items ready. Lock in!</span>`;
    }

    // Render Slots
    slotItems.forEach((item, index) => {
      const slot = document.createElement('div');
      
      if (item) {
        if (isLocked) {
          const isCorrect = item.id === [...dailyPuzzle].sort((a, b) => a.year - b.year)[index].id;
          slot.className = `w-full h-14 border rounded-xl flex items-center px-4 justify-between shadow-md ${
            isCorrect ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200' : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
          }`;
          slot.innerHTML = `<div class="flex items-center truncate"><span class="text-base mr-2">${item.emoji}</span><span class="text-xs font-bold truncate">${item.name}</span></div><span class="ml-2 mono text-[10px] opacity-70 shrink-0">${item.year < 0 ? Math.abs(item.year) + ' BC' : item.year + ' AD'}</span>`;
        } else {
          slot.className = "w-full h-14 bg-[#1e293b] border border-slate-500 rounded-xl flex items-center px-4 cursor-pointer shadow-sm active:scale-95 transition-transform";
          slot.innerHTML = `<span class="text-base mr-2">${item.emoji}</span><span class="text-xs font-bold text-slate-200 truncate">${item.name}</span>`;
          slot.addEventListener('click', () => {
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
          if (selectedId !== null) {
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
    if (actionBtn) actionBtn.disabled = !isFull;
  }

  if (actionBtn) {
    actionBtn.addEventListener('click', () => {
      isLocked = true;
      selectedId = null;
      const sortedCorrectly = [...dailyPuzzle].sort((a, b) => a.year - b.year);
      
      slotItems.forEach((item, index) => {
        if (item && item.id === sortedCorrectly[index].id) score += 200;
      });

      renderBoard();
      actionBtn.innerText = `Score: ${score} / 1000`;
      actionBtn.className = "w-full py-4 mt-6 bg-slate-800 text-amber-400 border border-amber-500/50 font-black uppercase tracking-wider text-xs rounded-2xl shadow-lg";
    });
  }
});
