// worldState.js — The brain of the dungeon
// Every mutation flows through here. The LLM reads this to narrate.

export const worldState = {
  player: {
    reputation: { explorer: 0, arsonist: 0, wanderer: 0 },
    totalRoomsVisited: 0,
    runHistory: [],          // plain-English log of everything done
    currentRoom: 'entrance',
    ticksAlive: 0,
  },

  rooms: {
    entrance: {
      id: 'entrance',
      displayName: 'The Threshold',
      visited: false,
      visitCount: 0,
      lastVisited: null,
      events: [],
      mood: 'foreboding',
      age: 0,
      connections: ['altar', 'forge'],
      meshFile: 'entrance.glb',
      lore: 'The mouth of the dungeon, where all journeys begin.',
    },
    altar: {
      id: 'altar',
      displayName: 'Altar of Ash',
      visited: false,
      visitCount: 0,
      lastVisited: null,
      events: [],
      mood: 'sacred',
      age: 0,
      connections: ['entrance', 'throne', 'crypt'],
      meshFile: 'altar.glb',
      lore: 'A place of ancient offering. The stone still holds heat.',
    },
    throne: {
      id: 'throne',
      displayName: 'The Throne Room',
      visited: false,
      visitCount: 0,
      lastVisited: null,
      events: [],
      mood: 'regal',
      age: 0,
      connections: ['altar', 'library'],
      meshFile: 'throne.glb',
      lore: 'Once a seat of power. The king is long gone. Something else sits here now.',
      hasNPC: true,
      npcName: 'The Hollow Regent',
    },
    crypt: {
      id: 'crypt',
      displayName: 'The Crypt',
      visited: false,
      visitCount: 0,
      lastVisited: null,
      events: [],
      mood: 'desolate',
      age: 0,
      connections: ['altar', 'garden'],
      meshFile: 'crypt.glb',
      lore: 'Hundreds sleep here. They do not appreciate visitors.',
    },
    forge: {
      id: 'forge',
      displayName: 'The Forge',
      visited: false,
      visitCount: 0,
      lastVisited: null,
      events: [],
      mood: 'industrial',
      age: 0,
      connections: ['entrance', 'garden'],
      meshFile: 'forge.glb',
      lore: 'The bellows still breathe. Something keeps them going.',
    },
    garden: {
      id: 'garden',
      displayName: 'The Sunken Garden',
      visited: false,
      visitCount: 0,
      lastVisited: null,
      events: [],
      mood: 'overgrown',
      age: 0,
      connections: ['crypt', 'forge', 'library'],
      meshFile: 'garden.glb',
      lore: 'Light reaches here somehow. Plants do not care about kingdoms.',
    },
    library: {
      id: 'library',
      displayName: 'Library of Echoes',
      visited: false,
      visitCount: 0,
      lastVisited: null,
      events: [],
      mood: 'ancient',
      age: 0,
      connections: ['throne', 'garden'],
      meshFile: 'library.glb',
      lore: 'Every book here is blank until you look away.',
    },
  },
};

// ─────────────────────────────────────────────
// Mutation helpers — always use these, never mutate directly
// ─────────────────────────────────────────────

export function enterRoom(roomId) {
  const room = worldState.rooms[roomId];
  if (!room) return;

  const prev = worldState.player.currentRoom;
  worldState.player.currentRoom = roomId;
  worldState.player.totalRoomsVisited++;

  room.visited = true;
  room.visitCount++;
  room.lastVisited = Date.now();

  if (!room.visited || room.visitCount === 1) {
    addMemory(`Entered ${room.displayName} for the first time`);
    addReputation('explorer', 1);
  } else {
    addMemory(`Returned to ${room.displayName} (visit ${room.visitCount})`);
  }

  // Age all other rooms
  Object.values(worldState.rooms).forEach(r => {
    if (r.id !== roomId) r.age++;
  });
}

export function addEvent(roomId, eventName) {
  const room = worldState.rooms[roomId];
  if (!room || room.events.includes(eventName)) return;
  room.events.push(eventName);
  addMemory(`${eventName} — ${room.displayName}`);
}

export function addReputation(type, amount) {
  if (worldState.player.reputation[type] !== undefined) {
    worldState.player.reputation[type] = Math.min(
      100,
      worldState.player.reputation[type] + amount
    );
    updateRepUI();
  }
}

export function addMemory(text) {
  worldState.player.runHistory.unshift(text);
  if (worldState.player.runHistory.length > 20) {
    worldState.player.runHistory.pop();
  }
  updateMemoryUI();
}

export function setRoomMood(roomId, mood) {
  if (worldState.rooms[roomId]) {
    worldState.rooms[roomId].mood = mood;
  }
}

// ─────────────────────────────────────────────
// UI sync helpers
// ─────────────────────────────────────────────

function updateRepUI() {
  const rep = worldState.player.reputation;
  const setBar = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.style.width = Math.min(100, val * 10) + '%';
  };
  setBar('rep-explorer', rep.explorer);
  setBar('rep-arsonist', rep.arsonist);
  setBar('rep-wanderer', rep.wanderer);
}

function updateMemoryUI() {
  const list = document.getElementById('memory-list');
  if (!list) return;
  const recent = worldState.player.runHistory.slice(0, 6);
  list.innerHTML = recent
    .map(m => `<div class="memory-entry">${m}</div>`)
    .join('');
}

// Export a snapshot for LLM prompts (trimmed for token efficiency)
export function getStateSnapshot(roomId) {
  const room = worldState.rooms[roomId];
  const rep = worldState.player.reputation;
  return {
    room: {
      name: room.displayName,
      visitCount: room.visitCount,
      events: room.events,
      mood: room.mood,
      age: room.age,
      lore: room.lore,
      hasNPC: room.hasNPC || false,
      npcName: room.npcName || null,
    },
    player: {
      reputation: rep,
      recentHistory: worldState.player.runHistory.slice(0, 5),
      totalVisits: worldState.player.totalRoomsVisited,
    },
  };
}
