/**
 * Curated couple memories for SmashFest memory blocks.
 * When a player liberates a memory block, one of these beautiful memories
 * is revealed, reinforcing the app's romantic and couple theme.
 */

export interface MemoryItem {
  id: string;
  title: string;
  category: "romance" | "travel" | "fun" | "home" | "milestone";
  icon: string;
}

export const COUPLE_MEMORIES: MemoryItem[] = [
  { id: "mem_1", title: "Aquel primer café donde las horas pasaron volando ☕✨", category: "romance", icon: "☕" },
  { id: "mem_2", title: "Nuestra escapada improvisada bajo las estrellas 🌌💫", category: "travel", icon: "🌌" },
  { id: "mem_3", title: "La risa incontrolable cocinando juntos a medianoche 🍕❤️", category: "fun", icon: "🍕" },
  { id: "mem_4", title: "El día que decidimos construir este refugio juntos 🏡🔑", category: "milestone", icon: "🏡" },
  { id: "mem_5", title: "Aquel atardecer infinito mirando el horizonte 🌅🎨", category: "romance", icon: "🌅" },
  { id: "mem_6", title: "Nuestra playlist secreta para viajes en carretera 🚗🎵", category: "travel", icon: "🚗" },
  { id: "mem_7", title: "Las tardes de lluvia acurrucados con mantas 🌧️🛋️", category: "home", icon: "🛋️" },
  { id: "mem_8", title: "Esa mirada cómplice que lo dice absolutamente todo 👀💖", category: "romance", icon: "💖" },
  { id: "mem_9", title: "El banquete de postres que juramos no repetir 🍰😋", category: "fun", icon: "🍰" },
  { id: "mem_10", title: "Cada pequeño gran paso dando forma a nuestro futuro 🚀🌟", category: "milestone", icon: "🚀" },
];

export function getRandomMemory(seed?: number): MemoryItem {
  const index = seed !== undefined ? Math.abs(seed) % COUPLE_MEMORIES.length : Math.floor(Math.random() * COUPLE_MEMORIES.length);
  return COUPLE_MEMORIES[index];
}
