import { motion } from 'framer-motion';

const HeroCopy = ({ fadeInLeft, fadeInUpSlow, fadeInUp, onOpenContact }) => (
  <motion.div
    className="col-lg-6 mb-10 mb-lg-0"
    variants={fadeInLeft}
  >
    <motion.div
      className="text-start mb-5 mb-lg-10"
      variants={fadeInUpSlow}
    >
      <h1 className="text-white lh-base fw-bold fs-2x fs-lg-3x mb-15">
        <span
          style={{
            background: 'linear-gradient(to right, #4db8ff 0%, #80d4ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          <span id="kt_landing_hero_text">FastPOS – Smarter Payments. Stronger Business.</span>
        </span>
      </h1>

      <motion.p
        className="fs-6 fs-lg-3 text-white opacity-85 mb-8"
        variants={fadeInUp}
      >
        A scalable, secure, cloud-based POS and payment ecosystem designed to modernize retail and service businesses with faster payments, real-time insights, centralized control, and high-level security.
      </motion.p>

      <motion.div
        className="d-flex flex-nowrap gap-2 gap-lg-3"
        variants={fadeInUp}
      >
        <motion.button
          type="button"
          className="btn me-2 me-lg-3 fw-bold fs-6 fs-lg-5 py-2 px-3 py-lg-3 px-lg-4"
          style={{
            background: 'linear-gradient(90deg, #00477b 0%, #027fd6 100%)',
            color: 'white',
            border: 'none',
          }}
          onClick={() => onOpenContact?.()}
          whileHover={{ scale: 1.05, translateY: -2 }}
          whileTap={{ scale: 0.97 }}
        >
          Request a Demo
        </motion.button>
      </motion.div>
    </motion.div>
  </motion.div>
);

export default HeroCopy;


