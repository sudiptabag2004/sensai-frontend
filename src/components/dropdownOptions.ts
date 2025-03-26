import { DropdownOption } from "./Dropdown";

// Options for question types in the quiz editor
export const questionTypeOptions: DropdownOption[] = [
    {
        "label": "Default",
        "value": "objective",
        "color": "#3A506B",
    },
    {
        "label": "Open-Ended",
        "value": "subjective",
        "color": "#3C6E47",
        "tooltip": "Questions without any fixed correct answer"
    },
    // {
    //     "label": "Coding",
    //     "value": "coding",
    //     "color": "#614A82",
    //     "tooltip": "Questions where learners need to submit code"
    // }
];

// Options for answer types in the quiz editor
export const answerTypeOptions: DropdownOption[] = [
    {
        "label": "Text",
        "value": "text",
        "color": "#2D6A4F",
    },
    {
        "label": "Audio",
        "value": "audio",
        "color": "#9D4E4E",
    }
]; 