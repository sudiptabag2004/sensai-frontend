import React, { useState, useRef, useEffect, ReactNode } from 'react';
import SimpleTooltip from './SimpleTooltip';

export interface DropdownOption {
    label: string;
    value: string;
    color: string;
    tooltip?: string;
}

interface DropdownProps {
    icon?: ReactNode;
    title: string;
    options: DropdownOption[];
    selectedOption: DropdownOption;
    onChange: (option: DropdownOption) => void;
    disabled?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({
    icon,
    title,
    options,
    selectedOption,
    onChange,
    disabled = false,
}) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const toggleDropdown = () => {
        if (disabled) return; // Don't toggle if disabled
        setShowDropdown(!showDropdown);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="flex items-center text-gray-500 text-sm w-full">
            <span className="w-1/6 mr-2 flex items-center hover:bg-[#2A2A2A] px-3 py-2 rounded-md">
                {icon && <span className="mr-2">{icon}</span>}
                {title}
            </span>
            <div
                className={`relative w-5/6 py-1.5 px-1.5 ${disabled ? 'opacity-70 cursor-default' : 'cursor-pointer'} ${showDropdown ? 'bg-[#2A2A2A] rounded-t-md' : `${!disabled ? 'hover:bg-[#2A2A2A]' : ''} rounded-md`}`}
                ref={dropdownRef}
                onClick={toggleDropdown}
            >
                <div className={`inline-flex items-center ${disabled ? 'cursor-default' : 'cursor-pointer'}`}>
                    <div className="inline-flex items-center px-2 py-0.5 rounded-md" style={{ backgroundColor: selectedOption.color }} >
                        <span className="text-white text-sm">{selectedOption.label}</span>
                    </div>
                </div>

                {showDropdown && !disabled && (
                    <div className="w-full absolute top-full left-0 z-50 w-64 bg-[#1A1A1A] border-t border-[#3A3A3A] rounded-b-lg shadow-lg overflow-visible">
                        <div className="p-3">
                            <div className="space-y-0">
                                {options.map((option) => (
                                    <div key={option.value} className="flex items-center mb-2 relative">
                                        {/* Help icon on the left side */}
                                        {option.tooltip && (
                                            <div className="mr-2" onClick={e => e.stopPropagation()}>
                                                <SimpleTooltip text={option.tooltip}>
                                                    <div className="text-gray-500 hover:text-gray-300 cursor-pointer">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <circle cx="12" cy="12" r="10"></circle>
                                                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                                        </svg>
                                                    </div>
                                                </SimpleTooltip>
                                            </div>
                                        )}

                                        {/* Option content */}
                                        <div
                                            className="flex items-center px-2 py-1.5 rounded-md hover:bg-[#2A2A2A] cursor-pointer transition-colors flex-grow"
                                            onClick={() => {
                                                onChange(option);
                                                setShowDropdown(false);
                                            }}
                                        >
                                            <div className="inline-flex items-center px-2 py-0.5 rounded-md" style={{ backgroundColor: option.color }}>
                                                <span className="text-white text-sm">{option.label}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dropdown; 