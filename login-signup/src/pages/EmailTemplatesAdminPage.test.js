import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmailTemplatesAdminPage from './EmailTemplatesAdminPage';

jest.mock('../AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'admin@test.com' },
    token: 'fake-token',
  }),
}));

global.fetch = jest.fn();

describe('EmailTemplatesAdminPage', () => {
  beforeEach(() => {
    fetch.mockReset();
  });

  function setup() {
    render(<EmailTemplatesAdminPage />);
    const button = screen.getByRole('button', { name: /send \/ queue now/i });
    return { button };
  }

  test('disables send button when required fields are missing', () => {
    const { button } = setup();
    expect(button).toBeDisabled();
  });

  test('queues welcome email with correct payload', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'task-1' }),
    });

    setup();

    fireEvent.change(screen.getByPlaceholderText(/recipient@gmail.com/i), {
      target: { value: 'recipient@gmail.com' },
    });

    fireEvent.change(screen.getByPlaceholderText(/vansh/i), {
      target: { value: 'Vansh' },
    });

    fireEvent.change(screen.getByPlaceholderText(/auth service/i), {
      target: { value: 'Auth Service' },
    });

    // welcome template requires username/password
    fireEvent.change(screen.getByPlaceholderText(/username/i), {
      target: { value: 'vansh' },
    });

    // placeholder text for password in the UI is "password"
    fireEvent.change(screen.getByPlaceholderText('password'), {
      target: { value: 'pass123' },
    });

    const button = screen.getByRole('button', { name: /send \/ queue now/i });

    // If the button is still disabled in test env, the click won't happen.
    // For this contract test, require that inputs enable the button.
    expect(button).not.toBeDisabled();

    fireEvent.click(button);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    const [url, opts] = fetch.mock.calls[0];
    expect(url).toMatch(/\/tasks$/);
    expect(opts.method).toBe('POST');

    const body = JSON.parse(opts.body);
    expect(body.type).toBe('send-email');
    expect(body.payload.email).toBe('recipient@gmail.com');
    expect(body.payload.template).toBe('welcome');
    expect(body.payload.templateData).toMatchObject({
      name: 'Vansh',
      siteName: 'Auth Service',
      username: 'vansh',
      password: 'pass123',
    });
  });

  test('requires resetLink for forgotPassword', async () => {
    setup();

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'forgotPassword' },
    });

    fireEvent.change(screen.getByPlaceholderText(/recipient@gmail.com/i), {
      target: { value: 'recipient@gmail.com' },
    });

    fireEvent.change(screen.getByPlaceholderText(/vansh/i), {
      target: { value: 'Vansh' },
    });

    fireEvent.change(screen.getByPlaceholderText(/auth service/i), {
      target: { value: 'Auth Service' },
    });

    const button = screen.getByRole('button', { name: /send \/ queue now/i });
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText(/reset-password\?token=\.\.\./i), {
      target: { value: 'https://example.com/reset?token=1' },
    });

    expect(button).not.toBeDisabled();
  });
});

