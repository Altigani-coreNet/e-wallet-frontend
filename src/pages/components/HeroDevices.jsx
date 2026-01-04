import { motion } from 'framer-motion';

const HeroDevices = ({ rotation, isHovering, handleMouseMove, handleMouseLeave, handleMouseEnter }) => (
  <>
    <style>{`
      .hero-device-main {
        height: 450px;
        border-radius: 40px;
      }
      .hero-glow-circle {
        height: 450px;
        width: 450px;
      }
      .hero-circle-1 {
        height: 400px;
        width: 400px;
      }
      .hero-circle-2 {
        height: 480px;
        width: 480px;
      }
      .hero-floating-device {
        height: 160px;
      }
      
      @media (max-width: 991.98px) {
        .hero-device-main {
          height: 280px !important;
          border-radius: 24px !important;
        }
        .hero-glow-circle {
          height: 280px !important;
          width: 280px !important;
          filter: blur(30px) !important;
        }
        .hero-circle-1 {
          height: 250px !important;
          width: 250px !important;
        }
        .hero-circle-2 {
          height: 300px !important;
          width: 300px !important;
        }
        .hero-floating-device {
          height: 100px !important;
        }
      }
      
      @media (max-width: 575.98px) {
        .hero-device-main {
          height: 220px !important;
          border-radius: 20px !important;
        }
        .hero-glow-circle {
          height: 220px !important;
          width: 220px !important;
          filter: blur(25px) !important;
        }
        .hero-circle-1 {
          height: 200px !important;
          width: 200px !important;
        }
        .hero-circle-2 {
          height: 240px !important;
          width: 240px !important;
        }
        .hero-floating-device {
          height: 80px !important;
        }
      }
    `}</style>
    <motion.div
      className="col-lg-6 d-flex justify-content-center justify-content-lg-end"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    >
      <div className="position-relative d-flex align-items-center justify-content-center" style={{ zIndex: 1 }}>
        {/* Small floating Device 4 inside card (top-right of device area) */}
        <motion.img
          src="/device_4.png"
          alt="FastPay POS Device Small Top Right"
          className="d-none d-lg-block position-absolute hero-floating-device"
          style={{
            top: '-10px',
            right: '-20px',
            width: 'auto',
            objectFit: 'contain',
            opacity: 0.8,
            pointerEvents: 'none',
            filter: 'drop-shadow(0 15px 35px rgba(17, 63, 103, 0.4))',
            zIndex: 12,
          }}
          initial={{ x: 0, y: 0, rotate: 0 }}
          animate={{
            // Top device: slower, more horizontal drift and light bobbing up/down
            x: [0, 22, 0, -22, 0],
            y: [0, -6, 0, 6, 0],
            rotate: [0, 1, 0, -1, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          whileHover={{
            scale: 1.08,
            opacity: 1,
          }}
        />
        {/* Small floating Device 4 inside card (bottom-left of device area) */}
        <motion.img
          src="/device_5.png"
          alt="FastPay POS Device Small Bottom Left"
          className="d-none d-lg-block position-absolute hero-floating-device"
          style={{
            bottom: '-10px',
            left: '-20px',
            width: 'auto',
            objectFit: 'contain',
            opacity: 0.9,
            pointerEvents: 'none',
            filter: 'drop-shadow(0 15px 35px rgba(17, 63, 103, 0.4))',
            zIndex: 12,
          }}
          initial={{ x: 0, y: 0, rotate: 0 }}
          animate={{
            // Bottom device: faster, more vertical motion and opposite rotation
            x: [0, -8, 0, 8, 0],
            y: [0, 26, 0, -26, 0],
            rotate: [0, -1.4, 0, 1.4, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          whileHover={{
            scale: 1.08,
            opacity: 1,
          }}
        />

        {/* Soft glow */}
        <div
          className="position-absolute rounded-circle hero-glow-circle"
          style={{
            zIndex: 1,
            background: 'linear-gradient(135deg, rgba(0, 71, 123, 0.25) 0%, rgba(2, 127, 214, 0.25) 100%)',
            filter: 'blur(40px)',
          }}
        />

        {/* First circle */}
        <div
          className="position-absolute rounded-circle hero-circle-1"
          style={{
            zIndex: 2,
            background: 'linear-gradient(135deg, rgba(0, 71, 123, 0.4) 0%, rgba(2, 127, 214, 0.4) 100%)',
            border: '2px solid rgba(2, 127, 214, 0.5)',
          }}
        />

        {/* Second circle */}
        <div
          className="position-absolute rounded-circle hero-circle-2"
          style={{
            zIndex: 3,
            background: 'linear-gradient(135deg, rgba(0, 71, 123, 0.3) 0%, rgba(2, 127, 214, 0.3) 100%)',
            border: '1px solid rgba(2, 127, 214, 0.3)',
          }}
        />

        {/* POS Device */}
        <div
          className="position-relative"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onMouseEnter={handleMouseEnter}
          style={{
            cursor: 'pointer',
            perspective: '1000px',
            zIndex: 11,
          }}
        >
          <img
            src="/device_1.png"
            alt="FastPay POS Device"
            className="hero-device-main"
            style={{
              width: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 20px 45px rgba(17, 63, 103, 0.45))',
              transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
              transition: isHovering ? 'transform 0.15s ease-out' : 'transform 0.8s ease-out',
              transformStyle: 'preserve-3d',
            }}
          />
        </div>
      </div>
    </motion.div>
  </>
);

export default HeroDevices;

