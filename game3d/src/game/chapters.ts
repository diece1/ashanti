export interface ChapterPalette {
  sky: number;
  fog: number;
  ground: number;
  path: number;
  foliage: number;
  accent: number;
  water: number;
}

export interface Chapter {
  id: number;
  title: string;
  narrative: string;
  objective: string;
  enemy: string;
  boss?: string;
  palette: ChapterPalette;
}

export const chapters: Chapter[] = [
  {
    id: 0,
    title: "La forêt sacrée",
    narrative: "On dit que chaque arbre garde la voix d’un ancêtre. Écoute : la forêt n’a jamais cessé de parler.",
    objective: "Libère les âmes égarées et rejoins le passage.",
    enemy: "Égaré",
    palette: { sky: 0x9dbdaf, fog: 0x416456, ground: 0x31543d, path: 0x876f45, foliage: 0x28583b, accent: 0x73d5b3, water: 0x4c9f9e },
  },
  {
    id: 1,
    title: "Les ruines ancestrales",
    narrative: "Ces ruines abritaient les gardiens de pierre. Les runes s’éveillent quand tu approches.",
    objective: "Traverse les ruines et découvre la source des runes.",
    enemy: "Rôdeur",
    palette: { sky: 0xa9b8a5, fog: 0x50645b, ground: 0x4e5143, path: 0x8c8770, foliage: 0x496044, accent: 0x9fe6e0, water: 0x578e91 },
  },
  {
    id: 2,
    title: "Les cascades spirituelles",
    narrative: "Mami Wata vit là où la rivière rencontre la mer. Elle récompense ceux qui respectent l’eau.",
    objective: "Franchis la rivière et libère les esprits de l’eau.",
    enemy: "Volant",
    boss: "Mokélé",
    palette: { sky: 0x8ab4c2, fog: 0x2f6470, ground: 0x284b4b, path: 0x6b796b, foliage: 0x1e6758, accent: 0x5fd8ff, water: 0x1c98c5 },
  },
  {
    id: 3,
    title: "Le village oublié",
    narrative: "Ici vivait ton peuple. Les feux sont éteints, mais les esprits veillent encore.",
    objective: "Explore le village et rallume le feu ancestral.",
    enemy: "Chaman",
    palette: { sky: 0xb99674, fog: 0x76513a, ground: 0x665036, path: 0x9a7142, foliage: 0x59612c, accent: 0xf2a93b, water: 0x7d8770 },
  },
  {
    id: 4,
    title: "Le sanctuaire ancestral",
    narrative: "Le sanctuaire ancestral. Au bout du chemin, le gardien de l’arbre sacré t’attend.",
    objective: "Atteins le sanctuaire et affronte son gardien.",
    enemy: "Corrompu",
    boss: "Nguéma",
    palette: { sky: 0x8e80ab, fog: 0x49366a, ground: 0x40394f, path: 0x766c85, foliage: 0x294a49, accent: 0xb58cff, water: 0x6d5aa4 },
  },
  {
    id: 5,
    title: "La faille souterraine",
    narrative: "Une faille s’est ouverte sous la forêt. Ce monde n’est pas fait pour les vivants.",
    objective: "Survis aux ombres et trouve une issue.",
    enemy: "Ombre dévoreuse",
    palette: { sky: 0x5d537d, fog: 0x30274e, ground: 0x302544, path: 0x594e73, foliage: 0x312957, accent: 0x9f7bff, water: 0x493a8a },
  },
  {
    id: 6,
    title: "Les cristaux lumineux",
    narrative: "Les cristaux chantent… Des machines anciennes dorment sous la pierre.",
    objective: "Traverse les galeries et rallume les cristaux.",
    enemy: "Gardien de pierre",
    palette: { sky: 0x819bb9, fog: 0x364b76, ground: 0x35415d, path: 0x71819b, foliage: 0x334a6a, accent: 0x5fd8ff, water: 0x4aa8ff },
  },
  {
    id: 7,
    title: "Le trône du Roi des Âmes",
    narrative: "Le Roi des Âmes contrôle toutes les âmes de ce monde. Il t’attend sur son trône.",
    objective: "Affronte le Roi des Âmes et libère les ancêtres.",
    enemy: "Spectre minéral",
    boss: "Akuma",
    palette: { sky: 0x726078, fog: 0x402743, ground: 0x3c2946, path: 0x76526d, foliage: 0x392344, accent: 0xd04bff, water: 0x7e3991 },
  },
];
