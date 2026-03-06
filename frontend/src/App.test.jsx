import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, test } from 'vitest';
import App from './App';

test('App renders correctly', () => {
    const { container } = render(
        <MemoryRouter>
            <App />
        </MemoryRouter>
    );

    const mainDiv = container.querySelector('.app');
    expect(mainDiv).toBeInTheDocument();
});