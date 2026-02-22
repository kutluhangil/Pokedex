import { motion } from 'framer-motion';

const Particles = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-px h-px rounded-full bg-foreground/15"
          style={{
            left: `${Math.random() * 100}%`,
            bottom: '-2%',
          }}
          animate={{
            y: [0, -window.innerHeight * 1.1],
            opacity: [0, 0.3, 0],
          }}
          transition={{
            duration: 10 + Math.random() * 15,
            repeat: Infinity,
            delay: Math.random() * 8,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
};

export default Particles;
