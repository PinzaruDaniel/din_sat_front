import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { AuthContext } from '../../src/presentation/features/auth/AuthContext.js';
import { AuthPage } from '../../src/presentation/features/auth/AuthPage.jsx';
function setup(auth, registering = false) {
  return render(
    <MemoryRouter>
      <AuthContext value={{ user: null, ...auth }}>
        <AuthPage registering={registering} />
      </AuthContext>
    </MemoryRouter>,
  );
}
describe('authentication form', () => {
  it('validates fields and does not send invalid credentials', async () => {
    const login = vi.fn();
    setup({ login });
    await userEvent.click(
      screen.getByRole('button', { name: 'Intră în cont' }),
    );
    expect(screen.getByText('Introdu un email valid.')).toBeVisible();
    expect(login).not.toHaveBeenCalled();
  });
  it('shows server errors while retaining the email and password', async () => {
    const login = vi
      .fn()
      .mockRejectedValue(new Error('Emailul sau parola nu este corectă.'));
    setup({ login });
    await userEvent.type(
      screen.getByLabelText('Adresa de email'),
      'ana@example.md',
    );
    await userEvent.type(
      screen.getByLabelText('Parola', { exact: true }),
      'incorrect-password',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Intră în cont' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Emailul sau parola',
    );
    expect(screen.getByLabelText('Adresa de email')).toHaveValue(
      'ana@example.md',
    );
    expect(login).toHaveBeenCalledWith({
      email: 'ana@example.md',
      password: 'incorrect-password',
    });
  });
  it('lets users choose producer registration and reveal the password', async () => {
    setup({ register: vi.fn() }, true);
    await userEvent.click(
      screen.getByRole('button', { name: /Sunt producător/ }),
    );
    expect(screen.getByLabelText('Numele gospodăriei')).toBeVisible();
    const password = screen.getByLabelText('Parola', { exact: true });
    expect(password).toHaveAttribute('type', 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Arată parola' }));
    expect(password).toHaveAttribute('type', 'text');
  });
});
