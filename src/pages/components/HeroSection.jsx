import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import axios from 'axios';
import { PUBLIC_ENDPOINTS } from '../../utils/constants';
import HeroCopy from './HeroCopy';
import HeroDevices from './HeroDevices';
import HeroClients from './HeroClients';

const ContactModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setErrors({});
      setFeedback(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    setErrors({});

    try {
      const payload = {
        ...formData,
        source: 'landing_hero',
        page_url: window.location.href,
      };

      const response = await axios.post(PUBLIC_ENDPOINTS.CONTACT_US, payload);
      const successMessage = response?.data?.data?.message ?? 'Thanks! We have your details.';

      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        message: '',
      });
      // Close modal and show a SweetAlert2 confirmation
      onClose();
      Swal.fire({
        icon: 'success',
        title: 'Request received',
        text: successMessage || 'Your request has been received. Our support team will contact you shortly.',
        confirmButtonText: 'Got it',
      });
    } catch (error) {
      const validationErrors = error?.response?.data?.errors;

      if (validationErrors) {
        setErrors(validationErrors);
      } else {
        setFeedback('We could not submit your request. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.65)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Contact Us</h5>
            <button type="button" className="btn btn-sm btn-icon" aria-label="Close" onClick={onClose}>
              <i className="ki-duotone ki-cross fs-2">
                <span className="path1" />
                <span className="path2" />
              </i>
            </button>
          </div>
          <div className="modal-body">
            <p className="text-muted mb-4">
              Share a few details and our team will reach out with a tailored walkthrough.
            </p>
            {feedback && (
              <div className="alert alert-info" role="alert">
                {feedback}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="row g-4">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name[0]}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Email</label>
                  <input
                    type="email"
                    name="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email[0]}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                    placeholder="+971 5X XXX XXXX"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                  {errors.phone && <div className="invalid-feedback">{errors.phone[0]}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Company</label>
                  <input
                    type="text"
                    name="company"
                    className={`form-control ${errors.company ? 'is-invalid' : ''}`}
                    placeholder="Company name"
                    value={formData.company}
                    onChange={handleChange}
                  />
                  {errors.company && <div className="invalid-feedback">{errors.company[0]}</div>}
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">How can we help?</label>
                  <textarea
                    name="message"
                    rows={4}
                    className={`form-control ${errors.message ? 'is-invalid' : ''}`}
                    placeholder="Tell us about your business and what you need"
                    value={formData.message}
                    onChange={handleChange}
                    required
                  />
                  {errors.message && <div className="invalid-feedback">{errors.message[0]}</div>}
                </div>
              </div>
              <div className="d-flex justify-content-end gap-3 mt-6">
                <button type="button" className="btn btn-light" onClick={onClose} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                      Sending...
                    </>
                  ) : (
                    'Send Request'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// Local animation variants (kept inside to keep this section self-contained)
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

const fadeInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};

const HeroSection = () => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    const openHandler = () => setShowContactModal(true);
    window.addEventListener('openContactModal', openHandler);
    return () => {
      window.removeEventListener('openContactModal', openHandler);
    };
  }, []);

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

  return (
    <motion.div
      className="d-flex flex-column w-100 min-h-350px min-h-lg-500px px-9 py-10 py-lg-20"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      style={{ position: 'relative', overflow: 'visible' }}
    >
      <div className="container">
        <div className="row g-10 align-items-center">
          <HeroCopy
            fadeInLeft={fadeInLeft}
            fadeInUpSlow={fadeInUpSlow}
            fadeInUp={fadeInUp}
            onOpenContact={() => setShowContactModal(true)}
          />
          <HeroDevices
            rotation={rotation}
            isHovering={isHovering}
            handleMouseMove={handleMouseMove}
            handleMouseLeave={handleMouseLeave}
            handleMouseEnter={handleMouseEnter}
          />
        </div>
      </div>

      <HeroClients
        staggerContainer={staggerContainer}
        fadeInUp={fadeInUp}
      />
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
      />
    </motion.div>
  );
};

export default HeroSection;

