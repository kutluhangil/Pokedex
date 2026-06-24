import { motion } from 'framer-motion';

interface Props {
  active: boolean;
  color?: string;
}

const VoiceVisualizer = ({ active, color = 'hsl(var(--poke-red))' }: Props) => {
  return (
    <div className="flex items-center justify-center gap-[3px] h-6 px-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-1.5 rounded-full"
          style={{ 
            backgroundColor: color,
            boxShadow: active ? `0 0 6px ${color}` : 'none'
          }}
          animate={{
            height: active 
              ? [`${20 + Math.random() * 20}%`, `${60 + Math.random() * 40}%`, `${30 + Math.random() * 20}%`] 
              : '15%',
            opacity: active ? [0.5, 1, 0.7] : 0.2
          }}
          transition={{
            duration: 0.3 + Math.random() * 0.3,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: 'easeInOut',
            delay: i * 0.05
          }}
        />
      ))}
    </div>
  );
};

export default VoiceVisualizer;
