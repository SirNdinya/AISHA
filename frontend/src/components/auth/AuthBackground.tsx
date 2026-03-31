import React, { useEffect, useRef } from 'react';
import { Box, useToken } from '@chakra-ui/react';
import { motion, useAnimation } from 'framer-motion';

const AuthBackground: React.FC<{ themeColor: string; portal?: string | null }> = ({ themeColor, portal }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [color500] = useToken('colors', [themeColor])

    const getBgImage = () => {
        switch (portal) {
            case 'student': return '/assets/images/student_aisha.png';
            case 'company': return '/assets/images/company_bg.png';
            case 'institution': return '/assets/images/student_aisha.png';
            case 'admin': return '/assets/images/admin_aisha.png';
            default: return '/assets/images/student_aisha.png'; // Fallback
        }
    };

    const bgImage = getBgImage();

    // Particle Animation Logic
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        class Particle {
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;
            opacity: number;

            constructor() {
                this.x = Math.random() * canvas!.width;
                this.y = Math.random() * canvas!.height;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = Math.random() * 0.5 - 0.25;
                this.speedY = Math.random() * 0.5 - 0.25;
                this.opacity = Math.random() * 0.5 + 0.1;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;

                if (this.x > canvas!.width) this.x = 0;
                if (this.x < 0) this.x = canvas!.width;
                if (this.y > canvas!.height) this.y = 0;
                if (this.y < 0) this.y = canvas!.height;
            }

            draw() {
                if (!ctx) return;
                ctx.fillStyle = color500 || 'rgba(255, 255, 255, 0.5)';
                ctx.globalAlpha = this.opacity;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const init = () => {
            particles = [];
            for (let i = 0; i < 100; i++) {
                particles.push(new Particle());
            }
        };

        const animate = () => {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw connecting lines
            for (let i = 0; i < particles.length; i++) {
                for (let j = i; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 100) {
                        ctx.beginPath();
                        ctx.strokeStyle = color500 || 'rgba(255,255,255,0.1)';
                        ctx.globalAlpha = (100 - distance) / 1000; // Faint lines
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });
            animationFrameId = requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        init();
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, [themeColor, color500]);


    return (
        <Box
            position="absolute"
            top={0}
            left={0}
            w="full"
            h="full"
            zIndex={0}
            overflow="hidden"
            bg="gray.900" // Fallback dark background
        >
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5 }}
                style={{ width: '100%', height: '100%' }}
            >
                {/* High-Quality Background Image with subtle panning */}
                <motion.div
                    initial={{ scale: 1.05 }}
                    animate={{
                        scale: [1.05, 1.1, 1.05],
                        x: [0, -5, 0],
                        y: [0, -2, 0]
                    }}
                    transition={{
                        duration: 25,
                        repeat: Infinity,
                        ease: "linear"
                    } as any}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        zIndex: -2,
                        backgroundImage: `url(${bgImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center 30%',
                    }}
                />

                {/* Dark Overlay for Readability - Lightened for Branding Visibility */}
                <Box
                    position="absolute"
                    top={0}
                    left={0}
                    w="full"
                    h="full"
                    bg="blackAlpha.600"
                    zIndex={-1}
                    backdropFilter="blur(3px)" // Reduced blur to keep the logo clear
                />

                {/* Gradient Mesh Layers */}
                <motion.div
                    animate={{
                        x: [0, 50, -50, 0],
                        y: [0, -30, 30, 0],
                        scale: [1, 1.1, 0.9, 1]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" } as any}
                    style={{
                        position: 'absolute',
                        top: '-20%',
                        left: '-20%',
                        width: '80%',
                        height: '80%',
                        background: `radial-gradient(circle, ${themeColor || 'blue.900'}, transparent)`,
                        opacity: 0.3,
                        filter: 'blur(80px)',
                        zIndex: 0
                    }}
                />
                <motion.div
                    animate={{
                        x: [0, -40, 40, 0],
                        y: [0, 40, -40, 0],
                        scale: [1, 1.2, 0.8, 1]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" } as any}
                    style={{
                        position: 'absolute',
                        bottom: '-20%',
                        right: '-20%',
                        width: '80%',
                        height: '80%',
                        background: `radial-gradient(circle, ${themeColor ? themeColor.replace('500', '800') : 'purple.900'}, transparent)`,
                        opacity: 0.2,
                        filter: 'blur(100px)',
                        zIndex: 0
                    }}
                />

                {/* Noise Texture */}
                <Box
                    position="absolute"
                    top={0}
                    left={0}
                    w="full"
                    h="full"
                    opacity={0.03}
                    pointerEvents="none"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    }}
                />

                <canvas
                    ref={canvasRef}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0.6
                    }}
                />
            </motion.div>
        </Box>
    );
};

export default AuthBackground;
