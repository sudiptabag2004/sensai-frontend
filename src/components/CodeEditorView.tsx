import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Play, Send, Terminal, ArrowLeft, X, AlertTriangle, Shield, Eye, EyeOff } from 'lucide-react';
import { useSession } from "next-auth/react";

async function savePlagiarismEvent(email: string, code: string) {
  await fetch("http://localhost:8001/api/plagiarism-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      timestamp: new Date().toISOString(),
      code,
    }),
  });
}

// Mock Editor component (replace with your actual Monaco Editor)
interface EditorProps {
  height: string | number;
  language: string;
  value: string;
  onChange?: (value: string) => void;
  theme?: string;
  options?: Record<string, any>;
  onMount?: (editor: any) => void;
}

const Editor: React.FC<EditorProps> = ({ height, language, value, onChange, theme, options, onMount }) => {
  const [localValue, setLocalValue] = useState(value || '');
  
  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleChange = (e: { target: { value: any; }; }) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <textarea
      className="w-full h-full bg-[#1E1E1E] text-white p-4 font-mono text-sm resize-none border-0 outline-0"
      value={localValue}
      onChange={handleChange}
      placeholder={`Write your ${language} code here...`}
      style={{ fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace' }}
    />
  );
};


// Toast Component
interface ToastProps {
  show: boolean;
  title: string;
  description: string;
  emoji: string;
  onClose: () => void;
  isMobileView: boolean;
  type?: 'warning' | 'error' | 'success';
}

const Toast: React.FC<ToastProps> = ({ show, title, description, emoji, onClose, isMobileView, type = 'warning' }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  const bgColor = type === 'error' ? 'bg-red-800' : type === 'success' ? 'bg-green-800' : 'bg-yellow-800';

  return (
    <div className={`fixed ${isMobileView ? 'top-4 left-4 right-4' : 'top-4 right-4'} z-50`}>
      <div className={`${bgColor} text-white p-4 rounded-lg shadow-lg flex items-start space-x-3 max-w-md`}>
        <span className="text-xl">{emoji}</span>
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{title}</h4>
          <p className="text-xs mt-1 opacity-90">{description}</p>
        </div>
        <button onClick={onClose} className="text-white hover:text-gray-200">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

// Plagiarism Detection Modal
interface PlagiarismModalProps {
  isOpen: boolean;
  onClose: () => void;
  suspiciousActivity: (string | number | boolean | React.ReactNode | Promise<any> | null | undefined)[];
  onProceed: () => void;
  onRevert: () => void;
  stats?: {
    charsAdded: number;
    timeSpan: number;
    typingSpeed: number;
    pasteEvents: number;
  };
}

const PlagiarismModal: React.FC<PlagiarismModalProps> = ({ isOpen, onClose, suspiciousActivity, onProceed, onRevert, stats }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-[#1D1D1D] border border-[#444444] rounded-lg p-6 max-w-lg w-full mx-4 shadow-2xl">
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="text-yellow-500 flex-shrink-0" size={28} />
          <h2 className="text-white text-xl font-semibold">Plagiarism Detected!</h2>
        </div>
        
        <div className="text-gray-300 mb-6">
                      <p className="mb-3 text-sm">
            Suspicious coding activity detected. Please confirm this is your original work.
        </p>
          
          <p className="mt-4 text-sm text-gray-400">
            If this is your original code typed naturally, you can proceed. 
            If you pasted code from external sources, please write your own solution.
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onRevert}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            Revert Changes
          </button>
          <button
            onClick={onProceed}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            This is My Code
          </button>
        </div>
        
        <button
          onClick={onClose}
          className="w-full mt-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg px-4 py-2 text-sm transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

// Plagiarism Detection Hook
const usePlagiarismDetection = (
  onDetection: (suspiciousActivity: string[], stats: { charsAdded: number; timeSpan: number; typingSpeed: number; pasteEvents: number }) => void
) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [stats, setStats] = useState({
    charsAdded: 0,
    timeSpan: 0,
    typingSpeed: 0,
    pasteEvents: 0
  });
  
  type ChangeHistoryItem = { chars: number; time: number; timeDiff: number };
  const detectionRef = useRef<{
    lastChange: number;
    changeHistory: ChangeHistoryItem[];
    pasteCount: number;
    totalCharsAdded: number;
    startTime: number;
    lastValue: string;
  }>({
    lastChange: Date.now(),
    changeHistory: [],
    pasteCount: 0,
    totalCharsAdded: 0,
    startTime: Date.now(),
    lastValue: ''
  });

  const checkForPlagiarism = useCallback((newValue: string | any[], oldValue: string | any[]) => {
    if (!isEnabled) return;

    const now = Date.now();
    const detection = detectionRef.current;
    const charsAdded = newValue.length - oldValue.length;
    const timeSinceLastChange = now - detection.lastChange;

    // Update stats
    if (charsAdded > 0) {
      detection.totalCharsAdded += charsAdded;
      detection.changeHistory.push({
        chars: charsAdded,
        time: now,
        timeDiff: timeSinceLastChange
      });

      // Keep only recent history (last 10 seconds)
      detection.changeHistory = detection.changeHistory.filter(
        change => now - change.time < 10000
      );

      const recentChars = detection.changeHistory.reduce((sum, change) => sum + change.chars, 0);
      const timeSpan = detection.changeHistory.length > 0 ? 
        now - detection.changeHistory[0].time : 0;
      const typingSpeed = timeSpan > 0 ? (recentChars / (timeSpan / 1000)) : 0;

      setStats({
        charsAdded: recentChars,
        timeSpan,
        typingSpeed: Math.round(typingSpeed * 100) / 100,
        pasteEvents: detection.pasteCount
      });

      // Detection criteria
      const suspiciousActivity = [];

      // 1. Large burst of characters (>50 chars in <500ms)
      if (charsAdded > 50 && timeSinceLastChange < 500) {
        suspiciousActivity.push(`Large text burst: ${charsAdded} characters in ${timeSinceLastChange}ms`);
      }

      // 2. Very high typing speed (>15 chars/sec sustained)
      if (typingSpeed > 20 && recentChars > 40) {
        suspiciousActivity.push(`Abnormally fast typing: ${typingSpeed} chars/second`);
      }

      // 3. Multiple large chunks quickly
      const recentLargeChunks = detection.changeHistory.filter(
        change => change.chars > 20 && now - change.time < 5000
      );
      if (recentLargeChunks.length >= 3) {
        suspiciousActivity.push(`Multiple large text chunks in short time`);
      }

      // 4. Pattern detection for common code structures
      const newText = newValue.slice(oldValue.length);
      if (charsAdded > 20) {
        const textStr = String(newText);
        const hasComplexPatterns = /^[\s]*(?:function|class|import|export|const|let|var|if|for|while|switch)\b/m.test(textStr) ||
                                  /^[\s]*(?:public|private|protected|static)\s+/m.test(textStr) ||
                                  /^[\s]*(?:<!DOCTYPE|<html|<head|<body|<script|<style)/i.test(textStr);
        
        if (hasComplexPatterns && timeSinceLastChange < 1000) {
          suspiciousActivity.push('Complex code structures appeared very quickly');
        }
      }

     // 5. Paste event detection (simulated)
        if (charsAdded > 100 && timeSinceLastChange < 100) {
         suspiciousActivity.push('Possible paste operation detected');
        }   

      // Trigger detection if suspicious
      if (suspiciousActivity.length > 0) {
        onDetection(suspiciousActivity, {
          charsAdded: recentChars,
          timeSpan,
          typingSpeed,
          pasteEvents: detection.pasteCount
        });
      }
    }

    detection.lastChange = now;
    detection.lastValue = String(newValue);
  }, [isEnabled, onDetection]);

  const resetDetection = useCallback(() => {
    detectionRef.current = {
      lastChange: Date.now(),
      changeHistory: [],
      pasteCount: 0,
      totalCharsAdded: 0,
      startTime: Date.now(),
      lastValue: ''
    };
    setStats({
      charsAdded: 0,
      timeSpan: 0,
      typingSpeed: 0,
      pasteEvents: 0
    });
  }, []);

  return {
    checkForPlagiarism,
    resetDetection,
    isEnabled,
    setIsEnabled,
    stats,
    detectionRef
  };
};

// Preview component that can be used in a separate column
export interface CodePreviewProps {
    isRunning: boolean;
    previewContent: string;
    output: string;
    isWebPreview: boolean;
    executionTime?: string;
    onClear?: () => void;
    onBack?: () => void;
    isMobileView?: boolean;
}

export const CodePreview: React.FC<CodePreviewProps> = ({
    isRunning,
    previewContent,
    output,
    isWebPreview,
    executionTime,
    onClear,
    onBack,
    isMobileView = false
}) => {
    const [isIframeLoading, setIsIframeLoading] = useState(true);

    // Reset loading state when new content is provided
    useEffect(() => {
        if (previewContent) {
            setIsIframeLoading(true);
        }
    }, [previewContent]);

    // Format console output with syntax highlighting
    const formatConsoleOutput = (text: string) => {
        if (!text) return 'Run your code to see output here';

        // Replace [ERROR], [WARN], and [INFO] tags with styled spans
        return text
            .replace(/\[ERROR\]/g, '<span class="text-red-500 font-bold">[ERROR]</span>')
            .replace(/\[WARN\]/g, '<span class="text-yellow-500 font-bold">[WARN]</span>')
            .replace(/\[INFO\]/g, '<span class="text-blue-500 font-bold">[INFO]</span>')
            .replace(/---.*?---/g, '<span class="text-gray-400">[interface omitted]</span>')
            .replace(/→ Return value:/g, '<span class="text-green-500 font-semibold">→ Return value:</span>')
            .replace(/(Error:[\s\S]*?)(?=\n\n|$)/g, '<span class="text-red-500">$1</span>')
            .replace(/(Compilation Error:[\s\S]*?)(?=\n\n|$)/g, '<span class="text-red-500">$1</span>');
    };

    // Create a modified HTML content with a loading indicator
    const enhancedPreviewContent = isWebPreview && previewContent ? `
        ${previewContent.replace(
        '</body>',
        `
            <style>
                #iframe-loading-indicator {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: #1a1a1a;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                    transition: opacity 0.3s ease-out;
                }
                #iframe-loading-indicator.hidden {
                    opacity: 0;
                    pointer-events: none;
                }
                .iframe-spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #2a2a2a;
                    border-top: 4px solid #a0a0a0;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
            <div id="iframe-loading-indicator">
                <div class="iframe-spinner"></div>
            </div>
            <script>
                // Hide the loading indicator when the page is fully loaded
                window.addEventListener('load', function() {
                    setTimeout(function() {
                        document.getElementById('iframe-loading-indicator').classList.add('hidden');
                    }, 500); // Small delay to ensure everything is rendered
                });
            </script>
            </body>
            `
    )}
    ` : previewContent;

    return (
        <div className={`flex-1 flex flex-col bg-[#111111] overflow-hidden h-full ${isMobileView ? 'mobile-preview-container' : ''}`}>
            <div className="px-4 bg-[#222222] text-white font-medium flex justify-between items-center">
                <div className="flex items-center">
                    <span className="text-sm py-2">{isWebPreview ? 'Preview' : 'Output'}</span>
                </div>
                <div className="items-center gap-2 flex">
                    {(!isWebPreview && output && onClear) && (
                        <button
                            onClick={onClear}
                            className="hidden md:block text-sm text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-[#333333] transition-colors cursor-pointer"
                            aria-label="Clear output"
                        >
                            Clear
                        </button>
                    )}
                    {isMobileView && onBack && (
                        <button
                            onClick={onBack}
                            className="text-sm text-gray-400 hover:text-white p-1 rounded hover:bg-[#333333] transition-colors"
                            aria-label="Close preview"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>
            <div className="flex-1 overflow-auto">
                {isRunning ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white"></div>
                    </div>
                ) : !previewContent && !output ? (
                    <div className="flex flex-col items-center justify-center h-full preview-placeholder text-gray-400">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14 4L18 8M18 8V18M18 8H8M6 20L10 16M10 16H20M10 16V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p>Run your code to see the preview here</p>
                        <p className="text-xs mt-2 text-center px-4">For HTML/CSS/JavaScript/React, you will see a live preview. For other languages, you will see the console output.</p>
                    </div>
                ) : isWebPreview ? (
                    <div className="relative w-full h-full">
                        {isIframeLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                                <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#f3f3f3] border-t-[#3498db]"></div>
                            </div>
                        )}
                        <iframe
                            srcDoc={enhancedPreviewContent}
                            title="Code Preview"
                            className="w-full h-full bg-white"
                            sandbox="allow-scripts"
                            onLoad={() => setIsIframeLoading(false)}
                        />
                    </div>
                ) : (
                    <div className="p-4 text-white font-mono text-sm terminal-output bg-[#1A1A1A]">
                        <div
                            className="whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: formatConsoleOutput(output) }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

interface CodeEditorViewProps {
    initialCode?: Record<string, string>;
    languages?: string[];
    handleCodeSubmit: (code: Record<string, string>) => void;
    onCodeRun?: (previewContent: string, output: string, executionTime?: string, isRunning?: boolean) => void;
    learnerEmail: string;
}

export interface CodeEditorViewHandle {
    getCurrentCode: () => Record<string, string>;
}

const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
    'javascript': 'JavaScript',
    'html': 'HTML',
    'css': 'CSS',
    'python': 'Python',
    'java': 'Java',
    'c': 'C',
    'cpp': 'C++',
    'csharp': 'C#',
    'ruby': 'Ruby',
    'typescript': 'TypeScript',
    'php': 'PHP',
    'react': 'React',
};

const DEFAULT_LANGUAGE_CONTENTS = {
    'javascript': 'function changeText() {\n  document.getElementById("greeting").textContent = "Hello from JavaScript!";\n}\n\nconsole.log("Hello, world!");\n',
    'html': '<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n</head>\n<body>\n  <h1 id="greeting">Hello, world!</h1>\n  <button onclick="changeText()">Change Text</button>\n</body>\n</html>\n',
    'css': 'body {\n  font-family: sans-serif;\n  margin: 20px;\n}\n\nh1 {\n  color: navy;\n}\n',
    'python': 'print("Hello, world!")\n',
    'java': 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, world!");\n  }\n}\n',
    'react': `function App() {
  const [count, setCount] = React.useState(0);

  return (
    <div style={{ fontFamily: "sans-serif", textAlign: "center", marginTop: "50px" }}>
      <h1>Hello from React!</h1>
      <p>You clicked the button {count} times</p>
      <button 
        onClick={() => setCount(count + 1)}
        style={{
          padding: "8px 16px",
          borderRadius: "4px",
          backgroundColor: "#0070f3",
          color: "white",
          border: "none",
          cursor: "pointer"
        }}
      >
        Click me
      </button>
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);`
} as Record<string, string>;

const CodeEditorView = forwardRef<CodeEditorViewHandle, CodeEditorViewProps>(({
    initialCode = {},
    languages = ['javascript'],
    handleCodeSubmit,
    onCodeRun,
}, ref) => {
    const { data: session } = useSession();
    const learnerEmail = session?.user?.email || "";
    const normalizedLanguages = languages.map(lang => lang.toLowerCase());
    
    const setupCodeState = (initial: Record<string, string>): Record<string, string> => {
        const state: Record<string, string> = {};
        normalizedLanguages.forEach(lang => {
            state[lang] = initial[lang] || DEFAULT_LANGUAGE_CONTENTS[lang] || '';
        });
        return state;
    };

    const [code, setCode] = useState<Record<string, string>>(() => setupCodeState(initialCode));
    const [activeLanguage, setActiveLanguage] = useState<string>(normalizedLanguages[0]);
    const [previewContent, setPreviewContent] = useState<string>('');
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [output, setOutput] = useState<string>('');
    const [executionTime, setExecutionTime] = useState<string>('');
    const [showInputPanel, setShowInputPanel] = useState<boolean>(false);
    const [stdInput, setStdInput] = useState<string>('');
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const [showMobilePreview, setShowMobilePreview] = useState<boolean>(false);
    const [inputError, setInputError] = useState<boolean>(false);
    const [isMobileView, setIsMobileView] = useState<boolean>(false);

    // Plagiarism detection states
    const [showPlagiarismModal, setShowPlagiarismModal] = useState(false);
    const [suspiciousActivity, setSuspiciousActivity] = useState<string[]>([]);
    const [detectionStats, setDetectionStats] = useState<{
        charsAdded: number;
        timeSpan: number;
        typingSpeed: number;
        pasteEvents: number;
    } | undefined>(undefined);
    const [previousCode, setPreviousCode] = useState<Record<string, string>>(code);
    const [showToast, setShowToast] = useState(false);
    const [toastData, setToastData] = useState({
        title: '',
        description: '',
        emoji: '',
        type: 'warning' as 'warning' | 'error' | 'success'
    });

    // Initialize plagiarism detection
    const { checkForPlagiarism, resetDetection, isEnabled: isPlagiarismEnabled, setIsEnabled: setPlagiarismEnabled, stats, detectionRef } = usePlagiarismDetection(
    (activities: React.SetStateAction<string[]>, stats: React.SetStateAction<null>) => {
        setPreviousCode(code);
    setSuspiciousActivity(activities);
    setDetectionStats(stats);
    // Add this line:
    savePlagiarismEvent(learnerEmail, code[activeLanguage]); // <-- pass the logged-in user's email here
    setShowPlagiarismModal(true);

);

    useEffect(() => {
        const checkMobileView = () => {
            setIsMobileView(window.innerWidth < 1024);
        };
        checkMobileView();
        window.addEventListener('resize', checkMobileView);
        return () => window.removeEventListener('resize', checkMobileView);
    }, []);

    useEffect(() => {
        setCode(setupCodeState(initialCode));
    }, [initialCode]);

    const handleCodeChange = (value: string | undefined) => {
        if (value !== undefined) {
            const oldValue = code[activeLanguage] || '';
            
            setCode(prevCode => {
                const newCode = {
                    ...prevCode,
                    [activeLanguage]: value
                };
                
                // Check for plagiarism on the new value
                checkForPlagiarism(value, oldValue);
                
                return newCode;
            });
        }
    };

    const handlePlagiarismProceed = () => {
    if (detectionRef && detectionRef.current) {
        detectionRef.current.pasteCount += 1;
        setDetectionStats((prev) => ({
            ...prev,
            pasteEvents: detectionRef.current.pasteCount
        }));
    }
    setTimeout(() => {
        setShowPlagiarismModal(false);
        setPreviousCode(code);
        setToastData({
            title: 'Proceeding with Code',
            description: 'Code accepted as original work.',
            emoji: '✅',
            type: 'success'
        });
        setShowToast(true);
        // Do NOT call resetDetection() here!
    }, 600); // 600ms delay so user sees the increment
};

    const handlePlagiarismRevert = () => {
    setCode(previousCode);
    setShowPlagiarismModal(false);
    // resetDetection();  // <-- REMOVE THIS LINE
    setToastData({
        title: 'Changes Reverted',
        description: 'Code has been reverted to previous state.',
        emoji: '↩️',
        type: 'warning'
    });
    setShowToast(true);
};

    const handleMobileBackClick = () => {
        setShowMobilePreview(false);
        if (onCodeRun) {
            onCodeRun('', output, executionTime, false);
        }
    };

    const countPythonInputs = (code: string): number => {
        const codeWithoutComments = code.replace(/#.*$/gm, '');
        const patterns = [/\binput\s*\([^)]*\)/g];
        let totalInputCalls = 0;
        patterns.forEach(pattern => {
            const matches = codeWithoutComments.match(pattern);
            if (matches) {
                totalInputCalls += matches.length;
            }
        });
        return totalInputCalls;
    };

    const countProvidedInputs = (input: string): number => {
        if (!input) return 0;
        return input.split('\n').length;
    };

    const handleCodeRun = () => {
        setInputError(false);

        if (activeLanguage === 'python') {
            const requiredInputs = countPythonInputs(code['python']);
            if (requiredInputs > 0) {
                const providedInputs = countProvidedInputs(stdInput);
                if (!showInputPanel) {
                    setShowInputPanel(true);
                    setInputError(true);
                    setToastData({
                        title: 'Input Required',
                        description: `Your code requires ${requiredInputs} input${requiredInputs > 1 ? 's' : ''}. Please provide ${requiredInputs > 1 ? 'them' : 'it'} in the input panel.`,
                        emoji: '⌨️',
                        type: 'warning'
                    });
                    setShowToast(true);
                    return;
                }
                if (providedInputs < requiredInputs) {
                    setInputError(true);
                    setToastData({
                        title: 'Insufficient Inputs',
                        description: `Your code requires ${requiredInputs} input${requiredInputs > 1 ? 's' : ''}, but ${providedInputs === 0 ? 'no input was provided' : `only ${providedInputs} ${providedInputs === 1 ? 'input was' : 'inputs were'} provided`}`,
                        emoji: '⚠️',
                        type: 'error'
                    });
                    setShowToast(true);
                    return;
                }
            }
        }

        setIsRunning(true);
        if (isMobileView) {
            setShowMobilePreview(true);
        }

        try {
            if (activeLanguage === 'react') {
                const reactTemplate = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>React Preview</title>
                    <script src="https://unpkg.com/react@18.2.0/umd/react.development.js"></script>
                    <script src="https://unpkg.com/react-dom@18.2.0/umd/react-dom.development.js"></script>
                    <script src="https://unpkg.com/@babel/standalone@7.21.4/babel.min.js"></script>
                    ${code['css'] ? `<style>${code['css']}</style>` : ''}
                </head>
                <body>
                    <div id="root"></div>
                    <script type="text/babel">
                    ${code['react']}
                    </script>
                </body>
                </html>`;

                setPreviewContent(reactTemplate);
                setOutput('React preview updated');

                if (onCodeRun) {
                    onCodeRun(reactTemplate, 'React preview updated', undefined, true);
                }

                setTimeout(() => {
                    setIsRunning(false);
                    if (onCodeRun) {
                        onCodeRun(reactTemplate, 'React preview updated', undefined, false);
                    }
                }, 300);
            } else {
                const outputMessage = `Code execution for ${LANGUAGE_DISPLAY_NAMES[activeLanguage] || activeLanguage} would happen on a server.`;
                setOutput(outputMessage);
                
                if (onCodeRun) {
                    onCodeRun('', outputMessage);
                }
                setIsRunning(false);
            }
        } catch (error) {
            const errorMessage = `Error: ${(error as Error).message}`;
            setOutput(errorMessage);
            setExecutionTime('');

            if (onCodeRun) {
                onCodeRun('', errorMessage, undefined, false);
            }
            setIsRunning(false);
        }
    };

    const handleSubmit = () => {
        handleCodeSubmit(code);
    };

    const handleEditorDidMount = (editor: any) => {
        editor?.focus?.();
    };

    const getMonacoLanguage = (lang: string) => {
        if (lang === 'react') return 'javascript';
        return lang;
    };

    useImperativeHandle(ref, () => ({
        getCurrentCode: () => code,
    }));

    const hasWebLanguages = normalizedLanguages.some(lang =>
        ['html', 'css', 'javascript'].includes(lang)
    );

    return (
        <div className="flex flex-col h-full overflow-auto">
            {/* Toast notification */}
            <Toast
                show={showToast}
                title={toastData.title}
                description={toastData.description}
                emoji={toastData.emoji}
                type={toastData.type}
                onClose={() => setShowToast(false)}
                isMobileView={isMobileView}
            />

            {/* Plagiarism Detection Modal */}
            <PlagiarismModal
                isOpen={showPlagiarismModal}
                onClose={() => setShowPlagiarismModal(false)}
                suspiciousActivity={suspiciousActivity}
                onProceed={handlePlagiarismProceed}
                onRevert={handlePlagiarismRevert}
                stats={detectionStats}
            />

            {/* Mobile preview overlay */}
            {isMobileView && showMobilePreview && (previewContent || output) ? (
                <div className="fixed inset-0 z-50 bg-[#111111]">
                    <div className="flex flex-col h-full">
                        <div className="px-4 bg-[#222222] text-white font-medium flex justify-between items-center">
                            <span className="text-sm py-2">Preview</span>
                            <button
                                onClick={handleMobileBackClick}
                                className="text-sm text-gray-400 hover:text-white p-1 rounded hover:bg-[#333333] transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto">
                            {isRunning ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white"></div>
                                </div>
                            ) : previewContent ? (
                                <iframe
                                    srcDoc={previewContent}
                                    title="Code Preview"
                                    className="w-full h-full bg-white"
                                    sandbox="allow-scripts"
                                />
                            ) : (
                                <div className="p-4 text-white font-mono text-sm bg-[#1A1A1A]">
                                    <div className="whitespace-pre-wrap">{output || 'Run your code to see output here'}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Language tabs */}
            {normalizedLanguages.length > 0 && !isMobileView && (
                <div className="flex items-center overflow-x-auto bg-[#1D1D1D] hide-scrollbar">
                    {normalizedLanguages.map((lang) => (
                        <button
                            key={lang}
                            onClick={() => setActiveLanguage(lang)}
                            className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${activeLanguage === lang
                                ? 'bg-[#2D2D2D] text-white border-b-2 border-white'
                                : 'text-gray-400 hover:text-white hover:bg-[#222222]'
                            }`}
                        >
                            {LANGUAGE_DISPLAY_NAMES[lang] || lang}
                        </button>
                    ))}
                    
                    
                </div>
            )}

            {/* Mobile language tabs */}
            {normalizedLanguages.length > 0 && isMobileView && (
                <div className="flex items-center justify-between overflow-x-auto bg-[#1D1D1D] hide-scrollbar">
                    <div className="flex">
                        {normalizedLanguages.map((lang) => (
                            <button
                                key={lang}
                                onClick={() => setActiveLanguage(lang)}
                                className={`px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${activeLanguage === lang
                                    ? 'bg-[#2D2D2D] text-white border-b-2 border-white'
                                    : 'text-gray-400 hover:text-white hover:bg-[#222222]'
                                }`}
                            >
                                {LANGUAGE_DISPLAY_NAMES[lang] || lang}
                            </button>
                        ))}
                    </div>
                    
                    <button
                        onClick={() => setPlagiarismEnabled(!isPlagiarismEnabled)}
                        className={`flex items-center space-x-1 px-2 py-1 rounded text-xs mr-2 ${
                            isPlagiarismEnabled 
                                ? 'bg-green-600 text-white' 
                                : 'bg-gray-600 text-gray-300'
                        }`}
                    >
                        <Shield size={12} />
                    </button>
                </div>
            )}

            {/* Main editor area */}
            <div className="flex-1 overflow-auto flex flex-col">
                <div className={`${showInputPanel ? 'flex-none h-2/3' : 'flex-1'}`}>
                    <Editor
    height="100%"
    language={getMonacoLanguage(activeLanguage)}
    value={code[activeLanguage]}
    onChange={handleCodeChange}
    theme="vs-dark"
    options={{
        minimap: { enabled: false },
        fontSize: 12,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'on',
        lineNumbers: 'off',
        readOnly: showPlagiarismModal // <-- Add this line here
    }}
    onMount={handleEditorDidMount}
/>
                </div>

                {/* Input panel */}
                {showInputPanel && (
                    <div className="flex-none h-1/3 border-t border-[#444444] flex flex-col">
                        <div className={`px-4 py-2 ${inputError ? 'bg-red-800' : 'bg-[#222222]'} text-white text-sm font-medium flex justify-between items-center`}>
                            <span>{inputError ? 'Input Required' : 'Add inputs for testing'}</span>
                        </div>
                        <textarea
                            ref={inputRef}
                            className={`flex-1 bg-[#1E1E1E] text-white p-4 resize-none font-mono text-sm border-0 outline-0 ${inputError ? 'border border-red-500' : ''}`}
                            value={stdInput}
                            onChange={(e) => {
                                setStdInput(e.target.value);
                                setInputError(false);
                            }}
                            placeholder="Add every input to your program in a new line"
                        />
                    </div>
                )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between p-4 border-t border-[#222222]">
                <div>
                    <button
                        onClick={handleCodeRun}
                        disabled={isRunning}
                        className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-700 disabled:opacity-50 text-white rounded-full px-4 py-2 cursor-pointer transition-colors"
                    >
                        {isRunning ? (
                            <>
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                <span>Run</span>
                            </>
                        ) : (
                            <>
                                <Play size={16} />
                                <span>Run</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Input toggle for Python */}
                {(['python'].includes(activeLanguage)) && (
                    <div>
                        <button
                            onClick={() => {
                                setShowInputPanel(!showInputPanel);
                                setTimeout(() => {
                                    if (!showInputPanel && inputRef.current) {
                                        inputRef.current.focus();
                                    }
                                }, 100);
                            }}
                            className={`flex items-center space-x-2 ${showInputPanel ? 'bg-[#444444] text-white' : inputError ? 'bg-red-700 text-white' : 'bg-[#333333] hover:bg-[#444444] text-white'
                                } rounded-full px-4 py-2 cursor-pointer transition-colors`}
                        >
                            <Terminal size={16} />
                            <span>Input</span>
                        </button>
                    </div>
                )}

                <div className="flex items-center space-x-2">
                    {/* Plagiarism status indicator */}
                    {isPlagiarismEnabled && (
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                            <Shield size={14} className="text-green-500" />
                            <span>Protected</span>
                        </div>
                    )}
                    
                    <button
                        onClick={handleSubmit}
                        className="flex items-center space-x-2 bg-white hover:bg-gray-200 text-black rounded-full px-4 py-2 cursor-pointer transition-colors"
                    >
                        <Send size={16} />
                        <span>Submit</span>
                    </button>
                </div>
            </div>

            {/* Plagiarism Detection Stats Panel (Development/Debug Mode) */}
            {/*{isPlagiarismEnabled && stats.charsAdded > 0 && !isMobileView && (
                <div className="bg-[#1A1A1A] border-t border-[#333333] p-2 text-xs text-gray-400">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <span>Typing Speed: {stats.typingSpeed.toFixed(1)} chars/sec</span>
                            <span>Recent Activity: {stats.charsAdded} chars</span>
                            <span>Time Span: {stats.timeSpan}ms</span>
                            {stats.pasteEvents > 0 && (
                                <span className="text-yellow-400">Paste Events: {stats.pasteEvents}</span>
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                                stats.typingSpeed > 15 ? 'bg-red-500' : 
                                stats.typingSpeed > 10 ? 'bg-yellow-500' : 
                                'bg-green-500'
                            }`}></div>
                            <span className="text-xs">
                                {stats.typingSpeed > 15 ? 'High Speed' : 
                                 stats.typingSpeed > 10 ? 'Moderate' : 
                                 'Normal'}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Global styles for hiding scrollbars */}
            <style jsx global>{`
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                
                @media (max-width: 1024px) {
                    .mobile-preview-container {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        z-index: 1000;
                        background-color: #111111;
                        animation: slide-up 0.3s ease-out;
                    }
                    
                    @keyframes slide-up {
                        from {
                            transform: translateY(100%);
                        }
                        to {
                            transform: translateY(0);
                        }
                    }
                }
            `}</style>
        </div>
    );
});

export default CodeEditorView;