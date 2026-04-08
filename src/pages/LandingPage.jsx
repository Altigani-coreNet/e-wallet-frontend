import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  CreditCard,
  PiggyBank,
  DollarSign,
  QrCode,
  Wallet,
  Smartphone,
  Link2,
  Store,
  Utensils,
  Building2,
  Briefcase,
  MapPin,
  Monitor,
  Key,
  CalendarCheck,
  Cloud,
  Building,
  Package,
  Users,
  Heart,
  BarChart3,
  Shield,
  Cpu,
  Plug,
  Rocket,
  Settings,
  Clock,
  Layers,
  Eye,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { PUBLIC_ENDPOINTS } from '../utils/constants';
import {
  cssAssets,
  scriptAssets,
  menuLinks,
  howItWorksSteps,
  productShots,
  stats,
  projectTabs,
  teamMembers,
} from './content';
import HeroSection from './components/HeroSection';
import TawkChat from './components/TawkChat';

// Framer Motion animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const fadeInUpSlow = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: 'easeOut' } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const sectionReveal = {
  hidden: { opacity: 0, y: 80 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: 'easeOut',
    },
  },
};

const fadeInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};

const fadeInDown = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};

const fadeInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};

const LandingHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      <style>{`
        /* Default (top of page): links white, active primary */
        .landing-header #kt_landing_menu .menu-link {
          color: #ffffff;
          transition: color 0.2s ease;
        }
        .landing-header #kt_landing_menu .menu-link:hover,
        .landing-header #kt_landing_menu .menu-link.active {
          color: #027fd6;
        }

        /* When header is sticky / page scrolled: links black, active primary */
        .landing-header.landing-header--scrolled #kt_landing_menu .menu-link {
          color: #000000;
        }
        .landing-header.landing-header--scrolled #kt_landing_menu .menu-link:hover,
        .landing-header.landing-header--scrolled #kt_landing_menu .menu-link.active {
          color: #027fd6;
        }
      `}</style>
      <div
        className={`landing-header${isScrolled ? ' landing-header--scrolled' : ''}`}
        data-kt-sticky="true"
        data-kt-sticky-name="landing-header"
        data-kt-sticky-offset="{default: '200px', lg: '300px'}"
      >
        <div className="container">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center flex-equal">
              <button className="btn btn-icon btn-active-color-primary me-3 d-flex d-lg-none" id="kt_landing_menu_toggle">
                <i className="ki-duotone ki-abstract-14 fs-2hx">
                  <span className="path1" />
                  <span className="path2" />
                </i>
              </button>

              <a href="/" style={{ position: 'relative', display: 'inline-block' }}>
                <div style={{ position: 'relative' }}>
                  <img 
                    alt="Fastpay Logo" 
                    src="/faspay_logo.png" 
                    className="logo-default h-35px h-lg-45px"
                  />
                  <img 
                    alt="Fastpay Logo" 
                    src="/faspay_logo.png" 
                    className="logo-sticky h-30px h-lg-35px"
                  />
                </div>
              </a>
            </div>

            <div className="d-lg-block" id="kt_header_nav_wrapper">
              <div
                className="d-lg-block p-5 p-lg-0"
                data-kt-drawer="true"
                data-kt-drawer-name="landing-menu"
                data-kt-drawer-activate="{default: true, lg: false}"
                data-kt-drawer-overlay="true"
                data-kt-drawer-width="200px"
                data-kt-drawer-direction="start"
                data-kt-drawer-toggle="#kt_landing_menu_toggle"
                data-kt-swapper="true"
                data-kt-swapper-mode="prepend"
                data-kt-swapper-parent="{default: '#kt_body', lg: '#kt_header_nav_wrapper'}"
              >
                <div className="menu menu-column flex-nowrap menu-rounded menu-lg-row menu-title-gray-600 menu-state-title-primary nav nav-flush fs-5 fw-semibold" id="kt_landing_menu">
                  {menuLinks.map(({ label, href, isActive }) => (
                    <div className="menu-item" key={href}>
                      <a
                        className={`menu-link nav-link py-3 px-4 px-xxl-6${isActive ? ' active' : ''}`}
                        href={href}
                        data-kt-scroll-toggle="true"
                        data-kt-drawer-dismiss="true"
                      >
                        {label}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-equal text-end ms-1">
              <a 
                href="/login" 
                className="btn"
                style={{
                  backgroundColor: '#027fd6',
                  color: 'white',
                  border: 'none',
                }}
              >
                Sign In
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const EcosystemOverviewSection = () => {
  const cards = [
    {
      title: 'Cloud POS',
      description: 'Web and mobile point-of-sale with cloud synchronization and offline capabilities.',
      iconClass: 'ki-devices',
    },
    {
      title: 'Dashboard Analytics',
      description: 'Real-time business intelligence with customizable reports and sales trends.',
      iconClass: 'ki-graph-3',
    },
    {
      title: 'Payment Processing',
      description: 'Supporting 10+ payment methods with PCI compliance and instant settlement.',
      iconClass: 'ki-credit-cart',
    },
    {
      title: 'Merchant App',
      description: 'Mobile business management including staff scheduling and customer loyalty programs.',
      icon: Smartphone,
    },
  ];

  return (
    <motion.div
      className="py-10 py-lg-20 bg-light"
      id="ecosystem"
      variants={sectionReveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
    >
      <div className="container">
        <div className="text-center mb-12">
          <h3 className="fs-2hx text-gray-900 mb-5">
            FastPay Ecosystem Overview
          </h3>
          <div className="fs-5 text-muted fw-semibold">
            Complete integrated platform for modern payment processing
          </div>
        </div>

        <motion.div
          className="row g-8 g-lg-10 justify-content-center"
          variants={staggerContainer}
        >
          {cards.map((card) => {
            const IconComponent = card.icon;
            return (
            <motion.div
              key={card.title}
              className="col-md-6 col-lg-3 d-flex"
              variants={fadeInUp}
              whileHover={{ translateY: -8, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 210, damping: 20 }}
            >
              <div
                className="w-100 card-rounded p-8 text-start"
                style={{
                  backgroundColor: '#ffffff',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  cursor: 'pointer',
                }}
              >
                <div
                  className="d-inline-flex align-items-center justify-content-center mb-5 rounded-circle"
                  style={{
                    width: 56,
                    height: 56,
                    backgroundColor: '#d0e4ff',
                  }}
                >
                  {IconComponent ? (
                    <IconComponent size={24} style={{ color: '#00477b' }} />
                  ) : (
                    <i
                      className={`ki-duotone ${card.iconClass} fs-2x`}
                      style={{ color: '#00477b' }}
                    >
                      <span className="path1" />
                      <span className="path2" />
                    </i>
                  )}
                </div>
                <h4 className="fs-3 fw-bold text-gray-900 mb-4">
                  {card.title}
                </h4>
                <p className="fs-6 text-gray-700 mb-0">
                  {card.description}
                </p>
              </div>
            </motion.div>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
};

const AboutSection = () => {
  const cards = [
    {
      title: 'Unified POS & Payments',
      description: 'Seamlessly integrate point-of-sale operations with multiple payment methods in one unified platform.',
      icon: CreditCard,
    },
    {
      title: 'Real-Time Analytics & Reporting',
      description: 'Get instant insights and comprehensive reports to make data-driven decisions for your business.',
      icon: BarChart3,
    },
    {
      title: 'Centralized Multi-Branch Management',
      description: 'Manage all your locations from a single dashboard with real-time synchronization across branches.',
      icon: Building,
    },
    {
      title: 'Secure and Reliable Cloud Platform',
      description: 'Hight  level security with PCI-DSS compliance and enterprise-grade reliability for peace of mind.',
      icon: Shield,
    },
  ];

  return (
    <motion.div
      className="py-10 py-lg-20 bg-light"
      id="about"
      variants={sectionReveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
    >
      <div className="container">
        <div className="text-center mb-12">
          <h3 className="fs-2hx text-gray-900 mb-5">
            About Us
          </h3>
          <div className="fs-5 text-muted fw-semibold mb-8" style={{ maxWidth: '800px', margin: '0 auto' }}>
            FastPOS delivers an all-in-one cloud POS and payment ecosystem that simplifies operations and enables businesses to scale with confidence.
          </div>
        </div>

        <motion.div
          className="row g-8 g-lg-10 justify-content-center"
          variants={staggerContainer}
        >
          {cards.map((card, index) => {
            const IconComponent = card.icon;
            return (
              <motion.div
                key={card.title}
                className="col-md-6 col-lg-3 d-flex"
                variants={fadeInUp}
                whileHover={{ translateY: -8, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 210, damping: 20, delay: index * 0.1 }}
              >
                <div
                  className="w-100 card-rounded p-8 text-start"
                  style={{
                    backgroundColor: '#ffffff',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <div
                    className="d-inline-flex align-items-center justify-content-center mb-5 rounded-circle"
                    style={{
                      width: 56,
                      height: 56,
                      backgroundColor: '#d0e4ff',
                    }}
                  >
                    <IconComponent size={24} style={{ color: '#00477b' }} />
                  </div>
                  <h4 className="fs-3 fw-bold text-gray-900 mb-4">
                    {card.title}
                  </h4>
                  <p className="fs-6 text-gray-700 mb-0">
                    {card.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
};

const BusinessChallengesSection = () => {
  const challenges = [
    {
      title: 'Slow and Complex Payment Processes',
      description: 'Streamline checkout with fast, intuitive payment processing.',
      icon: Clock,
      delay: 0.1,
    },
    {
      title: 'Fragmented POS and Payment Systems',
      description: 'Unify operations with an integrated platform connecting POS and payments.',
      icon: Layers,
      delay: 0.2,
    },
    {
      title: 'Limited Visibility Across Branches',
      description: 'Gain complete oversight with real-time dashboards and centralized reporting.',
      icon: Eye,
      delay: 0.3,
    },
    {
      title: 'High Hardware and Operational Costs',
      description: 'Reduce expenses with cloud-based infrastructure eliminating hardware investments.',
      icon: DollarSign,
      delay: 0.4,
    },
    {
      title: 'Delayed Settlements and Security Risks',
      description: 'Ensure instant settlements with bank-level security and PCI-DSS compliance.',
      icon: AlertTriangle,
      delay: 0.5,
    },
  ];

  const topChallenges = challenges.slice(0, 3);
  const bottomChallenges = challenges.slice(3, 5);

  return (
    <motion.div
      className="py-10 py-lg-20 bg-light"
      id="challenges"
      variants={sectionReveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
    >
      <div className="container">
        <div className="text-center mb-12">
          <h3 className="fs-2hx text-gray-900 mb-5">
            Why Businesses Choose FastPOS
          </h3>
          <div className="fs-5 text-muted fw-semibold">
            Business Challenges We Solve
          </div>
        </div>

        {/* Top row: 3 cards */}
        <motion.div
          className="row g-8 g-lg-10 justify-content-center mb-8"
          variants={staggerContainer}
        >
          {topChallenges.map((challenge, index) => {
            const IconComponent = challenge.icon;
            return (
              <motion.div
                key={challenge.title}
                className="col-md-6 col-lg-4 d-flex"
                variants={fadeInUp}
                whileHover={{ translateY: -8, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 210, damping: 20, delay: challenge.delay }}
              >
                <div
                  className="w-100 card-rounded p-8 text-start"
                  style={{
                    backgroundColor: '#ffffff',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <div
                    className="d-inline-flex align-items-center justify-content-center mb-5 rounded-circle"
                    style={{
                      width: 56,
                      height: 56,
                      backgroundColor: '#d0e4ff',
                    }}
                  >
                    <IconComponent size={24} style={{ color: '#00477b' }} />
                  </div>
                  <h4 className="fs-3 fw-bold text-gray-900 mb-4">
                    {challenge.title}
                  </h4>
                  <p className="fs-6 text-gray-700 mb-0">
                    {challenge.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom row: 2 cards */}
        <motion.div
          className="row g-8 g-lg-10 justify-content-center"
          variants={staggerContainer}
        >
          {bottomChallenges.map((challenge, index) => {
            const IconComponent = challenge.icon;
            return (
              <motion.div
                key={challenge.title}
                className="col-md-6 col-lg-6 d-flex"
                variants={fadeInUp}
                whileHover={{ translateY: -8, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 210, damping: 20, delay: challenge.delay }}
              >
                <div
                  className="w-100 card-rounded p-8 text-start"
                  style={{
                    backgroundColor: '#ffffff',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <div
                    className="d-inline-flex align-items-center justify-content-center mb-5 rounded-circle"
                    style={{
                      width: 56,
                      height: 56,
                      backgroundColor: '#d0e4ff',
                    }}
                  >
                    <IconComponent size={24} style={{ color: '#00477b' }} />
                  </div>
                  <h4 className="fs-3 fw-bold text-gray-900 mb-4">
                    {challenge.title}
                  </h4>
                  <p className="fs-6 text-gray-700 mb-0">
                    {challenge.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
};

const POSKeyFeaturesSectionMobile = () => {
  const features = [
    {
      title: 'Payment & Transaction Features',
      icon: CreditCard,
      delay: 0.1,
    },
    {
      title: 'Cloud POS Core Features',
      icon: Cloud,
      delay: 0.2,
    },
    {
      title: 'Multi-Branch & Enterprise Management',
      icon: Building,
      delay: 0.3,
    },
    {
      title: 'Inventory & Product Management',
      icon: Package,
      delay: 0.4,
    },
    {
      title: 'Staff & User Management',
      icon: Users,
      delay: 0.5,
    },
    {
      title: 'Customer & Loyalty Management',
      icon: Heart,
      delay: 0.6,
    },
    {
      title: 'Analytics & Reporting',
      icon: BarChart3,
      delay: 0.7,
    },
    {
      title: 'Security & Compliance',
      icon: Shield,
      delay: 0.8,
    },
    {
      title: 'Hardware & Device Support',
      icon: Cpu,
      delay: 0.9,
    },
    {
      title: 'Integration & APIs',
      icon: Plug,
      delay: 1.0,
    },
    {
      title: 'Deployment & Support',
      icon: Rocket,
      delay: 1.1,
    },
    {
      title: 'Advanced / Optional Features',
      icon: Settings,
      delay: 1.2,
    },
  ];

  return (
    <section className="position-relative z-index-2 py-10 py-lg-20 d-block d-lg-none" id="features-mobile">
      <div className="container">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-3 fs-2hx text-gray-900 fw-bold">
            Features
          </h2>
          <p className="fs-5 text-muted mx-auto" style={{ maxWidth: 720 }}>
            Comprehensive features for modern payment processing
          </p>
        </motion.div>

        <motion.div
          className="row g-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map(({ title, icon: Icon, delay }) => (
            <motion.div
              key={title}
              className="col-6 d-flex"
              variants={fadeInUp}
              transition={{ duration: 0.6, delay }}
            >
              <motion.div
                className="w-100 d-flex align-items-center gap-3 rounded-3 border bg-white px-3 py-3"
                style={{
                  borderColor: 'rgba(2, 127, 214, 0.2)',
                  boxShadow: '0 10px 30px rgba(17, 63, 103, 0.08)',
                  cursor: 'pointer',
                }}
                whileHover={{ 
                  scale: 1.05, 
                  y: -8,
                  boxShadow: '0 15px 40px rgba(17, 63, 103, 0.15)',
                  transition: { duration: 0.2 }
                }}
              >
                <div className="flex-shrink-0">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle"
                    style={{
                      height: 40,
                      width: 40,
                      backgroundColor: '#d0e4ff',
                    }}
                  >
                    <Icon size={18} style={{ color: '#00477b' }} />
                  </div>
                </div>
                <div className="text-start flex-grow-1">
                  <h3 className="fs-8 fw-semibold text-gray-900 mb-0" style={{ lineHeight: '1.3' }}>
                    {title}
                  </h3>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const POSKeyFeaturesSection = () => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -15;
    const rotateY = ((x - centerX) / centerX) * 15;
    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setIsHovering(false);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const features = [
    {
      title: 'Payment & Transaction Features',
      icon: CreditCard,
      delay: 0.1,
      direction: 'left',
    },
    {
      title: 'Cloud POS Core Features',
      icon: Cloud,
      delay: 0.2,
      direction: 'left',
    },
    {
      title: 'Multi-Branch & Enterprise Management',
      icon: Building,
      delay: 0.3,
      direction: 'left',
    },
    {
      title: 'Inventory & Product Management',
      icon: Package,
      delay: 0.4,
      direction: 'left',
    },
    {
      title: 'Staff & User Management',
      icon: Users,
      delay: 0.5,
      direction: 'left',
    },
    {
      title: 'Customer & Loyalty Management',
      icon: Heart,
      delay: 0.6,
      direction: 'left',
    },
    {
      title: 'Analytics & Reporting',
      icon: BarChart3,
      delay: 0.7,
      direction: 'right',
    },
    {
      title: 'Security & Compliance',
      icon: Shield,
      delay: 0.8,
      direction: 'right',
    },
    {
      title: 'Hardware & Device Support',
      icon: Cpu,
      delay: 0.9,
      direction: 'right',
    },
    {
      title: 'Integration & APIs',
      icon: Plug,
      delay: 1.0,
      direction: 'right',
    },
    {
      title: 'Deployment & Support',
      icon: Rocket,
      delay: 1.1,
      direction: 'right',
    },
    {
      title: 'Advanced / Optional Features',
      icon: Settings,
      delay: 1.2,
      direction: 'right',
    },
  ];

  const leftFeatures = features.slice(0, 6);
  const rightFeatures = features.slice(6, 12);

  return (
    <>
      <style>{`
        .features-device-main {
          height: 350px;
          border-radius: 40px;
        }
        .features-glow-circle {
          height: 320px;
          width: 320px;
        }
        .features-circle-1 {
          height: 280px;
          width: 280px;
        }
        .features-circle-2 {
          height: 360px;
          width: 360px;
        }
        .features-circle-3 {
          height: 260px;
          width: 260px;
        }
        
        @media (max-width: 991.98px) {
          .features-device-main {
            height: 240px !important;
            border-radius: 24px !important;
          }
          .features-glow-circle {
            height: 240px !important;
            width: 240px !important;
            filter: blur(30px) !important;
          }
          .features-circle-1 {
            height: 210px !important;
            width: 210px !important;
          }
          .features-circle-2 {
            height: 270px !important;
            width: 270px !important;
          }
          .features-circle-3 {
            height: 200px !important;
            width: 200px !important;
          }
        }
        
        @media (max-width: 575.98px) {
          .features-device-main {
            height: 200px !important;
            border-radius: 20px !important;
          }
          .features-glow-circle {
            height: 200px !important;
            width: 200px !important;
            filter: blur(25px) !important;
          }
          .features-circle-1 {
            height: 175px !important;
            width: 175px !important;
          }
          .features-circle-2 {
            height: 225px !important;
            width: 225px !important;
          }
          .features-circle-3 {
            height: 170px !important;
            width: 170px !important;
          }
        }
      `}</style>
      <section className="position-relative z-index-2 py-10 py-lg-20 d-none d-lg-block" id="features">
        <div className="container">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="mb-3 fs-2hx text-gray-900 fw-bold">
              Features
            </h2>
            <p className="fs-5 text-muted mx-auto" style={{ maxWidth: 720 }}>
              Comprehensive features for modern payment processing
            </p>
          </motion.div>

          <div className="row g-10 align-items-center justify-content-center position-relative">
            {/* Left: 6 features - curved pattern */}
            <div className="col-lg-4 position-relative" style={{ minHeight: '600px' }}>
              {leftFeatures.map(({ title, icon: Icon, delay, direction }, index) => {
                // Create curved pattern: top/bottom farther, middle closer
                const positions = [
                  { top: '0%', marginRight: '0rem' },      // Top - farthest
                  { top: '14%', marginRight: '2.5rem' },   // Upper - closer
                  { top: '28%', marginRight: '4rem' },    // Upper middle - closest
                  { top: '42%', marginRight: '4rem' },    // Lower middle - closest
                  { top: '56%', marginRight: '2.5rem' },   // Lower - closer
                  { top: '70%', marginRight: '0rem' },       // Bottom - farthest
                ];

                const getInitialPosition = () => {
                  switch (direction) {
                    case 'left':
                      return { opacity: 0, x: -50 };
                    case 'up':
                      return { opacity: 0, y: -40 };
                    case 'down':
                      return { opacity: 0, y: 40 };
                    default:
                      return { opacity: 0, x: -30 };
                  }
                };

                const marginRight = positions[index].marginRight || '0rem';
                
                return (
                  <motion.div
                    key={title}
                    className="position-absolute"
                    style={{
                      left: 0,
                      ...positions[index],
                      width: marginRight !== '0rem' ? `calc(100% - ${marginRight})` : '100%',
                    }}
                    initial={getInitialPosition()}
                    whileInView={{ opacity: 1, x: 0, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.8, delay, ease: 'easeOut' }}
                  >
                    <motion.div
                      className="d-flex align-items-center gap-3 rounded-3 border bg-white px-4 py-3"
                      style={{
                        borderColor: 'rgba(2, 127, 214, 0.2)',
                        boxShadow: '0 10px 30px rgba(17, 63, 103, 0.08)',
                        cursor: 'pointer',
                      }}
                      whileHover={{ 
                        scale: 1.05, 
                        y: -8,
                        boxShadow: '0 15px 40px rgba(17, 63, 103, 0.15)',
                        transition: { duration: 0.2 }
                      }}
                    >
                      <div className="flex-shrink-0">
                        <div
                          className="d-flex align-items-center justify-content-center rounded-circle"
                          style={{
                            height: 48,
                            width: 48,
                            backgroundColor: '#d0e4ff',
                          }}
                        >
                          <Icon size={20} style={{ color: '#00477b' }} />
                        </div>
                      </div>
                      <div className="text-start flex-grow-1">
                        <h3 className="fs-7 fw-semibold text-gray-900 mb-0" style={{ lineHeight: '1.4' }}>
                          {title}
                        </h3>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>

            {/* Center: phone mockup */}
            <motion.div
              className="col-lg-4 d-flex justify-content-center align-items-center mb-10 mb-lg-0"
              style={{ minHeight: '600px' }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="position-relative d-flex align-items-center justify-content-center" style={{ width: '100%', height: '100%', minHeight: '600px' }}>
                {/* Soft glow */}
                <div
                  className="position-absolute rounded-circle features-glow-circle"
                  style={{
                    top: '40%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: -30,
                    backgroundColor: 'rgba(2, 127, 214, 0.08)',
                    filter: 'blur(40px)',
                  }}
                />

                {/* First circle */}
                <div
                  className="position-absolute rounded-circle features-circle-1"
                  style={{
                    top: '40%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: -20,
                    border: '2px solid rgba(2, 127, 214, 0.4)',
                  }}
                />

                {/* Second circle */}
                <div
                  className="position-absolute rounded-circle features-circle-2"
                  style={{
                    top: '40%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: -10,
                    border: '1px solid rgba(2, 127, 214, 0.1)',
                    backgroundColor: '#ffffff',
                  }}
                />

                {/* Third circle */}
                <div
                  className="position-absolute rounded-circle features-circle-3"
                  style={{
                    top: '40%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: -5,
                    backgroundColor: 'rgba(208, 228, 255, 0.4)',
                    border: '1px solid rgba(208, 228, 255, 0.5)',
                  }}
                />

                {/* Phone Device */}
                <div
                  className="position-absolute"
                  style={{
                    top: '40%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10,
                  }}
                >
                  <div
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onMouseEnter={handleMouseEnter}
                    style={{
                      cursor: 'pointer',
                      perspective: '1000px',
                    }}
                  >
                    <img
                      src="/device_5.png"
                      alt="FastPay POS Device"
                      className="features-device-main"
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
              </div>
            </motion.div>

            {/* Right: 6 features - curved pattern */}
            <div className="col-lg-4 position-relative" style={{ minHeight: '600px' }}>
              {rightFeatures.map(({ title, icon: Icon, delay, direction }, index) => {
                // Create curved pattern: top/bottom farther, middle closer (mirrored)
                const positions = [
                  { top: '0%', marginLeft: '0rem' },      // Top - farthest
                  { top: '14%', marginLeft: '2.5rem' },   // Upper - closer
                  { top: '28%', marginLeft: '4rem' },    // Upper middle - closest
                  { top: '42%', marginLeft: '4rem' },    // Lower middle - closest
                  { top: '56%', marginLeft: '2.5rem' },   // Lower - closer
                  { top: '70%', marginLeft: '0rem' },       // Bottom - farthest
                ];

                const getInitialPosition = () => {
                  switch (direction) {
                    case 'right':
                      return { opacity: 0, x: 50 };
                    case 'up':
                      return { opacity: 0, y: -40 };
                    case 'down':
                      return { opacity: 0, y: 40 };
                    default:
                      return { opacity: 0, x: 30 };
                  }
                };

                const marginLeft = positions[index].marginLeft || '0rem';
                
                return (
                  <motion.div
                    key={title}
                    className="position-absolute"
                    style={{
                      right: 0,
                      ...positions[index],
                      width: marginLeft !== '0rem' ? `calc(100% - ${marginLeft})` : '100%',
                    }}
                    initial={getInitialPosition()}
                    whileInView={{ opacity: 1, x: 0, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.8, delay, ease: 'easeOut' }}
                  >
                    <motion.div
                      className="d-flex align-items-center gap-3 rounded-3 border bg-white px-4 py-3"
                      style={{
                        borderColor: 'rgba(2, 127, 214, 0.2)',
                        boxShadow: '0 10px 30px rgba(17, 63, 103, 0.08)',
                        cursor: 'pointer',
                      }}
                      whileHover={{ 
                        scale: 1.05, 
                        y: -8,
                        boxShadow: '0 15px 40px rgba(17, 63, 103, 0.15)',
                        transition: { duration: 0.2 }
                      }}
                    >
                      <div className="flex-shrink-0">
                        <div
                          className="d-flex align-items-center justify-content-center rounded-circle"
                          style={{
                            height: 48,
                            width: 48,
                            backgroundColor: '#d0e4ff',
                          }}
                        >
                          <Icon size={20} style={{ color: '#00477b' }} />
                        </div>
                      </div>
                      <div className="text-start flex-grow-1">
                        <h3 className="fs-7 fw-semibold text-gray-900 mb-0" style={{ lineHeight: '1.4' }}>
                          {title}
                        </h3>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

const ConnectAnywhereSection = () => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -15;
    const rotateY = ((x - centerX) / centerX) * 15;
    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setIsHovering(false);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const industries = [
    {
      title: 'Food & Beverages',
      description: 'Streamlined payment solutions for restaurants and cafes',
      icon: Utensils,
      delay: 0.1,
    },
    {
      title: 'Retail Stores',
      description: 'Complete POS systems for modern retail businesses',
      icon: Store,
      delay: 0.2,
    },
    {
      title: 'Hospitality',
      description: 'Integrated payment systems for hotels and hospitality services',
      icon: Building2,
      delay: 0.3,
    },
    {
      title: 'SMEs',
      description: 'Scalable solutions designed for small and medium enterprises',
      icon: Building,
      delay: 0.4,
    },
    {
      title: 'E-Governments',
      description: 'Secure payment processing for government services',
      icon: Shield,
      delay: 0.5,
    },
    {
      title: 'Professional & Service Businesses',
      description: 'Flexible payment solutions for service-based industries',
      icon: Briefcase,
      delay: 0.6,
    },
  ];

  return (
    <>
      <style>{`
        .services-device-main {
          height: 350px;
          border-radius: 40px;
        }
        .services-glow-circle {
          height: 320px;
          width: 320px;
        }
        .services-circle-1 {
          height: 280px;
          width: 280px;
        }
        .services-circle-2 {
          height: 360px;
          width: 360px;
        }
        
        @media (max-width: 991.98px) {
          .services-device-main {
            height: 240px !important;
            border-radius: 24px !important;
          }
          .services-glow-circle {
            height: 240px !important;
            width: 240px !important;
            filter: blur(30px) !important;
          }
          .services-circle-1 {
            height: 210px !important;
            width: 210px !important;
          }
          .services-circle-2 {
            height: 270px !important;
            width: 270px !important;
          }
        }
        
        @media (max-width: 575.98px) {
          .services-device-main {
            height: 200px !important;
            border-radius: 20px !important;
          }
          .services-glow-circle {
            height: 200px !important;
            width: 200px !important;
            filter: blur(25px) !important;
          }
          .services-circle-1 {
            height: 175px !important;
            width: 175px !important;
          }
          .services-circle-2 {
            height: 225px !important;
            width: 225px !important;
          }
        }
      `}</style>
      <section className="position-relative z-index-2 bg-light py-10 py-lg-20" id="services">
        <div className="container">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="mb-3 fs-2hx text-gray-900 fw-bold">
              Segments We Address
            </h2>
            <p className="fs-5 text-muted mx-auto" style={{ maxWidth: 720 }}>
              FastPay Services adapts to your business needs
            </p>
          </motion.div>

          <div className="row g-10 align-items-center">
            {/* Left: phone mockup */}
            <motion.div
              className="col-lg-5 d-flex justify-content-center mb-10 mb-lg-0"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="position-relative d-flex align-items-center justify-content-center">
                {/* Soft glow */}
                <div
                  className="position-absolute rounded-circle services-glow-circle"
                  style={{
                    zIndex: -30,
                    backgroundColor: 'rgba(2, 127, 214, 0.08)',
                    filter: 'blur(40px)',
                  }}
                />

                {/* First circle */}
                <div
                  className="position-absolute rounded-circle services-circle-1"
                  style={{
                    zIndex: -20,
                    border: '2px solid rgba(2, 127, 214, 0.4)',
                  }}
                />

                {/* Second circle */}
                <div
                  className="position-absolute rounded-circle services-circle-2"
                  style={{
                    zIndex: -10,
                    border: '1px solid rgba(2, 127, 214, 0.1)',
                    backgroundColor: '#ffffff',
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
                  }}
                >
                  <img
                    src="/device_1.png"
                    alt="FastPay POS Device"
                    className="services-device-main"
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

            {/* Right: industry cards */}
            <div className="col-lg-7">
              {industries.map(({ title, description, icon: Icon, delay }, index) => {
                const direction = index === 0 ? 'up' : index === industries.length - 1 ? 'down' : 'right';
                // Set initial position based on direction
                const getInitialPosition = () => {
                  switch (direction) {
                    case 'up':
                      return { opacity: 0, y: -40 };
                    case 'down':
                      return { opacity: 0, y: 40 };
                    case 'right':
                      return { opacity: 0, x: 50 };
                    default:
                      return { opacity: 0, x: 30 };
                  }
                };

                // Set final position (always center)
                const getFinalPosition = () => {
                  return { opacity: 1, x: 0, y: 0 };
                };

                // Curved margin pattern: 0, 30, 60, 60, 30, 0 (symmetric)
                const getMarginLeft = () => {
                  const margins = [0, 30, 60, 60, 30, 0];
                  return margins[index] || 0;
                };

                return (
                  <motion.div
                    key={title}
                    className="mb-4"
                    style={{ marginLeft: `${getMarginLeft()}px` }}
                    initial={getInitialPosition()}
                    whileInView={getFinalPosition()}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.8, delay, ease: 'easeOut' }}
                  >
                    <div
                      className="d-flex align-items-center gap-4 border bg-white px-5 py-4"
                      style={{
                        borderColor: 'rgba(2, 127, 214, 0.2)',
                        boxShadow: '0 10px 30px rgba(17, 63, 103, 0.08)',
                        cursor: 'pointer',
                        borderRadius: '16px',
                      }}
                    >
                      <div className="flex-shrink-0">
                        <div
                          className="d-flex align-items-center justify-content-center rounded-circle"
                          style={{
                            height: 48,
                            width: 48,
                            backgroundColor: '#d0e4ff',
                          }}
                        >
                          <Icon size={20} style={{ color: '#00477b' }} />
                        </div>
                      </div>
                      <div className="text-start">
                        <h3 className="fs-6 fw-semibold text-gray-900 mb-1">
                          {title}
                        </h3>
                        <p className="fs-7 text-gray-600 mb-0" style={{ lineHeight: '1.4' }}>
                          {description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

const StatisticsSection = () => (
  <motion.div
    className="mt-sm-n10 mt-10"
    id="achievements"
    variants={sectionReveal}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.3 }}
  >
    <div className="landing-curve landing-dark-color">
      <svg viewBox="15 -1 1470 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 48C4.93573 47.6644 8.85984 47.3311 12.7725 47H1489.16C1493.1 47.3311 1497.04 47.6644 1501 48V47H1489.16C914.668 -1.34764 587.282 -1.61174 12.7725 47H1V48Z" fill="currentColor" />
      </svg>
    </div>

    <div className="pb-15 pt-18 landing-dark-bg">
      <div className="container">
        <div className="text-center mt-15 mb-18" data-kt-scroll-offset="{default: 100, lg: 150}">
          <h3 className="fs-2hx text-white fw-bold mb-5">We Make Things Better</h3>
          <div className="fs-5 text-white fw-bold">
            Save thousands to millions of bucks by using single tool
            <br />
            for different amazing and great useful admin
          </div>
        </div>

        <div className="d-flex flex-center">
          <motion.div
            className="d-flex flex-wrap flex-center justify-content-lg-between mb-15 mx-auto w-xl-900px"
            variants={staggerContainer}
          >
            {stats.map(({ icon, value, suffix, label }) => (
              <motion.div
                className="d-flex flex-column flex-center h-200px w-200px h-lg-250px w-lg-250px m-3 bgi-no-repeat bgi-position-center bgi-size-contain"
                style={{ backgroundImage: "url('/assets/media/svg/misc/octagon.svg')" }}
                key={label}
                variants={fadeInUp}
                whileHover={{ scale: 1.05, rotate: 1 }}
                transition={{ type: 'spring', stiffness: 210, damping: 17 }}
              >
                <i className={`ki-duotone ${icon} fs-2tx text-white mb-3`}>
                  <span className="path1" />
                  <span className="path2" />
                  <span className="path3" />
                  <span className="path4" />
                </i>

                <div className="mb-0 text-center">
                  <div className="fs-lg-2hx fs-2x fw-bold text-white d-flex flex-center">
                    <div className="min-w-70px" data-kt-countup="true" data-kt-countup-value={value} data-kt-countup-suffix={suffix}>
                      0
                    </div>
                  </div>
                  <span className="text-white fw-semibold fs-5 lh-0">{label}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div className="fs-2 fw-semibold text-white text-center mb-3">
          <span className="fs-1 lh-1 text-white">“</span>
          When you care about your topic, you’ll write about it in a
          <br />
          <span className="text-white me-1">more powerful</span>, emotionally expressive way
          <span className="fs-1 lh-1 text-white">“</span>
        </div>
        <div className="fs-2 fw-semibold text-white text-center">
          <a href="#" className="link-light fs-4 fw-bold">
            Marcus Levy,
          </a>
          <span className="fs-4 fw-bold text-white">KeenThemes CEO</span>
        </div>
      </div>
    </div>

    <div className="landing-curve landing-dark-color">
      <svg viewBox="15 12 1470 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 11C3.93573 11.3356 7.85984 11.6689 11.7725 12H1488.16C1492.1 11.6689 1496.04 11.3356 1500 11V12H1488.16C913.668 60.3476 586.282 60.6117 11.7725 12H0V11Z" fill="currentColor" />
      </svg>
    </div>
  </motion.div>
);

const PaymentMethodsEcosystemSection = () => {
  const paymentMethods = [
    {
      title: 'Card Payments',
      description:
        'Supporting EMV chip, magnetic stripe and contactless payments with PCI-DSS compliance and tokenization',
      icon: CreditCard,
      delay: 0.2,
      direction: 'up',
    },
    {
      title: 'Cash Management',
      description:
        'Automated reconciliation and drawer balancing with real-time reporting',
      icon: PiggyBank,
      delay: 0.4,
      direction: 'right',
    },
    {
      title: 'QR Code Payments',
      description:
        'Dynamic QR generation supporting multiple digital wallets with instant settlement',
      icon: QrCode,
      delay: 0.6,
      direction: 'right',
    },
    {
      title: 'Digital Wallets',
      description:
        'Integration with Apple Pay, Google Pay, Samsung Pay and regional wallet solutions',
      icon: Wallet,
      delay: 0.8,
      direction: 'right',
    },
    {
      title: 'SoftPOS',
      description:
        'Turn smartphones into payment terminals with Android conversion technology',
      icon: Smartphone,
      delay: 1.0,
      direction: 'left',
    },
    {
      title: 'Payment Links',
      description:
        'Shareable URLs and SMS/email delivery options with customizable branding',
      icon: Link2,
      delay: 1.2,
      direction: 'down',
    },
  ];

  return (
    <motion.div
      className="py-10 py-lg-20 bg-light"
      variants={sectionReveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
    >
      <div className="container">
        <div className="text-center mb-12">
          <h3 className="fs-2hx text-gray-900 mb-5">
            Payment Methods Ecosystem
          </h3>
          <div className="fs-5 text-muted fw-semibold">
            15+ Integrated Payment Solutions
          </div>
        </div>

        <motion.div
          className="row g-8 g-lg-10 justify-content-center"
          variants={staggerContainer}
        >
          {paymentMethods.map(({ title, description, icon: Icon, delay, direction }) => {
            // Set initial position based on direction
            const getInitialPosition = () => {
              switch (direction) {
                case 'up':
                  return { opacity: 0, y: -40 };
                case 'down':
                  return { opacity: 0, y: 40 };
                case 'right':
                  return { opacity: 0, x: 50 };
                case 'left':
                  return { opacity: 0, x: -50 };
                default:
                  return { opacity: 0, y: 40 };
              }
            };

            // Responsive column classes: 4 cards top row (col-lg-3), 2 cards bottom row (col-lg-6)
            const getColumnClass = () => {
              const index = paymentMethods.findIndex((p) => p.title === title);
              // First 4 cards: col-lg-3 (4 per row), last 2 cards: col-lg-6 (2 per row)
              if (index < 4) {
                return 'col-md-6 col-lg-3';
              }
              return 'col-md-6 col-lg-6';
            };

            return (
              <motion.div
                key={title}
                className={`${getColumnClass()} d-flex`}
                initial={getInitialPosition()}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.8, delay, ease: 'easeOut' }}
                whileHover={{ translateY: -8, scale: 1.02 }}
              >
                <div
                  className="w-100 card-rounded p-8 text-start"
                  style={{
                    backgroundColor: '#ffffff',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <div
                    className="d-inline-flex align-items-center justify-content-center mb-5 rounded-circle"
                    style={{
                      width: 56,
                      height: 56,
                      backgroundColor: '#d0e4ff',
                    }}
                  >
                    <Icon size={24} style={{ color: '#00477b' }} />
                  </div>
                  <h4 className="fs-3 fw-bold text-gray-900 mb-4">
                    {title}
                  </h4>
                  <p className="fs-6 text-gray-700 mb-0">
                    {description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
};

const PricingSection = ({ plans, loading }) => {
  const formatPrice = (price) => Number(price ?? 0).toFixed(2);

  const planTypeLabel = (plan) => {
    const typeValue = typeof plan.plan_type === 'object' && plan.plan_type !== null
      ? plan.plan_type.value
      : plan.plan_type;
    if (!typeValue) return 'Monthly';
    const normalized = String(typeValue);
    return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
  };

  const formatCount = (count) => {
    if (count === null || count === undefined) return 'Unlimited';
    return new Intl.NumberFormat().format(count);
  };

  // Get currency symbol from plan (server-side handled)
  const getCurrencySymbol = (plan) => {
    return plan.currency_symbol || '$';
  };

  // Get the display price (with discount if available)
  const getDisplayPrice = (plan) => {
    const price = plan.price ?? 0;
    const currentPrice = plan.current_price;
    
    if (plan.has_discount && currentPrice) {
      return {
        current: currentPrice,
        original: price
      };
    }
    return {
      current: price,
      original: null
    };
  };

  return (
    <motion.div
      className="py-8 py-lg-12"
      id="pricing"
      variants={sectionReveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="container">
        <div className="text-center mb-12">
          <h3 className="fs-2hx text-dark fw-bold mb-5">Choose the Plan That Fits You</h3>
          <div className="fs-5 text-muted fw-semibold">
            Flexible pricing options with the same structure shown in the subscriptions page.
          </div>
        </div>

        {loading ? (
          <div className="d-flex justify-content-center my-10">
            <span className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} />
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-10">
            <div className="fs-4 text-muted mb-3">No plans available at the moment.</div>
            <div className="fs-6 text-muted opacity-75">Please check back later or contact us for more information.</div>
          </div>
        ) : (
          <motion.div
            className="row row-cols-xxl-4 row-cols-lg-3 row-cols-md-2 g-6 g-lg-8 justify-content-center"
            variants={staggerContainer}
            style={{ gap: '2rem' }}
          >
            {plans.map((plan) => {
              return (
                <motion.div
                  className="col d-flex"
                  key={plan.id}
                  variants={fadeInUp}
                >
                  <motion.div
                    className="h-100 d-flex flex-column justify-content-between rounded-3 bg-light bg-opacity-75 py-12 px-9 shadow-sm"
                    style={{ minWidth: '280px', width: '100%' }}
                    whileHover={{ translateY: -10, boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}
                    transition={{ type: 'spring', stiffness: 210, damping: 20 }}
                  >
                    <div className="mb-7 text-center">
                      <h1 className="text-gray-900 mb-5 fw-bolder fs-2">{plan.name || 'Plan Name Not Found'}</h1>
                      <div className="text-gray-600 fw-semibold mb-5 fs-6" style={{ lineHeight: '1.6' }}>{plan.description || 'Description not available'}</div>
                      <div className="text-center">
                        {(() => {
                          const currencySymbol = getCurrencySymbol(plan);
                          const prices = getDisplayPrice(plan);
                          return (
                            <>
                              <span className="mb-2 text-primary">{currencySymbol}</span>
                              <span className="fs-3x fw-bold text-primary">
                                {prices.current !== null && prices.current !== undefined ? formatPrice(prices.current) : 'N/A'}
                              </span>
                              <div className="fs-7 fw-semibold opacity-50">
                                / {planTypeLabel(plan)}
                              </div>
                              {prices.original && (
                                <div className="text-decoration-line-through text-muted fs-7">
                                  {currencySymbol}{formatPrice(prices.original)}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="w-100 mb-8">
                      {Array.isArray(plan.features) && plan.features.length > 0 ? (
                        plan.features.map((feature) => {
                          const featureName = feature?.name || 'Not Found';
                          const featureId = feature?.id || feature?.name || `feature-${Math.random()}`;
                          return (
                            <div 
                              className="d-flex align-items-center mb-4" 
                              key={`${plan.id}-feature-${featureId}`}
                              style={{ minHeight: '32px' }}
                            >
                              <span 
                                className={`fw-semibold fs-6 ${feature.is_enabled ? 'text-gray-800' : 'text-gray-600'} flex-grow-1 pe-3`}
                                style={{ wordBreak: 'break-word', lineHeight: '1.5' }}
                              >
                                {featureName}
                              </span>
                              {feature.is_enabled ? (
                                <i 
                                  className="ki-duotone ki-check-circle fs-1"
                                  style={{ color: '#027fd6' }}
                                >
                                  <span className="path1" />
                                  <span className="path2" />
                                </i>
                              ) : (
                                <i className="ki-duotone ki-cross-circle fs-1 text-muted">
                                  <span className="path1" />
                                  <span className="path2" />
                                </i>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-muted text-center py-4">
                          <div className="fs-6 mb-2">No features listed yet.</div>
                          <div className="fs-7 opacity-75">Features will be displayed here when available.</div>
                        </div>
                      )}
                    </div>

                    <motion.a
                      href={`/merchant/register?plan_id=${plan.id}`}
                      className="btn btn-sm btn-primary align-self-center mt-auto"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      Select
                    </motion.a>
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

const PartnersSection = () => {
  const partners = [
    {
      logo: '/parteners/faspay_logo.png',
      name: 'Partner 1',
    },
    {
      logo: '/parteners/faspay_logo_1.png',
      name: 'Partner 2',
    },
    {
      logo: '/parteners/faspay_logo.png',
      name: 'Partner 3',
    },
    {
      logo: '/parteners/faspay_logo_1.png',
      name: 'Partner 4',
    },
  ];

  return (
    <>
      <style>{`
        #partners {
          padding-top: 5rem;
          padding-bottom: 5rem;
        }
        @media (min-width: 992px) {
          #partners {
            padding-top: 8rem;
            padding-bottom: 8rem;
          }
        }
      `}</style>
      <motion.div
        className="py-10 py-lg-20"
        id="partners"
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
      <div className="container">
        <div className="text-center mb-12" style={{ marginTop: '2rem' }}>
          <h3 className="fs-2hx text-gray-900 mb-5" data-kt-scroll-offset="{default: 100, lg: 150}">
            Our Partners
          </h3>
          <div className="fs-5 text-muted fw-semibold">
            Trusted by leading businesses and organizations
          </div>
        </div>

        <motion.div
          className="row g-8 g-lg-10 justify-content-center align-items-center"
          variants={staggerContainer}
        >
          {partners.map((partner, index) => (
            <motion.div
              key={partner.name}
              className="col-6 col-md-4 col-lg-3 d-flex justify-content-center"
              variants={fadeInUp}
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 210, damping: 20, delay: index * 0.1 }}
            >
              <img
                src={partner.logo}
                alt={partner.name}
                className="img-fluid"
                style={{
                  maxWidth: '120px',
                  maxHeight: '80px',
                  objectFit: 'contain',
                }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
    </>
  );
};

const ProjectBlock = ({ type, image, images = [] }) => {
  if (type === 'large') {
    return (
      <div className="col-lg-6">
        <a className="d-block card-rounded overlay h-lg-100" data-fslightbox="lightbox-projects" href={image}>
          <div className="overlay-wrapper bgi-no-repeat bgi-position-center bgi-size-cover card-rounded h-lg-100 min-h-250px" style={{ backgroundImage: `url('${image}')` }} />
          <div className="overlay-layer card-rounded bg-dark bg-opacity-25">
            <i className="ki-duotone ki-eye fs-3x text-white">
              <span className="path1" />
              <span className="path2" />
              <span className="path3" />
            </i>
          </div>
        </a>
      </div>
    );
  }

  return (
    <div className="col-lg-6">
      <div className="row g-10 mb-10">
        {images.slice(0, 2).map((img) => (
          <div className="col-lg-6" key={img}>
            <a className="d-block card-rounded overlay" data-fslightbox="lightbox-projects" href={img}>
              <div className="overlay-wrapper bgi-no-repeat bgi-position-center bgi-size-cover card-rounded h-250px" style={{ backgroundImage: `url('${img}')` }} />
              <div className="overlay-layer card-rounded bg-dark bg-opacity-25">
                <i className="ki-duotone ki-eye fs-3x text-white">
                  <span className="path1" />
                  <span className="path2" />
                  <span className="path3" />
                </i>
              </div>
            </a>
          </div>
        ))}
      </div>
      {images[2] && (
        <a className="d-block card-rounded overlay" data-fslightbox="lightbox-projects" href={images[2]}>
          <div className="overlay-wrapper bgi-no-repeat bgi-position-center bgi-size-cover card-rounded h-250px" style={{ backgroundImage: `url('${images[2]}')` }} />
          <div className="overlay-layer card-rounded bg-dark bg-opacity-25">
            <i className="ki-duotone ki-eye fs-3x text-white">
              <span className="path1" />
              <span className="path2" />
              <span className="path3" />
            </i>
          </div>
        </a>
      )}
    </div>
  );
};

const ProjectsSection = () => (
  <motion.div
    className="mb-lg-n15 position-relative z-index-2"
    id="portfolio"
    variants={sectionReveal}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.25 }}
  >
    <div className="container">
      <div className="card" style={{ filter: 'drop-shadow(0px 0px 40px rgba(68, 81, 96, 0.08))' }}>
        <div className="card-body p-lg-20">
          <div className="text-center mb-5 mb-lg-10">
            <h3 className="fs-2hx text-gray-900 mb-5" data-kt-scroll-offset="{default: 100, lg: 250}">
              Our Products
            </h3>
            <div className="fs-5 text-muted fw-semibold">
              Discover our range of payment hardware solutions
            </div>
          </div>

          <div className="d-flex flex-center mb-5 mb-lg-15">
            <ul className="nav border-transparent flex-center fs-5 fw-bold">
              {projectTabs.map(({ id, label, isActive }) => (
                <li className="nav-item" key={id}>
                  <a
                    className={`nav-link text-gray-500 text-active-primary px-3 px-lg-6${isActive ? ' active' : ''}`}
                    href="#"
                    data-bs-toggle="tab"
                    data-bs-target={`#kt_landing_projects_${id}`}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="tab-content">
            {projectTabs.map(({ id, isActive, blocks }) => (
              <div
                className={`tab-pane fade${isActive ? ' show active' : ''}`}
                id={`kt_landing_projects_${id}`}
                key={id}
              >
                <div className="row g-10">
                  {blocks.map((block, index) => (
                    <ProjectBlock key={`${id}-${index}`} {...block} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

const TestimonialsSection = () => (
  <motion.div
    className="mt-20 mb-n20 position-relative z-index-2 py-10 py-lg-20"
    style={{ marginTop: '6rem' }}
    variants={sectionReveal}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.25 }}
  >
    <div className="container">
      <div className="text-center mb-17">
        <h3 className="fs-2hx text-gray-900 mb-5" id="clients" data-kt-scroll-offset="{default: 125, lg: 150}">
          What Our Clients Say
        </h3>
        <div className="fs-5 text-muted fw-bold">
          Trusted by merchants worldwide to streamline payments
          <br />
          and grow their business with powerful POS solutions
        </div>
      </div>

      <motion.div
        className="row g-lg-10 mb-10 mb-lg-20"
        variants={staggerContainer}
      >
        <div className="col-lg-4">
          <motion.div
            className="d-flex flex-column justify-content-between h-lg-100 px-10 px-lg-0 pe-lg-10 mb-15 mb-lg-0"
            variants={fadeInUp}
            whileHover={{ translateY: -8 }}
          >
            <div className="mb-7">
              <div className="rating mb-6">
                {[...Array(5)].map((_, index) => (
                  <div className="rating-label me-2 checked" key={`testimonial-1-star-${index}`}>
                    <i className="ki-duotone ki-star fs-5">
                      <span className="path1" />
                      <span className="path2" />
                    </i>
                  </div>
                ))}
              </div>
              <div className="fs-2 fw-bold text-gray-900 mb-3">
                FastPOS transformed our
                <br />
                payment operations completely
              </div>
              <div className="text-gray-500 fw-semibold fs-4">
                Switching to FastPOS Cloud was the best decision we made. The real-time analytics help us make data-driven decisions, and the seamless payment processing has increased our checkout speed by 40%. Our customers love the quick transactions.
              </div>
            </div>
          </motion.div>
        </div>
        <div className="col-lg-4">
          <motion.div
            className="d-flex flex-column justify-content-between h-lg-100 px-10 px-lg-0 pe-lg-10 mb-15 mb-lg-0"
            variants={fadeInUp}
            whileHover={{ translateY: -8 }}
          >
            <div className="mb-7">
              <div className="rating mb-6">
                {[...Array(5)].map((_, index) => (
                  <div className="rating-label me-2 checked" key={`testimonial-2-star-${index}`}>
                    <i className="ki-duotone ki-star fs-5">
                      <span className="path1" />
                      <span className="path2" />
                    </i>
                  </div>
                ))}
              </div>
              <div className="fs-2 fw-bold text-gray-900 mb-3">
                Inventory management
                <br />
                has never been easier
              </div>
              <div className="text-gray-500 fw-semibold fs-4">
                The cloud-based POS system keeps all our locations synchronized in real-time. We can track inventory across multiple stores, manage staff schedules, and process payments from anywhere. The mobile app is a game-changer for our busy restaurant.
              </div>
            </div>
          </motion.div>
        </div>
        <div className="col-lg-4">
          <motion.div
            className="d-flex flex-column justify-content-between h-lg-100 px-10 px-lg-0 pe-lg-10 mb-15 mb-lg-0"
            variants={fadeInUp}
            whileHover={{ translateY: -8 }}
          >
            <div className="mb-7">
              <div className="rating mb-6">
                {[...Array(5)].map((_, index) => (
                  <div className="rating-label me-2 checked" key={`testimonial-3-star-${index}`}>
                    <i className="ki-duotone ki-star fs-5">
                      <span className="path1" />
                      <span className="path2" />
                    </i>
                  </div>
                ))}
              </div>
              <div className="fs-2 fw-bold text-gray-900 mb-3">
                Multiple payment methods
                <br />
                in one integrated platform
              </div>
              <div className="text-gray-500 fw-semibold fs-4">
                FastPOS supports all the payment methods our customers prefer - cards, digital wallets, QR codes, and more. The reporting dashboard gives us insights we never had before. Setup was quick and the support team is always responsive.
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  </motion.div>
);

const ContactPartnershipSection = () => {
  const cards = [
    {
      icon: MapPin,
      title: 'Direct Contact',
      description: (
        <>
          The Metropolis Tower,
          <br />
          Office 1007, Business
          <br />
          Bay, Dubai, United Arab
          <br />
          Emirates
          <br />
          <br />
          Email: info@corenet-tech.com
          <br />
          Phone: +971 52 221 7717
        </>
      ),
      delay: 0.1,
    },
    {
      icon: Monitor,
      title: 'Schedule Demo',
      description: 'Book a POS workflow demo: checkout flows, inventory sync, staff roles, and real-time sales dashboards tailored to your stores',
      delay: 0.2,
    },
    {
      icon: Key,
      title: 'Request Trial',
      description: 'Get a trial tenant with POS terminals, SoftPOS, and dashboard access so your team can run test transactions end-to-end',
      delay: 0.3,
    },
    {
      icon: CalendarCheck,
      title: 'Book Consultation',
      description: 'Review your POS setup (devices, payment methods, outlets) with our team and receive a rollout plan with training steps',
      delay: 0.4,
    },
  ];

  return (
    <motion.div
      className="py-10 py-lg-20"
      variants={sectionReveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
    >
      <div className="container">
        <div className="text-center mb-12">
          <h3 className="fs-2hx text-gray-900 mb-5 fw-bold">
            Contact & Partnership Opportunities
          </h3>
          <div className="fs-5 text-muted fw-semibold">
            Let&apos;s discuss how FastPay can accelerate your business growth
          </div>
        </div>

        <motion.div
          className="row g-8 g-lg-10 justify-content-center"
          variants={staggerContainer}
        >
          {cards.map(({ icon: Icon, title, description, delay }) => (
            <motion.div
              key={title}
              className="col-md-6 col-lg-3 d-flex"
              variants={fadeInUp}
              whileHover={{ translateY: -8, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 210, damping: 20, delay }}
            >
              <div
                className="w-100 card-rounded p-8 text-center"
                style={{
                  backgroundColor: '#ffffff',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                }}
              >
                <div
                  className="d-inline-flex align-items-center justify-content-center mb-5 rounded-circle mx-auto d-block"
                  style={{
                    width: 56,
                    height: 56,
                    backgroundColor: '#d0e4ff',
                  }}
                >
                  <Icon size={24} style={{ color: '#00477b' }} />
                </div>
                <h4 className="fs-3 fw-bold text-gray-900 mb-4 text-center">
                  {title}
                </h4>
                <p className="fs-6 text-gray-700 mb-0 text-center">
                  {description}
                </p>
                {title !== 'Direct Contact' && (
                  <button
                    type="button"
                    className="btn mt-5"
                    style={{
                      backgroundColor: '#d0e4ff',
                      border: 'none',
                      color: '#00477b',
                      padding: '0.85rem 1.6rem',
                    }}
                    onClick={() => {
                      window.dispatchEvent(new Event('openContactModal'));
                      if (typeof window !== 'undefined') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                  >
                    Contact Us
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

const CompanyFooter = () => (
  <motion.div
    className="mb-0"
    id="contact"
    variants={sectionReveal}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.3 }}
  >
    <div className="landing-curve landing-dark-color">
      <svg viewBox="15 -1 1470 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 48C4.93573 47.6644 8.85984 47.3311 12.7725 47H1489.16C1493.1 47.3311 1497.04 47.6644 1501 48V47H1489.16C914.668 -1.34764 587.282 -1.61174 12.7725 47H1V48Z" fill="currentColor" />
      </svg>
    </div>

    <div className="landing-dark-bg pt-20">
      
      <div className="container">
        <div className="row py-10 py-lg-20">
          <div className="col-lg-6 pe-lg-16 mb-10 mb-lg-0">
            <div className="rounded landing-dark-border p-9 mb-10 ms-2">
              <h2 className="text-white mb-4">Contact Us</h2>
              <div className="fw-normal fs-5 text-white opacity-85 mb-3">
                <strong className="text-white">Address:</strong>
                <br />
                <span className="text-white opacity-90 text-hover-primary">The Metropolis Tower, Office 1007, Business Bay, Dubai</span>
              </div>
              <div className="fw-normal fs-5 text-white opacity-85 mb-3">
                <strong className="text-white">Email:</strong>
                <br />
                <a href="mailto:info@corenet-tech.com" className="text-white opacity-95 text-hover-primary">
                  info@corenet-tech.com
                </a>
              </div>
              <div className="fw-normal fs-5 text-white opacity-85">
                <strong className="text-white">Phone:</strong>
                <br />
                <a href="tel:+971522217717" className="text-white opacity-95 text-hover-primary">
                  +971 52 221 7717
                </a>
              </div>
            </div>
          </div>
          <div className="col-lg-6 ps-lg-16">
            <div className="d-flex justify-content-start justify-content-lg-start">
              <div className="d-flex fw-semibold flex-column align-items-start text-start">
                <h4 className="fw-bold text-white mb-6">Quick Links</h4>
                <a href="#home" className="text-white opacity-95 text-hover-primary fs-5 mb-6">
                  Home
                </a>
                <a href="#how-it-works" className="text-white opacity-95 text-hover-primary fs-5 mb-6">
                  How it Works
                </a>
                <a href="#pricing" className="text-white opacity-95 text-hover-primary fs-5 mb-6">
                  Pricing
                </a>
                <a href="#team" className="text-white opacity-95 text-hover-primary fs-5 mb-6">
                  Team
                </a>
                <a href="#portfolio" className="text-white opacity-95 text-hover-primary fs-5">
                  Portfolio
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="landing-dark-separator" />

      <div className="container">
          <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-4 p-7 py-lg-10 text-center text-md-start">
          <div className="d-flex flex-column align-items-center align-items-md-start order-2 order-md-1">
            <div className="d-flex align-items-center mb-3">
              <a href="/">
                <img 
                  alt="Fastpay Logo" 
                  src="/faspay_logo.png" 
                  className="h-25px h-md-30px"
                />
              </a>
            </div>
            <div className="fs-6 fw-semibold text-gray-600 mb-2">
              Powered by <span className="text-white fw-bold">CoreNet Technologies</span>
            </div>
            <div className="fs-7 text-white opacity-95 text-hover-primary">
              The Metropolis Tower, Office 1007, Business Bay, Dubai
            </div>
            <div className="fs-7 text-gray-600">
              <a href="mailto:info@corenet-tech.com" className="text-white opacity-95 text-hover-primary">
                info@corenet-tech.com
              </a>
              {' | '}
              <a href="tel:+971522217717" className="text-white opacity-95 text-hover-primary">
                +971 52 221 7717
              </a>
            </div>
          </div>
          <div className="order-1 order-md-2">
            <div className="fs-6 fw-semibold text-white opacity-95 text-hover-primary">
              &copy; {new Date().getFullYear()} FastPOS. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

const ScrollTop = () => (
  <div
    id="kt_scrolltop"
    className="scrolltop"
    data-kt-scrolltop="true"
    style={{ bottom: '110px' }}
  >
    <i className="ki-duotone ki-arrow-up">
      <span className="path1" />
      <span className="path2" />
    </i>
  </div>
);

function LandingPage() {
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    // Add global error handler to catch script errors
    const errorHandler = (event) => {
      // Suppress errors from external scripts trying to access null elements
      if (event.error && event.error.message && 
          (event.error.message.includes('querySelector') || 
           event.error.message.includes('Cannot read properties of null'))) {
        event.preventDefault();
        console.warn('Suppressed non-critical script error:', event.error.message);
        return false;
      }
    };

    window.addEventListener('error', errorHandler, true);

    const fetchPlans = async () => {
      try {
        const response = await axios.get(PUBLIC_ENDPOINTS.PLANS);
        const data = response.data?.data ?? response.data ?? [];
        setPlans(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load plans:', error);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();

    return () => {
      window.removeEventListener('error', errorHandler, true);
    };
  }, []);

  useEffect(() => {
    const { className, id } = document.body;
    const prevAttributes = {
      'data-bs-spy': document.body.getAttribute('data-bs-spy'),
      'data-bs-target': document.body.getAttribute('data-bs-target'),
    };

    document.body.className = 'bg-body position-relative app-blank';
    document.body.id = 'kt_body';
    document.body.setAttribute('data-bs-spy', 'scroll');
    document.body.setAttribute('data-bs-target', '#kt_landing_menu');

    const appendedLinks = cssAssets
      .map((href) => {
        if (!document.head) return null;
        if (document.querySelector(`link[data-landing-css="${href}"]`)) return null;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.landingCss = href;
        document.head.appendChild(link);
        return link;
      })
      .filter(Boolean);

    // Load scripts after a small delay to ensure React has rendered
    const loadScripts = () => {
      if (!document.body) {
        setTimeout(loadScripts, 50);
        return;
      }

      scriptAssets.forEach((src) => {
        if (document.querySelector(`script[data-landing-js="${src}"]`)) return;
        const script = document.createElement('script');
        script.src = src;
        script.defer = true;
        script.dataset.landingJs = src;
        
        // Add error handling to prevent crashes
        script.onerror = () => {
          console.warn(`Failed to load script: ${src}`);
        };
        
        // For scripts that need DOM, wait for load and ensure DOM is ready
        script.onload = () => {
          // Wait for React to finish rendering
          setTimeout(() => {
            try {
              // Re-initialize any scripts that need DOM elements
              if (typeof window.KTComponents !== 'undefined' && window.KTComponents.init) {
                window.KTComponents.init();
              }
              // Try to initialize general.js functionality safely
              if (typeof window.KTGeneral !== 'undefined' && window.KTGeneral.init) {
                const target = document.querySelector('#kt_body') || document.body;
                if (target) {
                  window.KTGeneral.init(target);
                }
              }
            } catch (e) {
              // Silently fail - these are enhancement scripts
              console.warn('Script initialization error (non-critical):', e);
            }
          }, 200);
        };
        
        document.body.appendChild(script);
      });
    };

    // Delay script loading to ensure React has rendered
    setTimeout(loadScripts, 100);

    return () => {
      if (document.body) {
        document.body.className = className;
        document.body.id = id;
        Object.entries(prevAttributes).forEach(([attr, value]) => {
          if (value === null) {
            document.body.removeAttribute(attr);
          } else {
            document.body.setAttribute(attr, value);
          }
        });
      }
      appendedLinks.forEach((link) => {
        if (link && link.parentNode) {
          link.remove();
        }
      });
      
      // Clean up scripts
      document.querySelectorAll('script[data-landing-js]').forEach((script) => {
        if (script.parentNode) {
          script.remove();
        }
      });
    };
  }, []);

  return (
    <div className="d-flex flex-column flex-root" id="kt_app_root">
      <div
        className="mb-0"
        id="home"
      >
        <TawkChat />
        <div
          className="bgi-no-repeat bgi-size-contain bgi-position-x-center bgi-position-y-bottom landing-dark-bg"
          style={{ backgroundImage: "url(/assets/media/svg/illustrations/landing.svg)" }}
        >
          <LandingHeader />
          <HeroSection />
        </div>

        <div className="landing-curve landing-dark-color mb-10 mb-lg-20">
          <svg viewBox="15 12 1470 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 11C3.93573 11.3356 7.85984 11.6689 11.7725 12H1488.16C1492.1 11.6689 1496.04 11.3356 1500 11V12H1488.16C913.668 60.3476 586.282 60.6117 11.7725 12H0V11Z" fill="currentColor" />
          </svg>
        </div>
      </div>

      {/* <HowItWorksSection /> */}
      <AboutSection />
      <BusinessChallengesSection />
      <POSKeyFeaturesSectionMobile />
      <POSKeyFeaturesSection />
      {/* <EcosystemOverviewSection /> */}
      <ConnectAnywhereSection />
      {/* <StatisticsSection /> */}
      {/* <PaymentMethodsEcosystemSection /> */}
      <PricingSection plans={plans} loading={loadingPlans} />
      <ProjectsSection />
      {/* <TestimonialsSection /> */}
      <PartnersSection />
      <ContactPartnershipSection />
      <CompanyFooter />
      <ScrollTop />
    </div>
  );
}

export default LandingPage;
