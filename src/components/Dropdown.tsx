import React, { useState, useRef, useEffect, ReactNode } from 'react';

interface DropdownProps {
    icon?: ReactNode;
    title: string;
    options: string[];
    selectedOption: string;
    onChange: (option: string) => void;
    bgColor?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
    icon,
    title,
    options,
    selectedOption,
    onChange,
    bgColor = '#7A623F',
}) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const toggleDropdown = () => {
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
            <span className="w-1/8 mr-2 flex items-center hover:bg-[#2A2A2A] px-3 py-2 rounded-md">
                {icon && <span className="mr-2">{icon}</span>}
                {title}
            </span>
            <div
                className={`relative w-5/6 py-1.5 px-1.5 cursor-pointer ${showDropdown ? 'bg-[#2A2A2A] rounded-t-md' : 'hover:bg-[#2A2A2A] rounded-md'}`}
                ref={dropdownRef}
                onMouseEnter={toggleDropdown}
                onMouseLeave={showDropdown ? toggleDropdown : undefined}
                onClick={toggleDropdown}
            >
                <div className="cursor-pointer inline-flex items-center">
                    <div className="inline-flex items-center px-2 py-0.5 rounded-md" style={{ backgroundColor: bgColor }} >
                        <span className="text-white text-sm">{selectedOption}</span>
                    </div>
                </div>

                {showDropdown && (
                    <div className="w-full absolute top-full left-0 z-50 w-64 bg-[#1A1A1A] border-t border-[#3A3A3A] rounded-b-lg shadow-lg overflow-hidden">
                        <div className="p-3">
                            <div className="space-y-0">
                                {options.map((option) => (
                                    <div
                                        key={option}
                                        className="flex items-center px-2 py-1.5 rounded-md hover:bg-[#2A2A2A] cursor-pointer transition-colors"
                                        onClick={() => {
                                            onChange(option);
                                            setShowDropdown(false);
                                        }}
                                    >
                                        <div className="inline-flex items-center px-2 py-0.5 rounded-md" style={{ backgroundColor: bgColor }}>
                                            <span className="text-white text-sm">{option}</span>
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