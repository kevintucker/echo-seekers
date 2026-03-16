// dungeonGraph.js — Room connections and minimap layout

// Grid positions for the minimap (3x3 grid, col/row 0-indexed)
// null = empty cell
export const MINIMAP_LAYOUT = [
  [null,      'library',  null    ],
  ['throne',  'altar',    'crypt' ],
  ['forge',   'entrance', 'garden'],
];

// Flat lookup: roomId → {col, row}
export const ROOM_GRID_POS = {};
MINIMAP_LAYOUT.forEach((row, r) => {
  row.forEach((id, c) => {
    if (id) ROOM_GRID_POS[id] = { col: c, row: r };
  });
});

// Door positions in 3D space for each room (where portals appear)
// These are relative to the room center
export const DOOR_POSITIONS = {
  entrance: [
    { target: 'altar',  position: [0, 0, -8],  label: 'Altar Hall' },
    { target: 'forge',  position: [8, 0, 0],   label: 'The Forge' },
  ],
  altar: [
    { target: 'entrance', position: [0, 0, 8],   label: 'Threshold' },
    { target: 'throne',   position: [-8, 0, 0],  label: 'Throne Room' },
    { target: 'crypt',    position: [8, 0, 0],   label: 'The Crypt' },
  ],
  throne: [
    { target: 'altar',   position: [8, 0, 0],   label: 'Altar' },
    { target: 'library', position: [0, 0, -8],  label: 'Library' },
  ],
  crypt: [
    { target: 'altar',  position: [-8, 0, 0],  label: 'Altar Hall' },
    { target: 'garden', position: [0, 0, -8],  label: 'Garden' },
  ],
  forge: [
    { target: 'entrance', position: [-8, 0, 0], label: 'Entrance' },
    { target: 'garden',   position: [0, 0, -8], label: 'Garden' },
  ],
  garden: [
    { target: 'crypt',  position: [0, 0, 8],   label: 'Crypt' },
    { target: 'forge',  position: [-8, 0, 0],  label: 'Forge' },
    { target: 'library',position: [8, 0, 0],   label: 'Library' },
  ],
  library: [
    { target: 'throne', position: [0, 0, 8],   label: 'Throne Room' },
    { target: 'garden', position: [-8, 0, 0],  label: 'Garden' },
  ],
};
