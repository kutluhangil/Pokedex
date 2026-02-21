import { motion } from 'framer-motion';

const Particles = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-0.5 h-0.5 rounded-full bg-foreground/20"
          style={{
            left: `${Math.random() * 100}%`,
            bottom: '-5%',
          }}
          animate={{
            y: [0, -window.innerHeight * 1.2],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 8 + Math.random() * 12,
            repeat: Infinity,
            delay: Math.random() * 10,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
};

export default Particles;
