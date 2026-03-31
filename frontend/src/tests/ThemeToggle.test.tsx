import { render, screen, fireEvent } from '@testing-library/react';
import ThemeToggle from '../components/common/ThemeToggle';
import { vi } from 'vitest';

// Mock useColorMode
vi.mock('../components/ui/color-mode', () => ({
    useColorMode: () => ({
        colorMode: 'light',
        toggleColorMode: vi.fn(),
    }),
}));

import { ChakraProvider } from '@chakra-ui/react';
import { system } from '../theme';

describe('ThemeToggle Component', () => {
    it('renders the theme toggle button', () => {
        render(
            <ChakraProvider value={system}>
                <ThemeToggle />
            </ChakraProvider>
        );
        const button = screen.getByLabelText(/toggle theme/i);
        expect(button).toBeDefined();
    });
});
