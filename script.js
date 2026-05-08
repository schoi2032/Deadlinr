let tasks = [];
let userName = "";
let searchTerm = "";
let calendarView = 'week';
let currentWeekStart = new Date();
currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay() + 1); 


let timerSeconds = 1500;
let timerInterval = null;
let isTimerRunning = false;


function initApp() {
  const nameInput = document.getElementById('user-name-input');
  const emailInput = document.getElementById('user-email-input');
  
  const name = nameInput.value.trim();
  const email = emailInput.value.trim().toLowerCase();

  if (!name) {
    nameInput.style.borderColor = "#ef4444";
    return;
  }
  if (!email || !email.includes('@')) {
    emailInput.style.borderColor = "#ef4444";
    return;
  }

  userEmail = email;
  userName = name;
  loadUserData(userEmail);

  document.getElementById('welcome-text').textContent = `What's up, ${userName}? 👋`;
  document.getElementById('side-name').textContent = userName;
  document.getElementById('user-avatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=3b82f6&color=fff&bold=true&rounded=true&size=128`;

  document.getElementById('onboarding').style.opacity = '0';
  document.getElementById('onboarding').style.transform = 'translateY(-100%)';

  setTimeout(() => {
    document.getElementById('onboarding').style.display = 'none';
    document.getElementById('app-container').style.display = 'flex';
    setTimeout(() => {
        document.getElementById('app-container').classList.add('visible');
    }, 50);
    
    document.getElementById('date-subtitle').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    renderTasks();
    setCalendarView(calendarView);
    renderTimelineWeekCalendar();
    lucide.createIcons();
  }, 600);
}

function navigate(pageId) {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('onclick').includes(pageId));
  });
  document.querySelectorAll('.page').forEach(page => {
    page.classList.toggle('active', page.id === `page-${pageId}`);
  });
  if (pageId === 'calendar') renderTimelineWeekCalendar();
}
let userEmail = "";

function saveUserData() {
  if (!userEmail) return;
  const allUsers = JSON.parse(localStorage.getItem('deadlinr_users') || '{}');
  allUsers[userEmail] = {
    name: userName,
    tasks: tasks,
    lastLogin: new Date().toISOString()
  };
  localStorage.setItem('deadlinr_users', JSON.stringify(allUsers));
}

function loadUserData(email) {
  const allUsers = JSON.parse(localStorage.getItem('deadlinr_users') || '{}');
  if (allUsers[email]) {
    tasks = allUsers[email].tasks || [];
    userName = allUsers[email].name || userName;
    return true;
  }
  tasks = [];
  return false;
}
function calculatePriority(dueDate) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const due = new Date(dueDate);
  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));


  if (diffTime < 0) return "Overdue";
  if (diffDays <= 2) return "High";
  if (diffDays <= 5) return "Medium";
  return "Low";
}
function renderDashboardCalendar() {
  if (calendarView === 'week') {
    renderWeekCalendar('week-grid', 'week-title');
  } else {
    renderMonthCalendar('calendar-grid', 'cal-month-title');
  }
}
function handleSearch(val) {
  searchTerm = val.toLowerCase();
  renderTasks();
}


function renderTasks() {
  const dbList = document.getElementById('dashboard-tasks');
  const allList = document.getElementById('all-tasks-list');
  const filter = document.getElementById('filter-prio');
  const prioFilter = filter ? filter.value : 'all';


  tasks.forEach(t => t.prio = calculatePriority(t.date));


  const filtered = tasks.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm);
    const matchesPrio = prioFilter === 'all' || t.prio === prioFilter;
    return matchesSearch && matchesPrio;
  });


  const buildItem = (t) => `
    <div class="task-item" style="opacity: ${t.done ? 0.5 : 1}">
      <div class="task-icon" style="background: ${t.prio === 'Overdue' ? 'rgba(239, 68, 68, 0.15)' : t.prio === 'High' ? 'rgba(245, 158, 11, 0.15)' : t.prio === 'Medium' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)'}">
        <i data-lucide="${t.done ? 'check-circle-2' : (t.prio === 'Overdue' ? 'alert-triangle' : 'circle')}" color="${t.prio === 'Overdue' ? '#ef4444' : t.prio === 'High' ? '#f59e0b' : t.prio === 'Medium' ? '#3b82f6' : '#10b981'}" size="24"></i>
      </div>
      <div class="task-info">
        <div style="font-weight: 800; font-size: 1.1rem; text-decoration: ${t.done ? 'line-through' : 'none'}">${t.name}</div>
        <span style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 600;">Due: ${new Date(t.date).toLocaleDateString()}</span>
      </div>
      <div class="badge ${t.prio.toLowerCase()}">${t.prio}</div>
      <div class="task-actions">
        <button class="action-btn" onclick="toggleTask(${t.id})" title="Toggle Complete"><i data-lucide="${t.done ? 'rotate-ccw' : 'check'}" size="16"></i></button>
        <button class="action-btn" onclick="deleteTask(${t.id})" title="Delete"><i data-lucide="trash-2" size="16"></i></button>
      </div>
    </div>
  `;


  if (dbList && allList) {
    if (filtered.length === 0) {
      const empty = `<div class="empty-state"><i data-lucide="inbox" size="48"></i><h3 style="text-align=center">Zero Stress.</h3><p>Your list is clear or no results found.</p></div>`;
      dbList.innerHTML = empty;
      allList.innerHTML = empty;
    } else {
      dbList.innerHTML = filtered.slice(0, 5).map(buildItem).join('');
      allList.innerHTML = filtered.map(buildItem).join('');
    }
  }


  lucide.createIcons();
  updateStats();
}


function updateStats() {
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  const overdue = tasks.filter(t => t.prio === 'Overdue' && !t.done).length;
  const high = tasks.filter(t => t.prio === 'High' && !t.done).length;


  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-done').textContent = done;
  document.getElementById('stat-overdue').textContent = overdue;
  document.getElementById('stat-high').textContent = high;


  const perc = total > 0 ? Math.round((done / total) * 100) : 0;
  document.getElementById('stat-perc').textContent = `${perc}%`;
  document.getElementById('stat-streak').textContent = tasks.length > 3 ? "7" : "0";
}


function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) task.done = !task.done;
  renderTasks();
  renderDashboardCalendar();
  renderTimelineWeekCalendar();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  renderTasks();
  renderDashboardCalendar();
  renderTimelineWeekCalendar();
}


function openModal() { document.getElementById('modal-overlay').style.display = 'flex'; }
function closeModal() { document.getElementById('modal-overlay').style.display = 'none'; }


function addTask() {
  const name = document.getElementById('m-name').value;
  const date = document.getElementById('m-date').value;
  if (!name || !date) return;
  tasks.unshift({ id: Date.now(), name, date, done: false });
  renderTasks();
  renderDashboardCalendar();
  renderTimelineWeekCalendar();
  closeModal();
  document.getElementById('m-name').value = "";
  document.getElementById('m-date').value = "";
}


function setTimer(minutes) {
  clearInterval(timerInterval);
  isTimerRunning = false;
  timerSeconds = minutes * 60;
  updateTimerDisplay();
  document.getElementById('timer-toggle').textContent = "Start Session";
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.includes(minutes + 'm'));
  });
}


function toggleTimer() {
  if (isTimerRunning) {
    clearInterval(timerInterval);
    document.getElementById('timer-toggle').textContent = "Resume Session";
  } else {
    timerInterval = setInterval(() => {
      if (timerSeconds > 0) {
        timerSeconds--;
        updateTimerDisplay();
      } else {
        clearInterval(timerInterval);
        alert("Session complete! Take a break.");
        resetTimer();
      }
    }, 1000);
    document.getElementById('timer-toggle').textContent = "Pause Session";
  }
  isTimerRunning = !isTimerRunning;
}


function resetTimer() {
  clearInterval(timerInterval);
  isTimerRunning = false;
  timerSeconds = 1500;
  updateTimerDisplay();
  document.getElementById('timer-toggle').textContent = "Start Session";
}


function updateTimerDisplay() {
  const m = Math.floor(timerSeconds / 60);
  const s = timerSeconds % 60;
  const text = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  const big = document.getElementById('timer-display');
  const mini = document.getElementById('mini-timer-display');
  if (big) big.textContent = text;
  if (mini) mini.textContent = text;
}

function prevWeek() {
  currentWeekStart.setDate(currentWeekStart.getDate() - 7);
  renderDashboardCalendar();
  renderTimelineWeekCalendar();
}

function nextWeek() {
  currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  renderDashboardCalendar();
  renderTimelineWeekCalendar();
}
function setCalendarView(view) {
  calendarView = view;

  document.querySelectorAll('.switch-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.toLowerCase().includes(view));
  });

  const weekTitle = document.getElementById('week-title');
  const weekGrid = document.getElementById('week-grid');
  const monthTitle = document.getElementById('cal-month-title');
  const monthHeader = document.getElementById('month-header');
  const monthGrid = document.getElementById('calendar-grid');

  if (weekTitle) weekTitle.style.display = view === 'week' ? 'block' : 'none';
  if (weekGrid) weekGrid.style.display = view === 'week' ? 'grid' : 'none';
  if (monthTitle) monthTitle.style.display = view === 'month' ? 'block' : 'none';
  if (monthHeader) monthHeader.style.display = view === 'month' ? 'grid' : 'none';
  if (monthGrid) monthGrid.style.display = view === 'month' ? 'grid' : 'none';

  renderDashboardCalendar();
}
function renderWeekCalendar(gridId = 'week-grid', titleId = 'week-title') {
  const grid = document.getElementById(gridId);
  const title = document.getElementById(titleId);
  if (!grid || !title) return;

  grid.innerHTML = "";

  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  title.textContent = `${currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const today = new Date();
  today.setHours(0,0,0,0);

  for (let i = 0; i < 7; i++) {
    const cellDate = new Date(currentWeekStart);
    cellDate.setDate(cellDate.getDate() + i);
    const dateStr = cellDate.toISOString().split('T')[0];

    const cell = document.createElement('div');
    cell.className = `week-cell ${cellDate.getTime() === today.getTime() ? 'today' : ''}`;

    const dayNum = cellDate.getDate();
    const dayName = cellDate.toLocaleDateString('en-US', { weekday: 'short' });

    cell.innerHTML = `
      <div class="week-day-num">${dayName}<br><span style="font-size: 1.6rem; font-weight: 800;">${dayNum}</span></div>
      <div class="week-tasks">
        ${tasks.filter(t => t.date === dateStr && !t.done)
          .slice(0, 4)
          .map(t => {
            const prio = calculatePriority(t.date);
            return `<div class="week-task ${prio.toLowerCase()}">${t.name}</div>`;
          }).join('') || '<div style="color: var(--text-secondary); font-size: 0.75rem; opacity: 0.6;">No tasks</div>'}
      </div>
    `;

    grid.appendChild(cell);
  }

  lucide.createIcons();
}
function renderMonthCalendar(gridId = 'calendar-grid', titleId = 'cal-month-title') {
  const grid = document.getElementById(gridId);
  const title = document.getElementById(titleId);
  const header = document.getElementById('month-header');
  if (!grid || !title) return;

  grid.innerHTML = "";
  const year = currentWeekStart.getFullYear();
  const month = currentWeekStart.getMonth();
  title.textContent = currentWeekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const firstDay = new Date(year, month, 1);
  let startDayIdx = firstDay.getDay() - 1;
  if (startDayIdx === -1) startDayIdx = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 42; i++) {
    const cell = document.createElement('div');
    let dayDisplay, cellDate;
    let isOtherMonth = false;

    if (i < startDayIdx) {
      dayDisplay = daysInPrevMonth - (startDayIdx - i - 1);
      cellDate = new Date(year, month - 1, dayDisplay);
      isOtherMonth = true;
    } else if (i < startDayIdx + daysInMonth) {
      dayDisplay = i - startDayIdx + 1;
      cellDate = new Date(year, month, dayDisplay);
    } else {
      dayDisplay = i - (startDayIdx + daysInMonth) + 1;
      cellDate = new Date(year, month + 1, dayDisplay);
      isOtherMonth = true;
    }

    cell.className = `cal-cell ${isOtherMonth ? 'other-month' : ''}`;
    if (cellDate.getTime() === today.getTime()) cell.classList.add('today');
    cell.innerHTML = `<div class="cal-day-num">${dayDisplay}</div>`;

    const dateStr = cellDate.toISOString().split('T')[0];
    const cellTasks = tasks.filter(t => t.date === dateStr && !t.done);

    cell.addEventListener('click', () => {
      if (cellTasks.length > 0) {
        alert(cellTasks.map(t => t.name).join('\n'));
      }
    });

    if (cellTasks.length > 0) {
      const dots = document.createElement('div');
      dots.className = 'cal-dots';

      cellTasks.forEach(t => {
        const dot = document.createElement('div');
        dot.className = 'dot';
        const prio = calculatePriority(t.date);
        dot.style.background =
          prio === 'Overdue' ? '#ef4444' :
          prio === 'High' ? '#f59e0b' :
          prio === 'Medium' ? '#3b82f6' :
          '#10b981';
        dots.appendChild(dot);
      });

      cell.appendChild(dots);
    }

    grid.appendChild(cell);
  }

  lucide.createIcons();
}
function renderTimelineWeekCalendar() {
  const grid = document.getElementById('timeline-week-grid');
  const title = document.getElementById('timeline-week-title');
  if (!grid || !title) return;

  grid.innerHTML = "";

  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  title.textContent = `${currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const today = new Date();
  today.setHours(0,0,0,0);

  for (let i = 0; i < 7; i++) {
    const cellDate = new Date(currentWeekStart);
    cellDate.setDate(cellDate.getDate() + i);
    const dateStr = cellDate.toISOString().split('T')[0];

    const cell = document.createElement('div');
    cell.className = `week-cell ${cellDate.getTime() === today.getTime() ? 'today' : ''}`;

    const dayNum = cellDate.getDate();
    const dayName = cellDate.toLocaleDateString('en-US', { weekday: 'short' });

    cell.innerHTML = `
      <div class="week-day-num">${dayName}<br><span style="font-size: 1.6rem; font-weight: 800;">${dayNum}</span></div>
      <div class="week-tasks">
        ${tasks.filter(t => t.date === dateStr && !t.done)
          .slice(0, 4)
          .map(t => {
            const prio = calculatePriority(t.date);
            return `<div class="week-task ${prio.toLowerCase()}">${t.name}</div>`;
          }).join('') || '<div style="color: var(--text-secondary); font-size: 0.75rem; opacity: 0.6;">No tasks</div>'}
      </div>
    `;

    grid.appendChild(cell);
  }

  lucide.createIcons();
}


function logout() {
  saveUserData();
  userEmail = "";
  userName = "";
  tasks = [];
  location.reload();
}

function deleteAccount() {
  if (confirm(`Are you sure you want to delete the account associated with ${userEmail}? This cannot be undone.`)) {
    const allUsers = JSON.parse(localStorage.getItem('deadlinr_users') || '{}');
    delete allUsers[userEmail];
    localStorage.setItem('deadlinr_users', JSON.stringify(allUsers));
    location.reload();
  }
}



lucide.createIcons();
