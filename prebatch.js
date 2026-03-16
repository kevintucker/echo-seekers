#!/usr/bin/env node
// prebatch.js — Run this TONIGHT before the jam to pre-generate all Tripo 3D meshes
//
// Usage:
//   TRIPO_KEY=your_key_here node prebatch.js
//
// This generates .glb files for all 7 rooms and saves them to assets/rooms/
// Tripo takes 30–90s per mesh, so this script runs them all in parallel.
// DO NOT skip this step — live generation during the demo will break your presentation.

const fs = require('fs');
const path = require('path');

const TRIPO_KEY = process.env.TRIPO_KEY || '';
const OUTPUT_DIR = path.join(__dirname, 'assets', 'rooms');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const ROOM_PROMPTS = {
  'entrance.glb': 'dark dungeon entrance hall, stone archway, gothic architecture, torchlight on walls, high vaulted ceiling, fantasy RPG environment, 3D game asset, no figures',
  'altar.glb':    'ancient stone altar in dungeon chamber, mystical carvings, black candles, rune-etched floor, dark fantasy, stone sarcophagus, 3D game environment asset',
  'throne.glb':   'crumbling medieval throne room, stone throne on raised dais, tattered banners, gothic arches, dungeon interior, dark atmosphere, 3D game asset',
  'crypt.glb':    'underground stone crypt, rows of stone sarcophagi, narrow passage, dim torchlight, dark dungeon, cobwebs, 3D game environment',
  'forge.glb':    'underground forge, glowing furnace, anvil on stone floor, hot coals, industrial dark fantasy, dungeon workshop, 3D game environment asset',
  'garden.glb':   'sunken underground garden, overgrown stone ruins, pale light from above, vines and roots on walls, mysterious flora, dungeon environment, 3D asset',
  'library.glb':  'ancient dungeon library, floor to ceiling stone bookshelves, dusty tomes, reading table, dim candlelight, dark fantasy academic, 3D game environment',
};

async function createTripoTask(prompt) {
  const res = await fetch('https://api.tripo3d.ai/v2/openapi/task', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TRIPO_KEY}`,
    },
    body: JSON.stringify({
      type: 'text_to_model',
      prompt,
      model_version: 'v2.0-20240919',
    }),
  });
  const data = await res.json();
  if (!data?.data?.task_id) throw new Error(`Tripo create failed: ${JSON.stringify(data)}`);
  return data.data.task_id;
}

async function pollTripoTask(taskId, filename) {
  console.log(`  [${filename}] Polling task ${taskId}...`);
  for (let i = 0; i < 120; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const res = await fetch(`https://api.tripo3d.ai/v2/openapi/task/${taskId}`, {
      headers: { 'Authorization': `Bearer ${TRIPO_KEY}` },
    });
    const data = await res.json();
    const status = data?.data?.status;
    const progress = data?.data?.progress || 0;

    process.stdout.write(`\r  [${filename}] ${status} — ${progress}%    `);

    if (status === 'success') {
      const modelUrl = data?.data?.output?.model;
      console.log(`\n  [${filename}] Done! Downloading from ${modelUrl}`);
      return modelUrl;
    }
    if (status === 'failed') throw new Error(`Task ${taskId} failed`);
  }
  throw new Error(`Task ${taskId} timed out`);
}

async function downloadFile(url, outputPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(buffer));
  const kb = Math.round(buffer.byteLength / 1024);
  console.log(`  Saved ${path.basename(outputPath)} (${kb} KB)`);
}

async function generateRoom(filename, prompt) {
  const outputPath = path.join(OUTPUT_DIR, filename);

  if (fs.existsSync(outputPath)) {
    console.log(`  [${filename}] Already exists, skipping`);
    return;
  }

  console.log(`\n  [${filename}] Creating task...`);
  try {
    const taskId = await createTripoTask(prompt);
    const modelUrl = await pollTripoTask(taskId, filename);
    await downloadFile(modelUrl, outputPath);
  } catch (err) {
    console.error(`\n  [${filename}] FAILED: ${err.message}`);
    console.error(`  Creating placeholder file so the game doesn't crash...`);
    // Write an empty file so the loader fails gracefully
    fs.writeFileSync(outputPath, '');
  }
}

async function runAll() {
  if (!TRIPO_KEY) {
    console.error('Error: Set TRIPO_KEY environment variable');
    console.error('Usage: TRIPO_KEY=your_key node prebatch.js');
    process.exit(1);
  }

  console.log('Echoes — Tripo 3D Pre-generation Batch');
  console.log('========================================');
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log(`Rooms to generate: ${Object.keys(ROOM_PROMPTS).length}`);
  console.log('Running all in parallel (expect 60-120s total)...\n');

  const start = Date.now();

  // Run all in parallel
  await Promise.allSettled(
    Object.entries(ROOM_PROMPTS).map(([filename, prompt]) =>
      generateRoom(filename, prompt)
    )
  );

  const elapsed = Math.round((Date.now() - start) / 1000);
  console.log(`\n\nDone in ${elapsed}s`);

  // Report what we got
  console.log('\nAsset status:');
  Object.keys(ROOM_PROMPTS).forEach(filename => {
    const p = path.join(OUTPUT_DIR, filename);
    const exists = fs.existsSync(p);
    const size = exists ? fs.statSync(p).size : 0;
    const status = exists && size > 0 ? '✓' : '✗ MISSING';
    console.log(`  ${status}  ${filename} (${Math.round(size / 1024)} KB)`);
  });
}

runAll().catch(console.error);
