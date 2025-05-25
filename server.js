const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading index.html');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else if (req.url === '/chat.html') {
    fs.readFile(path.join(__dirname, 'chat.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading chat.html');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else if (req.url === '/client.js') {
    fs.readFile(path.join(__dirname, 'client.js'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading client.js');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/javascript' });
      res.end(data);
    });
  } else if (req.url === '/styles.css') {
    fs.readFile(path.join(__dirname, 'styles.css'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading styles.css');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/css' });
      res.end(data);
    });
  } else if (req.url === '/favicon.ico') {
    res.writeHead(204);
    res.end();
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const wss = new WebSocket.Server({ server });
let messages = [];//temp message
let nextId = 1;

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'init', messages }));

  ws.on('message', (data) => {
    const message = JSON.parse(data);

    if (message.type === 'create') {
      const newMessage = { id: nextId++, text: message.text, timestamp: new Date().toISOString(), username: message.username };
      messages.push(newMessage);
      broadcast({ type: 'create', message: newMessage });
    } else if (message.type === 'update') {
      const index = messages.findIndex((msg) => msg.id === message.id);
      if (index !== -1) {
        messages[index].text = message.text;
        broadcast({ type: 'update', message: messages[index] });
      }
    } else if (message.type === 'delete') {
      messages = messages.filter((msg) => msg.id !== message.id);
      broadcast({ type: 'delete', id: message.id });
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});