import React from 'react';

const defaultSections = [
  {
    title: '1. Agreement Overview',
    body: 'These Contract Terms & Conditions govern the use of Corenet Tech payment and POS solutions. By continuing to use our services, you agree to comply with the obligations outlined below.',
  },
  {
    title: '2. Merchant Responsibilities',
    list: [
      'Provide accurate and up-to-date business information.',
      'Maintain compliance with all applicable laws and regulations.',
      'Safeguard account credentials and restrict unauthorized access.',
      'Promptly notify Corenet Tech of any security incidents or account compromises.',
    ],
  },
  {
    title: '3. Service Commitments',
    list: [
      'We process payments and settlements according to the agreed schedule.',
      'We maintain PCI DSS compliant infrastructure and security practices.',
      'We offer customer support via the channels listed on our website.',
      'We will notify you in advance of any material changes to these terms.',
    ],
  },
  {
    title: '4. Fees & Billing',
    body: 'Fees are assessed based on the pricing schedule in your onboarding documents. Additional services may incur separate fees; these will always be communicated before activation.',
  },
  {
    title: '5. Data Usage',
    body: 'Corenet Tech may collect and process transaction and usage data to deliver services, ensure compliance, and improve platform reliability. Refer to our Privacy Policy for more information.',
  },
  {
    title: '6. Termination',
    list: [
      'Either party may terminate the agreement with written notice.',
      'Immediate termination may occur in cases of fraud, illegal activity, or material breach.',
      'Outstanding balances remain payable upon termination.',
    ],
  },
  {
    title: '7. Governing Law',
    body: 'These terms are governed by the laws of the jurisdiction stated in your merchant agreement. Any disputes will be resolved through the dispute resolution process described therein.',
  },
];

export default function TermsPage() {
  const lastUpdated = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="bg-body py-5">
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-xl-8">
            <header className="mb-5 text-center">
              <h1 className="fw-bold mb-2">Contract Terms &amp; Conditions</h1>
              <p className="text-muted mb-0">Last updated: {lastUpdated}</p>
            </header>

            <div className="d-flex flex-column gap-4">
              {defaultSections.map(({ title, body, list }) => (
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
                </section>
              ))}

              <section className="bg-success-subtle border border-success-subtle rounded-4 p-4 p-md-5 text-center">
                <h2 className="h4 fw-semibold mb-3">Have questions about our terms?</h2>
                <p className="text-muted mb-4">
                  Reach out to our support team or start your registration to continue.
                </p>
                <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
                  <a href="/merchant/register" className="btn btn-success px-4 py-2">
                    Register Now
                  </a>
                  <a href="/support" className="btn btn-outline-success px-4 py-2">
                    Contact Support
                  </a>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}










