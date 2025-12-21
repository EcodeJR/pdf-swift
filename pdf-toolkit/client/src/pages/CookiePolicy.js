import React from 'react';
import { Link } from 'react-router-dom';
import { GridPattern } from '../components/GridPattern';

const CookiePolicy = () => {
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
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
                        <p className="text-gray-600 mb-8">Last updated: December 2, 2024</p>

                        <div className="prose max-w-none">
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. What Are Cookies?</h2>
                                <p className="text-gray-700 mb-4">
                                    Cookies are small text files stored on your device when you visit websites. They help websites remember your preferences and improve your experience.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Cookies</h2>
                                <p className="text-gray-700 mb-4">
                                    PDF Swift uses cookies to:
                                </p>
                                <ul className="list-disc pl-6 mb-4 text-gray-700">
                                    <li>Keep you logged in to your account</li>
                                    <li>Remember your preferences and settings</li>
                                    <li>Provide security features</li>
                                    <li>Analyze site performance</li>
                                    <li>Improve our services</li>
                                </ul>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Types of Cookies We Use</h2>

                                <div className="space-y-6">
                                    <div className="bg-gray-50 p-6 rounded-lg">
                                        <h3 className="text-xl font-semibold text-gray-800 mb-3">Essential Cookies</h3>
                                        <p className="text-gray-700 mb-2">
                                            <strong>Purpose:</strong> Required for basic website functionality
                                        </p>
                                        <p className="text-gray-700 mb-2">
                                            <strong>Examples:</strong>
                                        </p>
                                        <ul className="list-disc pl-6 text-gray-700">
                                            <li>Authentication (keeping you logged in)</li>
                                            <li>Session management</li>
                                            <li>Security tokens</li>
                                            <li>Cookie consent preferences</li>
                                        </ul>
                                        <p className="text-gray-700 mt-2">
                                            <strong>Can be disabled:</strong> No (required for site to function)
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 p-6 rounded-lg">
                                        <h3 className="text-xl font-semibold text-gray-800 mb-3">Functionality Cookies</h3>
                                        <p className="text-gray-700 mb-2">
                                            <strong>Purpose:</strong> Remember your preferences
                                        </p>
                                        <p className="text-gray-700 mb-2">
                                            <strong>Examples:</strong>
                                        </p>
                                        <ul className="list-disc pl-6 text-gray-700">
                                            <li>Language preference</li>
                                            <li>Theme selection (if available)</li>
                                            <li>File upload preferences</li>
                                        </ul>
                                        <p className="text-gray-700 mt-2">
                                            <strong>Can be disabled:</strong> Yes (but may affect user experience)
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 p-6 rounded-lg">
                                        <h3 className="text-xl font-semibold text-gray-800 mb-3">Analytics Cookies</h3>
                                        <p className="text-gray-700 mb-2">
                                            <strong>Purpose:</strong> Help us understand how visitors use our site
                                        </p>
                                        <p className="text-gray-700 mb-2">
                                            <strong>Examples:</strong>
                                        </p>
                                        <ul className="list-disc pl-6 text-gray-700">
                                            <li>Page visit counts</li>
                                            <li>Popular features</li>
                                            <li>Conversion rates</li>
                                            <li>Error tracking</li>
                                        </ul>
                                        <p className="text-gray-700 mt-2">
                                            <strong>Data collected:</strong> Anonymized and aggregated
                                        </p>
                                        <p className="text-gray-700 mt-1">
                                            <strong>Can be disabled:</strong> Yes
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 p-6 rounded-lg">
                                        <h3 className="text-xl font-semibold text-gray-800 mb-3">Performance Cookies</h3>
                                        <p className="text-gray-700 mb-2">
                                            <strong>Purpose:</strong> Monitor and improve site performance
                                        </p>
                                        <p className="text-gray-700 mb-2">
                                            <strong>Examples:</strong>
                                        </p>
                                        <ul className="list-disc pl-6 text-gray-700">
                                            <li>Load time monitoring</li>
                                            <li>Error detection</li>
                                            <li>Response time tracking</li>
                                        </ul>
                                        <p className="text-gray-700 mt-2">
                                            <strong>Can be disabled:</strong> Yes
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Third-Party Cookies</h2>
                                <p className="text-gray-700 mb-4">
                                    We use cookies from trusted third-party services:
                                </p>
                                <ul className="list-disc pl-6 mb-4 text-gray-700">
                                    <li><strong>Stripe:</strong> For secure payment processing</li>
                                    <li><strong>Analytics Services:</strong> To understand site usage (anonymized data only)</li>
                                </ul>
                                <p className="text-gray-700">
                                    These services have their own cookie policies. We do not control third-party cookies.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Cookie Duration</h2>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full bg-white border border-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Cookie Type</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Duration</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            <tr>
                                                <td className="px-6 py-4 text-sm text-gray-700">Session Cookies</td>
                                                <td className="px-6 py-4 text-sm text-gray-700">Deleted when you close browser</td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 text-sm text-gray-700">Authentication</td>
                                                <td className="px-6 py-4 text-sm text-gray-700">30 days</td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 text-sm text-gray-700">Preferences</td>
                                                <td className="px-6 py-4 text-sm text-gray-700">1 year</td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 text-sm text-gray-700">Analytics</td>
                                                <td className="px-6 py-4 text-sm text-gray-700">2 years</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Managing Cookies</h2>
                                <p className="text-gray-700 mb-4">
                                    You can control cookies in several ways:
                                </p>

                                <h3 className="text-xl font-semibold text-gray-800 mb-3">Browser Settings</h3>
                                <p className="text-gray-700 mb-4">
                                    Most browsers allow you to:
                                </p>
                                <ul className="list-disc pl-6 mb-4 text-gray-700">
                                    <li>View and delete cookies</li>
                                    <li>Block all cookies</li>
                                    <li>Block third-party cookies</li>
                                    <li>Clear cookies on exit</li>
                                </ul>

                                <h3 className="text-xl font-semibold text-gray-800 mb-3">Our Cookie Banner</h3>
                                <p className="text-gray-700 mb-4">
                                    When you first visit PDF Swift, you'll see a cookie consent banner allowing you to:
                                </p>
                                <ul className="list-disc pl-6 mb-4 text-gray-700">
                                    <li>Accept all cookies</li>
                                    <li>Decline non-essential cookies</li>
                                    <li>Learn more about our cookie policy</li>
                                </ul>

                                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-4">
                                    <p className="text-gray-700">
                                        <strong>Note:</strong> Blocking cookies may prevent some features from working properly, such as staying logged in or remembering your preferences.
                                    </p>
                                </div>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Do Not Track</h2>
                                <p className="text-gray-700">
                                    We respect Do Not Track (DNT) browser signals. If DNT is enabled, we will not set analytics or tracking cookies.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Updates to This Policy</h2>
                                <p className="text-gray-700">
                                    We may update this Cookie Policy to reflect changes in our practices or legal requirements. We will notify you of significant changes.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact Us</h2>
                                <p className="text-gray-700 mb-4">
                                    If you have questions about our use of cookies:
                                </p>
                                <ul className="list-none pl-0 text-gray-700">
                                    <li>Email: support@pdfswift.com</li>
                                    <li>Contact Form: <Link to="/contact" className="text-primary hover:underline">Contact Page</Link></li>
                                    <li>Privacy Policy: <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link></li>
                                </ul>
                            </section>

                            <div className="bg-primary/5 border-l-4 border-primary p-4 mt-8">
                                <p className="text-gray-700 font-semibold">
                                    We use cookies responsibly to enhance your experience while respecting your privacy choices.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CookiePolicy;
