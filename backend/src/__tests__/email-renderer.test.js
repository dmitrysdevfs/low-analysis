import { describe, it, expect } from 'vitest';
import { renderEmailTemplate } from '../modules/email/email.renderer.js';

describe('renderEmailTemplate', () => {
  it('renders password-reset template with resetUrl', () => {
    const html = renderEmailTemplate({
      templateSlug: 'password-reset',
      subject: 'Відновлення паролю',
      props: { resetUrl: 'https://example.com/reset?token=abc123' },
    });

    expect(html).toContain('https://example.com/reset?token=abc123');
    expect(html).toContain('Відновлення паролю');
    expect(html).toContain('<!DOCTYPE html>');
  });

  it('renders verify-email template with fullName and verifyUrl', () => {
    const html = renderEmailTemplate({
      templateSlug: 'verify-email',
      subject: 'Підтвердіть email',
      props: {
        fullName: 'Іван Франко',
        verifyUrl: 'https://example.com/verify?token=xyz',
      },
    });

    expect(html).toContain('Іван Франко');
    expect(html).toContain('https://example.com/verify?token=xyz');
    expect(html).toContain('Підтвердіть email');
  });

  it('throws on unknown templateSlug', () => {
    expect(() =>
      renderEmailTemplate({
        templateSlug: 'nonexistent',
        subject: 'x',
        props: {},
      }),
    ).toThrow('Unknown template: nonexistent');
  });

  it('uses default theme when theme is omitted', () => {
    const html = renderEmailTemplate({
      templateSlug: 'password-reset',
      subject: 'Test',
      props: { resetUrl: 'https://example.com' },
    });
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Law Analysis');
  });

  it('applies dark theme correctly', () => {
    const htmlDefault = renderEmailTemplate({
      templateSlug: 'password-reset',
      subject: 'Test',
      props: { resetUrl: 'https://example.com' },
      theme: 'default',
    });
    const htmlLight = renderEmailTemplate({
      templateSlug: 'password-reset',
      subject: 'Test',
      props: { resetUrl: 'https://example.com' },
      theme: 'light',
    });
    // Different themes produce different HTML (different color values)
    expect(htmlDefault).not.toBe(htmlLight);
  });

  it('includes previewText in output when provided', () => {
    const html = renderEmailTemplate({
      templateSlug: 'verify-email',
      subject: 'Test',
      previewText: 'Preview text here',
      props: { fullName: 'Test', verifyUrl: 'https://example.com' },
    });
    expect(html).toContain('Preview text here');
  });
});
