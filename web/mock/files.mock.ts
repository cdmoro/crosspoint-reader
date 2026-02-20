import { FileEntry } from "../src/types";

const rootFiles: FileEntry[] = [
  {
    name: "Classics",
    size: 0,
    isDirectory: true,
    isEpub: false,
  },
  {
    name: "Conversacion en La Catedral - Mario Vargas Llosa.epub",
    size: 727000,
    isEpub: true,
    isDirectory: false,
  },
  {
    name: "Homero - La Iliada [2392] (r1.6).epub",
    size: 1200000,
    isEpub: true,
    isDirectory: false,
  },
  {
    name: "Homero - La Odisea [2408] (r1.4).epub",
    size: 1480000,
    isEpub: true,
    isDirectory: false,
  },
  {
    name: "Pedro Paramo - Juan Rulfo_141.txt",
    size: 213100,
    isEpub: false,
    isDirectory: false,
  },
  {
    name: "Viajes - Beatriz Sarlo.pdf",
    size: 505430,
    isEpub: false,
    isDirectory: false,
  },
];

const classicFiles: FileEntry[] = [
  {
    name: "Don Quijote de la Mancha - Miguel de Cervantes.epub",
    size: 850000,
    isEpub: true,
    isDirectory: false,
  },
  {
    name: "Macbeth - William Shakespeare.pdf",
    size: 300000,
    isEpub: false,
    isDirectory: false,
  },
];

export const getFilesByPath = (path: string): FileEntry[] => {
  switch (path) {
    case "/":
      return rootFiles;
    case "/Classics":
      return classicFiles;
    default:
      return [];
  }
};
