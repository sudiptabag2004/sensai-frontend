import React, { useState, useRef } from 'react';
import { X, Plus, Check, Sparkles, FileText } from 'lucide-react';

interface CriterionData {
    name: string;
    maxScore: number;
}

interface ScorecardTemplate {
    id: string;
    name: string;
    icon: React.ReactNode;
    categories?: string[];
    description?: string;
    criteria?: CriterionData[];
}

interface ScorecardTemplatesDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateNew: () => void;
    onSelectTemplate: (templateId: string) => void;
    position?: { top: number; left: number };
}

// Preview component to show on hover - now matching the Issue Tracking design
const TemplatePreview: React.FC<{ template: ScorecardTemplate; templateElement: HTMLDivElement | null }> = ({ template, templateElement }) => {
    // Get the template-specific data or use defaults
    const getStatusPills = () => {
        if (template.id === 'issue-tracking') {
            return ['Backlog', 'Open', 'In progress'];
        }
        // Default status pills for other templates
        return ['Status 1', 'Status 2', 'Status 3'];
    };

    const statusPills = getStatusPills();
    const description = template.description || `Organize ${template.name.toLowerCase()} efficiently.`;

    // Default criteria if not provided
    const criteria = template.criteria || [
        { name: "Grammar", maxScore: 5 },
        { name: "Relevance", maxScore: 5 },
        { name: "Confidence", maxScore: 5 }
    ];

    // Calculate position based on template position in the viewport
    const previewStyle = React.useMemo(() => {
        if (!templateElement) {
            // Default positioning
            return { left: '100%', marginLeft: '10px', top: '0' };
        }

        const templateRect = templateElement.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const previewHeight = 350; // Approximate height of preview

        // Calculate available space below the template
        const spaceBelow = viewportHeight - templateRect.top;

        // If there's not enough space below, position from bottom up
        if (spaceBelow < previewHeight) {
            return {
                left: '100%',
                marginLeft: '10px',
                bottom: '0',
                top: 'auto'
            };
        }

        // Otherwise position from top down (default)
        return {
            left: '100%',
            marginLeft: '10px',
            top: '0',
            bottom: 'auto'
        };
    }, [templateElement]);

    return (
        <div className="absolute z-[60] w-[350px] bg-[#2F2F2F] rounded-lg shadow-xl p-2" style={previewStyle}>
            {/* Header with title */}
            <div className="p-5 pb-3 bg-[#1F1F1F]">
                <div className="flex items-center mb-4">
                    <div className="w-6 h-6 bg-[#712828] rounded flex items-center justify-center mr-2">
                        {template.icon}
                    </div>
                    <h3 className="text-white text-lg font-normal">{template.name}</h3>
                </div>

                {/* Table header */}
                <div className="grid grid-cols-3 gap-2 mb-2 text-xs text-gray-300">
                    <div className="px-2">Criterion</div>
                    <div className="px-2">Description</div>
                    <div className="px-2">Max Score</div>
                </div>

                {/* Table rows */}
                <div className="space-y-2 mb-3">
                    {criteria.map((criterion, index) => (
                        <div key={index} className="grid grid-cols-3 gap-2 bg-[#2A2A2A] rounded-md p-1 text-white">
                            <div className="px-2 py-1 text-sm">{criterion.name}</div>
                            <div className="px-2 py-1 flex items-center">
                                <div className="h-3 bg-[#333] rounded w-full"></div>
                            </div>
                            <div className="px-2 py-1 text-sm text-center">{criterion.maxScore}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Description text */}
            <p className="text-white text-sm font-normal p-2">{description}</p>
        </div>
    );
};

const ScorecardTemplatesDialog: React.FC<ScorecardTemplatesDialogProps> = ({
    isOpen,
    onClose,
    onCreateNew,
    onSelectTemplate,
    position
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

    // Define template options with updated properties
    const templates: ScorecardTemplate[] = [
        {
            id: 'critical-thinking',
            name: 'Critical Thinking',
            icon: <Check size={16} className="text-white" />,
            categories: ['Analysis', 'Evaluation', 'Inference', 'Problem-solving'],
            description: "Develop critical thinking skills systematically",
            criteria: [
                { name: "Analysis", maxScore: 5 },
                { name: "Evaluation", maxScore: 5 },
                { name: "Inference", maxScore: 5 }
            ]
        },
        {
            id: 'creativity',
            name: 'Creativity',
            icon: <Sparkles size={16} className="text-white" />,
            categories: ['Originality', 'Fluency', 'Flexibility', 'Elaboration'],
            description: "Foster creative thinking and innovation",
            criteria: [
                { name: "Originality", maxScore: 5 },
                { name: "Fluency", maxScore: 5 },
                { name: "Flexibility", maxScore: 5 }
            ]
        },
        {
            id: 'issue-tracking',
            name: 'Issue Tracking',
            icon: <Check size={16} className="text-white" />,
            description: "Resolve issues and feedback fast",
            criteria: [
                { name: "Priority", maxScore: 5 },
                { name: "Status", maxScore: 5 },
                { name: "Resolution", maxScore: 5 }
            ]
        },
    ];

    // Simpler approach: create a ref and track DOM element
    const [hoveredElement, setHoveredElement] = useState<HTMLDivElement | null>(null);

    if (!isOpen) return null;

    // Calculate position - default if not provided
    const dialogPosition = position || { top: 0, left: 0 };

    return (
        <div
            className="fixed inset-0 z-50"
            onClick={onClose}
        >
            <div
                className="absolute bg-[#1E1E1E] rounded-lg shadow-lg w-[296px] overflow-visible"
                style={{
                    top: dialogPosition.top,
                    left: dialogPosition.left
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4">
                    <h2 className="text-white text-lg font-normal">New scorecard</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Create new option */}
                <div
                    className="flex items-center px-4 py-3 hover:bg-[#2A2A2A] cursor-pointer transition-colors"
                    onClick={onCreateNew}
                >
                    <div className="w-8 h-8 bg-[#313131] rounded flex items-center justify-center mr-3">
                        <Plus size={20} className="text-white" />
                    </div>
                    <span className="text-white text-sm">New empty scorecard</span>
                </div>

                {/* Suggested section */}
                <div className="mb-2">
                    <div className="px-4 py-2 text-sm text-gray-400">Templates</div>

                    {templates.map((template) => (
                        <div
                            key={template.id}
                            className="flex items-center px-4 py-3 hover:bg-[#2A2A2A] cursor-pointer transition-colors relative"
                            onClick={() => onSelectTemplate(template.id)}
                            onMouseEnter={(e) => {
                                setHoveredTemplate(template.id);
                                setHoveredElement(e.currentTarget as HTMLDivElement);
                            }}
                            onMouseLeave={() => {
                                setHoveredTemplate(null);
                                setHoveredElement(null);
                            }}
                        >
                            <div className="w-8 h-8 bg-[#712828] rounded flex items-center justify-center mr-3">
                                {template.icon}
                            </div>
                            <span className="text-white text-sm">{template.name}</span>

                            {/* Preview on hover */}
                            {hoveredTemplate === template.id && hoveredElement && (
                                <TemplatePreview
                                    template={template}
                                    templateElement={hoveredElement}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ScorecardTemplatesDialog; 