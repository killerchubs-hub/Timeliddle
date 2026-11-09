document.addEventListener("DOMContentLoaded", () => {
  let dailyPuzzle = [];
  let isLocked = false;
  let score = 0;

  // UI Elements
  const pool = document.getElementById('cardPool');
  const slotsContainer = document.getElementById('slotContainer');
  const actionBtn = document.getElementById('actionBtn');
  const menuBtn = document.getElementById('menuBtn');
  const closeMenuBtn = document.getElementById('closeMenuBtn');
  const menuModal = document.getElementById('menuModal');

  // Menu Toggles
  if (menuBtn && menuModal) {
    menuBtn.addEventListener('click', () => { 
      menuModal.classList.remove('hidden'); 
      menuModal.classList.add('flex'); 
    });
  }
  if (closeMenuBtn && menuModal) {
    closeMenuBtn.addEventListener('click', () => { 
      menuModal.classList.add('hidden'); 
      menuModal.classList.remove('flex'); 
    });
  }

  // Fetch Data and Initialize
  fetch('data.json')
    .then(response => response.json())
    .then(data => {
      // Use calendar day of the year to pick the puzzle (1 to 365)
      const start = new Date(new Date().getFullYear(), 0, 0);
      const diff = new Date() - start;
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay);
      
      const badge = document.getElementById('dailyNumberBadge');
      if (badge) badge.innerText = `#${dayOfYear}`;
      
      // Select today's puzzle (fallback to manual generator if JSON runs out)
      const puzzleData = data.daily.find(d => d.day === dayOfYear) || data.daily[0];
      
      // Shuffle for the pool
      dailyPuzzle = [...puzzleData.items];
      const shuffled = [...dailyPuzzle].sort(() => Math.random() - 0.5);
      
      renderBoard(shuffled);
      initDragAndDrop();
    })
    .catch(err => console.error("Error loading daily data:", err));

  function renderBoard(shuffledItems) {
    pool.innerHTML = '';
    slotsContainer.innerHTML = '';

    // Render draggable pool cards
    shuffledItems.forEach(item => {
      const card = document.createElement('div');
      card.className = "game-card w-full text-xs font-bold text-slate-200";
      card.dataset.id = item.id;
      card.innerHTML = `<span class="text-base mr-2">${item.emoji}</span><span class="truncate">${item.name}</span>`;
      pool.appendChild(card);
    });

    // Render 5 empty drop slots
    for(let i = 0; i < 5; i++) {
      const slot = document.createElement('div');
      slot.className = "game-slot w-full border-2 border-dashed border-slate-800 bg-slate-900/50 flex justify-between relative";
      slot.dataset.index = i;
      slot.innerHTML = `<span class="text-slate-600 font-bold uppercase tracking-wider text-[10px] pointer-events-none">Position ${i + 1}</span>`;
      slotsContainer.appendChild(slot);
    }
  }

  function initDragAndDrop() {
    // Sortable JS configuration with aggressive mobile touch fixes applied
    const sortableConfig = {
      group: 'shared',
      animation: 150,
      delay: 0, // Instant touch response
      forceFallback: true, // Forces touch dragging on stubborn mobile browsers
      fallbackClass: 'opacity-80',
      ghostClass: 'opacity-30',
      onAdd: checkCompletion,
      onRemove: checkCompletion
    };

    Sortable.create(pool, sortableConfig);
    
    document.querySelectorAll('.game-slot').forEach(slot => {
      Sortable.create(slot, {
        ...sortableConfig,
        onAdd: (evt) => {
          // Force exactly 1 card per slot
          const cards = evt.to.querySelectorAll('.game-card');
          if (cards.length > 1) {
            // Send the older card back to where the new card came from
            evt.from.appendChild(cards[0]);
          }
          checkCompletion();
        }
      });
    });
  }

  function checkCompletion() {
    if (isLocked) return;
    const filledSlots = document.querySelectorAll('.game-slot .game-card').length;
    if (actionBtn) actionBtn.disabled = (filledSlots !== 5);
  }

  if (actionBtn) {
    actionBtn.addEventListener('click', () => {
      isLocked = true;
      const sortedCorrectly = [...dailyPuzzle].sort((a, b) => a.year - b.year);
      const slots = document.querySelectorAll('.game-slot');
      
      slots.forEach((slot, index) => {
        const card = slot.querySelector('.game-card');
        if (!card) return;
        
        const cardId = parseInt(card.dataset.id);
        const isCorrect = cardId === sortedCorrectly[index].id;
        
        // Update styling based on accuracy
        card.className = `game-card w-full text-xs font-bold shadow-md ${
          isCorrect ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200' : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
        }`;
        
        if (isCorrect) score += 200;
        
        // Reveal exact years
        const itemData = dailyPuzzle.find(i => i.id === cardId);
        card.innerHTML += `<span class="ml-auto mono text-[10px] opacity-70">${itemData.year < 0 ? Math.abs(itemData.year) + ' BC' : itemData.year + ' AD'}</span>`;
      });

      actionBtn.innerText = `Score: ${score} / 1000`;
      actionBtn.classList.remove('bg-amber-500');
      actionBtn.classList.add('bg-slate-800', 'text-amber-400', 'border', 'border-amber-500/50');
      
      // Save streak to local storage
      if (score === 1000) {
        let streak = parseInt(localStorage.getItem('timeline_streak') || 0);
        localStorage.setItem('timeline_streak', streak + 1);
        const streakCount = document.getElementById('streakCount');
        if (streakCount) streakCount.innerText = streak + 1;
      }
    });
  }

  // Load existing streak on boot
  const savedStreak = localStorage.getItem('timeline_streak') || 0;
  const streakEl = document.getElementById('streakCount');
  if (streakEl) streakEl.innerText = savedStreak;
});
