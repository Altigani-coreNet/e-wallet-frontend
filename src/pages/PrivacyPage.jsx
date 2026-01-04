import React from 'react';

const sections = [
  {
    title: '1. Introduction',
    body: 'At Corenet Tech, we take your privacy seriously. This policy describes how we collect, use, and protect your personal information.',
  },
  {
    title: '2. Information We Collect',
    list: [
      'Account information (name, email, phone)',
      'Business information',
      'Transaction data',
      'Device information',
      'Usage data',
    ],
  },
  {
    title: '3. How We Use Your Information',
    list: [
      'Process payments',
      'Provide POS services',
      'Improve our services',
      'Communicate with you',
      'Comply with regulations',
    ],
  },
  {
    title: '4. Data Security',
    list: [
      'Encryption in transit and at rest',
      'Regular security audits',
      'Access controls',
      'Employee training',
      'Compliance with industry standards',
    ],
  },
  {
    title: '5. Data Sharing',
    content: (
      <>
        <p>We may share your information with:</p>
        <ul className="mb-0">
          <li>Payment processors</li>
          <li>Banking partners</li>
          <li>Service providers</li>
          <li>Regulatory authorities</li>
        </ul>
        <p className="mt-3 mb-0">We never sell your personal information.</p>
      </>
    ),
  },
  {
    title: '6. Your Rights',
    list: [
      'Access your data',
      'Correct your data',
      'Delete your data',
      'Export your data',
      'Opt out of communications',
    ],
  },
  {
    title: '7. Cookies',
    list: [
      'Maintain your session',
      'Remember your preferences',
      'Analyze site usage',
      'Improve our services',
    ],
  },
  {
    title: '8. Contact Us',
    content: (
      <ul className="list-unstyled mb-0">
        <li>
          <span className="fw-semibold">Email:</span> privacy@corenettech.com
        </li>
        <li>
          <span className="fw-semibold">Phone:</span> +1 (555) 123-4567
        </li>
      </ul>
    ),
  },
];

export default function PrivacyPage() {
  const lastUpdated = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="bg-body-secondary py-5">
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <header className="mb-5 text-center">
              <h1 className="fw-bold mb-2">Privacy Policy</h1>
              <p className="text-muted mb-0">Last updated: {lastUpdated}</p>
            </header>

            <div className="d-flex flex-column gap-4">
              {sections.map(({ title, body, list, content }) => (
                <section key={title} className="bg-white border rounded-4 shadow-sm p-4 p-md-5">
                  <h2 className="h4 fw-semibold mb-3">{title}</h2>
                  {body && <p className="mb-0 text-muted">{body}</p>}
                  {list && (
                    <ul className="mb-0 text-muted">
                      {list.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {content}
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}










