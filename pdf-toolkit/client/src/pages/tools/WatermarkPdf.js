import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import FileUploader from '../../components/FileUploader';
import VideoAdModal from '../../components/VideoAdModal';
import AdBanner from '../../components/AdBanner';
import { conversionAPI } from '../../services/api';
import { FiDownload, FiLoader, FiType, FiImage } from 'react-icons/fi';

const WatermarkPdf = () => {
    const { user } = useAuth();
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [watermarkType, setWatermarkType] = useState('text'); // 'text' or 'image'
    const [text, setText] = useState('CONFIDENTIAL');
    const [color, setColor] = useState('#ff0000');
    const [opacity, setOpacity] = useState(0.5);
    const [size, setSize] = useState(50);
    const [rotation, setRotation] = useState(45);
    const [position, setPosition] = useState('center');
    const [watermarkImage, setWatermarkImage] = useState(null);
    const [imageScale, setImageScale] = useState(0.5);
    const [loading, setLoading] = useState(false);
    const [convertedFile, setConvertedFile] = useState(null);
    const [showAdModal, setShowAdModal] = useState(false);

    const handleWatermark = async () => {
        if (selectedFiles.length === 0) {
            toast.error('Please select a PDF');
            return;
        }

        if (watermarkType === 'text' && !text) {
            toast.error('Please enter watermark text');
            return;
        }

        if (watermarkType === 'image' && !watermarkImage) {
            toast.error('Please upload a watermark image');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('file', selectedFiles[0]);
        formData.append('type', watermarkType);
        formData.append('opacity', opacity);
        formData.append('rotation', rotation);
        formData.append('position', position);
        formData.append('storageType', 'temporary');

        if (watermarkType === 'text') {
            formData.append('text', text);
            formData.append('color', color);
            formData.append('size', size);
        } else {
            formData.append('watermarkImage', watermarkImage);
            formData.append('imageScale', imageScale);
        }

        try {
            const data = await conversionAPI.convertFile('watermark-pdf', formData);
            setConvertedFile(data);

            if (!user || !user.isPremium) {
                setShowAdModal(true);
            } else {
                toast.success('Watermark added successfully!');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Watermarking failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Ad Banner */}
            {(!user || !user.isPremium) && (
                <div className="bg-gray-100 py-2">
                    <div className="max-w-4xl mx-auto px-4">
                        <AdBanner />
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Watermark PDF</h1>
                    <p className="text-lg text-gray-600">Add text or image stamps to your documents</p>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-8">
                    <FileUploader
                        onFilesSelect={(files) => setSelectedFiles(files)}
                        acceptedFiles={{ 'application/pdf': ['.pdf'] }}
                        maxFiles={1}
                        maxSize={user?.isPremium ? 50 * 1024 * 1024 : 10 * 1024 * 1024}
                        selectedFiles={selectedFiles}
                        onRemoveFile={(i) => setSelectedFiles([])}
                    />

                    {selectedFiles.length > 0 && (
                        <div className="mt-8 space-y-6">
                            {/* Type Toggle */}
                            <div className="flex justify-center space-x-4">
                                <button
                                    onClick={() => setWatermarkType('text')}
                                    className={`px-6 py-2 rounded-lg font-medium flex items-center ${watermarkType === 'text'
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    <FiType className="mr-2" /> Text
                                </button>
                                <button
                                    onClick={() => setWatermarkType('image')}
                                    className={`px-6 py-2 rounded-lg font-medium flex items-center ${watermarkType === 'image'
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    <FiImage className="mr-2" /> Image
                                </button>
                            </div>

                            {/* Controls */}
                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                                {watermarkType === 'text' ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Text</label>
                                            <input
                                                type="text"
                                                value={text}
                                                onChange={(e) => setText(e.target.value)}
                                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 p-2 border"
                                                placeholder="Enter watermark text"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                                                <input
                                                    type="color"
                                                    value={color}
                                                    onChange={(e) => setColor(e.target.value)}
                                                    className="w-full h-10 rounded-md cursor-pointer"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Size ({size}px)</label>
                                                <input
                                                    type="range"
                                                    min="10"
                                                    max="200"
                                                    value={size}
                                                    onChange={(e) => setSize(e.target.value)}
                                                    className="w-full"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image</label>
                                            <input
                                                type="file"
                                                accept="image/png, image/jpeg"
                                                onChange={(e) => setWatermarkImage(e.target.files[0])}
                                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Scale ({imageScale}x)</label>
                                            <input
                                                type="range"
                                                min="0.1"
                                                max="2"
                                                step="0.1"
                                                value={imageScale}
                                                onChange={(e) => setImageScale(e.target.value)}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Common Controls */}
                                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Opacity ({opacity})</label>
                                        <input
                                            type="range"
                                            min="0.1"
                                            max="1"
                                            step="0.1"
                                            value={opacity}
                                            onChange={(e) => setOpacity(e.target.value)}
                                            className="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Rotation ({rotation}°)</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="360"
                                            value={rotation}
                                            onChange={(e) => setRotation(e.target.value)}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                                    <select
                                        value={position}
                                        onChange={(e) => setPosition(e.target.value)}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 p-2 border"
                                    >
                                        <option value="center">Center</option>
                                        <option value="top-left">Top Left</option>
                                        <option value="top-center">Top Center</option>
                                        <option value="top-right">Top Right</option>
                                        <option value="middle-left">Middle Left</option>
                                        <option value="middle-right">Middle Right</option>
                                        <option value="bottom-left">Bottom Left</option>
                                        <option value="bottom-center">Bottom Center</option>
                                        <option value="bottom-right">Bottom Right</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleWatermark}
                        disabled={loading || selectedFiles.length === 0}
                        className="w-full mt-6 py-4 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center transition-colors"
                    >
                        {loading ? (
                            <>
                                <FiLoader className="animate-spin mr-2" />
                                Adding Watermark...
                            </>
                        ) : (
                            'Add Watermark'
                        )}
                    </button>

                    {convertedFile && user && user.isPremium && (
                        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <p className="font-medium text-gray-900">{convertedFile.fileName}</p>
                                <a
                                    href={conversionAPI.downloadFile(convertedFile.fileName)}
                                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center"
                                >
                                    <FiDownload className="mr-2" />
                                    Download
                                </a>
                            </div>
                            <p className="text-sm text-gray-600">
                                Watermark added successfully!
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {showAdModal && convertedFile && (
                <VideoAdModal
                    isOpen={showAdModal}
                    onClose={() => setShowAdModal(false)}
                    onAdComplete={() => toast.success('Watermark complete!')}
                    downloadUrl={conversionAPI.downloadFile(convertedFile.fileName)}
                    fileName={convertedFile.fileName}
                />
            )}

            {/* Bottom Ad Banner */}
            {(!user || !user.isPremium) && (
                <div className="bg-gray-100 py-4">
                    <div className="max-w-4xl mx-auto px-4">
                        <AdBanner />
                    </div>
                </div>
            )}
        </div>
    );
};

export default WatermarkPdf;
