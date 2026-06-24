(function () {
  const QUICK_PROMPTS = [
    "What's in stock?",
    'What are your hours?',
    'Do you finance bad credit?'
  ];

  const style = document.createElement('style');
  style.textContent = `
    #chat-launcher {
      position: fixed;
      bottom: 22px;
      right: 22px;
      z-index: 1000;
      width: 58px;
      height: 58px;
      border: none;
      border-radius: 50%;
      background: linear-gradient(135deg, #ff2d6f, #ff6b00);
      color: #fff;
      cursor: pointer;
      box-shadow: 0 10px 28px rgba(20, 33, 61, 0.28);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.15s;
    }
    #chat-launcher:hover { transform: scale(1.05); }
    #chat-launcher svg { width: 26px; height: 26px; }

    #chat-panel {
      position: fixed;
      bottom: 92px;
      right: 22px;
      z-index: 1000;
      width: min(380px, calc(100vw - 32px));
      height: min(520px, calc(100vh - 120px));
      background: #fff;
      border: 1px solid #E2E5EA;
      border-radius: 14px;
      box-shadow: 0 18px 48px rgba(20, 33, 61, 0.2);
      display: none;
      flex-direction: column;
      overflow: hidden;
      font-family: 'Inter', sans-serif;
    }
    #chat-panel.open { display: flex; }

    .chat-head {
      background: #2C3E6B;
      color: #fff;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .chat-head h3 {
      font-family: 'Sora', sans-serif;
      font-size: 15px;
      font-weight: 800;
      margin: 0;
    }
    .chat-head p {
      margin: 2px 0 0;
      font-size: 11.5px;
      color: #C7CEDC;
    }
    .chat-close {
      background: transparent;
      border: none;
      color: #fff;
      font-size: 22px;
      line-height: 1;
      cursor: pointer;
      padding: 4px;
      opacity: 0.85;
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 14px;
      background: #F6F7F9;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .chat-msg {
      max-width: 88%;
      padding: 10px 12px;
      border-radius: 12px;
      font-size: 13.5px;
      line-height: 1.45;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .chat-msg.bot {
      align-self: flex-start;
      background: #fff;
      border: 1px solid #E2E5EA;
      color: #2C3E6B;
      border-bottom-left-radius: 4px;
    }
    .chat-msg.user {
      align-self: flex-end;
      background: #2C3E6B;
      color: #fff;
      border-bottom-right-radius: 4px;
    }
    .chat-msg.error {
      align-self: flex-start;
      background: #FDF1E7;
      border: 1px solid #E8772E;
      color: #1B2A4D;
    }
    .chat-typing {
      align-self: flex-start;
      font-size: 12px;
      color: #6B7280;
      padding: 4px 2px;
    }

    .chat-quick {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 0 14px 10px;
      background: #F6F7F9;
    }
    .chat-quick button {
      border: 1px solid #E2E5EA;
      background: #fff;
      color: #2C3E6B;
      border-radius: 99px;
      padding: 6px 10px;
      font-size: 11.5px;
      font-weight: 600;
      cursor: pointer;
    }
    .chat-quick button:hover { border-color: #3D527A; }

    .chat-input-row {
      display: flex;
      gap: 8px;
      padding: 12px;
      border-top: 1px solid #E2E5EA;
      background: #fff;
    }
    .chat-input-row input {
      flex: 1;
      border: 1.5px solid #E2E5EA;
      border-radius: 8px;
      padding: 11px 12px;
      font-size: 14px;
      outline: none;
      font-family: inherit;
    }
    .chat-input-row input:focus { border-color: #3D527A; }
    .chat-input-row button {
      border: none;
      border-radius: 8px;
      background: #2C3E6B;
      color: #fff;
      font-weight: 700;
      font-size: 13px;
      padding: 0 14px;
      cursor: pointer;
    }
    .chat-input-row button:disabled { opacity: 0.5; cursor: not-allowed; }

    .chat-foot {
      padding: 0 12px 10px;
      font-size: 11px;
      color: #9CA3AF;
      text-align: center;
      background: #fff;
    }
    .chat-foot a { color: #3D527A; font-weight: 600; text-decoration: none; }
  `;
  document.head.appendChild(style);

  const launcher = document.createElement('button');
  launcher.id = 'chat-launcher';
  launcher.type = 'button';
  launcher.setAttribute('aria-label', 'Open chat');
  launcher.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;

  const panel = document.createElement('div');
  panel.id = 'chat-panel';
  panel.innerHTML = `
    <div class="chat-head">
      <div>
        <h3>Auto Mart Assistant</h3>
        <p>Ask about inventory, hours, or financing</p>
      </div>
      <button class="chat-close" type="button" aria-label="Close chat">&times;</button>
    </div>
    <div class="chat-messages" id="chat-messages"></div>
    <div class="chat-quick" id="chat-quick"></div>
    <form class="chat-input-row" id="chat-form">
      <input type="text" id="chat-input" placeholder="Ask a question…" maxlength="2000" autocomplete="off">
      <button type="submit" id="chat-send">Send</button>
    </form>
    <div class="chat-foot">Prefer a person? <a href="tel:6019390075">Call</a> or <a href="sms:6019390075">text</a> us.</div>
  `;

  document.body.appendChild(launcher);
  document.body.appendChild(panel);

  const messagesEl = panel.querySelector('#chat-messages');
  const quickEl = panel.querySelector('#chat-quick');
  const form = panel.querySelector('#chat-form');
  const input = panel.querySelector('#chat-input');
  const sendBtn = panel.querySelector('#chat-send');
  const history = [];
  let loading = false;
  let greeted = false;

  function addMessage(role, text) {
    const el = document.createElement('div');
    el.className = `chat-msg ${role}`;
    el.textContent = text;
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return el;
  }

  function setTyping(on) {
    let typing = panel.querySelector('.chat-typing');
    if (on) {
      if (!typing) {
        typing = document.createElement('div');
        typing.className = 'chat-typing';
        typing.textContent = 'Typing…';
        messagesEl.appendChild(typing);
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }
    } else if (typing) {
      typing.remove();
    }
  }

  function renderQuickPrompts() {
    quickEl.innerHTML = '';
    QUICK_PROMPTS.forEach((text) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = text;
      btn.addEventListener('click', () => sendMessage(text));
      quickEl.appendChild(btn);
    });
  }

  function openChat() {
    panel.classList.add('open');
    if (!greeted) {
      greeted = true;
      addMessage('bot', "Hi! I'm the Auto Mart assistant. Ask me what's in stock, our hours, or financing options.");
      renderQuickPrompts();
    }
    input.focus();
  }

  function closeChat() {
    panel.classList.remove('open');
  }

  async function sendMessage(text) {
    const content = (text || input.value).trim();
    if (!content || loading) return;

    input.value = '';
    addMessage('user', content);
    history.push({ role: 'user', content });

    loading = true;
    sendBtn.disabled = true;
    setTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Request failed');

      history.push({ role: 'assistant', content: data.reply });
      addMessage('bot', data.reply);
    } catch (e) {
      addMessage('error', e.message || 'Something went wrong. Please call (601) 939-0075.');
    } finally {
      loading = false;
      sendBtn.disabled = false;
      setTyping(false);
      input.focus();
    }
  }

  launcher.addEventListener('click', () => {
    if (panel.classList.contains('open')) closeChat();
    else openChat();
  });

  panel.querySelector('.chat-close').addEventListener('click', closeChat);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage();
  });
})();
