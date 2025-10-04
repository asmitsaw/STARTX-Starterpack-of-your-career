import React, { useEffect, useState } from 'react';
import { useThemeMode } from '../../contexts/ThemeContext.jsx';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';

export function AnimatedThemeToggler() {
  const { isDark, toggleTheme } = useThemeMode();
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <motion.button
      onClick={toggleTheme}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-startx-400 to-startx-600 text-white shadow-lg hover:shadow-startx-500/25"
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <motion.div
          initial={{ rotate: -45, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 45, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Sun size={18} />
        </motion.div>
      ) : (
        <motion.div
          initial={{ rotate: 45, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: -45, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Moon size={18} />
        </motion.div>
      )}
    </motion.button>
  );
}

export default AnimatedThemeToggler;