import React from 'react';
import { Link } from 'react-router-dom';
import { GridPattern } from '../components/GridPattern';

const PrivacyPolicy = () => {
    return (
        <div className="relative min-h-screen bg-secondary-50">
            <GridPattern
                className="absolute inset-0 stroke-primary-200/40 [mask-image:radial-gradient(white,transparent_85%)] opacity-20"
                width={60}
                height={60}
            />

            <div className="relative z-10 py-20 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
                        <p className="text-gray-600 mb-8">Last updated: December 2, 2024</p>

                        <div className="prose max-w-none">
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
                                <p className="text-gray-700 mb-4">
                                    At PDF Swift ("we," "our," or "us"), we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our PDF conversion and editing services.
                                </p>
                                <p className="text-gray-700">
                                    By using PDF Swift, you agree to the collection and use of information in accordance with this policy.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>

                                <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Files You Upload</h3>
                                <p className="text-gray-700 mb-4">
                                    We temporarily store files you upload for conversion or editing. These files are:
                                </p>
                                <ul className="list-disc pl-6 mb-4 text-gray-700">
                                    <li>Processed immediately upon upload</li>
                                    <li>Automatically deleted after 1 hour</li>
                                    <li>Never accessed by our staff</li>
                                    <li>Never shared with third parties</li>
                                    <li>Stored securely with encryption</li>
                                </ul>

                                <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Account Information</h3>
                                <p className="text-gray-700 mb-4">
                                    If you create an account, we collect:
                                </p>
                                <ul className="list-disc pl-6 mb-4 text-gray-700">
                                    <li>Email address</li>
                                    <li>Name (optional)</li>
                                    <li>Password (encrypted)</li>
                                    <li>Subscription status</li>
                                </ul>

                                <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3 Usage Data</h3>
                                <p className="text-gray-700 mb-4">
                                    We collect anonymous usage statistics including:
                                </p>
                                <ul className="list-disc pl-6 mb-4 text-gray-700">
                                    <li>Number of conversions performed</li>
                                    <li>Types of conversions used</li>
                                    <li>Browser type and version</li>
                                    <li>Device type</li>
                                    <li>IP address (anonymized)</li>
                                </ul>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
                                <p className="text-gray-700 mb-4">
                                    We use collected information for:
                                </p>
                                <ul className="list-disc pl-6 mb-4 text-gray-700">
                                    <li>Providing and improving our services</li>
                                    <li>Processing your document conversions</li>
                                    <li>Managing your account and subscription</li>
                                    <li>Sending service-related communications</li>
                                    <li>Analyzing usage patterns to improve performance</li>
                                    <li>Detecting and preventing fraud</li>
                                </ul>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Security</h2>
                                <p className="text-gray-700 mb-4">
                                    We implement industry-standard security measures:
                                </p>
                                <ul className="list-disc pl-6 mb-4 text-gray-700">
                                    <li>SSL/TLS encryption for data in transit</li>
                                    <li>AES-256 encryption for data at rest</li>
                                    <li>Automatic file deletion after 1 hour</li>
                                    <li>Regular security audits</li>
                                    <li>Secure payment processing via Stripe</li>
                                </ul>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Cookies</h2>
                                <p className="text-gray-700 mb-4">
                                    We use cookies to enhance your experience. See our <Link to="/cookie-policy" className="text-primary hover:underline">Cookie Policy</Link> for details.
                                </p>
                                <p className="text-gray-700">
                                    You can disable cookies in your browser settings, but some features may not function properly.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Third-Party Services</h2>
                                <p className="text-gray-700 mb-4">
                                    We use the following third-party services:
                                </p>
                                <ul className="list-disc pl-6 mb-4 text-gray-700">
                                    <li><strong>Stripe:</strong> For payment processing</li>
                                    <li><strong>MongoDB Atlas:</strong> For database hosting</li>
                                    <li><strong>Analytics:</strong> For usage statistics (anonymized)</li>
                                </ul>
                                <p className="text-gray-700">
                                    These services have their own privacy policies. We do not sell your data to third parties.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Rights (GDPR)</h2>
                                <p className="text-gray-700 mb-4">
                                    If you are in the European Union, you have the right to:
                                </p>
                                <ul className="list-disc pl-6 mb-4 text-gray-700">
                                    <li>Access your personal data</li>
                                    <li>Correct inaccurate data</li>
                                    <li>Request deletion of your data</li>
                                    <li>Object to data processing</li>
                                    <li>Data portability</li>
                                    <li>Withdraw consent at any time</li>
                                </ul>
                                <p className="text-gray-700">
                                    To exercise these rights, contact us at support@pdfswift.com
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Children's Privacy</h2>
                                <p className="text-gray-700">
                                    Our services are not intended for children under 13. We do not knowingly collect personal information from children.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Changes to This Policy</h2>
                                <p className="text-gray-700">
                                    We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a notice on our website.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Us</h2>
                                <p className="text-gray-700 mb-4">
                                    If you have questions about this Privacy Policy, please contact us:
                                </p>
                                <ul className="list-none pl-0 text-gray-700">
                                    <li>Email: support@pdfswift.com</li>
                                    <li>Contact Form: <Link to="/contact" className="text-primary hover:underline">Contact Page</Link></li>
                                </ul>
                            </section>

                            <div className="bg-primary/5 border-l-4 border-primary p-4 mt-8">
                                <p className="text-gray-700 font-semibold">
                                    Your privacy is important to us. We are committed to protecting your data and being transparent about our practices.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
