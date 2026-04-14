// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

process.env.REACT_APP_BASE_URL = 'http://localhost:5000';
process.env.REACT_APP_PAYPAL_CLIENT_ID = 'test-sandbox-client-id';
