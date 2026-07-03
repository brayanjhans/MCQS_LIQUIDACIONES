const API_URL = 'http://localhost:5000/api';

// --- State Management ---
let currentState = {
    view: 'home',
    empresas: [],
    fianzas: [],
    facturas: [],
    usuarios: [],
    selectedRecord: null,
    selectedCompany: null,
    searchQuery: '',
    currentUser: null
};

// --- Helpers ---
function formatDate(isoString) {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return isNaN(date.getTime()) ? isoString : date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function toISODate(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return isNaN(date.getTime()) ? isoString : date.toISOString().split('T')[0];
}

// --- DOM Elements ---
const authScreen = document.getElementById('auth-screen');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('login-form');
const viewContainer = document.getElementById('view-container');
const pageTitle = document.getElementById('page-title');
const modalContainer = document.getElementById('modal-container');
const modalBody = document.getElementById('modal-body');
const modalTitle = document.getElementById('modal-title');
const closeModal = document.querySelector('.close-modal');
const sidebarCompanyList = document.getElementById('company-list');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    window.downloadPDF = (id) => {
        window.open(`${API_URL}/reporte/empresa/${id}`, '_blank');
    };
    initApp();
});

function initApp() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            sidebarToggle.innerText = sidebar.classList.contains('collapsed') ? '➔' : '☰';
        });
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                currentState.currentUser = await res.json();
                showDashboard();
            } else { alert('Credenciales incorrectas'); }
        } catch (err) {
            if (data.username === 'admin' && data.password === 'admin') {
                currentState.currentUser = { username: 'admin', role: 'admin' };
                showDashboard();
            }
        }
    });

    closeModal.onclick = () => modalContainer.classList.add('hidden');
    window.onclick = (e) => { if (e.target == modalContainer) modalContainer.classList.add('hidden'); };

    fetchData();
}

async function fetchData() {
    try {
        const [empRes, fianzaRes, facturaRes, userRes] = await Promise.all([
            fetch(`${API_URL}/empresas`),
            fetch(`${API_URL}/cartas_fianzas`),
            fetch(`${API_URL}/facturas`),
            fetch(`${API_URL}/usuarios`)
        ]);
        
        currentState.empresas = await empRes.json() || [];
        currentState.fianzas = await fianzaRes.json() || [];
        currentState.facturas = await facturaRes.json() || [];
        currentState.usuarios = await userRes.json() || [];
        
        updateCompanySidebar();
        if (currentState.selectedCompany) {
            currentState.selectedCompany = currentState.empresas.find(e => e.id === currentState.selectedCompany.id);
            renderCompanyDetail();
        } else {
            renderHome();
        }
    } catch (err) { console.warn('Error fetching data'); }
}

function updateCompanySidebar() {
    if (!sidebarCompanyList) return;
    const sidebar = document.getElementById('sidebar');
    const isCollapsed = sidebar.classList.contains('collapsed');
    const searchInput = document.getElementById('sidebar-search');
    const filter = searchInput?.value.toLowerCase() || '';
    const filtered = currentState.empresas.filter(e => e.nombre.toLowerCase().includes(filter));
    
    sidebarCompanyList.innerHTML = filtered.map((e, index) => {
        const initials = e.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const isActive = currentState.selectedCompany?.id === e.id;
        
        return `
            <div class="company-item ${isActive ? 'active' : ''}" 
                onclick="window.selectCompany(${e.id})"
                style="animation-delay: ${index * 0.05}s"
                title="${e.nombre}">
                <div style="min-width:32px; height:32px; background:${isActive ? 'var(--secondary)' : '#f1f5f9'}; color:${isActive ? 'white' : '#64748b'}; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:0.65rem; font-weight:800;">
                    ${initials}
                </div>
                <span style="${isCollapsed ? 'display:none' : 'display:block'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;">
                    ${e.nombre}
                </span>
                <div class="sidebar-actions-mini" style="${isCollapsed ? 'display:none' : 'display:flex'}; gap:10px; opacity:0.5;">
                    <span onclick="event.stopPropagation(); window.openEditModal('empresas', ${e.id})" title="Editar" style="cursor:pointer;">✏️</span>
                    <span onclick="event.stopPropagation(); window.executeDeletion('empresas', ${e.id})" title="Eliminar" style="cursor:pointer;">🗑️</span>
                </div>
            </div>
        `;
    }).join('');
}

window.filterCompanies = (val) => {
    updateCompanySidebar();
};

function showDashboard() {
    authScreen.classList.add('hidden');
    dashboard.classList.remove('hidden');
    
    // Update User Profile
    const userNameDisplay = document.getElementById('user-display-name');
    const avatarDisplay = document.querySelector('.avatar');
    if (userNameDisplay) userNameDisplay.innerText = currentState.currentUser.username;
    if (avatarDisplay) avatarDisplay.innerText = currentState.currentUser.username[0].toUpperCase();

    const btnUsers = document.getElementById('btn-manage-users');
    if (btnUsers) {
        if (currentState.currentUser.role === 'admin') btnUsers.classList.remove('hidden');
        else btnUsers.classList.add('hidden');
    }
    renderHome();
}

window.logout = () => {
    currentState.currentUser = null;
    dashboard.classList.add('hidden');
    authScreen.classList.remove('hidden');
};

window.switchView = (view) => {
    currentState.view = view;
    currentState.selectedCompany = null;
    updateCompanySidebar();
    if (view === 'usuarios') renderUserManagement();
    else renderHome();
};

window.selectCompany = (id) => {
    currentState.selectedCompany = currentState.empresas.find(e => e.id === id);
    currentState.view = 'company-detail';
    renderCompanyDetail();
    updateCompanySidebar();
};

// --- UI Components ---
window.filterLocalRecords = (input, categoryClass) => {
    const query = input.value.toLowerCase();
    const container = input.closest('.fianza-category');
    const items = container.querySelectorAll('.fianza-item');
    items.forEach(item => {
        const text = item.innerText.toLowerCase();
        item.style.display = text.includes(query) ? 'block' : 'none';
    });
};

function renderRecordCard(rec, type, isLatest = false, companyName = null) {
    const isFianza = type === 'fianzas';
    const accentColor = isFianza ? '#3b82f6' : '#10b981';
    const label = isFianza ? 'FIANZA' : 'FACTURA';
    
    const clickHandler = companyName 
        ? `window.selectCompany(${rec.empresa_id}); setTimeout(() => window.selectRecord('${type}', ${rec.id}), 100)`
        : `window.selectRecord('${type}', ${rec.id})`;

    return `
        <div class="fianza-item ${isLatest ? 'latest' : ''} ${!isFianza ? 'factura' : ''}" 
             onclick="${clickHandler}" 
             style="cursor:pointer; border-left: 4px solid ${accentColor}; border-radius:12px; padding:16px; background:white; margin-bottom:12px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; border-left: 4px solid ${accentColor};">
            
            ${companyName ? `
                <div style="margin-bottom:10px; padding-bottom:8px; border-bottom:1px solid #f8fafc;">
                    <div style="font-size:0.45rem; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:1px; margin-bottom:2px;">EMPRESA ASOCIADA</div>
                    <div style="font-size:0.8rem; font-weight:800; color:#1e293b; letter-spacing:-0.2px;">🏢 ${companyName}</div>
                </div>
            ` : ''}

            <!-- Compact Header -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="font-size:0.5rem; font-weight:800; color:#94a3b8; letter-spacing:1px; text-transform:uppercase;">📄 ${label}</span>
                    ${isLatest ? `<span style="color:#3b82f6; font-size:0.5rem; font-weight:800; display:flex; align-items:center; gap:3px;"><span style="width:6px; height:6px; background:#93c5fd; border-radius:50%;"></span> RECIENTE</span>` : ''}
                </div>
                <div style="font-size:0.5rem; font-weight:800; color:#94a3b8; letter-spacing:1px; text-transform:uppercase;">MONTO TOTAL</div>
            </div>

            <!-- Main Data Row -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <div style="font-size:1.1rem; font-weight:700; color:#334155;"># ${rec.numero}</div>
                <div style="color:${accentColor}; font-size:1.1rem; font-weight:800;">S/ ${parseFloat(rec.monto).toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
            </div>
            
            <!-- Minimal Detail Grid -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; padding-top:8px; border-top:1px dotted #e2e8f0;">
                <div>
                    <div style="font-size:0.45rem; font-weight:800; color:#94a3b8; letter-spacing:1px; margin-bottom:2px;">📅 ${isFianza ? 'VENCIMIENTO' : 'SALIDA'}</div>
                    <div style="font-size:0.85rem; font-weight:700; color:#475569;">${formatDate(isFianza ? rec.fecha_vencimiento : rec.fecha_salida)}</div>
                </div>
                <div>
                    <div style="font-size:0.45rem; font-weight:800; color:#94a3b8; letter-spacing:1px; margin-bottom:2px;">${isFianza ? '🏷️ TIPO' : '📄 DOC'}</div>
                    <div style="font-size:0.75rem; font-weight:600; color:#64748b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${isFianza ? (rec.tipo || 'GENERAL') : 'LIQUIDACIÓN'}</div>
                </div>
            </div>
        </div>
    `;
}

// --- Dashboard Rendering ---
function renderHome() {
    pageTitle.innerText = 'Dashboard Principal';
    
    // Global Data Preparation
    const totalEmpresas = currentState.empresas.length;
    const allFianzas = [...currentState.fianzas].sort((a, b) => new Date(b.created_at || b.fecha_inicio) - new Date(a.created_at || a.fecha_inicio));
    const allFacturas = [...currentState.facturas].sort((a, b) => new Date(b.created_at || b.fecha_salida) - new Date(a.created_at || a.fecha_salida));
    
    const facturasObs = currentState.facturas.filter(f => f.es_observada).length;
    const today = new Date();
    const expiringSoon = currentState.fianzas.filter(f => {
        const ven = new Date(f.fecha_vencimiento);
        return ven >= today && ven <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    }).length;

    const totalGarantia = currentState.empresas.reduce((acc, c) => acc + (parseFloat(c.monto_garantia) || 0), 0);
    const totalLiberado = currentState.empresas.reduce((acc, c) => acc + (parseFloat(c.monto_liberado) || 0), 0);
    const getCompName = (id) => currentState.empresas.find(e => e.id === id)?.nombre || '---';

    viewContainer.innerHTML = `
        <div class="home-dashboard">
            <!-- Information Hero Panel -->
            <div class="dashboard-hero glass" style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 40px; border-radius: 30px; margin-bottom: 3rem; position: relative; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.2);">
                <div style="position:relative; z-index:2;">
                    <h1 style="font-size:1.8rem; font-weight:300; margin-bottom:10px;">Resumen Ejecutivo de <span>Gestión</span></h1>
                    <p style="opacity:0.7; font-size:0.8rem; margin-bottom:30px; letter-spacing:1px;">MONITOREO GLOBAL DE LIQUIDACIONES Y GARANTÍAS</p>
                    
                    <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:2rem;">
                        <div class="hero-stat">
                            <div class="hero-stat-label">EMPRESAS</div>
                            <div class="hero-stat-value">${totalEmpresas}</div>
                        </div>
                        <div class="hero-stat">
                            <div class="hero-stat-label">EXPIRACIONES PRÓX.</div>
                            <div class="hero-stat-value" style="color:#fbbf24;">${expiringSoon}</div>
                        </div>
                        <div class="hero-stat">
                            <div class="hero-stat-label">FACTURAS OBS.</div>
                            <div class="hero-stat-value" style="color:#f87171;">${facturasObs}</div>
                        </div>
                        <div class="hero-stat">
                            <div class="hero-stat-label">TOTAL LIBERADO</div>
                            <div class="hero-stat-value" style="color:var(--accent);">S/ ${totalLiberado.toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:3rem;">
                <!-- Section 1: Recent Bonds -->
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; border-bottom:1px solid #e2e8f0; padding-bottom:15px;">
                        <h3 class="section-subtitle" style="margin-bottom:0;">📜 CARTAS FIANZAS RECIENTES</h3>
                        <span style="font-size:0.6rem; font-weight:800; color:var(--secondary); background:#eff6ff; padding:4px 10px; border-radius:20px;">ÚLTIMAS 3</span>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:10px;">
                        ${allFianzas.slice(0, 3).map(f => renderRecordCard(f, 'fianzas', true, getCompName(f.empresa_id))).join('')}
                    </div>
                </div>

                <!-- Section 2: Recent Invoices -->
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; border-bottom:1px solid #e2e8f0; padding-bottom:15px;">
                        <h3 class="section-subtitle" style="margin-bottom:0;">💰 FACTURAS RECIENTES</h3>
                        <span style="font-size:0.6rem; font-weight:800; color:var(--accent); background:#f0fdf4; padding:4px 10px; border-radius:20px;">ÚLTIMAS 3</span>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:10px;">
                        ${allFacturas.slice(0, 3).map(f => renderRecordCard(f, 'facturas', true, getCompName(f.empresa_id))).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderCompanyDetail() {
    const comp = currentState.selectedCompany;
    if (!comp) return;

    // Smooth transition for content change
    viewContainer.style.opacity = '0';
    viewContainer.style.transform = 'translateY(10px)';
    viewContainer.style.transition = 'none';

    setTimeout(() => {
        viewContainer.style.transition = 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
        viewContainer.style.opacity = '1';
        viewContainer.style.transform = 'translateY(0)';
    }, 50);

    pageTitle.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <div style="display:flex; flex-direction:column; gap:0.2rem;">
                <span style="font-size:2rem; font-weight:300; letter-spacing:-0.5px;">${comp.nombre}</span>
                <div style="font-size:0.6rem; color:#94a3b8; letter-spacing:1.5px; text-transform:uppercase; display:flex; gap:1.5rem; font-weight:800;">
                    <span>RUC: ${comp.ruc || '---'}</span>
                    <span>Representante: ${comp.representante || '---'}</span>
                </div>
            </div>
            <div class="header-actions-main">
                <button class="btn-action-minimal" onclick="window.downloadPDF(${comp.id})" style="background:var(--secondary); color:white; border:none; padding:8px 16px; font-size:0.6rem;">📄 DESCARGAR PDF</button>
                <button class="btn-action-minimal" onclick="window.openEditModal('empresas', ${comp.id})" style="padding:8px 16px; font-size:0.6rem;">EDITAR</button>
            </div>
        </div>
    `;

    const seaceInfo = `
        <div class="section-group" style="padding:1.5rem; margin-bottom:1.5rem;">
            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:2rem; padding-bottom:1.5rem; border-bottom:1px solid #f8fafc;">
                <div><div class="data-label">📂 SEACE</div><div class="data-value" style="color:var(--secondary); font-size:0.8rem;">${comp.nomenclatura || '---'}</div></div>
                <div><div class="data-label">💰 MONTO OBRA</div><div class="data-value" style="font-size:0.8rem;">S/ ${comp.monto_obra ? parseFloat(comp.monto_obra).toLocaleString('en-US') : '0.00'}</div></div>
                <div><div class="data-label">🗓️ PERIODO</div><div class="data-value" style="font-size:0.7rem;">${formatDate(comp.fecha_inicio_obra)} <span style="opacity:0.3;">/</span> ${formatDate(comp.fecha_fin_obra)}</div></div>
            </div>
            
            <div style="display:grid; grid-template-columns: 1.5fr 1fr; gap:3rem; margin-top:1.5rem;">
                <div>
                    <div class="data-label">📝 DESCRIPCIÓN DEL PROYECTO</div>
                    <div style="font-size:0.8rem; line-height:1.6; color:#475569; margin-top:0.5rem; font-weight:500;">${comp.descripcion || 'Sin descripción.'}</div>
                </div>
                <div style="background:#fcfdfe; border-radius:12px; border:1px solid #f1f5f9; padding:1.2rem;">
                    <div style="font-size:0.55rem; color:var(--secondary); font-weight:800; letter-spacing:2px; margin-bottom:1rem; display:flex; justify-content:space-between;">
                        <span>📊 CONTROL</span>
                        <span onclick="window.openControlDataModal(${comp.id})" style="cursor:pointer; font-size:0.8rem; opacity:0.5;">✏️</span>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:0.8rem;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-end; border-bottom:1px dotted #e2e8f0; padding-bottom:4px;">
                            <span class="data-label" style="margin-bottom:0;">SUMA ASEGURADA</span>
                            <span class="data-value" style="font-size:0.8rem;">S/ ${comp.suma_asegurada ? parseFloat(comp.suma_asegurada).toLocaleString() : '0.00'}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:flex-end; border-bottom:1px dotted #e2e8f0; padding-bottom:4px;">
                            <span class="data-label" style="margin-bottom:0;">GARANTÍA</span>
                            <span class="data-value" style="font-size:0.8rem;">S/ ${comp.monto_garantia ? parseFloat(comp.monto_garantia).toLocaleString() : '0.00'}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:flex-end;">
                            <span class="data-label" style="margin-bottom:0;">LIBERADO</span>
                            <span class="data-value" style="font-size:0.8rem; color:var(--accent);">S/ ${comp.monto_liberado ? parseFloat(comp.monto_liberado).toLocaleString() : '0.00'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const coFianzas = [...currentState.fianzas].filter(f => f.empresa_id === comp.id)
        .sort((a, b) => new Date(b.fecha_inicio) - new Date(a.fecha_inicio));
    const coFacturas = [...currentState.facturas].filter(f => f.empresa_id === comp.id)
        .sort((a, b) => new Date(b.fecha_salida) - new Date(a.fecha_salida));
        
    const normalFacturas = coFacturas.filter(f => !f.es_observada);
    const observadasFacturas = coFacturas.filter(f => f.es_observada);

    const getInvoiceType = (f) => {
        if (f.tipo_fianza_relacionada) return f.tipo_fianza_relacionada;
        if (!f.numero_fianza_relacionada) return 'Fiel Cumplimiento'; // Default if none
        const match = coFianzas.find(b => b.numero === f.numero_fianza_relacionada);
        return match ? match.tipo : 'Fiel Cumplimiento';
    };

    const facturasByCategory = {
        'Fiel Cumplimiento': normalFacturas.filter(f => getInvoiceType(f) === 'Fiel Cumplimiento'),
        'Adelanto de Materiales': normalFacturas.filter(f => getInvoiceType(f) === 'Adelanto de Materiales'),
        'Adelanto Directo': normalFacturas.filter(f => getInvoiceType(f) === 'Adelanto Directo')
    };

    const categories = {
        'Fiel Cumplimiento': coFianzas.filter(f => f.tipo === 'Fiel Cumplimiento'),
        'Adelanto de Materiales': coFianzas.filter(f => f.tipo === 'Adelanto de Materiales'),
        'Adelanto Directo': coFianzas.filter(f => f.tipo === 'Adelanto Directo')
    };

    viewContainer.innerHTML = `
        <div class="company-view-grid">
            ${seaceInfo}
            <!-- Sección Cartas Fianzas -->
            <div class="section-group">
                <div class="section-header">
                    <h2>Cartas Fianzas</h2>
                    <button class="btn-action-minimal" onclick="window.openFianzaModal()">+ AGREGAR FIANZA</button>
                </div>
                <div class="fianzas-container">
                    ${Object.entries(categories).map(([name, list]) => {
                        const latest = list[0];
                        const history = list.slice(1);
                        return `
                        <div class="fianza-category">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid #f1f5f9; padding-bottom:10px;">
                                <h4 style="margin-bottom:0; font-size:0.7rem;">${name}</h4>
                                <div style="position:relative; display:flex; align-items:center;">
                                    <span style="position:absolute; left:10px; font-size:0.6rem; opacity:0.4;">🔍</span>
                                    <input type="text" placeholder="Buscar..." 
                                           oninput="window.filterLocalRecords(this)"
                                           style="padding:5px 10px 5px 25px; border-radius:20px; border:1px solid #e2e8f0; font-size:0.6rem; outline:none; background:#fcfdfe; width:100px; transition:all 0.3s;"
                                           onfocus="this.style.width='150px'" onblur="if(!this.value) this.style.width='100px'">
                                </div>
                            </div>
                            ${latest ? renderRecordCard(latest, 'fianzas', true) : ''}
                            ${history.length ? `
                                <button class="toggle-history-btn" onclick="this.nextElementSibling.classList.toggle('hidden'); this.innerText = this.nextElementSibling.classList.contains('hidden') ? '+ VER HISTORIAL (${history.length})' : '- OCULTAR HISTORIAL';">
                                    + VER HISTORIAL (${history.length})
                                </button>
                                <div class="history-list hidden">
                                    ${history.map(h => renderRecordCard(h, 'fianzas', false)).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `}).join('')}
                </div>
            </div>

            <!-- Sección Facturas -->
            <div class="section-group">
                <div class="section-header">
                    <h2>Facturas Normales</h2>
                    <button class="btn-action-minimal" onclick="window.openFacturaModal()">+ AGREGAR FACTURA</button>
                </div>
                <div class="fianzas-container" style="margin-bottom:2rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
                    ${Object.entries(facturasByCategory).map(([name, list]) => {
                        const latest = list[0];
                        const history = list.slice(1);
                        return `
                        <div class="fianza-category" style="background:#f8fafc; padding:25px; border-radius:20px; border:1px solid #f1f5f9;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; border-bottom:1px solid #e2e8f0; padding-bottom:12px;">
                                <h4 style="margin-bottom:0; font-size:0.7rem;">${name}</h4>
                                <div style="position:relative; display:flex; align-items:center;">
                                    <span style="position:absolute; left:10px; font-size:0.6rem; opacity:0.4;">🔍</span>
                                    <input type="text" placeholder="Buscar..." 
                                           oninput="window.filterLocalRecords(this)"
                                           style="padding:6px 10px 6px 25px; border-radius:20px; border:1px solid #e2e8f0; font-size:0.6rem; outline:none; background:#ffffff; width:100px; transition:all 0.3s;"
                                           onfocus="this.style.width='150px'" onblur="if(!this.value) this.style.width='100px'">
                                </div>
                            </div>
                            ${latest ? renderRecordCard(latest, 'facturas', true) : ''}
                            ${history.length ? `
                                <button class="toggle-history-btn" onclick="this.nextElementSibling.classList.toggle('hidden'); this.innerText = this.nextElementSibling.classList.contains('hidden') ? '+ VER HISTORIAL (${history.length})' : '- OCULTAR HISTORIAL';">
                                    + VER HISTORIAL (${history.length})
                                </button>
                                <div class="history-list hidden">
                                    ${history.map(h => renderRecordCard(h, 'facturas', false)).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `}).join('')}
                </div>
            </div>

            <!-- Sección Facturas Observadas -->
            <div class="section-group" style="border-top: 4px solid #ef4444;">
                <div class="section-header">
                    <h2 style="color:#ef4444; display:flex; align-items:center; gap:10px;">⚠️ Facturas Observadas <span style="font-size:0.6rem; background:#fee2e2; color:#ef4444; padding:2px 8px; border-radius:10px; font-weight:800;">${observadasFacturas.length} ALERTAS</span></h2>
                    <button class="btn-action-minimal" onclick="window.openFacturaModal(null, true)" style="border-color:#fecaca; color:#ef4444;">+ REGISTRAR OBSERVACIÓN</button>
                </div>
                <div style="overflow-x:auto;">
                    <table style="min-width:800px;">
                        <thead>
                            <tr>
                                <th style="font-size:0.55rem; padding:12px 15px;">🧾 Factura #</th>
                                <th style="font-size:0.55rem; padding:12px 15px;">💰 Monto</th>
                                <th style="font-size:0.55rem; padding:12px 15px;">🔗 Fianza Relac.</th>
                                <th style="font-size:0.55rem; padding:12px 15px;">📤 Salida</th>
                                <th style="font-size:0.55rem; padding:12px 15px;">🔍 Detalle</th>
                                <th style="font-size:0.55rem; padding:12px 15px;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${observadasFacturas.map(f => `
                                <tr onclick="window.selectRecord('facturas', ${f.id})" style="cursor:pointer; transition:all 0.2s;">
                                    <td style="font-weight:700; color:#ef4444; font-size:0.8rem; padding:10px 15px;">${f.numero}</td>
                                    <td style="font-weight:700; font-size:0.8rem; padding:10px 15px;">S/ ${parseFloat(f.monto).toLocaleString()}</td>
                                    <td style="font-size:0.7rem; font-weight:700; color:var(--secondary); padding:10px 15px;">${f.numero_fianza_relacionada || '---'}</td>
                                    <td style="font-size:0.75rem; font-weight:600; padding:10px 15px;">${formatDate(f.fecha_salida)}</td>
                                    <td style="font-size:0.75rem; font-style:italic; color:#64748b; max-width:250px; line-height:1.4; padding:10px 15px;">${f.observacion || 'Sin detalle'}</td>
                                    <td style="padding:10px 15px;">
                                        <div class="row-actions" style="justify-content:center;">
                                            <button class="action-btn" style="padding:4px;" onclick="event.stopPropagation(); window.openEditModal('facturas', ${f.id})">✏️</button>
                                            <button class="action-btn" style="padding:4px;" onclick="event.stopPropagation(); window.executeDeletion('facturas', ${f.id})">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                            ${!observadasFacturas.length ? '<tr><td colspan="6" style="text-align:center; padding:3rem; color:#94a3b8; font-style:italic; font-size:0.75rem;">No se han registrado facturas con observaciones.</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Vista Previa -->
            <div id="preview-pane" class="glass" style="padding:1.5rem; border-radius:20px;">
                ${renderPreviewContent()}
            </div>
        </div>
    `;
}

function renderUserManagement() {
    pageTitle.innerText = 'Gestión de Usuarios';
    viewContainer.innerHTML = `
        <div class="section-group">
            <div class="section-header">
                <h2>Usuarios del Sistema</h2>
                <button class="btn-action-minimal" onclick="window.openUsuarioModal()">+ NUEVO USUARIO</button>
            </div>
            <table>
                <thead><tr><th>Username</th><th>Rol</th><th>Creado</th><th>Acciones</th></tr></thead>
                <tbody>
                    ${currentState.usuarios.map(u => `
                        <tr>
                            <td>${u.username}</td>
                            <td>${u.role}</td>
                            <td>${formatDate(u.created_at)}</td>
                            <td>
                                <button class="action-btn" onclick="window.deleteRecord('usuarios', ${u.id})">🗑️</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

window.selectRecord = (type, id) => {
    currentState.selectedRecord = currentState[type].find(r => r.id === id);
    const preview = document.getElementById('preview-pane');
    if (preview) preview.innerHTML = renderPreviewContent();
};

function renderPreviewContent() {
    const rec = currentState.selectedRecord;
    if (!rec) return `<div style="text-align:center; padding:3rem; opacity:0.3; font-size:0.6rem; letter-spacing:2px; font-weight:800;">SELECCIONE UN REGISTRO</div>`;

    const isFianza = !!rec.tipo;
    const pdfSrc = rec.pdf_path && rec.pdf_path !== 'null' ? `http://localhost:5000/uploads/${rec.pdf_path}` : null;

    const DataRow = (label, value, isBold = false) => `
        <div style="display:flex; justify-content:space-between; align-items:flex-end; border-bottom:1px dotted #e2e8f0; padding-bottom:6px; margin-bottom:8px;">
            <span class="data-label" style="margin-bottom:0;">${label}</span>
            <span class="data-value" style="${isBold ? 'font-weight:800;' : ''}">${value}</span>
        </div>
    `;

    return `
        <div class="preview-card-executive" style="padding:1rem;">
            <div style="margin-bottom:2rem;">
                <div class="data-label">${isFianza ? 'CARTA FIANZA' : 'FACTURA'}</div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="font-size:1.2rem; font-weight:300; letter-spacing:-0.5px;">${rec.numero}</h3>
                    <div style="font-size:0.5rem; font-weight:800; color:${isFianza ? 'var(--secondary)' : 'var(--accent)'}; border:1px solid; padding:2px 8px; border-radius:4px; letter-spacing:1px;">ACTIVE</div>
                </div>
            </div>

            <div style="margin-bottom:2rem;">
                ${DataRow('MONTO TOTAL', `S/ ${parseFloat(rec.monto).toLocaleString()}`, true)}
                ${DataRow(isFianza ? 'VENCIMIENTO' : 'SALIDA', formatDate(isFianza ? rec.fecha_vencimiento : rec.fecha_salida))}
                ${isFianza ? DataRow('INICIO', formatDate(rec.fecha_inicio)) : DataRow('FIANZA RELAC.', rec.numero_fianza_relacionada || '---')}
                ${isFianza ? DataRow('TIPO', rec.tipo) : DataRow('CATEGORÍA', rec.tipo_fianza_relacionada || 'Normal')}
            </div>

            ${rec.observacion || rec.observaciones ? `
                <div style="margin-bottom:2rem;">
                    <div class="data-label">OBSERVACIONES</div>
                    <div style="font-size:0.75rem; line-height:1.5; color:#64748b; font-weight:500; margin-top:5px; padding:10px; background:#fcfdfe; border:1px solid #f1f5f9; border-radius:8px;">${rec.observacion || rec.observaciones}</div>
                </div>
            ` : ''}

            <div style="display:flex; gap:0.5rem;">
                ${pdfSrc ? `<button class="btn-action-minimal" style="flex:1; background:var(--secondary); color:white; border:none; font-size:0.6rem;" onclick="window.open('${pdfSrc}', '_blank')">ABRIR DOCUMENTO</button>` : ''}
                <button class="btn-action-minimal" style="padding:8px 12px; font-size:0.7rem;" onclick="window.openEditModal('${isFianza ? 'fianzas' : 'facturas'}', ${rec.id})">✏️</button>
            </div>
        </div>
    `;
}

// --- CRUD ---
window.openAddModal = (type) => {
    if (type === 'empresas') openEmpresaModal();
};

window.openEditModal = (type, id) => {
    const record = currentState[type].find(r => r.id === id);
    if (type === 'empresas') openEmpresaModal(record);
    if (type === 'fianzas') openFianzaModal(record);
    if (type === 'facturas') openFacturaModal(record);
};

window.executeDeletion = async (type, id) => {
    console.log(`[CRUD] Iniciando petición de eliminación para ${type} ID: ${id}`);
    if (!confirm('¿Está seguro de que desea eliminar este registro? Esta acción no se puede deshacer.')) return;
    
    try {
        const response = await fetch(`${API_URL}/${type}/${id}`, { 
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            console.error(`[CRUD] Error de servidor eliminando ${type}:`, result.error);
            throw new Error(result.error || 'Error desconocido al eliminar en el servidor');
        }
        
        console.log(`[CRUD] Eliminación exitosa de ${type} ID: ${id}`, result);
        
        if (type === 'empresas' && currentState.selectedCompany?.id === id) {
            currentState.selectedCompany = null;
            currentState.view = 'home';
        }
        
        await fetchData();
        alert('Registro eliminado correctamente');
        
    } catch (error) {
        console.error('Error en executeDeletion:', error);
        alert('Hubo un error al intentar eliminar: ' + error.message);
    }
};

window.openControlDataModal = (id) => {
    const comp = currentState.selectedCompany;
    if (!comp || comp.id !== id) return;
    
    modalTitle.innerText = 'Editar Datos de Control (Secretaría)';
    modalBody.innerHTML = `
        <form id="control-form" style="max-height:70vh; overflow-y:auto; padding-right:10px;">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                <div class="input-group"><label>Suma Asegurada (S/)</label><input type="number" step="0.01" name="suma_asegurada" value="${comp.suma_asegurada || ''}"></div>
                <div class="input-group"><label>Monto Garantía (S/)</label><input type="number" step="0.01" name="monto_garantia" value="${comp.monto_garantia || ''}"></div>
            </div>
            <div class="input-group"><label>Monto Liberado (S/)</label><input type="number" step="0.01" name="monto_liberado" value="${comp.monto_liberado || ''}"></div>
            
            <div class="input-group">
                <label>Observaciones Generales</label>
                <textarea name="observaciones" style="width:100%; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; color:var(--text); outline:none; font-family:inherit; font-size:0.9rem; min-height:60px; padding:10px; font-weight:600;">${comp.observaciones || ''}</textarea>
            </div>
            
            <!-- Campos ocultos para mantener los datos de la empresa intactos -->
            <input type="hidden" name="nombre" value="${comp.nombre || ''}">
            <input type="hidden" name="ruc" value="${comp.ruc || ''}">
            <input type="hidden" name="representante" value="${comp.representante || ''}">
            <input type="hidden" name="nomenclatura" value="${comp.nomenclatura || ''}">
            <input type="hidden" name="descripcion" value="${comp.descripcion || ''}">
            <input type="hidden" name="monto_obra" value="${comp.monto_obra || ''}">
            <input type="hidden" name="fecha_inicio_obra" value="${toISODate(comp.fecha_inicio_obra) || ''}">
            <input type="hidden" name="fecha_fin_obra" value="${toISODate(comp.fecha_fin_obra) || ''}">
            
            <button type="submit" class="btn-action-minimal" style="width:100%; margin-top:20px;">GUARDAR CAMBIOS</button>
        </form>
    `;
    modalContainer.classList.remove('hidden');
    document.getElementById('control-form').onsubmit = async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        try {
            const response = await fetch(`${API_URL}/empresas/${comp.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Error al actualizar');
            await fetchData();
            modalContainer.classList.add('hidden');
        } catch (error) {
            console.error(error);
            alert('Error: ' + error.message);
        }
    };
};

window.openEmpresaModal = (record = null) => {
    modalTitle.innerText = record ? 'Editar Empresa' : 'Agregar Empresa / Consorcio';
    modalBody.innerHTML = `
        <form id="empresa-form" style="max-height:70vh; overflow-y:auto; padding-right:10px;">
            <div class="input-group">
                <label>Razón Social / Nombre</label>
                <input type="text" name="nombre" value="${record ? record.nombre : ''}" required>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                <div class="input-group">
                    <label>RUC</label>
                    <input type="text" name="ruc" value="${record ? record.ruc : ''}">
                </div>
                <div class="input-group">
                    <label>Representante Legal</label>
                    <input type="text" name="representante" value="${record ? record.representante : ''}">
                </div>
            </div>
            
            <div style="margin:2rem 0 1rem 0; font-size:0.7rem; color:var(--secondary); letter-spacing:2px; border-bottom:1px solid rgba(0,36,255,0.1); padding-bottom:5px; font-weight:800;">INFORMACIÓN SEACE</div>
            
            <div class="input-group">
                <label>Nomenclatura (Cód. Proceso)</label>
                <input type="text" name="nomenclatura" value="${record ? (record.nomenclatura || '') : ''}">
            </div>
            <div class="input-group">
                <label>Descripción de la Obra</label>
                <textarea name="descripcion" style="width:100%; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; color:var(--text); outline:none; font-family:inherit; font-size:0.95rem; min-height:100px; padding:12px; font-weight:700;">${record ? (record.descripcion || '') : ''}</textarea>
            </div>
            <div class="input-group">
                <label>Monto de la Obra (S/)</label>
                <input type="number" step="0.01" name="monto_obra" value="${record ? (record.monto_obra || '') : ''}">
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                <div class="input-group">
                    <label>Fecha Inicio</label>
                    <input type="date" name="fecha_inicio_obra" value="${record ? toISODate(record.fecha_inicio_obra) : ''}">
                </div>
                <div class="input-group">
                    <label>Fecha Fin</label>
                    <input type="date" name="fecha_fin_obra" value="${record ? toISODate(record.fecha_fin_obra) : ''}">
                </div>
            </div>
            
            <button type="submit" class="btn-action-minimal" style="width:100%; margin-top:20px;">GUARDAR</button>
        </form>
    `;
    modalContainer.classList.remove('hidden');
    document.getElementById('empresa-form').onsubmit = async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        const url = record ? `${API_URL}/empresas/${record.id}` : `${API_URL}/empresas`;
        await fetch(url, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
        modalContainer.classList.add('hidden'); 
        fetchData();
    };
};

window.openFianzaModal = (record = null) => {
    const comp = currentState.selectedCompany;
    modalTitle.innerText = 'Carta Fianza';
    modalBody.innerHTML = `
        <form id="fianza-form" style="max-height:70vh; overflow-y:auto; padding-right:10px;">
            <input type="hidden" name="empresa_id" value="${comp.id}">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                <div class="input-group"><label>Número</label><input type="text" name="numero" value="${record?record.numero:''}" required></div>
                <div class="input-group"><label>Monto</label><input type="number" step="0.01" name="monto" value="${record?record.monto:''}" required></div>
            </div>
            <div class="input-group"><label>Tipo</label>
                <select name="tipo">
                    <option ${record?.tipo==='Fiel Cumplimiento'?'selected':''}>Fiel Cumplimiento</option>
                    <option ${record?.tipo==='Adelanto de Materiales'?'selected':''}>Adelanto de Materiales</option>
                    <option ${record?.tipo==='Adelanto Directo'?'selected':''}>Adelanto Directo</option>
                </select>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                <div class="input-group"><label>Inicio</label><input type="date" name="fecha_inicio" value="${toISODate(record?.fecha_inicio)}"></div>
                <div class="input-group"><label>Vencimiento</label><input type="date" name="fecha_vencimiento" value="${toISODate(record?.fecha_vencimiento)}"></div>
            </div>
            
            <div style="margin:1rem 0 0.5rem 0; font-size:0.7rem; color:var(--secondary); letter-spacing:2px; border-bottom:1px solid rgba(0,36,255,0.1); padding-bottom:5px; font-weight:800;">DATOS DE CONTROL (SECRETARÍA)</div>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                <div class="input-group"><label>Suma Asegurada (S/)</label><input type="number" step="0.01" name="suma_asegurada" value="${record?.suma_asegurada || ''}"></div>
                <div class="input-group"><label>Monto Garantía (S/)</label><input type="number" step="0.01" name="monto_garantia" value="${record?.monto_garantia || ''}"></div>
            </div>
            <div class="input-group"><label>Monto Liberado (S/)</label><input type="number" step="0.01" name="monto_liberado" value="${record?.monto_liberado || ''}"></div>
            
            <div class="input-group">
                <label>Observaciones</label>
                <textarea name="observaciones" style="width:100%; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; color:var(--text); outline:none; font-family:inherit; font-size:0.9rem; min-height:60px; padding:10px; font-weight:600;">${record ? (record.observaciones || '') : ''}</textarea>
            </div>

            <div class="input-group"><label>PDF</label><input type="file" name="pdf" accept=".pdf"></div>
            <button type="submit" class="btn-action-minimal" style="width:100%; margin-top:20px;">GUARDAR</button>
        </form>
    `;
    modalContainer.classList.remove('hidden');
    document.getElementById('fianza-form').onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const url = record ? `${API_URL}/cartas_fianzas/${record.id}` : `${API_URL}/cartas_fianzas`;
        await fetch(url, { method: 'POST', body: formData });
        modalContainer.classList.add('hidden'); fetchData();
    };
};

window.openFacturaModal = (record = null, isObserved = false) => {
    const comp = currentState.selectedCompany;
    modalTitle.innerText = record ? 'Editar Factura' : (isObserved || record?.es_observada ? 'Registrar Factura Observada' : 'Factura');
    modalBody.innerHTML = `
        <form id="factura-form">
            <input type="hidden" name="empresa_id" value="${comp.id}">
            <div class="input-group"><label>Número de Factura</label><input type="text" name="numero" value="${record?record.numero:''}" required></div>
            <div class="input-group"><label>Monto</label><input type="number" step="0.01" name="monto" value="${record?record.monto:''}" required></div>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                <div class="input-group">
                    <label>Tipo de Fianza Relacionada</label>
                    <select name="tipo_fianza_relacionada">
                        <option value="">Seleccione tipo...</option>
                        <option ${record?.tipo_fianza_relacionada==='Fiel Cumplimiento'?'selected':''}>Fiel Cumplimiento</option>
                        <option ${record?.tipo_fianza_relacionada==='Adelanto de Materiales'?'selected':''}>Adelanto de Materiales</option>
                        <option ${record?.tipo_fianza_relacionada==='Adelanto Directo'?'selected':''}>Adelanto Directo</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Número de Fianza</label>
                    <input type="text" name="numero_fianza_relacionada" value="${record?record.numero_fianza_relacionada:''}">
                </div>
            </div>
            
            <div class="input-group"><label>Salida</label><input type="date" name="fecha_salida" value="${toISODate(record?.fecha_salida)}"></div>
            
            <div class="input-group">
                <label style="display:flex; align-items:center; gap:10px; cursor:pointer;">
                    <input type="checkbox" name="es_observada" value="true" ${isObserved || record?.es_observada ? 'checked' : ''} style="width:auto; margin:0;">
                    MARCAR COMO OBSERVADA
                </label>
            </div>

            <div class="input-group">
                <label>Observación / Detalle</label>
                <textarea name="observacion" style="width:100%; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; color:var(--text); outline:none; font-family:inherit; font-size:0.9rem; min-height:80px; padding:10px; font-weight:700;">${record ? (record.observacion || '') : ''}</textarea>
            </div>

            <div class="input-group"><label>PDF</label><input type="file" name="pdf" accept=".pdf"></div>
            <button type="submit" class="btn-action-minimal" style="width:100%; margin-top:20px;">GUARDAR</button>
        </form>
    `;
    modalContainer.classList.remove('hidden');
    document.getElementById('factura-form').onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const url = record ? `${API_URL}/facturas/${record.id}` : `${API_URL}/facturas`;
        await fetch(url, { method: 'POST', body: formData });
        modalContainer.classList.add('hidden'); fetchData();
    };
};

window.openUsuarioModal = () => {
    modalTitle.innerText = 'Nuevo Usuario';
    modalBody.innerHTML = `<form id="usuario-form"><div class="input-group"><label>Username</label><input type="text" name="username" required></div><div class="input-group"><label>Password</label><input type="password" name="password" required></div><div class="input-group"><label>Rol</label><select name="role"><option value="user">Usuario</option><option value="admin">Admin</option></select></div><button type="submit" class="btn-action-minimal" style="width:100%; margin-top:20px;">CREAR</button></form>`;
    modalContainer.classList.remove('hidden');
    document.getElementById('usuario-form').onsubmit = async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        await fetch(`${API_URL}/usuarios`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
        modalContainer.classList.add('hidden'); fetchData();
    };
};

