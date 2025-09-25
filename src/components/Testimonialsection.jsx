
import React, { useRef } from "react";
import { motion, useMotionValue, useTransform, useInView } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Senior Product Designer",
    company: "TechFlow",
    content: "This platform revolutionized how I connect with clients and showcase my work. The interactive profiles are game-changing.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
  },
  {
    name: "Michael Chen",
    role: "Full Stack Developer",
    company: "StartupLab",
    content: "The smart matching feature connected me with opportunities I never would have found otherwise. Truly impressive AI capabilities.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  },
  {
    name: "Emily Rodriguez",
    role: "Marketing Director",
    company: "GrowthCorp",
    content: "The collaboration tools are incredible. My team's productivity increased by 40% after switching to this platform.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
  },
];

const TestimonialCard = ({ testimonial, index }) => {
  const cardRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-150, 150], [10, -10]);
  const rotateY = useTransform(x, [-150, 150], [-10, 10]);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };
  
  const isInView = useInView(cardRef, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: "1000px",
        transformStyle: "preserve-3d",
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: index * 0.2 }}
    >
      <motion.div
        style={{ rotateX, rotateY }}
        className="relative p-8 bg-gray-900 rounded-3xl border border-gray-800 h-full shadow-2xl shadow-black/50"
      >
        <motion.div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
          <Quote className="w-6 h-6 text-white" />
        </motion.div>

        <div className="flex items-center gap-1 mb-6 mt-4">
          {[...Array(testimonial.rating)].map((_, i) => (
            <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
          ))}
        </div>

        <blockquote className="text-gray-300 text-lg leading-relaxed mb-8 font-medium">
          "{testimonial.content}"
        </blockquote>

        <div className="flex items-center gap-4">
          <img
            src={testimonial.avatar}
            alt={testimonial.name}
            className="w-14 h-14 rounded-full object-cover border-2 border-gray-700"
          />
          <div>
            <div className="font-bold text-gray-50 text-lg">
              {testimonial.name}
            </div>
            <div className="text-gray-400">
              {testimonial.role}
            </div>
            <div className="text-blue-400 font-medium text-sm">
              {testimonial.company}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};


export default function TestimonialsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 px-4 bg-black">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-gray-50 mb-6">
            Loved by
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {" "}professionals
            </span>
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            See what our community of talented professionals has to say about their experience.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} testimonial={testimonial} index={index} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-20 text-center"
        >
          <div className="inline-flex items-center gap-4 px-8 py-4 bg-gray-900 border border-gray-700 rounded-full">
            <div className="flex -space-x-3">
              {testimonials.map((testimonial, index) => (
                <img
                  key={index}
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-10 h-10 rounded-full border-2 border-gray-800 object-cover"
                />
              ))}
            </div>
            <div className="text-gray-300 font-medium">
              Join 10,000+ satisfied professionals
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
