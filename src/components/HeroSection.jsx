
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Users } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";

const DotGrid = () => {
  return (
    <div
      style={{
        backgroundImage: "radial-gradient(circle at center, rgba(128, 128, 128, 0.2) 1px, transparent 1px)",
        backgroundSize: "30px 30px",
      }}
      className="absolute inset-0 h-full w-full"
    />
  );
};

export default function HeroSection() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { openAuthModal } = useAuth();

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black text-white">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <DotGrid />
        <motion.div
          className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-full blur-3xl opacity-50"
          animate={{
            x: mousePosition.x * 0.02,
            y: mousePosition.y * 0.02,
          }}
          transition={{ type: "spring", stiffness: 150, damping: 30 }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-gradient-to-r from-indigo-600/20 to-cyan-600/20 rounded-full blur-3xl opacity-50"
          animate={{
            x: mousePosition.x * -0.03,
            y: mousePosition.y * -0.03,
          }}
          transition={{ type: "spring", stiffness: 120, damping: 30 }}
        />
      </div>

      {/* Floating Icons with 3D effect */}
      <motion.div
        className="absolute top-1/4 left-1/4"
        style={{ perspective: "1000px" }}
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateX: [0, 20, 0], rotateY: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30"
        >
          <Sparkles className="w-8 h-8 text-white" />
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute top-1/3 right-1/4"
        style={{ perspective: "1000px" }}
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <motion.div
            style={{ transformStyle: "preserve-3d" }}
            animate={{ rotateX: [-15, 15, -15], rotateY: [15, -15, 15] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-2xl shadow-purple-500/30"
        >
          <Zap className="w-7 h-7 text-white" />
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute bottom-1/3 left-1/5"
        style={{ perspective: "1000px" }}
        animate={{ y: [0, -25, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      >
        <motion.div
            style={{ transformStyle: "preserve-3d" }}
            animate={{ rotateX: [10, -10, 10], rotateY: [-10, 10, -10] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-2xl shadow-cyan-500/30"
        >
          <Users className="w-6 h-6 text-white" />
        </motion.div>
      </motion.div>


      {/* Main Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 text-center px-4 max-w-5xl mx-auto"
      >
        <motion.div variants={itemVariants} className="mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-700 rounded-full text-blue-400 text-sm font-medium">
            <Sparkles className="w-4 h-4 text-blue-500" />
            Now in Dark Mode
          </span>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-50 mb-8 leading-tight"
        >
          Build the Future
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Together
          </span>
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-lg md:text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed"
        >
          Connect with talented professionals, showcase your skills, and discover opportunities 
          that match your passion. Join a community where innovation meets collaboration.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <motion.div
            whileHover={{ scale: 1.05, boxShadow: "0px 0px 30px rgba(99, 102, 241, 0.5)" }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <button 
              onClick={() => openAuthModal('signup')}
              className="btn-primary px-8 py-6 text-lg font-medium rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 group bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <button 
              className="btn-outline border-2 border-white/20 hover:border-white/30 text-gray-300 px-8 py-6 text-lg font-medium rounded-xl hover:bg-white/10 transition-all duration-300"
            >
              Watch Demo
            </button>
          </motion.div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="mt-16 text-sm text-gray-500"
        >
          Trusted by 10,000+ professionals worldwide
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 border-2 border-gray-600 rounded-full flex justify-center"
        >
          <div className="w-1 h-3 bg-gray-500 rounded-full mt-2"></div>
        </motion.div>
      </motion.div>
    </section>
  );
}
