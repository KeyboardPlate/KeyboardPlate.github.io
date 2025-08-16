import { render, screen } from '@testing-library/react';
import App from './App';

test('渲染学习React链接', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
