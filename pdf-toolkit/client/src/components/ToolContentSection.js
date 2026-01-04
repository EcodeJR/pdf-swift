import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiCheck, FiHelpCircle } from 'react-icons/fi';

const ToolContentSection = ({ title, content }) => {
    const [openFaqIndex, setOpenFaqIndex] = useState(null);

    const toggleFaq = (index) => {
        setOpenFaqIndex(openFaqIndex === index ? null : index);
    };

    return (
        <div className="mt-16 max-w-4xl mx-auto">
            {/* Introduction */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">{title}</h2>
                <div className="prose prose-lg text-gray-600 max-w-none">
                    {content.introduction.map((paragraph, index) => (
                        <p key={index} className="mb-4 leading-relaxed">
                            {paragraph}
                        </p>
                    ))}
                </div>
            </div>

            {/* Benefits / Features */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                        <span className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mr-3">
                            <FiCheck />
                        </span>
                        Key Benefits
                    </h3>
                    <ul className="space-y-4">
                        {content.benefits.map((benefit, index) => (
                            <li key={index} className="flex items-start text-gray-600">
                                <span className="mr-2 text-green-500 mt-1">•</span>
                                {benefit}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                        <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-3">
                            <FiHelpCircle />
                        </span>
                        How to Use
                    </h3>
                    <ol className="space-y-4">
                        {content.howToSteps.map((step, index) => (
                            <li key={index} className="flex items-start text-gray-600">
                                <span className="flex-shrink-0 w-6 h-6 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                                    {index + 1}
                                </span>
                                {step}
                            </li>
                        ))}
                    </ol>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h3>
                <div className="space-y-4">
                    {content.faqs.map((faq, index) => (
                        <div
                            key={index}
                            className={`border rounded-xl transition-all duration-200 ${openFaqIndex === index ? 'border-primary-200 bg-primary-50/30' : 'border-gray-200 hover:border-primary-100'
                                }`}
                        >
                            <button
                                className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none"
                                onClick={() => toggleFaq(index)}
                            >
                                <span className="font-semibold text-gray-900 pr-8">{faq.question}</span>
                                {openFaqIndex === index ? (
                                    <FiChevronUp className="w-5 h-5 text-primary-600 flex-shrink-0" />
                                ) : (
                                    <FiChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                )}
                            </button>

                            <div
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaqIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                    }`}
                            >
                                <div className="px-6 pb-5 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                                    {faq.answer}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ToolContentSection;
