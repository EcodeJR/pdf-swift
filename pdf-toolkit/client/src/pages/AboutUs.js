import React from 'react';
import { Link } from 'react-router-dom';
import { FiZap, FiShield, FiClock, FiGlobe, FiUsers, FiHeart } from 'react-icons/fi';
import { GridPattern } from '../components/GridPattern';

const AboutUs = () => {
    const features = [
        {
            icon: FiZap,
            title: 'Lightning Fast Processing',
            description: 'Our optimized conversion engine processes your PDFs in seconds, not minutes. Built with performance in mind.'
        },
        {
            icon: FiShield,
            title: 'Privacy First',
            description: 'All files are automatically deleted after 1 hour. We never store, share, or access your documents.'
        },
        {
            icon: FiClock,
            title: 'Always Available',
            description: '24/7 access to all PDF tools. No downtime, no waiting. Your documents, your schedule.'
        },
        {
            icon: FiGlobe,
            title: 'Cloud & Local Processing',
            description: 'Choose between cloud processing or local conversion. Your data, your choice.'
        },
        {
            icon: FiUsers,
            title: 'Trusted by Thousands',
            description: 'Join thousands of professionals who trust PDF Swift for their document workflows.'
        },
        {
            icon: FiHeart,
            title: 'Made with Care',
            description: 'Built by developers who care about user experience, security, and simplicity.'
        }
    ];

    const stats = [
        { value: '100K+', label: 'Files Processed' },
        { value: '50MB', label: 'Max File Size (Premium)' },
        { value: '<3s', label: 'Average Conversion Time' },
        { value: '99.9%', label: 'Uptime' }
    ];

    return (
        <div className="relative min-h-screen bg-secondary-50">
            <GridPattern
                className="absolute inset-0 stroke-primary-200/40 [mask-image:radial-gradient(white,transparent_85%)]"
                width={60}
                height={60}
            />

            <div className="relative z-10">
                {/* Hero Section */}
                <section className="py-20 px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-5xl font-bold text-gray-900 mb-6">
                            About PDF Swift
                        </h1>
                        <p className="text-xl text-gray-600 mb-8">
                            Your trusted partner for fast, secure, and reliable PDF conversions
                        </p>
                        <div className="w-24 h-1 bg-primary mx-auto rounded-full"></div>
                    </div>
                </section>

                {/* Mission Section */}
                <section className="py-16 px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
                            <p className="text-lg text-gray-700 leading-relaxed mb-4">
                                At PDF Swift, we believe document conversion should be fast, simple, and secure.
                                We've built a platform that eliminates the complexity of PDF workflows, allowing you
                                to focus on what matters most—your work.
                            </p>
                            <p className="text-lg text-gray-700 leading-relaxed">
                                Whether you're converting Word documents, merging PDFs, or editing existing files,
                                our tools are designed to save you time while protecting your privacy every step of the way.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="py-16 px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {stats.map((stat, index) => (
                                <div key={index} className="text-center">
                                    <div className="bg-white rounded-xl shadow-md p-6">
                                        <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                                        <div className="text-gray-600">{stat.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="py-16 px-4">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                            What Makes Us Different
                        </h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {features.map((feature, index) => (
                                <div key={index} className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow">
                                    <feature.icon className="w-12 h-12 text-primary mb-4" />
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                    <p className="text-gray-600">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Technology Stack */}
                <section className="py-16 px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-gradient-to-br from-primary-600 to-primary text-white rounded-2xl shadow-xl p-8 md:p-12">
                            <h2 className="text-3xl font-bold mb-6">Built with Modern Technology</h2>
                            <p className="text-lg mb-6 opacity-90">
                                PDF Swift is powered by cutting-edge technology to ensure the best performance and reliability:
                            </p>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-bold text-xl mb-3">Frontend</h3>
                                    <ul className="space-y-2 opacity-90">
                                        <li>• React for dynamic user interfaces</li>
                                        <li>• Tailwind CSS for beautiful design</li>
                                        <li>• Real-time progress updates</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl mb-3">Backend</h3>
                                    <ul className="space-y-2 opacity-90">
                                        <li>• Node.js for high performance</li>
                                        <li>• pdf-lib for reliable conversions</li>
                                        <li>• MongoDB for secure storage</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-16 px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">
                            Ready to Simplify Your PDF Workflow?
                        </h2>
                        <p className="text-lg text-gray-600 mb-8">
                            Join thousands of users who trust PDF Swift for their document needs
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/register"
                                className="btn-primary px-8 py-4 text-lg"
                            >
                                Get Started Free
                            </Link>
                            <Link
                                to="/pricing"
                                className="btn-secondary px-8 py-4 text-lg"
                            >
                                View Pricing
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default AboutUs;
