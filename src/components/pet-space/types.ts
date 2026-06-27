export interface Pet {
  id: string;
  name: string;
  src: string;
  designation: string;
  birthDate: string;
  gender: string;
  role: string;
  description: string;
  accent: string;
  o2: number;
  temp: number;
  gallery: string[];
}

export const PETS: Pet[] = [
  {
    id: 'kiaro',
    name: 'Kiaro',
    src: '/img/pets/Kiaro.png',
    designation: 'MACHO',
    birthDate: '15 MAR 2019',
    gender: '♂',
    role: 'Guardián Principal',
    description: 'Protector del perímetro y líder de manada.',
    accent: '#ff7020',
    o2: 99.1,
    temp: 22.8,
    gallery: ['/img/pets/Kiaro.png'],
  },
  {
    id: 'nika',
    name: 'Nika',
    src: '/img/pets/Nika.png',
    designation: 'HEMBRA',
    birthDate: '22 OCT 2021',
    gender: '♀',
    role: 'Exploradora',
    description: 'Exploradora del cosmos y guardiana de sueños.',
    accent: '#00dbe9',
    o2: 98.5,
    temp: 22.4,
    gallery: ['/img/pets/Nika.png'],
  },
  {
    id: 'sam',
    name: 'Sam',
    src: '/img/pets/Sam.png',
    designation: 'HEMBRA',
    birthDate: '08 JUN 2020',
    gender: '♀',
    role: 'Navegante',
    description: 'Navegante estelar y compañero de misiones.',
    accent: '#a100f0',
    o2: 97.8,
    temp: 23.1,
    gallery: ['/img/pets/Sam.png'],
  },
  {
    id: 'miel',
    name: 'Miel',
    src: '/img/pets/Miel.png',
    designation: 'HEMBRA',
    birthDate: '30 DEC 2018',
    gender: '♀',
    role: 'Oficial Médico',
    description: 'Oficial médico y especialista en confort.',
    accent: '#ffb595',
    o2: 98.9,
    temp: 22.6,
    gallery: ['/img/pets/Miel.png'],
  },
];
