# Route Access Report

Дата проверки: 2026-06-17
Проект: Law-Analysis Platform
Формат проверки: read-only аудит маршрутов и текущей логики доступа

## Что проверено

Отчет собран по фактической реализации маршрутов и гейтов доступа в коде:

- `frontend/src/app/**/page.tsx`
- `frontend/src/app/layout.tsx`
- `frontend/src/components/auth/RouteAccessGate.tsx`
- `frontend/src/components/auth/AuthProvider.tsx`
- `frontend/src/components/guest/GuestLimitsProvider.tsx`
- `frontend/src/components/billing/BillingProvider.tsx`
- `backend/src/models/User.js`
- `backend/src/config/permissions.js`
- `backend/src/routes/supervisorRoutes.js`
- `backend/src/modules/pages/page.constants.js`

## Ключевые выводы

1. В проекте есть 5 ролевых сущностей в модели и правах: `user`, `paid_user`, `legislator`, `supervisor`, `admin`.
2. Отдельных `paid-only` страниц в текущей реализации нет.
3. Платные тарифы сейчас влияют не на список URL, а на квоты, лимиты и billing-функции внутри продукта.
4. Глобально жестко закрыты только:
   - все `/admin/*` для `admin`
   - все `/account/*` для авторизованных пользователей
   - все `/legislator-cabinet/*` для авторизованных пользователей
   - вложенные страницы `/legislator-cabinet/[proposalId]` дополнительно только для `legislator` или `admin`
5. `/supervisor/dashboard` не закрыт глобальным route-gate, но сама страница внутри пускает только `supervisor` или `admin`.
6. Страницы `/roles/*`, `/docs`, `/support`, `/help`, `/laws`, `/analysis`, `/subjects`, `/search` публичные и доступны гостю.

## Важное уточнение по формулировкам

- `Доступно гостю` означает: страницу можно открыть без логина.
- `Только гостю` страниц сейчас нет.
- `Платные страницы` как отдельная группа URL сейчас отсутствуют.
- `Ролевые страницы` есть, но часть из них ограничивается жестким роут-гейтом, а часть проверяется уже внутри компонента страницы.

## Матрица доступа по типам

### Публичные страницы

Доступны гостю и всем авторизованным ролям:

- `/`
- `/analysis`
- `/analysis/laws/[id]`
- `/assistant`
- `/auth`
- `/auth/login`
- `/auth/register`
- `/auth/forgot-password`
- `/auth/reset-password`
- `/changes`
- `/docs`
- `/graph`
- `/help`
- `/help/[slug]`
- `/laws`
- `/laws/[id]`
- `/laws/[id]/articles/[num]`
- `/legal`
- `/project-info`
- `/radiant`
- `/roadmap`
- `/roles/guest`
- `/roles/user`
- `/roles/lawmaker`
- `/roles/supervisor`
- `/roles/admin`
- `/search`
- `/search/results`
- `/subjects`
- `/subjects/[id]`
- `/support`

Примечание: для гостя на части этих страниц могут срабатывать лимиты и quota-flow, но сам URL не закрыт.

### Только для авторизованных пользователей

Доступны после логина, независимо от того, `user`, `paid_user`, `legislator`, `supervisor` или `admin`:

- `/account`
- `/account/billing`
- `/account/billing/checkout`
- `/account/notes`
- `/account/saved`
- `/legislator-cabinet`

Примечание: `/legislator-cabinet` требует логин, но не является жестко legislator-only. Не-`legislator` пользователь попадает на ограниченный сценарий внутри страницы.

### Только для legislator или admin

- `/legislator-cabinet/[proposalId]`

Это единственный маршрут, который сейчас явно защищен как детальный legislator workflow.

### Только для supervisor или admin

- `/supervisor/dashboard`

Примечание: ограничение реализовано внутри страницы через `isSupervisor`, а не через общий `RouteAccessGate`.

### Только для admin

- `/admin`
- `/admin/access`
- `/admin/analytics`
- `/admin/api-center`
- `/admin/architecture`
- `/admin/audit`
- `/admin/billing`
- `/admin/codes`
- `/admin/email`
- `/admin/email/compose`
- `/admin/email/history`
- `/admin/email/settings`
- `/admin/email/templates`
- `/admin/help`
- `/admin/help/[slug]`
- `/admin/inbox`
- `/admin/project-page`
- `/admin/support`
- `/admin/users`
- `/admin/users/[id]`

### Только для paid_user

Отдельных страниц нет.

Текущая реализация показывает, что `paid_user` влияет на billing/quota-логику, но не открывает отдельный URL-раздел.

## Полный перечень страниц

| Route | Guest | User | Paid User | Lawmaker | Supervisor | Admin | Комментарий |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | Yes | Yes | Yes | Yes | Yes | Yes | Публичная главная |
| `/account` | No | Yes | Yes | Yes | Yes | Yes | Нужен логин |
| `/account/billing` | No | Yes | Yes | Yes | Yes | Yes | Нужен логин |
| `/account/billing/checkout` | No | Yes | Yes | Yes | Yes | Yes | Нужен логин |
| `/account/notes` | No | Yes | Yes | Yes | Yes | Yes | Нужен логин |
| `/account/saved` | No | Yes | Yes | Yes | Yes | Yes | Нужен логин |
| `/admin` | No | No | No | No | No | Yes | Только admin |
| `/admin/access` | No | No | No | No | No | Yes | Только admin |
| `/admin/analytics` | No | No | No | No | No | Yes | Только admin |
| `/admin/api-center` | No | No | No | No | No | Yes | Только admin |
| `/admin/architecture` | No | No | No | No | No | Yes | Только admin |
| `/admin/audit` | No | No | No | No | No | Yes | Только admin |
| `/admin/billing` | No | No | No | No | No | Yes | Только admin |
| `/admin/codes` | No | No | No | No | No | Yes | Только admin |
| `/admin/email` | No | No | No | No | No | Yes | Только admin |
| `/admin/email/compose` | No | No | No | No | No | Yes | Только admin |
| `/admin/email/history` | No | No | No | No | No | Yes | Только admin |
| `/admin/email/settings` | No | No | No | No | No | Yes | Только admin |
| `/admin/email/templates` | No | No | No | No | No | Yes | Только admin |
| `/admin/help` | No | No | No | No | No | Yes | Только admin |
| `/admin/help/[slug]` | No | No | No | No | No | Yes | Только admin |
| `/admin/inbox` | No | No | No | No | No | Yes | Только admin |
| `/admin/project-page` | No | No | No | No | No | Yes | Только admin |
| `/admin/support` | No | No | No | No | No | Yes | Только admin |
| `/admin/users` | No | No | No | No | No | Yes | Только admin |
| `/admin/users/[id]` | No | No | No | No | No | Yes | Только admin |
| `/analysis` | Yes | Yes | Yes | Yes | Yes | Yes | Публичная |
| `/analysis/laws/[id]` | Yes | Yes | Yes | Yes | Yes | Yes | Публичная |
| `/assistant` | Yes | Yes | Yes | Yes | Yes | Yes | Публичная, часть UX лучше для авторизованных |
| `/auth` | Yes | Yes | Yes | Yes | Yes | Yes | Публичная |
| `/auth/forgot-password` | Yes | Yes | Yes | Yes | Yes | Yes | Публичная |
| `/auth/login` | Yes | Yes | Yes | Yes | Yes | Yes | Публичная |
| `/auth/register` | Yes | Yes | Yes | Yes | Yes | Yes | Публичная |
| `/auth/reset-password` | Yes | Yes | Yes | Yes | Yes | Yes | Публичная |
| `/changes` | Yes | Yes | Yes | Yes | Yes | Yes | Публичная |
| `/docs` | Yes | Yes | Yes | Yes | Yes | Yes | Публичная |
| `/graph` | Yes | Yes | Yes | Yes | Yes | Yes | Публичная |
| `/help` | Yes | Yes | Yes | Yes | Yes | Yes | Публичная |
| `/help/[slug]` | Yes | Yes | Yes | Yes | Yes | Yes | Публичная |
| `/laws` | Yes | Yes | Yes | Yes | Yes | Yes | Публичная |
| `/laws/[id]` | Yes | Yes | Yes | Yes | Yes | Yes | Публичная |
| `/laws/[id]/articles/[num]` | Yes | Yes | Yes | Yes | Yes | Yes | Публичная |
| `/legal` | Yes | Yes | Yes | Yes | Yes | Yes | Публичная |
| `/legislator-cabinet` | No | Yes | Yes | Yes | Yes | Yes | Нужен логин, без жесткого legislator-only gate |
| `/legislator-cabinet/[proposalId]` | No | No | No | Yes | No | Yes | Только legislator или admin |
| `/project-info` | Yes | Yes | Yes | Yes | Yes | Yes | Публичная |
| `/radiant` | Yes | Yes | Yes | Yes | Yes | Yes | Публичная |
| `/roadmap` | Yes | Yes | Yes | Yes | Yes | Yes | Публичная |
| `/roles/admin` | Yes | Yes | Yes | Yes | Yes | Yes | Публичная role landing page |
| `/roles/guest` | Yes | Yes | Yes | Yes | Yes | Yes | Публичная role landing page |
| `/roles/lawmaker` | Yes | Yes | Yes | Yes | Yes | Yes | Публичная role landing page |
| `/roles/supervisor` | Yes | Yes | Yes | Yes | Yes | Yes | Публичная role landing page |
| `/roles/user` | Yes | Yes | Yes | Yes | Yes | Yes | Публичная role landing page |
| `/search` | Yes | Yes | Yes | Yes | Yes | Yes | Публичная |
| `/search/results` | Yes | Yes | Yes | Yes | Yes | Yes | Публичная |
| `/subjects` | Yes | Yes | Yes | Yes | Yes | Yes | Публичная |
| `/subjects/[id]` | Yes | Yes | Yes | Yes | Yes | Yes | Публичная |
| `/supervisor/dashboard` | Yes* | Yes* | Yes* | Yes* | Yes | Yes | URL публичен, но контент реально только для supervisor/admin |
| `/support` | Yes | Yes | Yes | Yes | Yes | Yes | Публичная |

## Что это значит для бизнеса и продукта

1. Роли `legislator`, `supervisor` и `paid_user` уже частично заведены в системе, но маршрутизация пока не полностью выстроена вокруг них.
2. `Supervisor` уже появился в модели и имеет свой dashboard route, но доступ к нему реализован не через единый глобальный RBAC-gate, а локально внутри страницы.
3. `Paid User` пока больше похож на billing-tier, чем на отдельную навигационную роль с собственными страницами.
4. Ролевые landing pages уже существуют для всех 5 ролей, и это хорошо совпадает с вашим MVP-4 ТЗ.
5. Если дальше делать полноценную матрицу доступа, то логично будет выровнять frontend route-guards и backend RBAC по одной общей схеме.

## Что сейчас отсутствует

- Нет страниц, доступных только `paid_user`.
- Нет отдельного закрытого раздела для `supervisor`, кроме `/supervisor/dashboard`.
- Нет единой централизованной route-matrix, где `user`, `paid_user`, `legislator`, `supervisor`, `admin` обрабатываются одинаково и прозрачно.
- Нет отдельного гостевого-only сценария по URL.

## Рекомендация для следующего шага

Следующим документом имеет смысл собрать уже не просто список страниц, а полную `RBAC matrix`:

- route
- кто видит URL
- кто видит контент
- кто может читать данные
- кто может создавать
- кто может редактировать
- кто может модерировать

Это даст готовую основу под backlog для frontend, backend, QA и PM.
