import React from 'react';
import { IconButton } from '@chakra-ui/react';
import { useColorMode } from '../ui/color-mode';
import { FiSun, FiMoon } from 'react-icons/fi';

const ThemeToggle: React.FC = () => {
    const { colorMode, toggleColorMode } = useColorMode();

    return (
        <IconButton
            aria-label="Toggle Theme"
            onClick={toggleColorMode}
            variant="ghost"
            size="sm"
        >
            {colorMode === 'light' ? <FiMoon /> : <FiSun />}
        </IconButton>
    );
};

export default ThemeToggle;
