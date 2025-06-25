import React from 'react';
import { render, screen } from '@testing-library/react';
import AdminPage from '../admin/page';

jest.mock('../actions', () => ({
  sendTestEmail: jest.fn()
}));

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(async () => ({ user: { email: 'test@example.com' } }))
}));

jest.mock('@/lib/db', () => ({
  getDatabaseInfo: jest.fn(async () => ({
    host: 'localhost',
    database: 'testdb',
    userCount: 1,
    eventCount: 2,
    productCount: 3
  }))
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn()
}));

jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

describe('AdminPage', () => {
  it('renders database information', async () => {
    const result = await AdminPage();
    render(result as React.ReactElement);

    expect(screen.getByText('Database')).toBeInTheDocument();
    const host = screen.getByText(/Host:/).parentElement as HTMLElement;
    expect(host).toHaveTextContent('Host: localhost');
    const db = screen.getByText(/Database:/).parentElement as HTMLElement;
    expect(db).toHaveTextContent('Database: testdb');
    const users = screen.getByText(/Users:/).parentElement as HTMLElement;
    expect(users).toHaveTextContent('Users: 1');
    const events = screen.getByText(/Events:/).parentElement as HTMLElement;
    expect(events).toHaveTextContent('Events: 2');
    const products = screen.getByText(/Products:/).parentElement as HTMLElement;
    expect(products).toHaveTextContent('Products: 3');
  });
});
