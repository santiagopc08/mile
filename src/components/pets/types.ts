export interface Pet {
  id: string;
  name: string;
  description: string;
  birthDate: string;
  gender: 'M' | 'F' | 'Male' | 'Female' | 'Macho' | 'Hembra';
  role: string;
  image: string;
  gallery: string[];
  colorAccent?: string;
}

export const PETS_DATA: Pet[] = [
  {
    id: 'kiaro',
    name: 'Kiaro',
    description: 'Compañero leal y guardián del refugio. Siempre alerta y listo para la aventura.',
    birthDate: '2020-05-15',
    gender: 'Macho',
    role: 'Guardia Estelar',
    image: '/img/pets/Kiaro.png',
    gallery: ['/img/pets/Kiaro.png', '/img/pets/all.png'],
    colorAccent: '#ff7020'
  },
  {
    id: 'miel',
    name: 'Miel',
    description: 'Dulce y curiosa, exploradora de rincones oscuros y cazadora de reflejos.',
    birthDate: '2021-08-20',
    gender: 'Hembra',
    role: 'Navegante de Sueños',
    image: '/img/pets/Miel.png',
    gallery: ['/img/pets/Miel.png', '/img/pets/all.png'],
    colorAccent: '#00dbe9'
  },
  {
    id: 'sam',
    name: 'Sam',
    description: 'Energía pura y entusiasmo. El motor de alegría del equipo.',
    birthDate: '2019-11-10',
    gender: 'Macho',
    role: 'Especialista en Recreo',
    image: '/img/pets/Sam.png',
    gallery: ['/img/pets/Sam.png', '/img/pets/all.png'],
    colorAccent: '#a100f0'
  },
  {
    id: 'nika',
    name: 'Nika',
    description: 'Serena y observadora. La sabiduría silenciosa de la cápsula.',
    birthDate: '2022-02-28',
    gender: 'Hembra',
    role: 'Analista de Confort',
    image: '/img/pets/Nika.png',
    gallery: ['/img/pets/Nika.png', '/img/pets/all.png'],
    colorAccent: '#ffb595'
  }
];
