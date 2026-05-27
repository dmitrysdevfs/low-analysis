// On Windows the command line length limit is ~8191 chars.
// Passing 100+ file paths to prettier in one command exceeds that limit.
// Using functions that return static commands (format the whole workspace)
// avoids the issue while still only running on commits that touch those files.
export default {
  "backend/src/**/*.js": () => [
    'npx prettier --write "backend/src/**/*.js"',
    'npx eslint --fix --config backend/eslint.config.js "backend/src"',
  ],
  "frontend/src/**/*.{ts,tsx}": () => [
    'npx prettier --write --cache "frontend/src/**/*.{ts,tsx}"',
    'npm --prefix frontend run lint -- --fix "src"',
  ],
  "frontend/src/**/*.{css,scss,json}": () =>
    'npx prettier --write "frontend/src/**/*.{css,scss,json}"',
};
