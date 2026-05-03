import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Box, Button, MenuRoot, MenuTrigger, MenuContent, MenuItem } from '@chakra-ui/react';
import { Palette, Moon, Sun, Monitor, MonitorSmartphone } from 'lucide-react';

const ThemeSwitcher: React.FC = () => {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch by only rendering after mount
    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return <Box w="40px" h="40px" />; // Placeholder to prevent layout shift
    }

    const getCurrentIcon = () => {
        if (theme === 'system') return <MonitorSmartphone size={20} />;
        if (theme === 'light') return <Sun size={20} />;
        if (theme === 'midnight') return <Moon size={20} />;
        if (theme === 'cyberpunk') return <Monitor size={20} />;
        return <Palette size={20} />; // fallback for 'dark' or others
    };

    return (
        <MenuRoot positioning={{ placement: "bottom-end" }}>
            <MenuTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    aria-label="Toggle Theme"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    w="40px"
                    h="40px"
                    p={0}
                    color="var(--text-primary)"
                    _hover={{ bg: "var(--terminal-border)" }}
                >
                    {getCurrentIcon()}
                </Button>
            </MenuTrigger>
            <MenuContent 
                bg="var(--terminal-card)" 
                border="1px solid" 
                borderColor="var(--terminal-border)"
                shadow="lg"
                zIndex={9999}
            >
                <MenuItem value="light" onClick={() => setTheme('light')} _hover={{ bg: "var(--terminal-border)" }} color="var(--text-primary)">
                    <Sun size={16} style={{ marginRight: '8px' }} /> Light Mode
                </MenuItem>
                <MenuItem value="dark" onClick={() => setTheme('dark')} _hover={{ bg: "var(--terminal-border)" }} color="var(--text-primary)">
                    <Palette size={16} style={{ marginRight: '8px' }} /> Default Dark
                </MenuItem>
                <MenuItem value="midnight" onClick={() => setTheme('midnight')} _hover={{ bg: "var(--terminal-border)" }} color="var(--text-primary)">
                    <Moon size={16} style={{ marginRight: '8px' }} /> Midnight Blue
                </MenuItem>
                <MenuItem value="cyberpunk" onClick={() => setTheme('cyberpunk')} _hover={{ bg: "var(--terminal-border)" }} color="var(--text-primary)">
                    <Monitor size={16} style={{ marginRight: '8px' }} /> Cyberpunk
                </MenuItem>
                <MenuItem value="system" onClick={() => setTheme('system')} _hover={{ bg: "var(--terminal-border)" }} color="var(--text-primary)">
                    <MonitorSmartphone size={16} style={{ marginRight: '8px' }} /> System Settings
                </MenuItem>
            </MenuContent>
        </MenuRoot>
    );
};

export default ThemeSwitcher;
