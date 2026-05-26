# Frontend API Contracts

Справочник для frontend-разработчиков. Описывает контракты всех эндпоинтов, используемых на клиенте.

**Base URL:** `/api` (проксируется через Next.js rewrites → `https://low-analysis.onrender.com`)
**Auth:** Bearer JWT в заголовке `Authorization: Bearer <token>`
**Swagger UI:** `/api-docs` · Raw spec: `/api-docs.json`

---

## Auth

### POST /api/auth/register

Регистрация пользователя. Backend принимает `displayName` или `fullName` — оба варианта равнозначны.

**Request:**
| Поле | Тип | Обязательное | Описание |
|---|---|---|---|
| email | string | ✅ | |
| password | string | ✅ | Минимум 8 символов |
| displayName | string | рекомендовано | Имя пользователя |
| accountType | `"client"` \| `"admin"` | нет | По умолчанию client |
| superCode | string | если admin | Секретный код из env |

**Response 201:**
```json
{ "_id": "...", "email": "...", "fullName": "...", "role": "user", "token": "eyJ..." }
```

**Ошибки:** `400` — пользователь существует или плохой superCode.

---

### POST /api/auth/login

**Request:** `{ email, password }` — email также может быть username.

**Response 200:**
```json
{ "_id": "...", "email": "...", "fullName": "...", "role": "user"|"paid_user"|"admin", "token": "eyJ..." }
```

Frontend маппинг: `role === "admin"` → `accountType: "admin"`, всё остальное → `accountType: "client"`.

**Ошибки:** `401` — Invalid email or password.

---

### GET /api/auth/me

Требует: `Authorization: Bearer <token>`

**Response 200:** `{ _id, email, fullName, role }` — без токена.

**Ошибки:** `401` если токен истёк или отсутствует → frontend должен сделать `clearStoredSession()`.

---

### PUT /api/auth/profile

Требует: Authorization.

**Request:** `{ displayName: string }` — backend принимает и `fullName`.

**Response 200:** `{ _id, email, fullName, role }`

---

### PUT /api/auth/password

Требует: Authorization.

**Request:** `{ currentPassword: string, nextPassword: string }` — nextPassword минимум 8 символов.

**Response 200:** `{ message: "Password updated successfully" }`

**Ошибки:** `400` — Current password is incorrect / Password must be at least 8 characters.

---

### POST /api/auth/logout

Не требует токена. Сервер stateless — клиент сам удаляет токен из localStorage/sessionStorage.

**Response 200:** `{ message: "Logged out successfully" }`

---

## Laws

### GET /api/laws

**Query params:**
| Параметр | Тип | Default | Описание |
|---|---|---|---|
| q | string | — | Поиск по названию (case-insensitive regex) |
| status | string | — | Фильтр по статусу (напр. `"Чинний"`) |
| documentType | string | — | Фильтр по типу документа (массив, contains) |
| dateFrom | date | — | adoptedDate >= dateFrom (ISO: `2020-01-01`) |
| dateTo | date | — | adoptedDate <= dateTo |
| sortBy | `date`\|`title` | `date` | |
| sortOrder | `asc`\|`desc` | `desc` | |
| page | integer | 1 | |
| limit | integer | 20 | **Максимум 100** |

**Response 200 (PaginatedLaws):**
```json
{
  "data": [ "Law[]" ],
  "pagination": {
    "page": 1, "limit": 20, "total": 11,
    "totalPages": 1, "hasNextPage": false, "hasPrevPage": false
  }
}
```

> Внимание: при `limit=100` возвращается весь корпус (сейчас 11 законов). Максимум backend поддерживает 100.

---

### GET /api/laws/:id/tree

Возвращает закон + плоский массив всех элементов. Клиент сам строит иерархию по `parentId` и `depth`.

**Query params:** `function`, `domain`, `subjectId` — фильтрация элементов.

**Response 200:**
```json
{
  "law": { "Law": "..." },
  "elements": [
    {
      "_id": "...", "lawId": "...", "type": "...", "code": "...", "number": "...", "title": "...", "text": "...",
      "parentId": "...", "depth": 0, "order": 0, "chars_count": 0, "subjects_count": 0,
      "z_score": 0, "risk_level": "...",
      "subjects": [{ "subject_id": "...", "role": "..." }],
      "taxonomy": { "legalFunctions": [], "domains": [], "keywords": [], "confidence": 0, "source": "..." }
    }
  ]
}
```

**Типы элементов:** `section` → `article` → `part` → `point` → `sub_point` → `paragraph`

**Важно:** `taxonomy` может быть `null` если элемент ещё не классифицирован.

---

### GET /api/laws/:id/heatmap

Лёгкая версия без текста и subjects[]. Используется для построения тепловой карты.

**Response 200:** массив `ElementLite[]`:
```json
[{ "_id": "...", "type": "...", "code": "...", "depth": 0, "chars_count": 0, "subjects_count": 0, "z_score": 0, "risk_level": "...", "factor": 0 }]
```

> `factor` — аналитическая метрика нагрузки (0–100), вычисляется сервером.

---

### GET /api/laws/:id/stats

**Response 200:**
```json
{
  "totalElements": 994,
  "meanChars": 160.45,
  "standardDeviation": 140.12,
  "riskLevels": { "green": 850, "yellow": 110, "red": 34, "nullCount": 0 }
}
```

> `riskLevels.nullCount` — элементы без определённого уровня риска.

---

### GET /api/laws/:id/articles/:num

`num` — строка (напр. `"1"`, `"129-1"`).

**Response 200:**
```json
{ "lawUrl": "https://...|null", "article": "Element", "children": "Element[]" }
```

---

### GET /api/laws/elements/:id

Один элемент по ID — полный payload включая taxonomy и subjects.

**Response 200:** `Element` (полная схема)

**Ошибки:** `404` — Element not found.

---

### POST /api/laws/parse

**Request:** `{ url: "https://zakon.rada.gov.ua/laws/show/580-19" }`

**Response 200:** `{ message: "...", lawId: "...", elementsCount: 0 }`

---

## Subjects

### GET /api/subjects

Глобальный реестр субъектов, отсортированных по `canonical_name`.

**Response 200:** `Subject[]`

```json
[{
  "_id": "...", "canonical_name": "...", "legal_status": "...", "aliases": [], "description": "...", "taxonomies": []
}]
```

**legal_status enum:** `executive_body` | `official` | `legal_entity` | `individual` | `self_regulatory_org` | `other`

---

### GET /api/subjects/:id/elements

**Response 200:**
```json
{ "subject": "Subject", "elements": "Element[]" }
```

**Ошибки:** `404` — Subject not found.

---

## Taxonomy

### GET /api/taxonomies

**Response 200:** `Taxonomy[]` — плоский список всех категорий.

### GET /api/taxonomies/tree

**Response 200:** `TaxonomyTreeNode[]` — корневые узлы с рекурсивными `children`.

---

## Обработка ошибок

| Код | Значение | Что делает frontend |
|---|---|---|
| 400 | Плохой запрос | Показать `data.message` пользователю |
| 401 | Нет/истёк токен | `clearStoredSession()` → редирект на `/auth/login` |
| 403 | Нет прав (не admin) | Показать сообщение об отказе доступа |
| 404 | Не найдено | Показать empty state или редирект |
| 500 | Ошибка сервера | Показать общее сообщение об ошибке |

Все ошибки возвращают: `{ message: string, stack?: string }` (stack только в dev).

---

## Enums — источник истины

### subjects.role
`actor` | `target_of_control` | `recipient` | `regulator` | `protected_party` | `issuer_of_regulations` | `other`

### element.type
`section` | `article` | `part` | `point` | `sub_point` | `paragraph`

### element.risk_level
`green` | `yellow` | `red` | `null`

### subject.legal_status
`executive_body` | `official` | `legal_entity` | `individual` | `self_regulatory_org` | `other`

### user.role (backend)
`user` | `paid_user` | `admin`
Frontend маппинг: `user/paid_user` → `accountType: "client"`, `admin` → `accountType: "admin"`

---

## Кэширование на фронте

| Данные | TTL | Механизм |
|---|---|---|
| Список законов | 60 сек | Модульный кэш в `useLaws` hook |
| Субъекты | 60 сек | Модульный кэш в `useSubjects` hook |
| Дерево закона | Per request | SWR / React state |
| Stats | Per request | SWR / React state |

---

## Что backend вычисляет, что frontend вычисляет сам

| Поле | Кто считает |
|---|---|
| `chars_count` | Backend (при парсинге) |
| `subjects_count` | Backend (при парсинге) |
| `z_score` | Backend (при анализе) |
| `risk_level` | Backend (при анализе) |
| `factor` (в heatmap) | Backend |
| `factor` (в analysis) | Frontend — `deriveLawAnalysis.ts` если нет backend-значения |
| `averageFactor` | Frontend |
| `highRiskCount` | Frontend |
| Иерархия дерева | Frontend — строит из плоского массива |
| `articleOptions` | Frontend — из elements |
