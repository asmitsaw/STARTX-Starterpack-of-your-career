
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  Users,
  Briefcase,
  MessageSquare,
  Award,
  Shield,
  Zap,
  ArrowRight,
  Star,
  TrendingUp,
  Globe,
  Rocket,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Professional Profiles",
    description:
      "Create stunning profiles that showcase your skills, experience, and achievements with interactive elements.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Briefcase,
    title: "Smart Job Matching",
    description:
      "AI-powered matching connects you with opportunities that align perfectly with your skills and career goals.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: MessageSquare,
    title: "Dynamic Pitches",
    description:
      "Present your ideas with interactive pitch decks that engage and impress potential collaborators.",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Award,
    title: "Skill Recognition",
    description:
      "Get validated for your expertise and build credibility within your professional community.",
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    icon: Shield,
    title: "Secure Platform",
    description:
      "Enterprise-grade security ensures your data and connections remain private and protected.",
    gradient: "from-red-500 to-rose-500",
  },
  {
    icon: Zap,
    title: "Real-time Collaboration",
    description:
      "Work together seamlessly with instant messaging, video calls, and collaborative workspaces.",
    gradient: "from-indigo-500 to-blue-500",
  },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Product Designer",
    avatar: "SC",
    content:
      "StartX transformed how I showcase my work. The platform is intuitive and the connections I've made are invaluable.",
    rating: 5,
  },
  {
    name: "Marcus Johnson",
    role: "Software Engineer",
    avatar: "MJ",
    content:
      "Best professional platform I've used. The smart matching feature helped me find my dream job in weeks!",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "Startup Founder",
    avatar: "ER",
    content:
      "The pitch feature is a game-changer. I've connected with investors and co-founders who truly get my vision.",
    rating: 5,
  },
  {
    name: "David Park",
    role: "Marketing Director",
    avatar: "DP",
    content:
      "Professional networking has never been this easy. The UI is beautiful and the features are exactly what I needed.",
    rating: 5,
  },
];

const stats = [
  { label: "Active Professionals", value: "50K+", icon: Users },
  { label: "Success Stories", value: "10K+", icon: TrendingUp },
  { label: "Countries", value: "120+", icon: Globe },
  { label: "Job Matches", value: "25K+", icon: Rocket },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 right-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-20 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
           

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Build the Future
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Together
              </span>
            </h1>

            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
              Connect with talented professionals, showcase your skills, and discover opportunities that match your passion. Join a community where innovation meets collaboration.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/register"
                className="inline-flex items-center bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-3 md:py-4 text-lg font-semibold rounded-md shadow-lg shadow-emerald-500/25"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                to="/premium"
                className="inline-flex items-center border border-gray-700 text-gray-300 hover:bg-gray-800 px-8 py-3 md:py-4 text-lg rounded-md"
              >
                Watch Demo
              </Link>
            </div>

            <p className="text-sm text-gray-500 mt-8">Trusted by 50,000+ professionals worldwide</p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 border-y border-gray-800/50 bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-emerald-400" />
                <div className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything you need to {" "}
              <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">succeed</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Powerful features designed to help professionals connect, collaborate, and thrive in the modern workplace.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="bg-gray-900/50 border border-gray-800 hover:border-gray-700 transition-all duration-300 h-full group hover:shadow-xl hover:shadow-emerald-500/5 rounded-xl">
                  <div className="p-6">
                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-transparent to-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">What people are saying</h2>
            <p className="text-xl text-gray-400">Real feedback from real users</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="bg-gray-900/50 border border-gray-800 h-full rounded-xl">
                  <div className="p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                    <p className="text-gray-300 mb-4 leading-relaxed">"{testimonial.content}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-sm font-semibold">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold">{testimonial.name}</div>
                        <div className="text-sm text-gray-400">{testimonial.role}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 overflow-hidden relative rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-blue-500/5" />
              <div className="p-12 text-center relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to build your future?</h2>
                <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                  Join thousands of professionals who are already using StartX to advance their careers and connect with opportunities.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/register"
                    className="inline-flex items-center bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-3 md:py-4 text-lg font-semibold rounded-md"
                  >
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                  <Link
                    to="/premium"
                    className="inline-flex items-center border border-gray-700 text-gray-300 hover:bg-gray-800 px-8 py-3 md:py-4 text-lg rounded-md"
                  >
                    Schedule Demo
                  </Link>
                </div>
                <p className="text-sm text-gray-500 mt-6">No credit card required • Free forever plan available</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
