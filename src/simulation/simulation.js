import fetch from 'node-fetch';

const API = "http://localhost:3000/locations";

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function send(deviceId) {
  fetch(API, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      deviceId,
      latitude: rand(6.8, 7.0),
      longitude: rand(79.8, 80.0),
      timestamp: new Date()
    })
  });
}

for (let i = 1; i <= 200; i++) {
  setInterval(() => send("DEVICE-" + i), 3000);
}