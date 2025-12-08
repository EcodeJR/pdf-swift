import React from 'react';
import { Link } from 'react-router-dom';
import { GridPattern } from '../components/GridPattern';

const TermsOfService = () => {
    return (
        <div className="relative min-h-screen bg-secondary-50">
            <GridPattern
                className="absolute inset-0 stroke-primary-200/40 [mask-image:radial-gradient(white,transparent_85%)]"
                width={60}
                height={60}
            />

            <div className="relative z-10 py-20 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
                        <p className="text-gray-600 mb-8">Last updated: December 2, 2024</p>

                        <div className="prose max-w-none">
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Agreement to Terms</h2>
                                <p className="text-gray-700 mb-4">
                                    By accessing or using PDF Swift ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Service.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
                                <p className="text-gray-700 mb-4">
                                    PDF Swift provides online PDF conversion, editing, and manipulation tools including:
                                </p>
                                <ul className="list-disc pl-6 mb-4 text-gray-700">
                                    <li>Document format conversion (Word, Excel, JPG to PDF)</li>
                                    <li>PDF merging and splitting</li>
                                    <li>PDF editing and annotation</li>
                                    <li>PDF compression and optimization</li>
                                    <li>OCR (Optical Character Recognition)</li>
                                </ul>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Account Registration</h2>
                                <p className="text-gray-700 mb-4">
                                    To access certain features, you may need to create an account. You agree to:
                                </p>
                                <ul className="list-disc pl-6 mb-4 text-gray-700">
                                    <li>Provide accurate and complete information</li>
                                    <li>Maintain the security of your password</li>
                                    <li>Notify us immediately of any unauthorized access</li>
                                    <li>Accept responsibility for all activities under your account</li>
                                </ul>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Subscription Plans</h2>

                                <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 Free Plan</h3>
                                <ul className="list-disc pl-6 mb-4 text-gray-700">
                                    <li>Limited to 5 conversions per hour</li>
                                    <li>Maximum file size: 10MB</li>
                                    <li>Standard processing speed</li>
                                    <li>May include advertisements</li>
                                </ul>

                                <h3 className="text-xl font-semibold text-gray-800 mb-3">4.2 Premium Plan</h3>
                                <ul className="list-disc pl-6 mb-4 text-gray-700">
                                    <li>Unlimited conversions</li>
                                    <li>Maximum file size: 50MB</li>
                                    <li>Priority processing</li>
                                    <li>No advertisements</li>
                                    <li>Batch processing (up to 20 files)</li>
                                    <li>Unlimited cloud storage</li>
                                    <li>Email support within 24 hours</li>
                                </ul>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Payment and Billing</h2>
                                <p className="text-gray-700 mb-4">
                                    For Premium subscriptions:
                                </p>
                                <ul className="list-disc pl-6 mb-4 text-gray-700">
                                    <li>Billing is monthly or annually based on your selection</li>
                                    <li>Automatic renewal unless cancelled</li>
                                    <li>Payments processed securely via Stripe</li>
                                    <li>We reserve the right to change prices with 30 days notice</li>
                                    <li>Refunds available within 7 days of purchase</li>
                                </ul>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Acceptable Use</h2>
                                <p className="text-gray-700 mb-4">
                                    You agree NOT to:
                                </p>
                                <ul className="list-disc pl-6 mb-4 text-gray-700">
                                    <li>Upload malicious, illegal, or copyrighted content without authorization</li>
                                    <li>Attempt to bypass usage limitations</li>
                                    <li>Use automated systems to access the Service excessively</li>
                                    <li>Reverse engineer or copy our software</li>
                                    <li>Resell or redistribute our services</li>
                                    <li>Upload files containing viruses or malware</li>
                                </ul>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. File Processing and Storage</h2>
                                <p className="text-gray-700 mb-4">
                                    Important information about your files:
                                </p>
                                <ul className="list-disc pl-6 mb-4 text-gray-700">
                                    <li>Uploaded files are automatically deleted after 1 hour</li>
                                    <li>We do not access, view, or share your files</li>
                                    <li>You retain all rights to your content</li>
                                    <li>Premium users can choose cloud storage (still deleted after 30 days of inactivity)</li>
                                    <li>We are not responsible for data loss</li>
                                </ul>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Intellectual Property</h2>
                                <p className="text-gray-700 mb-4">
                                    The Service, including its design, code, and content, is owned by PDF Swift and protected by intellectual property laws. You may not:
                                </p>
                                <ul className="list-disc pl-6 mb-4 text-gray-700">
                                    <li>Copy, modify, or create derivative works</li>
                                    <li>Sell or license our software</li>
                                    <li>Remove copyright notices</li>
                                </ul>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Disclaimers and Limitations</h2>
                                <p className="text-gray-700 mb-4">
                                    THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. We do not guarantee:
                                </p>
                                <ul className="list-disc pl-6 mb-4 text-gray-700">
                                    <li>Uninterrupted or error-free service</li>
                                    <li>Accuracy of conversions</li>
                                    <li>Compatibility with all file formats</li>
                                </ul>
                                <p className="text-gray-700">
                                    We are not liable for any indirect, incidental, or consequential damages arising from use of the Service.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Termination</h2>
                                <p className="text-gray-700">
                                    We reserve the right to suspend or terminate your account for violating these Terms. You may cancel your account at any time from your Settings page.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to Terms</h2>
                                <p className="text-gray-700">
                                    We may modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Information</h2>
                                <p className="text-gray-700 mb-4">
                                    For questions about these Terms:
                                </p>
                                <ul className="list-none pl-0 text-gray-700">
                                    <li>Email: support@pdfswift.com</li>
                                    <li>Contact Form: <Link to="/contact" className="text-primary hover:underline">Contact Page</Link></li>
                                </ul>
                            </section>

                            <div className="bg-primary/5 border-l-4 border-primary p-4 mt-8">
                                <p className="text-gray-700">
                                    <strong>By using PDF Swift, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
