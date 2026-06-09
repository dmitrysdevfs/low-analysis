import { THEMES } from './themes.js';
import { emailShell } from './shell.js';
import { broadcastTemplate } from './templates/broadcast.js';
import { maintenanceTemplate } from './templates/maintenance.js';
import { productUpdateTemplate } from './templates/product-update.js';

const TEMPLATE_MAP = {
  broadcast: broadcastTemplate,
  maintenance: maintenanceTemplate,
  'product-update': productUpdateTemplate,
};

export function renderEmailTemplate({ templateSlug, theme = 'default', subject, previewText, props }) {
  const themeObj = THEMES[theme] || THEMES.default;
  const templateFn = TEMPLATE_MAP[templateSlug];
  if (!templateFn) throw new Error(`Unknown template: ${templateSlug}`);
  const content = templateFn(props);
  return emailShell({ theme: themeObj, content, subject, previewText });
}
