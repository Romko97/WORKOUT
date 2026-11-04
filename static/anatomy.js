'use strict';

// Original schematic vectors. These highlight regions, not individual muscle fibres.
function muscleDiagramSVG(key) {
  const areas = {
    chest: ['<path d="M20 41Q24 37 29 40V54Q22 56 20 50ZM40 41Q36 37 31 40V54Q38 56 40 50Z"/>', ''],
    shoulders: ['<ellipse cx="20" cy="39" rx="6" ry="7"/><ellipse cx="40" cy="39" rx="6" ry="7"/>', '<ellipse cx="20" cy="39" rx="6" ry="7"/><ellipse cx="40" cy="39" rx="6" ry="7"/>'],
    biceps: ['<ellipse cx="15" cy="56" rx="4" ry="11"/><ellipse cx="45" cy="56" rx="4" ry="11"/>', ''],
    triceps: ['', '<ellipse cx="15" cy="56" rx="4" ry="11"/><ellipse cx="45" cy="56" rx="4" ry="11"/>'],
    forearms: ['<path d="M10 71L15 73 11 88 6 87ZM50 71L45 73 49 88 54 87Z"/>', '<path d="M10 71L15 73 11 88 6 87ZM50 71L45 73 49 88 54 87Z"/>'],
    abdominals: ['<rect x="24" y="58" width="12" height="25" rx="5"/>', ''],
    lats: ['', '<path d="M19 47L27 51 25 76 20 69ZM41 47L33 51 35 76 40 69Z"/>'],
    upper_back: ['', '<path d="M23 43H37L36 64 30 68 24 64Z"/>'],
    traps: ['', '<path d="M27 30H33L42 39 34 47H26L18 39Z"/>'],
    lower_back: ['', '<path d="M25 69H35L37 85H23Z"/>'],
    glutes: ['', '<ellipse cx="24" cy="91" rx="7" ry="8"/><ellipse cx="36" cy="91" rx="7" ry="8"/>'],
    quadriceps: ['<ellipse cx="23" cy="110" rx="5" ry="15"/><ellipse cx="37" cy="110" rx="5" ry="15"/>', ''],
    hamstrings: ['', '<ellipse cx="23" cy="110" rx="5" ry="15"/><ellipse cx="37" cy="110" rx="5" ry="15"/>'],
    calves: ['', '<ellipse cx="21" cy="138" rx="4" ry="11"/><ellipse cx="39" cy="138" rx="4" ry="11"/>'],
    neck: ['<rect x="26" y="26" width="8" height="9" rx="2"/>', '<rect x="26" y="26" width="8" height="9" rx="2"/>'],
    abductors: ['<path d="M19 87L23 91 20 104 17 101ZM41 87L37 91 40 104 43 101Z"/>', ''],
    adductors: ['<ellipse cx="27" cy="108" rx="3" ry="13"/><ellipse cx="33" cy="108" rx="3" ry="13"/>', '']
  };
  const silhouette = '<circle cx="30" cy="14" r="10"/><rect x="26" y="24" width="8" height="11" rx="3"/><path d="M20 34Q30 30 40 34L43 67 38 91H22L17 67Z"/><path d="M20 35L13 39 7 70 4 90 11 92 17 72 23 45Z"/><path d="M40 35L47 39 53 70 56 90 49 92 43 72 37 45Z"/><path d="M22 89L30 92 28 123 25 154H16L18 122Z"/><path d="M38 89L30 92 32 123 35 154H44L42 122Z"/>';
  const selected = Object.prototype.hasOwnProperty.call(areas, key) ? areas[key] : ['', ''];
  const full = key === 'full_body';
  const body = (x, side) => `<g transform="translate(${x},5)"><g fill="${full ? '#d76c55' : '#dce3d6'}" stroke="#8c9b83" stroke-width="1" stroke-linejoin="round">${silhouette}</g><g fill="#d76c55" stroke="#b94d39" stroke-width=".5">${selected[side]}</g>${key === 'cardio' && side === 0 ? '<path fill="#d76c55" d="M30 58C10 46 22 33 30 43C38 33 50 46 30 58Z"/>' : ''}${['unknown','other'].includes(key) && side === 0 ? '<text x="30" y="69" text-anchor="middle" font-size="23" fill="#64705b">?</text>' : ''}</g>`;
  return `<svg class="muscle-diagram" viewBox="0 0 136 176" role="img" aria-label="Схематичне розташування: ${esc(muscleLabel(key))}. Вигляд спереду та ззаду.">${body(3, 0)}${body(73, 1)}<text x="33" y="172" text-anchor="middle">Спереду</text><text x="103" y="172" text-anchor="middle">Ззаду</text></svg>`;
}
