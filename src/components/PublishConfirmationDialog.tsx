import React from 'react';
import { X } from 'lucide-react';

interface PublishConfirmationDialogProps {
    show: boolean;
    title?: string;
    message?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isPublishing?: boolean;
    errorMessage?: string | null;
}

const PublishConfirmationDialog: React.FC<PublishConfirmationDialogProps> = ({
    show,
    title = "Ready to publish?",
    message = "Make sure your content is complete and reviewed for errors before publishing",
    onConfirm,
    onCancel,
    isPublishing = false,
    errorMessage = null
}) => {
    if (!show) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => {
                e.stopPropagation();
                onCancel();
            }}
        >
            <div
                className="w-full max-w-md bg-[#1A1A1A] rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <h2 className="text-xl font-light text-white mb-4">{title}</h2>
                    <p className="text-gray-300">{message}</p>
                    {errorMessage && (
                        <p className="mt-4 text-red-400 text-sm">{errorMessage}</p>
                    )}
                </div>
                <div className="flex justify-end gap-4 p-6">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onCancel();
                        }}
                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
                        disabled={isPublishing}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onConfirm();
                        }}
                        className={`px-6 py-2 bg-green-700 text-white text-sm font-medium rounded-full hover:bg-green-800 transition-colors focus:outline-none cursor-pointer ${isPublishing ? 'opacity-70' : ''}`}
                        disabled={isPublishing}
                    >
                        {isPublishing ? (
                            <div className="flex items-center justify-center">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                <span>Publish Now</span>
                            </div>
                        ) : 'Publish Now'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PublishConfirmationDialog; 