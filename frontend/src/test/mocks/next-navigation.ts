import { vi } from 'vitest';

let pathname = '/';
let params: Record<string, string> = {};
let searchParams = '';

const router = {
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
  push: vi.fn((href: string) => updateNavigationState(href)),
  refresh: vi.fn(),
  replace: vi.fn((href: string) => updateNavigationState(href)),
};

function updateNavigationState(href: string) {
  const url = new URL(href, 'https://codex.test');
  pathname = url.pathname;
  searchParams = url.searchParams.toString();
}

export function setMockPathname(value: string) {
  pathname = value;
}

export function setMockParams(value: Record<string, string>) {
  params = value;
}

export function setMockSearchParams(value: string | Record<string, string | string[] | undefined>) {
  if (typeof value === 'string') {
    searchParams = value.startsWith('?') ? value.slice(1) : value;
    return;
  }

  const nextSearchParams = new URLSearchParams();

  for (const [key, rawValue] of Object.entries(value)) {
    if (rawValue === undefined) {
      continue;
    }

    if (Array.isArray(rawValue)) {
      rawValue.forEach(item => nextSearchParams.append(key, item));
      continue;
    }

    nextSearchParams.set(key, rawValue);
  }

  searchParams = nextSearchParams.toString();
}

export function getRouterMock() {
  return router;
}

export function resetNavigationMocks() {
  pathname = '/';
  params = {};
  searchParams = '';
}

export function usePathname() {
  return pathname;
}

export function useParams<T extends Record<string, string>>() {
  return params as T;
}

export function useRouter() {
  return router;
}

export function useSearchParams() {
  return new URLSearchParams(searchParams);
}
