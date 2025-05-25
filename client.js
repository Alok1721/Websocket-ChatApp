let ws = null;
let selectedMessageId = null;
let username = localStorage.getItem('chatUsername');

if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
  const modal = document.getElementById('usernameModal');
  const usernameInput = document.getElementById('usernameInput');
  const usernameSubmit = document.getElementById('usernameSubmit');

  if (modal && usernameInput && usernameSubmit) {
    if (!username) {
      modal.classList.remove('hidden');
      usernameInput.focus();
    } else {
      window.location.href = '/chat.html';
    }

    usernameSubmit.addEventListener('click', () => {
      const name = usernameInput.value.trim();
      if (name.length > 0) {
        localStorage.setItem('chatUsername', name);
        window.location.href = '/chat.html';
      } else {
        alert('Please enter a valid username');
        usernameInput.focus();
      }
    });

    usernameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        usernameSubmit.click();
      }
    });
  }
}

if (window.location.pathname === '/chat.html') {
  if (!username) {
    window.location.href = '/';
  } else {
    initializeWebSocket();
    initializeChat();
  }
}

function initializeWebSocket() {
  ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss://' : 'ws://'}${window.location.host}`);
  
  ws.onopen = () => {
    console.log('Connected to WebSocket server');
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'init') {
      data.messages.forEach(displayMessage);
    } else if (data.type === 'create') {
      displayMessage(data.message);
    } else if (data.type === 'update') {
      updateMessage(data.message);
    } else if (data.type === 'delete') {
      deleteMessage(data.id);
    }
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
  };
}

function displayMessage(message) {
  const chat = document.getElementById('chat');
  const div = document.createElement('div');
  div.className = `message ${message.username === username ? 'own' : 'other'}`;
  div.dataset.id = message.id;
  div.innerHTML = `<span class="username">${message.username}</span>: ${message.text} <span class="timestamp">${new Date(message.timestamp).toLocaleTimeString()}</span>`;
  div.onclick = () => selectMessage(message.id, message.text, message.username);
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function updateMessage(message) {
  const div = document.querySelector(`.message[data-id="${message.id}"]`);
  if (div) {
    div.innerHTML = `<span class="username">${message.username}</span>: ${message.text} <span class="timestamp">${new Date(message.timestamp).toLocaleTimeString()}</span>`;
    div.className = `message ${message.username === username ? 'own' : 'other'}`;
  }
}

function deleteMessage(id) {
  const div = document.querySelector(`.message[data-id="${id}"]`);
  if (div) {
    div.remove();
  }
  if (selectedMessageId === id) {
    clearSelection();
  }
}

function selectMessage(id, text, messageUsername) {
  if (messageUsername !== username) return; // Only allow editing/deleting own messages
  selectedMessageId = id;
  document.getElementById('input').value = text;
  document.getElementById('update').disabled = false;
  document.getElementById('delete').disabled = false;
  document.querySelectorAll('.message').forEach(div => div.classList.remove('selected'));
  document.querySelector(`.message[data-id="${id}"]`).classList.add('selected');
}

function clearSelection() {
  selectedMessageId = null;
  document.getElementById('input').value = '';
  document.getElementById('update').disabled = true;
  document.getElementById('delete').disabled = true;
  document.querySelectorAll('.message').forEach(div => div.classList.remove('selected'));
}

function initializeChat() {
  const sendButton = document.getElementById('send');
  const updateButton = document.getElementById('update');
  const deleteButton = document.getElementById('delete');
  const logoutButton = document.getElementById('logout');

  if (sendButton) {
    sendButton.onclick = () => {
      const input = document.getElementById('input');
      if (input.value.trim() && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'create', text: input.value, username }));
        input.value = '';
      }
    };
  }

  if (updateButton) {
    updateButton.onclick = () => {
      const input = document.getElementById('input');
      if (selectedMessageId && input.value.trim() && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'update', id: selectedMessageId, text: input.value }));
        clearSelection();
      }
    };
  }

  if (deleteButton) {
    deleteButton.onclick = () => {
      if (selectedMessageId && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'delete', id: selectedMessageId }));
        clearSelection();
      }
    };
  }

  if (logoutButton) {
    logoutButton.onclick = () => {
      localStorage.removeItem('chatUsername');
      if (ws) ws.close();
      window.location.href = '/';
    };
  }
}