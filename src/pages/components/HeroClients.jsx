import { motion } from 'framer-motion';
import { clientLogos } from '../content';

const HeroClients = ({ staggerContainer, fadeInUp }) => (
  <motion.div
    className="d-flex flex-center flex-wrap position-relative px-5 mt-10"
    id="clients"
    variants={staggerContainer}
  >
    {clientLogos.map(({ title, src }) => (
      <motion.div
        className="d-flex flex-center m-3 m-md-6"
        data-bs-toggle="tooltip"
        title={title}
        key={title}
        variants={fadeInUp}
        whileHover={{ scale: 1.2, rotate: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 15 }}
        style={{
          width: '70px',
          height: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
        }}
      >
        <img 
          src={src} 
          alt={title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </motion.div>
    ))}
  </motion.div>
);

export default HeroClients;


