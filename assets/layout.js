/**
 * layout.js  –  Injects the shared sidebar + topbar into every admin page.
 * Usage: each page has <div id="sidebar-root"></div> and calls:
 *        Layout.init({ active: 'dashboard' })
 */
const Layout = (() => {

  const NAV_ITEMS = [
    { id: 'dashboard',  icon: 'grid',        label: 'Dashboard',         href: 'dashboard.html' },
    { id: 'campaigns',  icon: 'megaphone',   label: 'Campaigns',         href: 'campaigns.html' },
    { id: 'research',   icon: 'search',      label: 'AI Research',       href: 'research.html' },
    { id: 'pipeline',   icon: 'film',        label: 'AI Pipeline',       href: 'pipeline.html' },
    { id: 'scheduler',  icon: 'calendar',    label: 'Scheduler',         href: 'scheduler.html' },
    { id: 'contacts',   icon: 'users',       label: 'Contacts',          href: 'contacts.html' },
    { id: 'settings',   icon: 'settings',    label: 'Settings',          href: 'settings.html' },
  ];

  const ICONS = {
    grid: `<svg class="w-5 h-5 nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>`,
    megaphone: `<svg class="w-5 h-5 nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>`,
    search: `<svg class="w-5 h-5 nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>`,
    film: `<svg class="w-5 h-5 nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"/></svg>`,
    calendar: `<svg class="w-5 h-5 nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`,
    users: `<svg class="w-5 h-5 nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
    settings: `<svg class="w-5 h-5 nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
    menu: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>`,
    bell: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>`,
    wa: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`,
  };

  function buildSidebar(activeId) {
    const items = NAV_ITEMS.map(n => `
      <a href="${n.href}" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 text-sm transition-all ${n.id === activeId ? 'active' : ''}">
        ${ICONS[n.icon]}
        <span class="nav-label">${n.label}</span>
      </a>`).join('');

    return `
    <aside id="sidebar" class="bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 overflow-y-auto z-30">
      <!-- Logo -->
      <div class="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
        <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style="background:linear-gradient(135deg,#128C7E,#25D366)">
          <span class="text-white">${ICONS.wa}</span>
        </div>
        <div class="sidebar-logo-text min-w-0">
          <p class="font-bold text-gray-800 text-sm leading-tight truncate">WA AI Chatbot</p>
          <p class="text-gray-400 text-xs truncate">Campaign Platform</p>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 px-3 py-4 space-y-1">
        <p class="sidebar-section-label text-gray-400 text-xs font-semibold uppercase tracking-widest px-3 mb-2">Main</p>
        ${items.slice(0, 2).split('</a>').join('</a>')}
        ${items.split('</a>').slice(0, 2).join('</a>') + '</a>'}

        <p class="sidebar-section-label text-gray-400 text-xs font-semibold uppercase tracking-widest px-3 mt-4 mb-2">AI Tools</p>
        ${NAV_ITEMS.slice(2, 5).map(n => `
          <a href="${n.href}" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 text-sm transition-all ${n.id === activeId ? 'active' : ''}">
            ${ICONS[n.icon]}
            <span class="nav-label">${n.label}</span>
          </a>`).join('')}

        <p class="sidebar-section-label text-gray-400 text-xs font-semibold uppercase tracking-widest px-3 mt-4 mb-2">Manage</p>
        ${NAV_ITEMS.slice(5).map(n => `
          <a href="${n.href}" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 text-sm transition-all ${n.id === activeId ? 'active' : ''}">
            ${ICONS[n.icon]}
            <span class="nav-label">${n.label}</span>
          </a>`).join('')}
      </nav>

      <!-- Bottom user card -->
      <div class="px-3 pb-4 border-t border-gray-100 pt-3">
        <div class="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 cursor-pointer">
          <img src="https://ui-avatars.com/api/?name=Admin+User&background=128C7E&color=fff&size=32" class="w-8 h-8 rounded-full flex-shrink-0" />
          <div class="nav-label min-w-0">
            <p class="text-sm font-semibold text-gray-800 truncate">Admin User</p>
            <p class="text-xs text-gray-400 truncate">admin@wachatbot.ai</p>
          </div>
        </div>
      </div>
    </aside>`;
  }

  function buildTopbar(pageTitle) {
    return `
    <header class="sticky top-0 z-20 bg-white border-b border-gray-100 flex items-center gap-4 px-6" style="height:64px">
      <button id="sidebar-toggle" onclick="Layout.toggleSidebar()" class="text-gray-500 hover:text-gray-800 transition p-1 rounded-lg hover:bg-gray-100">
        ${ICONS.menu}
      </button>
      <div>
        <h1 class="font-bold text-gray-800 text-lg leading-tight">${pageTitle}</h1>
      </div>
      <div class="ml-auto flex items-center gap-3">
        <!-- WhatsApp status pill -->
        <div class="hidden sm:flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full">
          <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          WA Connected
        </div>
        <!-- Scheduler pill -->
        <div class="hidden md:flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Next: 7:00 PM PKT
        </div>
        <!-- Bell -->
        <button class="relative p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition">
          ${ICONS.bell}
          <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
        </button>
        <!-- Avatar -->
        <img src="https://ui-avatars.com/api/?name=Admin+User&background=128C7E&color=fff&size=32" class="w-9 h-9 rounded-full cursor-pointer ring-2 ring-green-200" />
      </div>
    </header>`;
  }

  function init({ active = 'dashboard', title = 'Dashboard' } = {}) {
    // Inject sidebar
    const sidebarRoot = document.getElementById('sidebar-root');
    if (sidebarRoot) sidebarRoot.innerHTML = buildSidebar(active);

    // Inject topbar
    const topbarRoot = document.getElementById('topbar-root');
    if (topbarRoot) topbarRoot.innerHTML = buildTopbar(title);
  }

  function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    if (sb) sb.classList.toggle('collapsed');
  }

  return { init, toggleSidebar };
})();
