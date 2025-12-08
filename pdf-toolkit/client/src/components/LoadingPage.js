import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LoadingPage = () => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Start exit animation after 1.5 seconds
        const timer = setTimeout(() => {
            setIsExiting(true);
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="fixed inset-0 z-[9999] overflow-hidden bg-gradient-to-br from-primary-600 via-primary to-primary-800">
            {/* Left Panel - Slides left on exit */}
            <motion.div
                initial={{ x: 0 }}
                animate={{ x: isExiting ? '-100%' : 0 }}
                transition={{
                    duration: 0.8,
                    ease: [0.68, -0.55, 0.265, 1.55],
                    delay: 0.3
                }}
                className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-primary-600 to-primary-800"
            />

            {/* Right Panel - Slides right on exit */}
            <motion.div
                initial={{ x: 0 }}
                animate={{ x: isExiting ? '100%' : 0 }}
                transition={{
                    duration: 0.8,
                    ease: [0.68, -0.55, 0.265, 1.55],
                    delay: 0.3
                }}
                className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-br from-primary to-primary-800"
            />

            {/* Content - Centered, fades out before split */}
            <AnimatePresence>
                {!isExiting && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ zIndex: 10 }}
                    >
                        <div className="text-center">
                            {/* Logo */}
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                className="mb-8"
                            >
                                <div className="text-6xl md:text-7xl font-black text-secondary-50 tracking-wide">
                                    PDF
                                </div>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                                    className="text-6xl md:text-7xl font-black text-white tracking-wide"
                                >
                                    SWIFT
                                </motion.div>
                            </motion.div>

                            {/* Spinner */}
                            <div className="relative w-20 h-20 mx-auto">
                                {/* Outer Ring - Pulse */}
                                <motion.div
                                    animate={{
                                        scale: [1, 1.1, 1],
                                        opacity: [1, 0.5, 1]
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: 'easeInOut'
                                    }}
                                    className="absolute inset-0 rounded-full border-4 border-secondary-200/20"
                                />

                                {/* Spinning Circle */}
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{
                                        duration: 1,
                                        repeat: Infinity,
                                        ease: 'linear'
                                    }}
                                    className="absolute top-2 left-2 w-16 h-16 rounded-full border-4 border-transparent border-t-secondary-50 border-r-secondary-50"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LoadingPage;
