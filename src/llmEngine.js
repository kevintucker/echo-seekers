// llmEngine.js — AI narration, room descriptions, NPC dialogue
// All prompts flow through here. Handles real API + demo mode fallback.

import { getStateSnapshot, setRoomMood, addEvent, addReputation } from './worldState.js';

const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';

// ─────────────────────────────────────────────
// Core API call
// ─────────────────────────────────────────────

async function callClaude(systemPrompt, userPrompt, maxTokens = 300) {
  const apiKey = window._echoesConfig?.anthropicKey;

  if (!apiKey) {
    // Demo mode — return a hardcoded response
    return getDemoResponse(userPrompt);
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      console.warn('Claude API error:', response.status);
      return getDemoResponse(userPrompt);
    }

    const data = await response.json();
    return data.content?.[0]?.text || getDemoResponse(userPrompt);
  } catch (err) {
    console.warn('LLM call failed, using demo mode:', err.message);
    return getDemoResponse(userPrompt);
  }
}

// ─────────────────────────────────────────────
// Room narration — called on every room entry
// ─────────────────────────────────────────────

export async function narrateRoomEntry(roomId) {
  const snap = getStateSnapshot(roomId);

  const system = `You are the voice of a living dungeon — ancient, aware, and watching.
You narrate what a player sees when entering a room.
The dungeon REMEMBERS everything that has happened. Past events must be reflected.
Respond ONLY with valid JSON. No markdown, no preamble.`;

  const user = `Room: ${snap.room.name}
Times visited before: ${snap.room.visitCount - 1}
Events that occurred here: ${snap.room.events.length ? snap.room.events.join(', ') : 'none yet'}
Room age (time unvisited): ${snap.room.age} ticks
Current mood: ${snap.room.mood}
Lore: ${snap.room.lore}
Player reputation — explorer:${snap.player.reputation.explorer}, arsonist:${snap.player.reputation.arsonist}, wanderer:${snap.player.reputation.wanderer}
Recent player history: ${snap.player.recentHistory.join(' | ') || 'just arrived'}

Respond with this JSON:
{
  "description": "2 sentences max. Vivid, atmospheric. Reflect history if revisiting.",
  "mood": "one word new mood (can be same)",
  "whisper": "optional single short phrase the room seems to say, or null",
  "reputationDelta": {"explorer": 0, "arsonist": 0, "wanderer": 0}
}`;

  const raw = await callClaude(system, user, 250);

  try {
    const parsed = JSON.parse(raw);
    // Apply side effects
    if (parsed.mood) setRoomMood(roomId, parsed.mood);
    if (parsed.reputationDelta) {
      Object.entries(parsed.reputationDelta).forEach(([k, v]) => {
        if (v !== 0) addReputation(k, v);
      });
    }
    return parsed;
  } catch {
    return { description: raw, mood: snap.room.mood, whisper: null };
  }
}

// ─────────────────────────────────────────────
// Action narration — burn, examine, linger
// ─────────────────────────────────────────────

export async function narrateAction(roomId, action) {
  const snap = getStateSnapshot(roomId);

  const actionDescriptions = {
    burn: 'The player sets fire to this room, scorching surfaces and leaving ash.',
    examine: 'The player studies the room carefully, looking for details and history.',
    linger: 'The player stands still and simply exists in this space for a long moment.',
  };

  const system = `You are the voice of a living dungeon. 
A player just performed an action. Narrate the consequence in 1-2 sentences.
The dungeon is changed by this. Be specific and visceral.
Respond ONLY with valid JSON.`;

  const user = `Room: ${snap.room.name}
Action: ${actionDescriptions[action] || action}
Room events so far: ${snap.room.events.join(', ') || 'none'}
Room mood: ${snap.room.mood}

Respond with:
{
  "consequence": "1-2 sentences describing what happens",
  "newEvent": "snake_case_event_tag to record (e.g. charred, altar_examined, silence_felt)",
  "moodChange": "new mood or null",
  "reputationDelta": {"explorer": 0, "arsonist": 0, "wanderer": 0}
}`;

  const raw = await callClaude(system, user, 200);

  try {
    const parsed = JSON.parse(raw);
    if (parsed.newEvent) addEvent(roomId, parsed.newEvent);
    if (parsed.moodChange) setRoomMood(roomId, parsed.moodChange);
    if (parsed.reputationDelta) {
      Object.entries(parsed.reputationDelta).forEach(([k, v]) => {
        if (v !== 0) addReputation(k, v);
      });
    }
    return parsed;
  } catch {
    return { consequence: raw, newEvent: action + '_done' };
  }
}

// ─────────────────────────────────────────────
// NPC dialogue — uses player reputation
// ─────────────────────────────────────────────

export async function getNPCDialogue(roomId) {
  const snap = getStateSnapshot(roomId);
  if (!snap.room.hasNPC) return null;

  const system = `You are ${snap.room.npcName}, an ancient entity dwelling in a dungeon.
You speak to the player in 1-3 lines. Your tone shifts based on their reputation.
An arsonist gets cold contempt. An explorer gets wary curiosity. A wanderer gets weary kinship.
Speak in character. No quotation marks. Just the words.`;

  const user = `Player reputation — explorer:${snap.player.reputation.explorer}, arsonist:${snap.player.reputation.arsonist}, wanderer:${snap.player.reputation.wanderer}
What they have done: ${snap.player.recentHistory.slice(0, 3).join('; ')}
Room mood: ${snap.room.mood}

Speak.`;

  return await callClaude(system, user, 150);
}

// ─────────────────────────────────────────────
// Tripo 3D mesh generation
// ─────────────────────────────────────────────

export async function generateRoomMesh(roomId, roomData) {
  const tripoKey = window._echoesConfig?.tripoKey;
  if (!tripoKey) {
    console.log('[Tripo] No key — using pre-cached mesh:', roomData.meshFile);
    return `assets/rooms/${roomData.meshFile}`;
  }

  const prompts = {
    entrance: 'dark dungeon entrance hall, stone archway, torchlight, fantasy RPG, 3D game asset',
    altar:    'ancient stone altar, mystical dungeon chamber, candles, carved runes, dark fantasy',
    throne:   'crumbling throne room, gothic architecture, tattered banners, dungeon interior',
    crypt:    'underground crypt, stone sarcophagi, dim torchlight, dark dungeon chamber',
    forge:    'underground forge, glowing furnace, anvil, stone walls, fantasy dungeon',
    garden:   'sunken underground garden, vines, dim light shaft, overgrown ruins, dungeon',
    library:  'ancient dungeon library, dusty shelves, old tomes, stone walls, torchlight',
  };

  try {
    // Step 1: Create task
    const createRes = await fetch('https://api.tripo3d.ai/v2/openapi/task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tripoKey}`,
      },
      body: JSON.stringify({
        type: 'text_to_model',
        prompt: prompts[roomId] || `dungeon ${roomId} chamber, dark fantasy 3D game asset`,
      }),
    });

    const createData = await createRes.json();
    const taskId = createData?.data?.task_id;
    if (!taskId) throw new Error('No task ID from Tripo');

    console.log(`[Tripo] Task created: ${taskId} for ${roomId}`);

    // Step 2: Poll for completion (max 90s)
    for (let i = 0; i < 90; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const pollRes = await fetch(`https://api.tripo3d.ai/v2/openapi/task/${taskId}`, {
        headers: { Authorization: `Bearer ${tripoKey}` },
      });
      const pollData = await pollRes.json();
      const status = pollData?.data?.status;

      if (status === 'success') {
        const modelUrl = pollData?.data?.output?.model;
        console.log(`[Tripo] Done: ${modelUrl}`);
        return modelUrl;
      }
      if (status === 'failed') throw new Error('Tripo task failed');
    }
    throw new Error('Tripo timeout');
  } catch (err) {
    console.warn('[Tripo] Error, falling back to cached mesh:', err.message);
    return `assets/rooms/${roomData.meshFile}`;
  }
}

// ─────────────────────────────────────────────
// SeeDream texture generation
// ─────────────────────────────────────────────

export async function generateRoomTexture(roomId, mood, events) {
  const seedKey = window._echoesConfig?.seedreamKey;
  if (!seedKey) return null;

  const moodModifiers = {
    charred: 'scorched, blackened, ash-covered, burned',
    sacred: 'golden light, holy, glowing',
    desolate: 'crumbling, abandoned, moss-covered',
    overgrown: 'vines, roots, nature reclaiming',
    industrial: 'hot metal, glowing coals, steam',
  };

  const eventMods = events.map(e => moodModifiers[e] || e).join(', ');
  const prompt = `dungeon stone wall texture, ${mood}, ${eventMods}, seamless, dark fantasy, game texture`;

  try {
    // ByteDance SeedDream API call
    const res = await fetch('https://api.seecloud.bytedance.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${seedKey}`,
      },
      body: JSON.stringify({
        model: 'seedream-3.0',
        prompt,
        size: '512x512',
        n: 1,
      }),
    });

    const data = await res.json();
    return data?.data?.[0]?.url || null;
  } catch (err) {
    console.warn('[SeeDream] Error:', err.message);
    return null;
  }
}

// ─────────────────────────────────────────────
// Demo mode responses (no API key needed)
// ─────────────────────────────────────────────

const DEMO_ROOM_RESPONSES = {
  entrance: {
    description: 'Cold air presses against you as you cross the threshold. The stone walls have absorbed centuries of fear and it seeps back into your bones.',
    mood: 'foreboding',
    whisper: '...you should not have come...',
  },
  altar: {
    description: 'A great stone altar dominates the chamber, its surface darkened by old offerings. Whatever was worshipped here left long ago — but the altar still listens.',
    mood: 'sacred',
    whisper: null,
  },
  throne: {
    description: 'The throne sits empty at the far end of the hall, draped in shadow that moves against the torchlight. Something watches from that darkness.',
    mood: 'regal',
    whisper: '...you kneel, or you leave...',
  },
  crypt: {
    description: 'Row upon row of stone coffins stretch into darkness. The silence here is thick — not empty, but full. Full of sleepers.',
    mood: 'desolate',
    whisper: null,
  },
  forge: {
    description: 'The forge breathes. You can hear the bellows pump in slow, regular rhythm even though no one stands at them. The coals glow ember-red.',
    mood: 'industrial',
    whisper: '...something is being made...',
  },
  garden: {
    description: 'Pale light filters from somewhere above through roots and vines. Flowers bloom here that have never seen the sun. They seem to turn toward you.',
    mood: 'overgrown',
    whisper: null,
  },
  library: {
    description: 'Thousands of volumes line the walls from floor to vaulted ceiling. Every spine is blank. You have the distinct feeling that if you pull one out, it will know your name.',
    mood: 'ancient',
    whisper: '...we have been waiting...',
  },
};

const DEMO_ACTION_RESPONSES = {
  burn: { consequence: 'Flames catch and spread, scorching the ancient stone black. The smell of burning fills the chamber. Something shifts in the dungeon — it noticed.', newEvent: 'charred', moodChange: 'charred', reputationDelta: { arsonist: 2, explorer: 0, wanderer: 0 } },
  examine: { consequence: 'You study the room carefully, running your fingers along carved surfaces. Hidden details emerge from the stone — marks left by others who stood here before you.', newEvent: 'examined', moodChange: null, reputationDelta: { explorer: 2, arsonist: 0, wanderer: 0 } },
  linger: { consequence: 'Time passes. The room settles around you, becomes accustomed to your presence. You feel the weight of all the years this place has stood. It is very old.', newEvent: 'lingered', moodChange: null, reputationDelta: { wanderer: 2, explorer: 0, arsonist: 0 } },
};

const DEMO_NPC_LINES = [
  'You carry fire in your eyes. I have seen that look before. It does not end well.',
  'An explorer? Good. The others just passed through without looking. You at least see.',
  'Still yourself, wanderer. This place has waited long. It can wait a little longer.',
  'I remember when this hall held a hundred voices. Now it holds one. You.',
];

function getDemoResponse(userPrompt) {
  // Detect what kind of response is needed
  if (userPrompt.includes('action:') || userPrompt.includes('Action:')) {
    const action = userPrompt.includes('burn') ? 'burn' : userPrompt.includes('examine') ? 'examine' : 'linger';
    return JSON.stringify(DEMO_ACTION_RESPONSES[action]);
  }

  if (userPrompt.includes('Speak.')) {
    return DEMO_NPC_LINES[Math.floor(Math.random() * DEMO_NPC_LINES.length)];
  }

  // Room entry — extract room name
  const roomMatch = userPrompt.match(/Room:\s*(.+)/);
  const roomName = roomMatch?.[1]?.trim();
  const roomId = Object.keys(DEMO_ROOM_RESPONSES).find(id =>
    DEMO_ROOM_RESPONSES[id] && roomName?.toLowerCase().includes(id)
  ) || 'entrance';

  const base = DEMO_ROOM_RESPONSES[roomId];
  const visitMatch = userPrompt.match(/Times visited before:\s*(\d+)/);
  const visits = parseInt(visitMatch?.[1] || '0');
  const hasCharred = userPrompt.includes('charred');

  let description = base.description;
  if (visits > 0 && hasCharred) {
    description = 'The scorch marks from your last visit still darken the walls. Ash has settled on every surface. The room remembers what you did here.';
  } else if (visits > 0) {
    description = 'You have been here before. The room feels different now — more familiar, but also more watchful. It recognizes you.';
  }

  return JSON.stringify({
    description,
    mood: hasCharred ? 'charred' : base.mood,
    whisper: base.whisper,
    reputationDelta: { explorer: 1, arsonist: 0, wanderer: 0 },
  });
}
