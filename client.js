const ws = new WebSocket('ws://' + window.location.host);
let selectedMessageId = null;

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

function displayMessage(message) {
  const chat = document.getElementById('chat');
  const div = document.createElement('div');
  div.className = 'message';
  div.dataset.id = message.id;
  div.innerHTML = `${message.text} <span>${new Date(message.timestamp).toLocaleTimeString()}</span>`;
  div.onclick = () => selectMessage(message.id, message.text);
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function updateMessage(message) {
  const div = document.querySelector(`.message[data-id="${message.id}"]`);
  if (div) {
    div.innerHTML = `${message.text} <span>${new Date(message.timestamp).toLocaleTimeString()}</span>`;
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

function selectMessage(id, text) {
  selectedMessageId = id;
  document.getElementById('input').value = text;
  document.getElementById('update').disabled = false;
  document.getElementById('delete').disabled = false;
}

function clearSelection() {
  selectedMessageId = null;
  document.getElementById('input').value = '';
  document.getElementById('update').disabled = true;
  document.getElementById('delete').disabled = true;
}

document.getElementById('send').onclick = () => {
  const input = document.getElementById('input');
  if (input.value.trim()) {
    ws.send(JSON.stringify({ type: 'create', text: input.value }));
    input.value = '';
  }
};

document.getElementById('update').onclick = () => {
  const input = document.getElementById('input');
  if (selectedMessageId && input.value.trim()) {
    ws.send(JSON.stringify({ type: 'update', id: selectedMessageId, text: input.value }));
    clearSelection();
  }
};

document.getElementById('delete').onclick = () => {
  if (selectedMessageId) {
    ws.send(JSON.stringify({ type: 'delete', id: selectedMessageId }));
    clearSelection();
  }
};