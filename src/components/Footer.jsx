
import React from "react";
import { motion } from "framer-motion";
import { 
  Twitter, 
  Linkedin, 
  Github, 
  Mail, 
  ArrowRight,
  Sparkles
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-transparent text-white">
     

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">StartX</span>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6 max-w-md">
                Empowering professionals to connect, collaborate, and succeed in the digital age. 
                Join our community of innovators and creators.
              </p>
              
              <div className="flex gap-4">
                {[
                  { icon: Twitter, href: "#" },
                  
                  { icon: Github, href: "#" },
                  { icon: Mail, href: "#" },
                ].map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.href}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-12 h-12 bg-white/5 hover:bg-gradient-to-br hover:from-emerald-500 hover:to-teal-500 rounded-xl flex items-center justify-center transition-all duration-300 group"
                  >
                    <social.icon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-300" />
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Links Columns */}
          {[
            {
              title: "Product",
              links: ["Features", "Pricing", "Security", "Integrations", "API"],
            },
            {
              title: "Resources",
              links: ["Documentation", "Help Center", "Blog", "Community", "Status"],
            },
            {
              title: "Company",
              links: ["About", "Careers", "Privacy", "Terms", "Contact"],
            },
          ].map((column, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <h4 className="font-bold text-white mb-6">{column.title}</h4>
              <ul className="space-y-4">
                {column.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <motion.a
                      href="#"
                      whileHover={{ x: 4 }}
                      className="text-gray-400 hover:text-white transition-all duration-300 flex items-center group"
                    >
                      {link}
                      <ArrowRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </motion.a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
 {/* Newsletter Section */}
 <div className="border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                Stay in the loop
              </h3>
              <p className="text-gray-400 text-lg max-w-md">
                Get the latest updates, feature releases, and industry insights delivered to your inbox.
              </p>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex gap-3 w-full md:w-auto"
            >
              <input
                type="email"
                placeholder="Enter your email"
                className="input min-w-80 bg-white/5 border-white/10 placeholder:text-gray-400 focus:border-brand-green focus:ring-emerald-700/40"
              />
              <button className="btn-primary px-6 py-3 group rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400">
                Subscribe
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </motion.div>
          </div>
        </div>
      </div>
      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-gray-400 text-sm"
            >
              © 2024 Platform. All rights reserved.
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex gap-6 text-sm"
            >
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
                Terms of Service
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
                Cookie Policy
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </footer>
  );
}
