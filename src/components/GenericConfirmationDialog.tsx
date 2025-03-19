import React from 'react';
import { X, Trash2 } from 'lucide-react';

interface ConfirmationDialogProps {
    show: boolean;
    title?: string;
    message?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
    errorMessage?: string | null;
    type: 'publish' | 'delete';
    confirmButtonText?: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
    show,
    title,
    message,
    onConfirm,
    onCancel,
    isLoading = false,
    errorMessage = null,
    type = 'publish',
    confirmButtonText
}) => {
    if (!show) return null;

    // Default values based on type
    const defaultTitle = type === 'publish' ? "Ready to publish?" : "Confirm deletion";
    const defaultMessage = type === 'publish'
        ? "Make sure your content is complete and reviewed for errors before publishing"
        : "Are you sure you want to delete this item? This action cannot be undone.";
    const defaultButtonText = type === 'publish' ? "Publish Now" : "Delete";

    // Use provided values or defaults
    const displayTitle = title || defaultTitle;
    const displayMessage = message || defaultMessage;
    const buttonText = confirmButtonText || defaultButtonText;

    // Button styles based on type
    const buttonBgColor = type === 'publish' ? 'bg-green-700 hover:bg-green-800' : 'bg-red-600 hover:bg-red-700';

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
                    <h2 className="text-xl font-light text-white mb-4">{displayTitle}</h2>
                    <p className="text-gray-300">{displayMessage}</p>
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
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onConfirm();
                        }}
                        className={`px-6 py-2 ${buttonBgColor} text-white text-sm font-medium rounded-full transition-colors focus:outline-none cursor-pointer ${isLoading ? 'opacity-70' : ''}`}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                <span>{buttonText}</span>
                            </div>
                        ) : (
                            <div className="flex items-center">
                                {type === 'delete' && <Trash2 size={16} className="mr-2" />}
                                {buttonText}
                            </div>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationDialog; 