const fs = require('fs');
let content = fs.readFileSync('src/app/cumple/page.tsx', 'utf8');

const melodyStr = `// --- Happy Birthday Melody Configuration for Lofi Synthesizer ---
const MELODY = [
  { note: 'C4', dur: 0.5 }, { note: 'C4', dur: 0.5 }, { note: 'D4', dur: 1 }, { note: 'C4', dur: 1 }, { note: 'F4', dur: 1 }, { note: 'E4', dur: 2 },
  { note: 'C4', dur: 0.5 }, { note: 'C4', dur: 0.5 }, { note: 'D4', dur: 1 }, { note: 'C4', dur: 1 }, { note: 'G4', dur: 1 }, { note: 'F4', dur: 2 },
  { note: 'C4', dur: 0.5 }, { note: 'C4', dur: 0.5 }, { note: 'C5', dur: 1 }, { note: 'A4', dur: 1 }, { note: 'F4', dur: 1 }, { note: 'E4', dur: 1 }, { note: 'D4', dur: 1 },
  { note: 'Bb4', dur: 0.5 }, { note: 'Bb4', dur: 0.5 }, { note: 'A4', dur: 1 }, { note: 'F4', dur: 1 }, { note: 'G4', dur: 1 }, { note: 'F4', dur: 2 }
];

const NOTE_FREQS: Record<string, number> = {
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'Bb4': 466.16, 'C5': 523.25
};

`;

content = content.replace("class BdaySynth {", melodyStr + "class BdaySynth {");
fs.writeFileSync('src/app/cumple/page.tsx', content);
