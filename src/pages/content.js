// Centralized content/config for the Landing page
// This keeps React components in LandingPage.jsx focused on layout & behavior.

export const cssAssets = [
  '/assets/plugins/global/plugins.bundle.css',
  '/assets/css/style.bundle.css',
];

export const scriptAssets = [
  '/assets/plugins/global/plugins.bundle.js',
  '/assets/js/scripts.bundle.js',
  '/assets/plugins/custom/fslightbox/fslightbox.bundle.js',
  '/assets/plugins/custom/typedjs/typedjs.bundle.js',
  '/assets/js/custom/landing.js',
  '/assets/js/custom/pages/pricing/general.js',
];

export const menuLinks = [
  { label: 'Home', href: '#home', isActive: true },
  { label: 'About Us', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Packages', href: '#pricing' },
  { label: 'Contact', href: '#contact' },
];

export const clientLogos = [  
  { title: 'Mastercard', src: '/assets/media/svg/card-logos/mastercard.svg' },
  { title: 'Apple Pay', src: '/assets/media/svg/card-logos/apple-pay-svgrepo-com_4.png' },
  { title: 'Google Pay', src: '/assets/media/svg/card-logos/google-pay-svgrepo-com_3.png' },
  { title: 'American Express', src: '/assets/media/svg/card-logos/american-express.svg' },
  // { title: 'Bitcoin', src: '/assets/media/svg/card-logos/bitcoin 1.svg' },
  { title: 'Visa', src: '/assets/media/svg/card-logos/visa.svg' },

];

export const howItWorksSteps = [
  {
    badge: '1',
    title: 'Create Your Account',
    lines: [
      'Sign up for your FastPOS Cloud account',
      'Add your business details and locations',
      'Get ready to start accepting payments',
    ],
    image: '/assets/media/illustrations/sketchy-1/2.png',
  },
  {
    badge: '2',
    title: 'We Review Your Application',
    lines: [
      'Our team securely reviews your application',
      'We verify your business and compliance',
      'You get approved and onboarded quickly',
    ],
    image: '/assets/media/illustrations/sketchy-1/8.png',
  },
  {
    badge: '3',
    title: 'Start Selling & Get Paid',
    lines: [
      'Enjoy seamless payments across all channels',
      'Track sales, purchases, and inventory in real time',
      'Grow your business with powerful insights',
    ],
    image: '/assets/media/illustrations/sketchy-1/12.png',
  },
];

export const productShots = [
  '/assets/media/illustrations/sketchy-1/8.png',
  '/assets/media/illustrations/sketchy-1/8.png',
  '/assets/media/illustrations/sketchy-1/8.png',
  '/assets/media/illustrations/sketchy-1/8.png',

];

export const stats = [
  {
    icon: 'ki-element-11',
    value: '700',
    suffix: '+',
    label: 'Known Companies',
  },
  {
    icon: 'ki-chart-pie-4',
    value: '80',
    suffix: 'K+',
    label: 'Statistic Reports',
  },
  {
    icon: 'ki-basket',
    value: '35',
    suffix: 'M+',
    label: 'Secure Payments',
  },
];

export const teamMembers = [
  {
    name: 'Alaa Aldeen',
    role: 'Manager',
    avatar: '/assets/media/avatars/300-1.jpg',
  },
  {
    name: 'Divya Ghildiyal',
    role: 'Product Management',
    avatar: '/assets/media/avatars/300-2.jpg',
  },
  {
    name: 'Gaffer Hussien Seddig',
    role: 'Project Manager',
    avatar: '/assets/media/avatars/300-1.jpg',
  },
  {
    name: 'Mohammed Altigani',
    role: 'Team Lead',
    avatar: '/assets/media/avatars/300-23.jpg',
  },
  {
    name: 'Sayed Zaeem',
    role: 'Senior Team Lead',
    avatar: '/assets/media/avatars/300-1.jpg',
  },
];

export const projectTabs = [
  {
    id: 'checkout',
    label: 'Checkout Devices',
    isActive: true,
    blocks: [
      {
        type: 'large',
        image: '/Product/Checkout/538f733c45483e16e660ec0e59753e58.png',
      },
      {
        type: 'grid',
        images: [
          '/Product/Checkout/5b919e9593b022194cc4803160ea2f14.webp',
          '/Product/Checkout/747427c2bfe83a8f4d3b5d1ecf26b248.webp',
          '/Product/Checkout/856d5bf2caab2e072bac8e7122d1f65b.webp',
        ],
      },
    ],
  },
  {
    id: 'mobility',
    label: 'Mobility Devices',
    blocks: [
      {
        type: 'large',
        image: '/Product/Mobilty/e6544a091beeb304442ff01cce7f9d68.webp',
      },
      {
        type: 'grid',
        images: [
          '/Product/Mobilty/79587c30802753f84b307fb8e1926b2c.webp',
          '/Product/Mobilty/b037d19a52b4606df4124413ebd85507.webp',
          '/Product/Mobilty/4ae398e203fd3f65594973aaf6c7ab3f.webp',
        ],
      },
    ],
  },
  {
    id: 'accessor',
    label: 'Access Devices',
    blocks: [
      {
        type: 'large',
        image: '/Product/Accessor/02ddffc0d8640b6ec52800070bd6391e.png',
      },
      {
        type: 'grid',
        images: [
          '/Product/Accessor/156bfacc06fafc0610b778f33e60e6f8.webp',
          '/Product/Accessor/7750067a92d7459388e432d85124e5c8.webp',
          '/Product/Accessor/f3614d5b746fd5f17d1c1412fa18ff48.webp',
        ],
      },
    ],
  },
];







