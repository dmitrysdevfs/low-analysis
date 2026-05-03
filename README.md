# Low Analysis

Система структурування та аналізу українського законодавства.

## Концепція

Перетворення лінійних текстів законів на ієрархічну базу даних взаємопов'язаних елементів, де кожен абзац є окремим об'єктом з унікальним кодом та метаданими.

## Стек

- **Backend**: Node.js + Express.js
- **Database**: MongoDB (Atlas)
- **Parser**: Cheerio
- **Frontend**: Next.js + Bootstrap 5 (опційно)

## Швидкий старт

```bash
npm install
cp .env.example .env    # Заповнити MONGODB_URI
npm run dev
```

## Структура

```
src/
├── config/       # DB connection
├── models/       # Mongoose schemas
├── services/     # Business logic
├── controllers/  # Request handlers
├── routes/       # API endpoints
└── app.js        # Express setup
```

## API

| Endpoint                        | Description                    |
|---------------------------------|--------------------------------|
| `GET /api/laws`                 | Список розпарсених законів     |
| `GET /api/laws/:id/tree`        | Ієрархічне дерево закону       |
| `GET /api/laws/:id/articles/:n` | Конкретна стаття               |
| `GET /api/subjects`             | Суб'єкти регулювання           |
| `GET /api/subjects/:id/elements`| Абзаци по суб'єкту             |

## Wiki (Другий мозок)

Зовнішня база знань за методом LLM-Wiki (A. Karpathy) у Obsidian:
`C:\Users\Admin\Dropbox\Main Vault\01_Projects\Low_Analysis\wiki\`
