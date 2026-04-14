import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

beforeEach(() => {
  window.paypal = {
    Buttons: {
      driver: (_framework, { React }) =>
        function MockPayPalButtons() {
          return React.createElement('div', { 'data-testid': 'paypal-buttons' }, 'PayPal');
        },
    },
  };
});

afterEach(() => {
  delete window.paypal;
});

test('renders PayPal checkout when SDK is available', () => {
  render(
    <MemoryRouter initialEntries={['/checkout?method=_deposit&amount=10.00']}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByTestId('paypal-buttons')).toBeInTheDocument();
});

test('shows URL hint when method query param is missing', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByText(/Add checkout parameters/i)).toBeInTheDocument();
  expect(screen.queryByTestId('paypal-buttons')).not.toBeInTheDocument();
});

test('withdraw without payee email does not render the PayPal button', () => {
  render(
    <MemoryRouter initialEntries={['/?method=_withdraw&amount=5.00']}>
      <App />
    </MemoryRouter>
  );
  expect(screen.queryByTestId('paypal-buttons')).not.toBeInTheDocument();
  expect(screen.getByText(/payee email/i)).toBeInTheDocument();
});
