import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Trash2, Plus, X } from 'lucide-react';
import { CriterionData } from './ScorecardPickerDialog';
import './scorecard-styles.css'; // We'll create this CSS file

interface ScorecardProps {
    title: string;
    criteria: CriterionData[];
    onDelete: () => void;
    readOnly?: boolean;
    onChange?: (criteria: CriterionData[]) => void;
}

export interface ScorecardHandle {
    focusTitle: () => void;
}

const Scorecard = forwardRef<ScorecardHandle, ScorecardProps>(({
    title,
    criteria,
    onDelete,
    readOnly = false,
    onChange
}, ref) => {
    const titleRef = useRef<HTMLInputElement>(null);

    // Expose the focusTitle method to parent components
    useImperativeHandle(ref, () => ({
        focusTitle: () => {
            if (titleRef.current && !readOnly) {
                titleRef.current.focus();
                // Select all text to make it easy to replace
                titleRef.current.select();
            }
        }
    }));

    // Function to add a new criterion
    const handleAddCriterion = () => {
        if (readOnly || !onChange) return;

        const newCriterion: CriterionData = {
            name: '',
            description: '',
            maxScore: 5
        };

        const updatedCriteria = [...(criteria || []), newCriterion];
        onChange(updatedCriteria);
    };

    // Function to delete a criterion by index
    const handleDeleteCriterion = (indexToDelete: number) => {
        if (readOnly || !onChange) return;

        const updatedCriteria = criteria.filter((_, index) => index !== indexToDelete);
        onChange(updatedCriteria);
    };

    return (
        <div className="w-full bg-[#2F2F2F] rounded-lg shadow-xl p-2">
            {/* Header with title */}
            <div className="p-5 pb-3 bg-[#1F1F1F] mb-2">
                <div className="flex items-center mb-4">
                    <input
                        ref={titleRef}
                        type="text"
                        defaultValue={title}
                        readOnly={readOnly}
                        placeholder="Scorecard Name"
                        className="text-white text-lg font-normal bg-transparent border-none outline-none focus:border-b focus:border-white/50 w-full max-w-full"
                        style={{ caretColor: 'white' }}
                    />

                    <div className="ml-auto flex items-center space-x-2">
                        {/* Delete scorecard button */}
                        <button
                            onClick={onDelete}
                            className="flex items-center justify-center p-2 rounded-full hover:bg-[#4F2828] text-gray-400 hover:text-red-300 transition-colors cursor-pointer"
                            aria-label="Delete scorecard"
                            disabled={readOnly}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                {/* Table header */}
                <div style={{ display: 'grid', gridTemplateColumns: '25% 55% 10% 10%' }} className="gap-2 mb-2 text-xs text-gray-300">
                    <div className="px-2">Criterion</div>
                    <div className="px-2">Description</div>
                    <div className="px-2 text-center">Max Score</div>
                    <div className="px-2"></div> {/* Empty header for delete button */}
                </div>

                {/* Criteria rows */}
                <div className="space-y-2 mb-3">
                    {criteria?.map((criterion, index) => {
                        // Generate a unique background color for each criterion pill
                        const pillColors = ["#5E3B5D", "#3B5E4F", "#3B4E5E", "#5E3B3B", "#4F5E3B"];
                        const pillColor = pillColors[index % pillColors.length];

                        return (
                            <div key={index} style={{ display: 'grid', gridTemplateColumns: '25% 55% 10% 10%' }} className="gap-2 bg-[#2A2A2A] rounded-md p-1 text-white">
                                <div className="px-2 py-1 text-sm flex items-center">
                                    <span
                                        className="inline-block px-2 py-0.5 rounded-full text-xs text-white"
                                        style={{ backgroundColor: pillColor }}
                                    >
                                        {criterion.name}
                                    </span>
                                </div>
                                <div className="px-2 py-1 text-sm">
                                    {criterion.description || ""}
                                </div>
                                <div className="px-2 py-1 text-sm text-center">
                                    {criterion.maxScore}
                                </div>
                                <div className="flex items-center justify-center">
                                    {!readOnly && criteria.length > 1 && (
                                        <button
                                            onClick={() => handleDeleteCriterion(index)}
                                            className="p-1 rounded-full hover:bg-[#4F2828] text-gray-500 hover:text-red-300 transition-colors cursor-pointer"
                                            aria-label={`Delete criterion ${criterion.name}`}
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* If no criteria, show empty state */}
                    {(!criteria || criteria.length === 0) && (
                        <div style={{ display: 'grid', gridTemplateColumns: '25% 55% 10% 10%' }} className="gap-2 bg-[#2A2A2A] rounded-md p-1 text-white">
                            <div className="px-2 py-1 text-sm flex items-center">
                                <span className="inline-block px-2 py-0.5 rounded-full text-xs text-white bg-[#5E3B5D]">
                                    Add criteria
                                </span>
                            </div>
                            <div className="px-2 py-1 flex items-center">
                                <div className="h-3 bg-[#333] rounded w-full"></div>
                            </div>
                            <div className="px-2 py-1 text-sm text-center"></div>
                            <div></div>
                        </div>
                    )}
                </div>

                {/* Add Criterion button - now below the criteria rows */}
                {!readOnly && (
                    <div className="flex justify-center mt-3">
                        <button
                            onClick={handleAddCriterion}
                            className="flex items-center px-4 py-2 rounded-full bg-[#2A2A2A] hover:bg-[#2A4A3A] text-gray-300 hover:text-green-300 transition-colors cursor-pointer"
                            aria-label="Add criterion"
                            disabled={readOnly}
                        >
                            <Plus size={14} className="mr-1" />
                            <span className="text-sm">Add</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
});

// Add display name for better debugging
Scorecard.displayName = 'Scorecard';

export default Scorecard; 