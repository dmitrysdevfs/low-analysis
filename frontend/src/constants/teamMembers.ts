export type TeamTrack =
  | "product"
  | "fullstack"
  | "backend"
  | "design"
  | "quality"
  | "legal";

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  track: TeamTrack;
  years: number;
  yearsLabel: string;
  photo: string;
  photoPosition?: string;
  photoBrightness?: number;
  photoGrayscale?: number;
  stack: string[];
  note?: string;
};

export const teamTracks: { id: TeamTrack | "all"; label: string }[] = [
  { id: "all", label: "Усі" },
  { id: "product", label: "Продукт" },
  { id: "design", label: "Дизайн" },
  { id: "fullstack", label: "Fullstack" },
  { id: "backend", label: "Backend" },
  { id: "quality", label: "Якість" },
  { id: "legal", label: "Право" },
];

export const teamMembers: TeamMember[] = [
  {
    id: "oleksii-klymchuk",
    name: "Oleksii Klymchuk",
    role: "COO / Product Manager / Business Analyst",
    track: "product",
    years: 10,
    yearsLabel: "10 років досвіду",
    photo: "/team/oleksii-klymchuk.jpg",
    stack: [
      "PM / BA",
      "Product Strategy",
      "Team Leadership",
      "AI Products",
      "MVP Development",
      "Stakeholder Management",
    ],
  },
  {
    id: "veronika-lishchynska",
    name: "Veronika Lishchynska",
    role: "UX/UI Designer",
    track: "design",
    years: 2,
    yearsLabel: "2 роки досвіду",
    photo: "/team/veronika-lishchynska.jpg",
    stack: ["Design system", "Інтерфейси", "Прототипи"],
  },
  {
    id: "vitalii-belevtsov",
    name: "Vitalii Belevtsov",
    role: "Fullstack Developer",
    track: "fullstack",
    years: 1,
    yearsLabel: "1 рік досвіду",
    photo: "/team/vitalii-belevtsov.jpg",
    photoPosition: "center 25%",
    stack: ["Next.js", "React", "Python", "Node.js"],
  },
  {
    id: "tetiana-skliarchuk",
    name: "Tetiana Skliarchuk",
    role: "Fullstack Developer",
    track: "fullstack",
    years: 2,
    yearsLabel: "2 роки досвіду",
    photo: "/team/tetiana-skliarchuk.png",
    stack: [
      "Next.js",
      "Node.js",
      "React",
      "JavaScript",
      "TypeScript",
      "Tailwind CSS",
    ],
  },
  {
    id: "rostyslav-bryhynets",
    name: "Rostyslav Bryhynets",
    role: "Fullstack Developer",
    track: "fullstack",
    years: 2,
    yearsLabel: "2 роки досвіду",
    photo: "/team/rostyslav-bryhynets.jpg",
    photoBrightness: 1.8,
    photoGrayscale: 0.6,
    stack: ["TypeScript", "React", "Next.js", "Node.js", "Docker"],
  },
  {
    id: "tetiana-khyzhniak",
    name: "Tetiana Khyzhniak",
    role: "Fullstack Developer",
    track: "fullstack",
    years: 1,
    yearsLabel: "1 рік досвіду",
    photo: "/team/tetiana-khyzhniak.jpg",
    stack: ["React", "Next.js", "TypeScript", "Node.js"],
  },
  {
    id: "oleksandr-mykhaylenko",
    name: "Oleksandr Mykhaylenko",
    role: "Junior Fullstack Developer",
    track: "fullstack",
    years: 1,
    yearsLabel: "1 рік досвіду",
    photo: "/team/oleksandr-mykhaylenko.jpg",
    stack: [
      "HTML",
      "CSS",
      "JavaScript",
      "TypeScript",
      "React",
      "Next.js",
      "Node.js",
    ],
  },
  {
    id: "dmytro-saliakin",
    name: "Dmytro Salіakin",
    role: "Backend Developer",
    track: "backend",
    years: 2,
    yearsLabel: "2 роки досвіду",
    photo: "/team/dmytro-saliakin.jpg",
    stack: ["Data Pipeline", "AI Integration"],
  },
  {
    id: "inna-maleva",
    name: "Inna Maleva",
    role: "Backend Developer",
    track: "backend",
    years: 1,
    yearsLabel: "1 рік досвіду",
    photo: "/team/inna-maleva.jpg",
    stack: ["Python", "Django", "HTML", "CSS", "JavaScript"],
  },
  {
    id: "tetyana-moroz",
    name: "Tetyana Moroz",
    role: "QA Engineer",
    track: "quality",
    years: 1,
    yearsLabel: "1 рік досвіду",
    photo: "/team/tetyana-moroz.jpg",
    photoPosition: "center 20%",
    stack: ["Тестування", "Пошук багів", "Якість UX"],
    note: "Забезпечує якість продукту: тестує, знаходить дефекти та покращує користувацький досвід.",
  },
  {
    id: "yulia-kuznetsova",
    name: "Yulia Kuznetsova",
    role: "Lawyer Expert",
    track: "legal",
    years: 2,
    yearsLabel: "2 роки досвіду",
    photo: "/team/yulia-kuznetsova.jpg",
    stack: ["Право України", "Магістратура, 1 курс"],
    note: "Юридична експертиза норм та перевірка коректності правових формулювань.",
  },
];
