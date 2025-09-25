
import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Users, Briefcase, MessageSquare, Star, Shield, Zap } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Professional Profiles",
    description: "Create stunning profiles that showcase your skills, experience, and achievements with interactive elements.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Briefcase,
    title: "Smart Job Matching",
    description: "AI-powered matching connects you with opportunities that align perfectly with your skills and career goals.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: MessageSquare,
    title: "Dynamic Pitches",
    description: "Present your ideas with interactive pitch decks that engage and impress potential collaborators.",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Star,
    title: "Skill Recognition",
    description: "Get recognized for your expertise through peer endorsements and skill verification systems.",
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    icon: Shield,
    title: "Secure Platform",
    description: "Enterprise-grade security ensures your data and communications remain private and protected.",
    gradient: "from-red-500 to-rose-500",
  },
  {
    icon: Zap,
    title: "Real-time Collaboration",
    description: "Work together seamlessly with integrated tools for communication, project management, and file sharing.",
    gradient: "from-indigo-500 to-blue-500",
  },
];

export default function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 px-4 bg-gray-950">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-gray-50 mb-6">
            Everything you need to
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {" "}succeed
            </span>
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Powerful features designed to help professionals connect, collaborate, and thrive in the modern workplace.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="group relative"
            >
              <motion.div 
                className={`absolute -inset-0.5 bg-gradient-to-r ${feature.gradient} rounded-3xl blur opacity-0 group-hover:opacity-75 transition duration-500`}
              />
              <div className="relative p-8 bg-gray-900 rounded-3xl border border-gray-800 h-full">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}
                >
                  <feature.icon className="w-8 h-8 text-white" />
                </motion.div>

                <h3 className="text-xl font-bold text-gray-50 mb-4">
                  {feature.title}
                </h3>

                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {[
            { number: "10K+", label: "Active Users" },
            { number: "2.5K", label: "Companies" },
            { number: "15K", label: "Connections Made" },
            { number: "98%", label: "Satisfaction Rate" },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                {stat.number}
              </div>
              <div className="text-gray-400 font-medium">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
