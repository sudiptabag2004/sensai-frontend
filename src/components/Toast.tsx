import React from 'react';
import { X } from 'lucide-react';

interface ToastProps {
    show: boolean;
    title: string;
    description: string;
    emoji: string;
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({
    show,
    title,
    description,
    emoji,
    onClose
}) => {
    if (!show) return null;

    return (
        <div className="fixed bottom-4 right-4 bg-white text-black px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-4 max-w-md">
            <div className="flex items-center justify-center w-10 h-10 bg-amber-50 rounded-full">
                <span className="text-xl">{emoji}</span>
            </div>
            <div>
                <h3 className="font-medium text-base">{title}</h3>
                <p className="text-sm text-gray-600">{description}</p>
            </div>
            <button
                onClick={onClose}
                className="ml-auto text-gray-400 hover:text-gray-600 cursor-pointer"
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default Toast; 