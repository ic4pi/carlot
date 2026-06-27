(function () {
  const QUICK_PROMPTS = [
    "What's in stock?",
    'What are your hours?',
    'How do I get there?'
  ];

  const launcher = document.getElementById('chat-launcher');
  const panel = document.getElementById('chat-panel');
  if (!launcher || !panel) return;

  const messagesEl = document.getElementById('chat-messages');
  const quickEl = document.getElementById('chat-quick');
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
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
      addMessage('bot', "Hi! I'm the Auto Mart assistant. Ask about our inventory, hours (Mon–Fri 10–5), or directions — I'll ask where you're coming from to help with directions.");
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
      if (!res.ok) {
        if (data.code === 'missing_api_key') {
          throw new Error('Chat not configured — OPENROUTER_API_KEY missing on this Vercel deployment. Redeploy after adding it.');
        }
        if (data.code === 'groq_error' && data.detail) {
          throw new Error(`AI error: ${data.detail}`);
        }
        throw new Error(data.error || `Request failed (${res.status})`);
      }

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
