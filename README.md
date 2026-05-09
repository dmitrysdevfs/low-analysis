# Low Analysis

> Система структурування та аналізу українського законодавства - перетворення лінійних текстів законів на ієрархічну базу атомарних елементів.

## Концепція

Закони України зараз існують як неструктуровані "текстові полотна". **Low Analysis** розбиває кожен закон на атомарні одиниці (розділ -> стаття -> абзац), де кожен елемент має:
- унікальний ієрархічний код (напр. `rz1.st2.ch3`)
- прив'язку до батьківського елемента
- майбутній зв'язок із суб'єктами регулювання (студент, лікар, підприємець)

Кінцева мета - **"Радіант"**: 3D-граф зв'язків між нормами різних законів та 4D-часова вісь для аналізу еволюції законодавства.

## Live API

**Base URL:** `https://low-analysis.onrender.com`

| Метод | Ендпоінт | Опис |
|-------|----------|------|
| `GET` | `/` | Health check |
| `GET` | `/api/laws` | Список розпарсених законів |
| `GET` | `/api/laws/:id/tree` | Ієрархічне дерево закону |
| `GET` | `/api/laws/:id/articles/:num` | Конкретна стаття з її вкладеними елементами |
| `GET` | `/api/subjects` | Список усіх суб'єктів регулювання |
| `GET` | `/api/subjects/:id/elements` | Елементи закону (абзаци/статті), що стосуються конкретного суб'єкта |

### Приклади запитів

```bash
# Список законів
curl https://low-analysis.onrender.com/api/laws

# Дерево Конституції
curl https://low-analysis.onrender.com/api/laws/69f84aa7395f1789bc7b2b89/tree

# Стаття 1 Конституції
curl https://low-analysis.onrender.com/api/laws/69f84aa7395f1789bc7b2b89/articles/1
```

## Технологічний стек

| Компонент | Технологія |
|-----------|-----------|
| Runtime | Node.js 20+ (ESM) |
| Backend | Express.js 5 |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Parser | Cheerio (HTML -> structured data) |
| Frontend | Next.js 16+, React 19, TailwindCSS v4 |

## Швидкий старт (локально)

### Бекенд (API + Парсер)
```bash
git clone https://github.com/dmitrysdevfs/low-analysis.git
cd low-analysis/backend
npm install
cp .env.example .env   # додати MONGODB_URI
npm run dev            # API: http://localhost:3000
```

### Фронтенд (UI)
```bash
cd low-analysis/frontend
npm install
npm run dev            # UI: http://localhost:3000 (або 3001)
```

## Архітектура

```text
low-analysis/
├── backend/           # Node.js REST API + Парсер
│   ├── src/
│   │   ├── models/        # Law, Element, Subject (Mongoose)
│   │   ├── services/      # Бізнес-логіка (lawService, parserService)
│   │   ├── controllers/   # HTTP-обробники
│   │   └── routes/        # API маршрути
│   └── scripts/
│       ├── fetchLaw.js    # Завантаження HTML з zakon.rada.gov.ua
│       └── ingestLaw.js   # Парсинг + збереження в MongoDB
└── frontend/          # Next.js + TailwindCSS UI (в розробці)
    ├── src/
    └── package.json
```

**Ключовий принцип бекенду**: Controllers ніколи не звертаються до БД напряму - лише через Services.

## Парсер

Парсер аналізує `.frame` HTML з `zakon.rada.gov.ua` через `data-tree` атрибути:

```text
data-tree="rz1"         -> Розділ 1
data-tree="st1"         -> Стаття 1
data-tree="st129-1"     -> Стаття 129-1 (під-стаття)
data-tree="ch_1:st2"    -> Частина 1 статті 2
```

## Wiki (Persistent Memory)

Зовнішня база знань за методом LLM-Wiki (A. Karpathy) в Obsidian:
- Архітектурні рішення (ADR)
- Доменна онтологія законодавства
- Технічна документація DOM-структури zakon.rada.gov.ua

## Roadmap

- [x] Парсинг HTML -> MongoDB (Конституція)
- [x] REST API для читання структури законів
- [ ] Інгест кодексів (КУпАП, ЦКУ, КК)
- [ ] AI-визначення суб'єктів регулювання (OpenAI / Ollama)
- [ ] Граф зв'язків між нормами різних законів
- [ ] "Радіант" - 3D-візуалізація законодавчої бази
