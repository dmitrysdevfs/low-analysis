# Project Architecture — Low Analysis

## Purpose
A product to parse, ingest, analyze and explore legal texts (laws) with optional LLM enrichment for subject extraction and summarization.

## Users
- Analysts / legal researchers
- Admin users / data curators

## High-level Flows
1. Ingest raw HTML from external sources
2. Parse into structured legal tree (chapters, articles, parts)
3. Persist structured data in MongoDB
4. Run analyses (statistical metrics, subject extraction)
5. Enrich content via LLM pipeline (SRL / subject tagging)
6. Serve data via REST API and Next.js UI

## Backend
- API & Routing: Express REST endpoints for laws, elements, subjects; OpenAPI/Swagger documentation.
- Services: layered services implement business logic (parserService, lawService, subjectService, statisticalAnalysisService, batchAnalysisService).
- LLM Adapter: `llmService` provides provider-agnostic calls with retry and rate-limit behavior (Gemini / Ollama / OpenAI interchangeable).
- Data Access: Mongoose models and repository helpers for Law, Element, Subject; bulk upserts and deduplication logic.
- Tests: Unit/integration tests (Vitest) for controllers and services.

## Frontend
- Framework: Next.js + React + TailwindCSS.
- App Shell: top-level layout, auth provider, route guards.
- Pages & Components: search, law tree viewer, account/admin screens, reusable UI components.
- State & Auth: client-side auth provider and session storage; frontend flows implemented for login/register.
- Billing: billing UI with local/mock flows; backend billing integration partial.
- Tests: component and e2e test support.

## Core Features
- Parsing & Ingestion: `fetchService` + `parserService` extract hierarchical elements and metadata.
- Search & Navigation: API filters and frontend navigation for finding laws and articles.
- Subject Extraction: SRL pipeline calling LLMs to tag elements with subjects; deduplication via subject repository.
- Statistical Analysis: services compute distributional metrics and persist aggregated stats.

## AI / LLM Pipeline
- Providers supported: Gemini (via @google/genai), Ollama, OpenAI (config-driven).
- Pipeline: per-element SRL analysis, normalization, and subject upsert; batch orchestration with rate-limiting.
- Status: partial — experimental pipeline works but needs production hardening and monitoring.

## Integrations
- External Law Source: scraping `zakon.rada.gov.ua` for law HTML (primary ingestion source).
- LLM Providers: configurable via env; adapter isolates provider differences.
- CI: GitHub Actions run linting, tests, and frontend checks.

## Infrastructure
- Local dev: Docker Compose (backend, frontend, MongoDB volumes).
- Database: MongoDB (local or Atlas) with indexes for users and domain entities.
- Deployment: hints at Render or containerized hosts; CI pipelines present but deployment automation partial.
- Developer Tooling: Husky, lint-staged, Prettier, and test runners for pre-push checks.

## Data & ETL
- Raw Storage: repo contains raw HTML corpus for reproducibility.
- Scripts: Python utilities and migration scripts for bulk loads and transformations.
- Migrations: services implement safe upserts and delete-orphaned-elements flows.

## Observability & Docs
- API docs available via Swagger UI.
- Project README and AI implementation plan document architecture and roadmap.
- Logging and retries present; formal monitoring/caching is planned.

## Security & Ops Notes
- Secrets: JWT secret and LLM API keys loaded from environment; review required for production.
- Auth: frontend auth flows implemented; backend auth endpoints require stabilization for production use.

## Status Summary
- Implemented: core parsing, storage, REST API, frontend shell, tests, Docker Compose, CI checks.
- Partial: LLM enrichment pipeline, auth end-to-end, billing backend, deployment automation, caching & monitoring.
- Planned: external KB integration, production-grade LLM orchestration, caching layer, full billing integration.

## Next Recommended Steps
1. Harden LLM pipeline: add monitoring, circuit-breaker, and cost controls.
2. Stabilize backend auth and connect frontend auth to secured endpoints.
3. Implement production deployment workflows and secrets management.
4. Add caching layer for heavy read endpoints (law trees, article content).
5. Integrate monitoring/alerting and observability dashboards.

---
Generated: May 26, 2026
