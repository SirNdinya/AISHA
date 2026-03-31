import React, { useState, useEffect } from 'react';
import { IconButton } from '@chakra-ui/react';
import { FaMobileAlt, FaDesktop } from 'react-icons/fa';
import { Tooltip } from './ui/tooltip';

/**
 * Mobile View Toggle Component
 * 
 * Allows users to toggle between desktop and mobile preview modes.
 * Useful for testing responsive design and previewing mobile experience.
 */
const MobileViewToggle: React.FC = () => {
    const [isMobileView, setIsMobileView] = useState(false);

    useEffect(() => {
        // Load saved preference from localStorage
        const savedView = localStorage.getItem('mobileViewEnabled');
        if (savedView === 'true') {
            setIsMobileView(true);
            enableMobileView();
        }
    }, []);

    const enableMobileView = () => {
        // Add mobile viewport meta tag
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.setAttribute('name', 'viewport');
            document.head.appendChild(viewport);
        }
        viewport.setAttribute('content', 'width=375, initial-scale=1, maximum-scale=1');

        // Add mobile view class to body
        document.body.classList.add('mobile-preview');

        // Apply mobile styles
        document.body.style.maxWidth = '375px';
        document.body.style.margin = '0 auto';
        document.body.style.boxShadow = '0 0 20px rgba(0,0,0,0.2)';
    };

    const disableMobileView = () => {
        // Reset viewport
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1');
        }

        // Remove mobile view class
        document.body.classList.remove('mobile-preview');

        // Reset styles
        document.body.style.maxWidth = '';
        document.body.style.margin = '';
        document.body.style.boxShadow = '';
    };

    const toggleMobileView = () => {
        const newState = !isMobileView;
        setIsMobileView(newState);

        // Save preference
        localStorage.setItem('mobileViewEnabled', String(newState));

        // Apply or remove mobile view
        if (newState) {
            enableMobileView();
        } else {
            disableMobileView();
        }
    };

    return (
        <Tooltip
            content={isMobileView ? 'Switch to Desktop View' : 'Switch to Mobile View'}
            positioning={{ placement: 'bottom' }}
        >
            <IconButton
                aria-label={isMobileView ? 'Desktop View' : 'Mobile View'}
                onClick={toggleMobileView}
                colorPalette={isMobileView ? 'blue' : 'gray'}
                variant={isMobileView ? 'solid' : 'ghost'}
                size="md"
            >
                {isMobileView ? <FaDesktop /> : <FaMobileAlt />}
            </IconButton>
        </Tooltip>
    );
};

export default MobileViewToggle;
