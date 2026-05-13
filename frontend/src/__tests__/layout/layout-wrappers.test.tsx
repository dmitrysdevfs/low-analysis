import React from 'react';
import { render, screen } from '@testing-library/react';
import RootLayout, { metadata } from '@/app/layout';
import Header from '@/layout/Header/Header';

vi.mock('@/components/AppHeader', () => ({
  AppHeader: () => <div>Mock AppHeader</div>,
}));

describe('frontend layout wrappers', () => {
  it('renders Header through the AppHeader wrapper', () => {
    render(<Header />);
    expect(screen.getByText('Mock AppHeader')).toBeInTheDocument();
  });

  it('exports root metadata and html shell structure', () => {
    expect(metadata.title).toBe('Low Analysis');
    expect(metadata.description).toContain('Ukrainian legislation');

    const tree = RootLayout({
      children: <span>Дитина</span>,
    }) as React.ReactElement;

    expect(tree.type).toBe('html');
    expect(tree.props.lang).toBe('uk');

    const body = tree.props.children as React.ReactElement;
    expect(body.type).toBe('body');
  });
});
