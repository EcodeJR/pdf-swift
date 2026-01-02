import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import FileUploader from '../../components/FileUploader';
import VideoAdModal from '../../components/VideoAdModal';
import { conversionAPI } from '../../services/api';
import { FiDownload, FiLoader, FiLock } from 'react-icons/fi';

const ProtectPdf = () => {
    const { user } = useAuth();
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [permissions, setPermissions] = useState({
        print: true,
        copy: true,
        modify: true
    });
    const [loading, setLoading] = useState(false);
    const [convertedFile, setConvertedFile] = useState(null);
    const [showAdModal, setShowAdModal] = useState(false);

    const handleProtect = async () => {
        if (selectedFiles.length === 0) {
            toast.error('Please select a PDF to protect');
            return;
        }

        if (!password) {
            toast.error('Please enter a password');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('file', selectedFiles[0]);
        formData.append('password', password);
        formData.append('permissions', JSON.stringify(permissions));
        formData.append('storageType', 'temporary');

        try {
            const data = await conversionAPI.convertFile('protect-pdf', formData);
            setConvertedFile(data);

            if (!user || !user.isPremium) {
                setShowAdModal(true);
            } else {
                toast.success('PDF protected successfully!');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Protection failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Protect PDF</h1>
                    <p className="text-lg text-gray-600">Encrypt your PDF with a password</p>
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

                    {selectedFiles.length > 0 && (<>
                        <div className="mt-6 max-w-md mx-auto space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Set Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiLock className="text-gray-400" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2 border"
                                        placeholder="Enter password"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiLock className="text-gray-400" />
                                    </div>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2 border"
                                        placeholder="Confirm password"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 border-t border-gray-200 pt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
                            <div className="space-y-2">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={permissions.print}
                                        onChange={(e) => setPermissions({ ...permissions, print: e.target.checked })}
                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Allow Printing</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={permissions.copy}
                                        onChange={(e) => setPermissions({ ...permissions, copy: e.target.checked })}
                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Allow Copying Content</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={permissions.modify}
                                        onChange={(e) => setPermissions({ ...permissions, modify: e.target.checked })}
                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Allow Modifications</span>
                                </label>
                            </div>
                        </div>
                    </>)}

                    <button
                        onClick={handleProtect}
                        disabled={loading || selectedFiles.length === 0 || !password}
                        className="w-full mt-6 py-4 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center transition-colors"
                    >
                        {loading ? (
                            <>
                                <FiLoader className="animate-spin mr-2" />
                                Protecting...
                            </>
                        ) : (
                            'Protect PDF'
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
                                File protected successfully. Remember your password!
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {showAdModal && convertedFile && (
                <VideoAdModal
                    isOpen={showAdModal}
                    onClose={() => setShowAdModal(false)}
                    onAdComplete={() => toast.success('Protection complete!')}
                    downloadUrl={conversionAPI.downloadFile(convertedFile.fileName)}
                    fileName={convertedFile.fileName}
                />
            )}
        </div>
    );
};

export default ProtectPdf;
