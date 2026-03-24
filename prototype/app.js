// State Management
const state = {
  currentUser: {
    role: 'professor', // 'superadmin', 'director', 'professor', 'student'
    name: 'Prof. Ana Silva',
    id: 't1',
    classId: 'c1',
    studentId: 's1'
  },
  currentScreen: 'dashboard',
  params: {}, // For routing params like studentId
  modals: {
    grant: false,
    share: false
  }
};

// Mock Data
const mockData = {
  stats: {
    students: 142,
    classes: 8,
    achievements: 1240,
    active_now: 12
  },
  achievements: [
    { id: 'a1', title: 'Leitura Genesis', category: 'Leitura', icon: '📖', color: 'clay' },
    { id: 'a2', title: 'Leitura Exodo', category: 'Leitura', icon: '📜', color: 'clay' },
    { id: 'a3', title: 'Presenca Mes', category: 'Frequencia', icon: '📅', color: 'teal' },
    { id: 'a4', title: 'Memorizacao #1', category: 'Memorizacao', icon: '🧠', color: 'gold' },
    { id: 'a5', title: 'Bom Samaritano', category: 'Comportamento', icon: '🤝', color: 'rose' },
    { id: 'a6', title: 'Pentateuco', category: 'Modulo', icon: '📚', color: 'navy', special: true },
  ],
  classes: [
    { id: 'c1', name: 'Seminario Matutino A', teacher: 'Prof. Ana Silva', students: 18, time: '06:00' },
    { id: 'c2', name: 'Seminario Vespertino B', teacher: 'Prof. Carlos Souza', students: 15, time: '14:00' },
  ],
  students: [
    { id: 's1', name: 'Julia Martins', classId: 'c1', achievements: ['a1', 'a3'], progress: 15 },
    { id: 's2', name: 'Pedro Santos', classId: 'c1', achievements: ['a1', 'a2', 'a3', 'a4'], progress: 32 },
    { id: 's3', name: 'Lucas Oliveira', classId: 'c2', achievements: [], progress: 0 },
  ],
  invites: [
    { id: 'i1', email: 'novo.aluno@email.com', status: 'pending', classId: 'c1', createdAt: '2023-10-25', token: 'INV-7K2A' },
    { id: 'i2', email: 'outro.aluno@email.com', status: 'accepted', classId: 'c1', createdAt: '2023-10-20', token: 'INV-91QF' },
  ],
  audit: [
    { id: 'l1', action: 'Grant Achievement', details: 'Leitura Genesis para Julia', user: 'Prof. Ana', time: '2h ago' },
    { id: 'l2', action: 'Create Class', details: 'Seminario Noturno C', user: 'Dir. Roberto', time: '1d ago' },
  ]
};

// Utils
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

function uid(prefix) {
  return `${prefix}_${Math.random().toString(16).slice(2, 8)}${Date.now().toString(16).slice(-4)}`;
}

function toast(message) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  window.clearTimeout(toast._t);
  toast._t = window.setTimeout(() => el.classList.remove('show'), 2200);
}

function emailToName(email) {
  const local = (email || '').split('@')[0] || 'Novo Aluno';
  const cleaned = local.replace(/[._-]+/g, ' ').trim();
  if (!cleaned) return 'Novo Aluno';
  return cleaned.split(' ').map(part => part ? (part[0].toUpperCase() + part.slice(1)) : '').join(' ');
}

function teacherClasses() {
  if (state.currentUser.role !== 'professor') return mockData.classes;
  return mockData.classes.filter(c => c.teacher === state.currentUser.name);
}

function visibleStudents() {
  const role = state.currentUser.role;
  if (role === 'student') {
    return mockData.students.filter(s => s.id === state.currentUser.studentId);
  }
  if (role === 'professor') {
    const classId = state.params.classId || state.currentUser.classId || teacherClasses()[0]?.id;
    return mockData.students.filter(s => s.classId === classId);
  }
  return mockData.students;
}

function recountClassStudents(classId) {
  const cls = mockData.classes.find(c => c.id === classId);
  if (!cls) return;
  cls.students = mockData.students.filter(s => s.classId === classId).length;
}

function inviteHref(token) {
  return `#invite/${encodeURIComponent(token)}`;
}

function createInvite() {
  const emailEl = $('#invite-email');
  const classEl = $('#invite-class');
  const email = (emailEl?.value || '').trim();
  const classId = classEl?.value || state.currentUser.classId;

  if (!email || !email.includes('@')) {
    toast('Informe um email valido.');
    return;
  }

  const inv = {
    id: uid('inv'),
    email,
    status: 'pending',
    classId,
    createdAt: new Date().toISOString().slice(0, 10),
    token: `INV-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
  };
  mockData.invites.unshift(inv);
  if (emailEl) emailEl.value = '';
  toast('Convite criado.');
  render();
}

function cancelInvite(inviteId) {
  const inv = mockData.invites.find(i => i.id === inviteId);
  if (!inv) return;
  inv.status = 'expired';
  toast('Convite cancelado.');
  render();
}

function resendInvite(inviteId) {
  const inv = mockData.invites.find(i => i.id === inviteId);
  if (!inv) return;
  toast('Convite reenviado (simulacao).');
}

async function copyInvite(inviteId) {
  const inv = mockData.invites.find(i => i.id === inviteId);
  if (!inv) return;
  const link = inviteHref(inv.token);
  try {
    await navigator.clipboard.writeText(link);
    toast('Link copiado.');
  } catch {
    toast(`Copie manualmente: ${link}`);
  }
}

function simulateAcceptInvite(inviteId) {
  const inv = mockData.invites.find(i => i.id === inviteId);
  if (!inv || inv.status !== 'pending') return;

  inv.status = 'accepted';
  const newStudent = {
    id: uid('s'),
    name: emailToName(inv.email),
    classId: inv.classId,
    achievements: [],
    progress: 0
  };
  mockData.students.unshift(newStudent);
  recountClassStudents(inv.classId);
  toast('Convite aceito: aluno adicionado.');
  render();
}

function selectGrantAchievement(achievementId) {
  state.params.grantAchievementId = achievementId;
  render();
}

function selectAllGrantStudents(checked) {
  $$('input[name="student"]').forEach(el => {
    el.checked = !!checked;
  });
}

function confirmGrant() {
  const achievementId = state.params.grantAchievementId;
  if (!achievementId) {
    toast('Selecione uma conquista.');
    return;
  }

  const studentIds = Array.from($$('input[name="student"]'))
    .filter(el => el.checked)
    .map(el => el.value);

  if (!studentIds.length) {
    toast('Selecione pelo menos 1 aluno.');
    return;
  }

  const achievement = mockData.achievements.find(a => a.id === achievementId);
  let applied = 0;
  for (const sid of studentIds) {
    const s = mockData.students.find(st => st.id === sid);
    if (!s) continue;
    if (!s.achievements.includes(achievementId)) {
      s.achievements.push(achievementId);
      applied += 1;
    }
    // naive progress update: percent of catalog earned
    s.progress = Math.round((s.achievements.length / mockData.achievements.length) * 100);
  }

  mockData.audit.unshift({
    id: uid('log'),
    action: 'Grant Achievement',
    details: `${achievement?.title || 'Achievement'} para ${studentIds.length} aluno(s)`,
    user: state.currentUser.name,
    time: 'agora'
  });

  toast(applied ? `Concedido: ${applied} novo(s).` : 'Todos ja tinham essa conquista.');
  navigate('students', { classId: state.currentUser.classId });
}

function navigate(screen, params = {}) {
  state.currentScreen = screen;
  state.params = params;

  if (state.currentUser.role === 'professor' && params.classId) {
    state.currentUser.classId = params.classId;
  }
  if (state.currentUser.role === 'student' && params.id) {
    state.currentUser.studentId = params.id;
  }

  render();
  window.scrollTo(0, 0);
}

function switchRole(role) {
  state.currentUser.role = role;
  // Reset name based on role for realism
  const names = {
    superadmin: 'Admin System',
    director: 'Dir. Roberto Alves',
    professor: 'Prof. Ana Silva',
    student: 'Julia Martins'
  };
  state.currentUser.name = names[role];
  
  // Default landing screens
  if (role === 'student') {
    state.currentUser.studentId = 's1';
    navigate('student-album', { id: 's1' });
    return;
  }
  if (role === 'professor') {
    state.currentUser.classId = teacherClasses()[0]?.id || 'c1';
  }
  navigate('dashboard');
}

// Init
function init() {
  render();
}

// Main Render Loop
function render() {
  const app = $('#app');
  app.innerHTML = `
    <div class="app-shell">
      ${renderSidebar()}
      <main class="main">
        ${renderScreen()}
      </main>
      ${renderModals()}
    </div>
    <div id="toast" class="toast" aria-live="polite"></div>
  `;
  attachEvents();
}

// Render Sidebar
function renderSidebar() {
  const userRole = state.currentUser.role;
  const current = state.currentScreen;

  const navItems = {
    superadmin: [
      { id: 'dashboard', label: 'Visão Geral', icon: '📊', color: 'navy' },
      { id: 'users', label: 'Diretores', icon: '👥', color: 'olive' },
      { id: 'achievements', label: 'Catálogo', icon: '🏆', color: 'gold' },
      { id: 'audit', label: 'Auditoria', icon: '📋', color: 'rose' },
    ],
    director: [
      { id: 'dashboard', label: 'Dashboard', icon: '📈', color: 'navy' },
      { id: 'teachers', label: 'Professores', icon: '👩‍🏫', color: 'olive' },
      { id: 'classes', label: 'Classes', icon: '🏫', color: 'teal' },
      { id: 'invites', label: 'Convites', icon: '✉️', color: 'gold' },
    ],
    professor: [
      { id: 'dashboard', label: 'Minha Classe', icon: '📅', color: 'navy' },
      { id: 'classes', label: 'Minhas Classes', icon: '🏫', color: 'teal' },
      { id: 'students', label: 'Alunos da Classe', icon: '🎓', color: 'olive' },
      { id: 'invites', label: 'Convites', icon: '✉️', color: 'gold' },
      { id: 'grant', label: 'Conceder', icon: '✨', color: 'clay' },
    ],
    student: [
      { id: 'student-album', label: 'Meu Álbum', icon: '📖', color: 'clay' },
      { id: 'progress', label: 'Progresso', icon: '🚀', color: 'teal' },
    ]
  };

  const items = navItems[userRole] || navItems['student'];

  const menu = items.map(item => `
    <button class="nav-button ${current === item.id ? 'active' : ''}" onclick="navigate('${item.id}')">
      <div class="nav-icon ${item.color || 'clay'}">${item.icon}</div>
      <div>
        <strong>${item.label}</strong>
      </div>
    </button>
  `).join('');

  const profClass = (userRole === 'professor') ? (mockData.classes.find(c => c.id === (state.currentUser.classId || teacherClasses()[0]?.id))) : null;

  return `
    <aside class="sidebar panel">
      <div class="brand">
        <div class="brand-mark">S</div>
        <div>
          <div class="eyebrow">Seminário</div>
          <h1>Album</h1>
        </div>
      </div>
      
      <div class="nav-list">
        ${menu}
      </div>

      <div style="margin-top: auto">
        ${profClass ? `
          <div class="side-card">
            <h4>Classe Atual</h4>
            <div class="line-title">${profClass.name}</div>
            <div class="muted">${profClass.time} • ${visibleStudents().length} alunos visíveis</div>
            <div class="hero-actions" style="margin-top: 10px">
              <button class="mini-button" onclick="navigate('students', { classId: '${profClass.id}' })">Abrir alunos</button>
              <button class="mini-button" onclick="navigate('invites')">Convidar</button>
            </div>
          </div>
        ` : ''}
        <div class="side-card">
          <div class="eyebrow">Logado como</div>
          <div class="person-name">${state.currentUser.name}</div>
          <div class="meta-label">${userRole.toUpperCase()}</div>
        </div>
        <div class="role-switcher" style="margin-top: 12px; display: flex; gap: 4px; flex-wrap: wrap;">
          <button class="mini-button" onclick="switchRole('superadmin')">Admin</button>
          <button class="mini-button" onclick="switchRole('director')">Dir</button>
          <button class="mini-button" onclick="switchRole('professor')">Prof</button>
          <button class="mini-button" onclick="switchRole('student')">Aluno</button>
        </div>
      </div>
    </aside>
  `;
}

// Router
function renderScreen() {
  const { currentScreen } = state;
  const screens = {
    'dashboard': renderDashboard,
    'users': renderUserList,
    'achievements': renderAchievementCatalog,
    'audit': renderAuditLog,
    'classes': renderClassList,
    'students': renderStudentList,
    'grant': renderGrantScreen,
    'student-album': renderStudentAlbum,
    'student-detail': renderStudentDetail,
    'invites': renderInvites,
  };
  
  const renderer = screens[currentScreen] || (() => `<div class="panel"><h1>Em Construção: ${currentScreen}</h1></div>`);
  return renderer();
}

// Render Placeholders (will be replaced by actual implementations)
function renderDashboard() {
  const role = state.currentUser.role;
  const stats = mockData.stats;
  
  // Header
  const header = `
    <div class="hero">
      <div class="hero-copy">
        <div class="eyebrow">Dashboard</div>
        <h2>Olá, ${state.currentUser.name}</h2>
        <p>Bem-vindo ao sistema de achievements do Seminário. Aqui está o resumo das atividades recentes.</p>
        <div class="hero-actions">
          ${role === 'professor' ? '<button class="primary-button" onclick="navigate(\'grant\')">Conceder Achievement</button>' : ''}
          ${role === 'director' ? '<button class="primary-button" onclick="navigate(\'invites\')">Gerenciar Convites</button>' : ''}
          ${role === 'superadmin' ? '<button class="primary-button" onclick="navigate(\'achievements\')">Novo Achievement</button>' : ''}
        </div>
      </div>
      <div class="hero-aside">
        <div class="kpi-grid">
          <div class="kpi-card">
            <h4>Alunos Ativos</h4>
            <strong>${stats.students}</strong>
            <p class="status-pill active" style="margin-top: 8px">+12% este mês</p>
          </div>
          <div class="kpi-card">
            <h4>Conquistas</h4>
            <strong>${stats.achievements}</strong>
            <p class="status-pill active" style="margin-top: 8px">+85 hoje</p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Recent Activity (shared logic for now)
  const activity = mockData.audit.map(log => `
    <div class="audit-line">
      <div>
        <div class="line-title">${log.action}</div>
        <div class="muted">${log.details} • ${log.user}</div>
      </div>
      <div class="meta-label">${log.time}</div>
    </div>
  `).join('');

  return `
    <div class="screen-section">
      ${header}
      
      <div class="screen-grid two">
        <div class="list-card">
          <div class="screen-head" style="margin-bottom: 0">
            <h4>Atividade Recente</h4>
            <button class="mini-button" onclick="navigate('audit')">Ver tudo</button>
          </div>
          <div>${activity}</div>
        </div>
        
        <div class="side-stack">
          <div class="side-card">
            <h4>Resumo Rápido</h4>
            <ul>
              <li><span>Classes</span> <strong>${stats.classes}</strong></li>
              <li><span>Professores</span> <strong>${role === 'superadmin' ? '24' : '1'}</strong></li>
              <li><span>Convites</span> <strong>3 Pendentes</strong></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;
}
function renderUserList() { return '<div class="panel"><h1>Usuários</h1></div>'; }
function renderAchievementCatalog() { return '<div class="panel"><h1>Catálogo</h1></div>'; }
function renderAuditLog() { return '<div class="panel"><h1>Auditoria</h1></div>'; }
function renderClassList() {
  const classesVisible = teacherClasses();
  const classes = classesVisible.map(c => `
    <div class="class-card">
      <div class="detail-top">
        <div class="avatar-large" style="background: var(--navy)">${c.name[0]}</div>
        <button class="icon-button" onclick="navigate('students', { classId: '${c.id}' })" aria-label="Abrir alunos">➡️</button>
      </div>
      <div>
        <h4>${c.name}</h4>
        <div class="muted">${c.teacher} • ${c.time}</div>
      </div>
      <div class="meta-label">${c.students} Alunos</div>
    </div>
  `).join('');

  return `
    <div class="screen-section">
      <div class="screen-head">
        <h3>Minhas Classes</h3>
        <button class="primary-button">Nova Classe</button>
      </div>
      <div class="cards-grid classes">
        ${classes}
      </div>
    </div>
  `;
}

function renderStudentList() {
  const list = visibleStudents();
  const classId = state.params.classId || state.currentUser.classId;
  const classObj = mockData.classes.find(c => c.id === classId);

  const students = list.map(s => `
    <div class="student-card" onclick="navigate('student-detail', { id: '${s.id}' })" style="cursor: pointer">
      <div class="student-top">
        <div class="avatar">${s.name[0]}</div>
        <div class="status-pill active">${s.progress}%</div>
      </div>
      <div>
        <div class="person-name">${s.name}</div>
        <div class="muted">${mockData.classes.find(c => c.id === s.classId)?.name || 'Sem Classe'}</div>
      </div>
      <div class="chip-row">
        <span class="tiny-label">🏅 ${s.achievements.length}</span>
      </div>
    </div>
  `).join('');

  return `
    <div class="screen-section">
      <div class="screen-head">
        <div>
          <h3>Alunos</h3>
          <p>${classObj ? `Classe: <strong>${classObj.name}</strong> • ${classObj.time}` : 'Selecione uma classe para ver os alunos.'}</p>
        </div>
        <div class="action-row">
          <button class="secondary-button" onclick="navigate('invites')">Convidar</button>
          <button class="primary-button" onclick="navigate('grant')">Conceder</button>
        </div>
      </div>
      <div class="cards-grid students">
        ${students || '<div class="empty-state"><h4>Nenhum aluno</h4><p>Envie um convite para adicionar alguem a esta classe.</p><button class="primary-button" onclick="navigate(\'invites\')">Criar convite</button></div>'}
      </div>
    </div>
  `;
}

function renderStudentDetail() {
  const s = mockData.students.find(student => student.id === state.params.id);
  if (!s) return '<div class="panel">Aluno não encontrado</div>';
  
  const studentAchievements = s.achievements.map(aid => {
    const a = mockData.achievements.find(ach => ach.id === aid);
    return `<span class="chip active">${a.icon} ${a.title}</span>`;
  }).join('');

  return `
    <div class="screen-section">
      <button class="mini-button" onclick="navigate('students')">← Voltar</button>
      <div class="detail-card">
        <div class="detail-top">
          <div class="avatar-large">${s.name[0]}</div>
          <button class="primary-button" onclick="navigate('student-album', { id: '${s.id}' })">Ver Álbum</button>
        </div>
        <div>
          <h2 class="detail-title">${s.name}</h2>
          <p class="muted">Progresso Global: ${s.progress}%</p>
        </div>
        <div class="progress-wrap">
          <div class="progress-bar"><span style="width: ${s.progress}%"></span></div>
        </div>
        <div style="margin-top: 12px">
          <h4>Últimas Conquistas</h4>
          <div class="chip-row">
            ${studentAchievements || '<span class="muted">Nenhuma conquista ainda.</span>'}
          </div>
        </div>
      </div>
    </div>
  `;
}
function renderStudentAlbum() {
  const s = mockData.students.find(student => student.id === state.params.id) || mockData.students[0];
  
  const stickers = mockData.achievements.map(a => {
    const has = s.achievements.includes(a.id);
    if (has) {
      return `
        <div class="sticker hover-lift">
          <div class="sticker-badge ${a.color}">${a.icon}</div>
          <div class="sticker-title">${a.title}</div>
          <div class="meta-label">Conquistado</div>
        </div>
      `;
    }
    return `
      <div class="sticker locked">
        <div class="sticker-badge grey">🔒</div>
        <div class="sticker-title">${a.title}</div>
        <div class="meta-label">Bloqueado</div>
      </div>
    `;
  }).join('');

  return `
    <div class="screen-section">
      <div class="screen-head">
        <h3>Álbum de ${s.name}</h3>
        <button class="secondary-button" onclick="navigate('dashboard')">Voltar</button>
      </div>
      
      <div class="album-grid">
        ${stickers}
      </div>
    </div>
  `;
}

function renderGrantScreen() {
  const list = visibleStudents();
  const classId = state.params.classId || state.currentUser.classId;
  const classObj = mockData.classes.find(c => c.id === classId);
  const selectedAchievementId = state.params.grantAchievementId;

  const students = list.map(s => `
    <label class="check-row" style="padding: 12px; border: 1px solid var(--line); border-radius: 12px; background: rgba(255,255,255,0.6)">
      <input type="checkbox" name="student" value="${s.id}">
      <div class="avatar">${s.name[0]}</div>
      <div>
        <div class="line-title">${s.name}</div>
        <div class="muted">${s.achievements.length} conquistas</div>
      </div>
    </label>
  `).join('');

  const achievements = mockData.achievements.map(a => {
    const selected = selectedAchievementId === a.id;
    return `
      <button class="achievement-option ${selected ? 'selected' : ''}" onclick="selectGrantAchievement('${a.id}')" type="button">
        <div class="achievement-head">
          <div class="sticker-badge ${a.color}" style="width: 42px; height: 42px;">${a.icon}</div>
          <span class="status-pill ${selected ? 'active' : 'pending'}">${a.category}</span>
        </div>
        <strong>${a.title}</strong>
        <p>${a.special ? 'Marco de colecao (mais raro).' : 'Conquista padrao do catalogo.'}</p>
      </button>
    `;
  }).join('');

  return `
    <div class="screen-section">
      <div class="screen-head">
        <div>
          <h3>Conceder Achievement</h3>
          <p>${classObj ? `Aplicar na classe: <strong>${classObj.name}</strong>` : 'Selecione uma classe.'}</p>
        </div>
        <div class="action-row">
          <button class="secondary-button" onclick="navigate('students')">Ver alunos</button>
          <button class="mini-button" onclick="selectAllGrantStudents(true)">Selecionar todos</button>
          <button class="mini-button" onclick="selectAllGrantStudents(false)">Limpar</button>
        </div>
      </div>
      
      <div class="screen-grid two">
        <div class="panel">
          <h4>1. Selecione os Alunos</h4>
          <div class="form-grid">
            ${students}
          </div>
        </div>
        
        <div class="panel">
          <h4>2. Escolha a Conquista</h4>
          <div class="sticker-grid" style="grid-template-columns: repeat(auto-fill, minmax(140px, 1fr))">
            ${achievements}
          </div>
          
          <div style="margin-top: 24px; text-align: right">
            <button class="primary-button" onclick="confirmGrant()">Confirmar Concessão</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function setInviteFilter(status) {
  state.params.inviteStatus = status;
  render();
}

function renderInvites() {
  const role = state.currentUser.role;
  const classes = (role === 'professor') ? teacherClasses() : mockData.classes;
  const classOptions = classes.map(c => `<option value="${c.id}" ${c.id === state.currentUser.classId ? 'selected' : ''}>${c.name} (${c.time})</option>`).join('');
  const classIds = new Set(classes.map(c => c.id));

  const filter = state.params.inviteStatus || 'all';
  const invites = mockData.invites
    .filter(i => classIds.has(i.classId))
    .filter(i => (filter === 'all' ? true : i.status === filter));

  const filters = [
    { id: 'all', label: 'Todos' },
    { id: 'pending', label: 'Pendentes' },
    { id: 'accepted', label: 'Aceitos' },
    { id: 'expired', label: 'Cancelados' },
  ].map(f => `<button class="filter-chip ${filter === f.id ? 'active' : ''}" onclick="setInviteFilter('${f.id}')">${f.label}</button>`).join('');

  const rows = invites.map(inv => {
    const cls = mockData.classes.find(c => c.id === inv.classId);
    const statusClass = inv.status === 'pending' ? 'pending' : (inv.status === 'accepted' ? 'accepted' : 'expired');
    const statusLabel = inv.status === 'pending' ? 'Pendente' : (inv.status === 'accepted' ? 'Aceito' : 'Cancelado');

    return `
      <div class="invite-card">
        <div class="invite-line">
          <div>
            <div class="line-title">${inv.email}</div>
            <div class="muted">${cls ? cls.name : 'Classe'} • ${inv.createdAt}</div>
          </div>
          <span class="status-pill ${statusClass}">${statusLabel}</span>
        </div>

        <div class="hero-actions" style="margin-top: 8px">
          <button class="mini-button" onclick="copyInvite('${inv.id}')">Copiar link</button>
          ${inv.status === 'pending' ? `<button class="mini-button" onclick="resendInvite('${inv.id}')">Reenviar</button>` : ''}
          ${inv.status === 'pending' ? `<button class="mini-button" onclick="simulateAcceptInvite('${inv.id}')">Simular aceite</button>` : ''}
          ${inv.status === 'pending' ? `<button class="mini-button" onclick="cancelInvite('${inv.id}')">Cancelar</button>` : ''}
        </div>

        <div class="footer-note">Token: <strong>${inv.token}</strong> • Link: <code>${inviteHref(inv.token)}</code></div>
      </div>
    `;
  }).join('');

  return `
    <div class="screen-section">
      <div class="screen-head">
        <div>
          <h3>Convites</h3>
          <p>Adicione pessoas a sua classe por convite. Sem backend: voce pode simular o aceite.</p>
        </div>
        <button class="secondary-button" onclick="navigate('students')">Ver alunos</button>
      </div>

      <div class="screen-grid two">
        <div class="invite-state">
          <h3>Criar convite</h3>
          <p>Gera um link de aceite para um aluno entrar na classe selecionada.</p>
          <div class="form-grid">
            <div class="field">
              <label for="invite-email" class="tiny-label">Email do aluno</label>
              <input id="invite-email" type="email" placeholder="aluno@exemplo.com" autocomplete="off">
            </div>
            <div class="field">
              <label for="invite-class" class="tiny-label">Classe</label>
              <select id="invite-class" style="width: 100%; border: 1px solid rgba(34, 50, 40, 0.1); border-radius: 16px; padding: 14px 16px; background: rgba(255, 255, 255, 0.86)">
                ${classOptions}
              </select>
            </div>
            <div class="hero-actions">
              <button class="primary-button" onclick="createInvite()">Criar convite</button>
              <button class="ghost-button" onclick="toast('Dica: use "Simular aceite" em um convite pendente.')">Como testar</button>
            </div>
          </div>
        </div>

        <div class="list-card">
          <div class="screen-head" style="margin-bottom: 0">
            <h4>Convites da sua area</h4>
            <div class="filter-row">${filters}</div>
          </div>

          <div class="invite-grid" style="margin-top: 12px">
            ${rows || '<div class="empty-state"><h4>Nenhum convite</h4><p>Crie um convite para adicionar novos alunos.</p></div>'}
          </div>
        </div>
      </div>
    </div>
  `;
}
function renderModals() { return ''; }
function attachEvents() {}

document.addEventListener('DOMContentLoaded', init);
