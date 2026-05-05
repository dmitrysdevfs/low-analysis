# Low Analysis

> Система структурування та аналізу українського законодавства — перетворення лінійних текстів законів на ієрархічну базу атомарних елементів.

## 🎯 Концепція

Закони України зараз існують як неструктуровані "текстові полотна". **Low Analysis** розбиває кожен закон на атомарні одиниці (розділ → стаття → абзац), де кожен елемент має:
- унікальний ієрархічний код (напр. `rz1.st2.ch3`)
- прив'язку до батьківського елемента
- майбутній зв'язок із суб'єктами регулювання (студент, лікар, підприємець)

Кінцева мета — **"Радіант"**: 3D-граф зв'язків між нормами різних законів та 4D-часова вісь для аналізу еволюції законодавства.

## 🚀 Live API

**Base URL:** `https://low-analysis.onrender.com`

| Метод | Ендпоінт | Опис |
|-------|----------|------|
| `GET` | `/` | Health check |
| `GET` | `/api/laws` | Список розпарсених законів |
| `GET` | `/api/laws/:id/tree` | Ієрархічне дерево закону (всі 481 елемент) |
| `GET` | `/api/laws/:id/articles/:num` | Конкретна стаття з частинами |
| `GET` | `/api/subjects` | Суб'єкти регулювання |

### Приклади запитів

```bash
# Список законів
curl https://low-analysis.onrender.com/api/laws

# Дерево Конституції (481 елемент: 14 розділів, 166 статей, 301 абзац)
curl https://low-analysis.onrender.com/api/laws/<id>/tree

# Стаття 1 Конституції
curl https://low-analysis.onrender.com/api/laws/<id>/articles/1
```

### Приклад відповіді `/api/laws`

```json
[
  {
    "_id": "...",
    "title": "КОНСТИТУЦІЯ УКРАЇНИ",
    "code": "254к/96-вр",
    "totalSections": 14,
    "totalArticles": 166,
    "source": "https://zakon.rada.gov.ua/laws/show/254к/96-вр.frame"
  }
]
```

### Приклад елемента дерева (`/api/laws/:id/tree`)

```json
[
  { "type": "section", "code": "rz1", "title": "Розділ I ЗАГАЛЬНІ ЗАСАДИ", "depth": 0 },
  { "type": "article", "code": "rz1.st1", "number": "1", "title": "Стаття 1.", "depth": 1,
    "text": "Україна є суверенна і незалежна, демократична, соціальна, правова держава." },
  { "type": "paragraph", "code": "rz1.st2.ch1", "depth": 2,
    "text": "Україна є унітарною державою." }
]
```

## 🛠 Технологічний стек

| Компонент | Технологія |
|-----------|-----------|
| Runtime | Node.js 20+ (ESM) |
| Backend | Express.js 5 |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Parser | Cheerio (HTML → structured data) |

## ⚡ Швидкий старт (локально)

```bash
git clone https://github.com/dmitrysdevfs/low-analysis.git
cd low-analysis
npm install
cp .env.example .env   # додати MONGODB_URI
npm run dev            # http://localhost:3000
```

## 🏗 Архітектура

```
src/
├── models/        # Law, Element, Subject (Mongoose)
├── services/      # Бізнес-логіка (lawService, parserService)
├── controllers/   # HTTP-обробники (делегують до services)
├── routes/        # API маршрути
└── app.js         # Express entry point

scripts/
├── fetchLaw.js    # Завантаження HTML з zakon.rada.gov.ua
└── ingestLaw.js   # Парсинг + збереження в MongoDB
```

**Ключовий принцип**: Controllers ніколи не звертаються до БД напряму — лише через Services.

## 🔬 Парсер

Парсер аналізує `.frame` HTML з `zakon.rada.gov.ua` через `data-tree` атрибути:

```
data-tree="rz1"         → Розділ 1
data-tree="st1"         → Стаття 1
data-tree="st129-1"     → Стаття 129-1 (під-стаття)
data-tree="ch_1:st2"    → Частина 1 статті 2
```

**Результат парсингу Конституції**: 481 елемент, 0 дублікатів.

## 📚 Wiki (Persistent Memory)

Зовнішня база знань за методом LLM-Wiki ([A. Karpathy](https://karpathy.ai)) в Obsidian:
- Архітектурні рішення (ADR)
- Доменна онтологія законодавства
- Технічна документація DOM-структури zakon.rada.gov.ua

## 🗺 Roadmap

- [x] Парсинг HTML → MongoDB (Конституція)
- [x] REST API для читання структури законів
- [ ] Інгест кодексів (КУпАП, ЦКУ, КК)
- [ ] AI-визначення суб'єктів регулювання (OpenAI / Ollama)
- [ ] Граф зв'язків між нормами різних законів
- [ ] "Радіант" — 3D-візуалізація законодавчої бази
