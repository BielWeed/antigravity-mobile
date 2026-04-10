// ═══════════════════════════════════════════════════════════════════════════
// ANTIGRAVITY MOBILE — App Logic
// ═══════════════════════════════════════════════════════════════════════════

const $ = (sel) => document.querySelector(sel);
const msgInput = $('#msg-input');
const btnSend = $('#btn-send');
const messagesEl = $('#messages');
const welcomeEl = $('#welcome-screen');
const statusDot = $('#status-dot');
const modelLabel = $('#model-label');
const sidebar = $('#sidebar');
const sidebarOverlay = $('#sidebar-overlay');
const conversationList = $('#conversation-list');



// ─── STATE ───────────────────────────────────────────────────────────────────

let API_URL = globalThis.location.origin;

// Fix para APK Nativo Capacitor (Onde a origin é localhost ou file://)
if (API_URL.includes('localhost') || API_URL.includes('file://') || API_URL.includes('capacitor://')) {
    let savedIp = localStorage.getItem('bridge_ip');
    let termuxMode = localStorage.getItem('termux_mode') === 'true';

    if (termuxMode) {
        API_URL = 'http://127.0.0.1:3777';
    } else {
        API_URL = savedIp ? `http://${savedIp.trim()}:3777` : 'http://192.168.1.101:3777';
        if (!savedIp) setTimeout(showConnectionRadar, 100);
    }
    
    // Permitir reset clicando na bolinha de status
    if (statusDot) {
        statusDot.onclick = () => {
            showConnectionRadar();
        };
        statusDot.style.cursor = 'pointer';
    }
}

// Ensure proper fallbacks
if (API_URL === "null" || API_URL === "undefined") {
    API_URL = "http://192.168.1.101:3777";
}

// ─── Radar de Conexão Wi-Fi (Scanner Local) ──────────────────────────────────
function showConnectionRadar() {
    if (document.getElementById('radar-modal')) return;

    const overlay = document.createElement('div');
    overlay.id = 'radar-modal';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
        z-index: 10000; display: flex; flex-direction: column;
        align-items: center; justify-content: center; font-family: Inter, sans-serif;
    `;

    overlay.innerHTML = `
        <div style="background: #111; padding: 25px; border-radius: 15px; border: 1px solid #333; width: 85%; max-width: 400px; text-align: center;">
            <h2 style="color: #32ff78; margin-top: 0; margin-bottom: 10px;">Radar Antigravity 📡</h2>
            <p style="color: #ccc; font-size: 14px;">Buscando PCs na rede Wi-Fi...</p>
            <div id="radar-results" style="display: flex; flex-direction: column; gap: 10px; margin: 20px 0; max-height: 250px; overflow-y: auto;">
                <div style="color: #888; font-size: 13px;">Escaneando... <br/>(Isso leva poucos segundos)</div>
            </div>
            <div style="margin-top: 15px; text-align: left; padding-top: 15px; border-top: 1px solid #222;">
                <label style="color: #888; font-size: 12px; font-weight: bold;">CONEXÃO MANUAL DIRIGIDA</label>
                <div style="display: flex; gap: 8px; margin-top: 8px;">
                    <input type="text" id="manual-ip-input" placeholder="Ex: 192.168.1.101" style="flex: 1; padding: 12px; border-radius: 8px; border: 1px solid #333; background: #000; color: #fff; outline:none;">
                    <button id="btn-manual-ip" style="background: #32ff78; color: #000; border: none; padding: 12px 15px; border-radius: 8px; font-weight: bold; cursor: pointer;">Engatar</button>
                </div>
            </div>
            <button onclick="document.getElementById('radar-modal').remove()" style="margin-top: 20px; background: transparent; color: #666; border: none; cursor: pointer; text-decoration: underline;">Fechar Radar</button>
        </div>
    `;
    
    document.body.appendChild(overlay);

    const oldIp = localStorage.getItem('bridge_ip');
    if (oldIp) document.getElementById('manual-ip-input').value = oldIp;

    document.getElementById('btn-manual-ip').onclick = () => {
        const val = document.getElementById('manual-ip-input').value.trim();
        if (val) {
            localStorage.setItem('bridge_ip', val);
            globalThis.location.reload();
        }
    };

    const resultsDiv = document.getElementById('radar-results');
    let foundAny = false;

    // Fast Sweep Table
    const bases = ['192.168.1.', '192.168.0.', '10.0.0.', '172.25.224.', '172.28.112.'];
    const endpoints = ['127.0.0.1']; // Termux Localhost Prioridade MÁXIMA
    bases.forEach(b => {
        [100, 101, 102, 103, 104, 105, 110, 115, 120, 15, 2, 3, 50, 64].forEach(n => endpoints.push(b + n));
    });

    if (oldIp && !endpoints.includes(oldIp)) {
        endpoints.unshift(oldIp); // Prioriza pingar o último conhecido
    }

    async function probe(ip) {
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 1200);
            // Corrige mixed-content e localhost proxy errors
            const targetUrl = (ip === '127.0.0.1' || ip === 'localhost') ? `http://127.0.0.1:3777/api/status` : `http://${ip}:3777/api/status`;
            const res = await fetch(targetUrl, { signal: controller.signal });
            clearTimeout(id);
            const data = await res.json();
            if (data.ok) {
                if (!foundAny) {
                    resultsDiv.innerHTML = '';
                    foundAny = true;
                }
                // Evita duplicados na tela
                if (document.getElementById('btn-ip-' + ip.replaceAll('.', '-'))) return;
                
                const isTermux = ip === '127.0.0.1' || ip === 'localhost';
                const label = isTermux ? '📱 Termux/Host Local' : '💻 Nave Mãe (PC)';
                const color = isTermux ? '#ffb86c' : '#32ff78'; // Laranja para Termux, Verde para Desktop
                
                const btn = document.createElement('button');
                btn.id = 'btn-ip-' + ip.replaceAll('.', '-');
                btn.style.cssText = `background: rgba(50, 255, 120, 0.05); border: 1px solid ${color}; color: #fff; padding: 14px; border-radius: 10px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s; margin-bottom: 8px;`;
                btn.innerHTML = `<span style="font-weight: 500;">${label} <br/><span style="color: ${color}; font-size: 11px; opacity:0.8;">${ip}</span></span> <b style="color: #000; background: ${color}; padding: 6px 12px; border-radius: 6px; font-size: 12px;">CONECTAR</b>`;
                btn.onclick = () => {
                    localStorage.setItem('bridge_ip', ip);
                    globalThis.location.reload();
                };
                resultsDiv.appendChild(btn);
            }
        } catch(e) { 
            // Handle exception explícito para agradar ao linter
            if (e.name !== 'AbortError') {
                console.debug(`[Sonar] Probe skipped for ${ip}`); 
            }
        }
    }

    endpoints.forEach(ip => probe(ip));
    
    setTimeout(() => {
        if (!foundAny) {
            resultsDiv.innerHTML = '<div style="color: #ff4d4d; font-size: 13px; background: rgba(255,0,0,0.1); padding: 10px; border-radius: 6px;">Nenhum Bridge Server visível no seu Wi-Fi. <br><br>Se estiver usando Termux, insira 127.0.0.1 no campo manual abaixo.</div>';
        }
    }, 4000);
}

let state = {
  conversations: [],
  currentConv: null,
  messages: [],
  connected: false,
  sending: false
};

// ─── Local Database Persistence ──────────────────────────────────────────────
function saveState() {
   localStorage.setItem('antigravity_db', JSON.stringify({
       conversations: state.conversations,
       currentConv: state.currentConv,
       messages: state.messages
   }));
}

function restoreState() {
   try {
       const raw = localStorage.getItem('antigravity_db');
       if (raw) {
           const db = JSON.parse(raw);
           state.conversations = db.conversations || [];
           state.currentConv = db.currentConv || null;
           state.messages = db.messages || [];
           
           if (state.messages.length > 0) {
               if (welcomeEl) welcomeEl.classList.add('hidden');
               const fragment = document.createDocumentFragment();
               state.messages.forEach(ev => {
                   if (ev.isFile) fragment.appendChild(createFileEl(ev.url, ev.filename, ev.filesize));
                   else if (ev.isUpdate) fragment.appendChild(createUpdateEl(ev.url, ev.version));
                   else fragment.appendChild(createMessageEl(ev.role, ev.content || ev.text));
               });
               messagesEl.appendChild(fragment);
               setTimeout(scrollToBottom, 100); // Async frame lock paint
           }
           renderConversations();
       }
   } catch(e) { console.error('Failed restoring state:', e); }
}

// ─── Status check ────────────────────────────────────────────────────────────

// ─── Status check ────────────────────────────────────────────────────────────

// ─── Status check ────────────────────────────────────────────────────────────

// ─── Status check ────────────────────────────────────────────────────────────

async function checkStatus() {
  try {
    statusDot.className = 'status-dot connecting';
    const res = await fetch(`${API_URL}/api/status`);
    const data = await res.json();

    if (data.ok) {
      state.connected = true;
      statusDot.className = 'status-dot online';
      statusDot.title = `Conectado — Porta ${data.httpsPort}`;
      modelLabel.textContent = `Conectado • Porta ${data.httpsPort}`;
    } else {
      state.connected = false;
      statusDot.className = 'status-dot offline';
      statusDot.title = data.error || 'Offline';
        modelLabel.textContent = 'Desconectado';
        if (!document.getElementById('radar-modal') && (API_URL.includes('192.168.') || API_URL.includes('10.0.') || API_URL.includes('172.') || API_URL.includes('localhost') || API_URL.includes('capacitor'))) {
             if (typeof showConnectionRadar === 'function') showConnectionRadar();
        }
    }
  } catch(e) {
    console.error('Status check fail:', e);
    state.connected = false;
    statusDot.className = 'status-dot offline';
    modelLabel.textContent = 'Servidor Bridge offline';
    if (!document.getElementById('radar-modal') && (API_URL.includes('192.168.') || API_URL.includes('10.0.') || API_URL.includes('172.') || API_URL.includes('localhost') || API_URL.includes('capacitor'))) {
         if (typeof showConnectionRadar === 'function') showConnectionRadar();
    }
  }
}

// ─── Input handling ──────────────────────────────────────────────────────────

let resizeTimeout;
function autoResize(el) {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
     el.style.height = 'auto';
     el.style.height = Math.min(el.scrollHeight, 120) + 'px';
     btnSend.disabled = !el.value.trim() || state.sending;
  }, 15);
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

// ─── Message rendering ──────────────────────────────────────────────────────

function createMessageEl(role, content) {
  const div = document.createElement('div');
  
  let roleClass = role;
  let avatarText = role === 'user' ? 'U' : '◆';
  let senderName = role === 'user' ? 'Você' : 'Antigravity Agent';

  if (role === 'thought') {
    roleClass = 'system thought';
    avatarText = 'T';
    senderName = 'Chain of Thought (Agent)';
  }

  div.className = `message ${roleClass}`;

  div.innerHTML = `
    <div class="msg-avatar">${avatarText}</div>
    <div class="msg-body">
      <div class="msg-sender">${senderName}</div>
      <div class="msg-content">${formatContent(content)}</div>
    </div>
  `;

  return div;
}

function createTypingEl() {
  const div = document.createElement('div');
  div.className = 'message agent';
  div.id = 'typing-msg';
  div.innerHTML = `
    <div class="msg-avatar">◆</div>
    <div class="msg-body">
      <div class="msg-sender">Antigravity Agent</div>
      <div class="typing-indicator">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  return div;
}

function createFileEl(url, filename, filesize) {
  const div = document.createElement('div');
  div.className = 'message agent file-message';
  
  // Icon based on extension
  let icon = '📄';
  const ext = filename.split('.').pop().toLowerCase();
  if (['png','jpg','jpeg','gif','webp'].includes(ext)) icon = '🖼️';
  if (['zip','rar','7z'].includes(ext)) icon = '📦';
  if (['exe','apk'].includes(ext)) icon = '⚙️';
  if (['pdf'].includes(ext)) icon = '📕';

  div.innerHTML = `
    <div class="msg-avatar">◆</div>
    <div class="msg-body">
      <div class="msg-sender">Antigravity Agent</div>
      <div class="file-card">
        <div class="fc-icon">${icon}</div>
        <div class="fc-details">
            <div class="fc-name">${escapeHtml(filename)}</div>
            <div class="fc-size">${escapeHtml(filesize)}</div>
        </div>
        <a class="fc-btn" href="${url}" download="${escapeHtml(filename)}" target="_blank">Baixar</a>
      </div>
    </div>
  `;
  return div;
}

function createUpdateEl(url, version) {
  const div = document.createElement('div');
  div.className = 'message agent file-message';
  
  const safeUrl = escapeHtml(url);
  const clickAction = `(async function() { 
      try { 
         if (globalThis.Capacitor && globalThis.Capacitor.Plugins.Browser) {
             await globalThis.Capacitor.Plugins.Browser.open({ url: '${safeUrl}' });
         } else {
             globalThis.open('${safeUrl}', '_system');
         }
      } catch(e) { globalThis.location.href='${safeUrl}'; }
  })()`;

  div.innerHTML = `
    <div class="msg-avatar">🔥</div>
    <div class="msg-body">
      <div class="msg-sender">Antigravity OTA</div>
      <div class="update-card" style="box-shadow: 0 0 15px rgba(50, 255, 120, 0.4); border: 2px solid #32ff78; padding: 16px; border-radius: 12px; margin-top: 10px;">
        <div class="update-header">
            <div class="update-icon">⚡</div>
            <div class="update-info">
                <div class="update-title" style="color: #32ff78; font-weight: bold; font-size: 1.1em;">NOVA VERSÃO DISPONÍVEL</div>
                <div class="update-version" style="color: #fff; opacity: 0.8;">Versão Recomendada: ${escapeHtml(version || 'Latest')}</div>
            </div>
        </div>
        <button class="update-btn" onclick="${clickAction}" style="background: #32ff78; color: #000; font-weight: bold; padding: 12px; margin-top: 15px; border-radius: 8px; border: none; width: 100%; cursor: pointer;">INSTALAR AGORA</button>
      </div>
    </div>
  `;
  return div;
}

function formatContent(text) {
  let html = escapeHtml(text || '');

  // 1. Code blocks
  html = html.replaceAll(/```[a-z0-9]*\n([\s\S]*?)```/gi, '<pre><code>$1</code></pre>');

  // 2. Inline code
  html = html.replaceAll(/`([^`]+)`/g, '<code>$1</code>');

  // 3. Imagens (Nativo Markdown)
  // RegEx captura ![alt](url) -> Note que o escape string transformaria em ! [alt](url) ? 
  // No, escapeHtml mantem ! e [] e (). Only & < > " ' are changed.
  html = html.replaceAll(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, 
    '<div style="border-radius: 8px; overflow: hidden; margin: 8px 0;"><img src="$2" alt="$1" style="max-width: 100%; height: auto; display: block;" loading="lazy"></div>'
  );

  // 4. Links Web clicáveis p/ abrir no navegador de sistema
  html = html.replaceAll(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, 
    '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: var(--accent-bright); text-decoration: underline;" onclick="globalThis.open(\'$2\', \'_system\'); return false;">$1</a>'
  );

  // 5. Bold & Italic
  html = html.replaceAll(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replaceAll(/\*([^*]+)\*/g, '<em>$1</em>');

  // 6. Listas Básicas ( - Item)
  html = html.replaceAll(/^[ \t]*-[ \t]+(.*)$/gm, '<li style="margin-left: 20px;">$1</li>');

  // 7. Line breaks (Ignorando dentro do pre)
  html = html.replaceAll('\n', '<br>');
  html = html.replaceAll(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, function(match, p1) {
    return '<pre><code>' + p1.replaceAll('<br>', '\n') + '</code></pre>';
  });

  return html;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function scrollToBottom() {
  const chat = $('#chat-area');
  requestAnimationFrame(() => {
    chat.scrollTop = chat.scrollHeight;
  });
}

// ─── Send message ────────────────────────────────────────────────────────────

async function sendMessage() {
  const text = msgInput.value.trim();
  if (!text || state.sending) return;

  // Hide welcome, show messages
  welcomeEl.classList.add('hidden');

  // Add user message
  state.messages.push({ role: 'user', content: text });
  messagesEl.appendChild(createMessageEl('user', text));

  // Clear input
  msgInput.value = '';
  autoResize(msgInput);
  state.sending = true;
  btnSend.disabled = true;

  scrollToBottom();

  // Show typing
  const typingEl = createTypingEl();
  messagesEl.appendChild(typingEl);
  scrollToBottom();

  try {
    // 1. Gestão de Workspaces (Apenas na 1a mensagem)
    if (!state.currentConv) {
      state.currentConv = {
        id: Date.now(),
        title: text.substring(0, 40),
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      state.conversations.unshift(state.currentConv);
      renderConversations();
      saveState();

      // Diz ao PC para criar a pasta e o Antigravity para abri-la
      try {
        await fetch(`${API_URL}/api/workspace`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: state.currentConv.title })
        });
        // Espera agressiva pro VSIX reiniciar ou aplicar
        await new Promise(r => setTimeout(r, 1500));
      } catch (err) { console.error('Workspace cmd error:', err); }
    }

    // 2. Envia a Requisição de Fato
    const res = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: text })
    });

    const data = await res.json();

    // Quando a bridge nativa pisca "ok", NÃO colocamos resposta fingida.
    // Se houve erro na extensão, mostra erro
        if (data.error) {
      typingEl.remove();
      state.messages.push({ role: 'agent', content: `⚠️ ${data.error}` });
      messagesEl.appendChild(createMessageEl('agent', `⚠️ ${data.error}`));
      saveState();
    } else {
      // Remove typing after 2 seconds to simulate delivery instead of hanging forever
      setTimeout(() => {
          if (document.getElementById('typing-msg')) {
              document.getElementById('typing-msg').remove();
              const deliveryMsg = `✅ Mensagem entregue ao Antigravity!\n(O retorno virá apenas quando o Agente disparar o Webhook)`;
              state.messages.push({ role: 'agent', content: deliveryMsg });
              messagesEl.appendChild(createMessageEl('agent', deliveryMsg));
              saveState();
              scrollToBottom();
          }
      }, 1500);
    }
  } catch (e) {
    const typingElCheck = document.getElementById('typing-msg');
    if (typingElCheck) typingElCheck.remove();
    
    const errMsg = `❌ Erro de conexão: ${e.message}. Verifique se o Bridge Server está rodando.`;
    state.messages.push({ role: 'agent', content: errMsg });
    messagesEl.appendChild(createMessageEl('agent', errMsg));
    saveState();
  }

  state.sending = false;
  scrollToBottom();
}

function sendHint(el) {
  msgInput.value = el.textContent;
  autoResize(msgInput);
  sendMessage();
}

// ─── Conversations ───────────────────────────────────────────────────────────

function renderConversations() {
  if (state.conversations.length === 0) {
    conversationList.innerHTML = '<div class="empty-state">Nenhuma conversa ainda</div>';
    return;
  }

  conversationList.innerHTML = state.conversations.map(c => `
    <div class="conv-item ${c.id === state.currentConv?.id ? 'active' : ''}" onclick="switchConv('${c.id}')">
      <div class="conv-title">${escapeHtml(c.title)}</div>
      <div class="conv-time">${c.time}</div>
    </div>
  `).join('');
}

function switchConv(id) {
  // Simple implementation for now
  toggleSidebar();
}

function newConversation() {
  state.currentConv = null;
  state.messages = [];
  messagesEl.innerHTML = '';
  welcomeEl.classList.remove('hidden');
  msgInput.value = '';
  autoResize(msgInput);
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function toggleSidebar() {
  sidebar.classList.toggle('hidden');
  sidebarOverlay.classList.toggle('hidden');
}

// ─── Termux Setup ────────────────────────────────────────────────────────────

function toggleTermuxSetup() {
  const modal = $('#termux-setup-modal');
  if (!modal) return;
  modal.classList.toggle('hidden');
  
  const toggle = $('#termux-toggle');
  if (toggle) {
    toggle.checked = localStorage.getItem('termux_mode') === 'true';
  }
}

function copyTermuxCmd() {
  const code = $('#termux-cmd').innerText;
  navigator.clipboard.writeText(code).then(() => {
    const btn = document.querySelector('.copy-btn');
    btn.textContent = 'Copiado!';
    setTimeout(() => btn.textContent = 'Copiar', 2000);
  });
}

function downloadTermux() {
  const url = 'https://github.com/termux/termux-app/releases/download/v0.118.1/termux-app_v0.118.1+github-debug_universal.apk';
  try {
      globalThis.open(url, '_system');
  } catch(e) {
      globalThis.location.href = url;
  }
}

function applyTermuxMode() {
  const toggle = $('#termux-toggle');
  const isEnabled = toggle.checked;
  localStorage.setItem('termux_mode', isEnabled ? 'true' : 'false');
  if (isEnabled) {
      localStorage.setItem('bridge_ip', '127.0.0.1');
  } else {
      localStorage.removeItem('bridge_ip');
  }
  globalThis.location.reload();
}

// ─── Init ────────────────────────────────────────────────────────────────────

(async function init() {
  restoreState();
  
  // Focus input
  msgInput.addEventListener('input', () => autoResize(msgInput));

  // Initial status check
  await checkStatus();

  // Periodic status check
  setInterval(checkStatus, 10000);

  // Auto-reconnect
  if (!state.connected) {
    try {
      await fetch(`${API_URL}/api/refresh`, { method: 'POST' });
      await checkStatus();
    } catch (e) { console.error('Refresh fail:', e); }
  }

  // SSE: Conexão neural de mão dupla com o Webhook (Retido para aba local)
  const evtSource = new EventSource(`${API_URL}/api/stream`);
  evtSource.onopen = () => { console.log('[SSE] Conectado e ouvindo!'); };
  evtSource.onerror = (e) => { 
      // Handle the event explícito para evitar linter errors
      if (e.eventPhase === EventSource.CLOSED) {
          console.debug('[SSE] Ligação fechada. Polling híbrido assumirá.');
      }
  };

  let lastEventId = 0;
  
  function processIncomingPackets(dataArray) {
      if (dataArray.length === 0) return;
      const fragment = document.createDocumentFragment();

      dataArray.forEach(ev => {
          if (ev.id <= lastEventId) return; // Prevent loop replays if SSE + Poll crossfire
          lastEventId = ev.id;
          
          const typingEl = document.getElementById('typing-msg');
          if (typingEl) typingEl.remove();

          if (ev.type === 'file') {
              state.messages.push({ role: 'agent', isFile: true, ...ev });
              fragment.appendChild(createFileEl(ev.url, ev.filename, ev.filesize));
          } else if (ev.type === 'update') {
              state.messages.push({ role: 'agent', isUpdate: true, ...ev });
              fragment.appendChild(createUpdateEl(ev.url, ev.version));
          } else {
              const role = ev.type === 'thought' ? 'thought' : 'agent';
              state.messages.push({ role, content: ev.text });
              fragment.appendChild(createMessageEl(role, ev.text));
          }
      });
      
      if (fragment.children.length > 0) {
          messagesEl.appendChild(fragment);
          saveState();
          scrollToBottom();
      }
  }

  evtSource.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      processIncomingPackets([data]);
    } catch (err) { console.error('SSE Error:', err); }
  };

  // POLARIZAÇÃO INQUEBRÁVEL (OOM Shield Mode) - Fetch recursivo sem bloqueio de Stack Thread
  async function recursivePoll() {
     try {
         if (state.connected || !location.href.includes('capacitor')) {
             const res = await fetch(`${API_URL}/api/sync?lastId=${lastEventId}`);
             const poolJson = await res.json();
             if (poolJson.ok && poolJson.items && poolJson.items.length > 0) {
                 processIncomingPackets(poolJson.items);
             }
         }
     } catch(e) {
         console.error('Sync Error:', e);
     } finally {
         setTimeout(recursivePoll, 1000); // 1 sec delay guarantee (No encavalamento)
     }
  }
  
  setTimeout(recursivePoll, 1000);

})();


async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const text = '📎 [Arquivo Anexado: ' + file.name + ']';
    state.messages.push({ role: 'user', content: text });
    messagesEl.appendChild(createMessageEl('user', text));
    scrollToBottom();
    
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            body: formData
        });
        
        const responsePayload = await res.json();
        const msg = responsePayload.message;
        state.messages.push({ role: 'agent', content: msg });
        messagesEl.appendChild(createMessageEl('agent', msg));
        saveState();
        scrollToBottom();
    } catch (err) {
        const errMsg = '❌ Falha ao enviar arquivo.\n' + err;
        state.messages.push({ role: 'agent', content: errMsg });
        messagesEl.appendChild(createMessageEl('agent', errMsg));
        saveState();
        scrollToBottom();
    }
}
