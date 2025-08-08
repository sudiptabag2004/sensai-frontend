import { useEffect, useState, useMemo } from "react";
import { AlertTriangle, Clock, Copy, TrendingUp, User, Mail, Calendar, Activity, Shield, Eye, Terminal, FileText } from "lucide-react";

interface ReportCardProps {
  member: {
    name?: string;
    email?: string;
  };
  onBack: () => void;
}
function getNameFromEmail(email?: string) {
  if (typeof email !== 'string') return null;
  const match = email.match(/^([^@]+)/);
  return match ? match[1] : null;
}

export default function ReportCard({ member, onBack }: ReportCardProps) {
  interface PlagiarismEvent {
    timestamp: string;
    code: string;
    event_type:string;
  }

  const [events, setEvents] = useState<PlagiarismEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [otherCodes, setOtherCodes] = useState<{email: string, code: string}[]>([]);
  const [similarityLLM, setSimilarityLLM] = useState<string>("Loading...");

  useEffect(() => {
    if (member?.email) {
      setLoading(true);
      fetch(`http://localhost:8001/api/plagiarism-events?email=${encodeURIComponent(member.email)}`)
        .then(res => res.json())
        .then(data => {
          setEvents(data.events || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [member?.email]);

  useEffect(() => {
    if (member?.email) {
      fetch(`http://localhost:8001/api/all-codes?exclude_email=${encodeURIComponent(member.email)}`)
        .then(res => res.json())
        .then(data => setOtherCodes(data.codes || []))
        .catch(() => setOtherCodes([]));
    }
  }, [member?.email]);

  // Memoize calculations to prevent unnecessary re-renders
  const analytics = useMemo(() => {
    const totalEvents = events.length;
    
    const getIntegrityScore = () => {
      if (totalEvents === 0) return 100;
      if (totalEvents <= 2) return 85;
      if (totalEvents <= 5) return 70;
      if (totalEvents <= 10) return 50;
      return 25;
    };

    const getRiskLevel = () => {
      if (totalEvents === 0) return { level: "Low", color: "text-green-400", bg: "bg-green-900/20", border: "border-green-500/30" };
      if (totalEvents <= 2) return { level: "Minimal", color: "text-yellow-400", bg: "bg-yellow-900/20", border: "border-yellow-500/30" };
      if (totalEvents <= 5) return { level: "Moderate", color: "text-orange-400", bg: "bg-orange-900/20", border: "border-orange-500/30" };
      if (totalEvents <= 10) return { level: "High", color: "text-red-400", bg: "bg-red-900/20", border: "border-red-500/30" };
      return { level: "Critical", color: "text-red-300", bg: "bg-red-900/30", border: "border-red-400/40" };
    };

    const getTimeAnalysis = () => {
      if (events.length === 0) return null;
      
      const times = events.map(e => new Date(e.timestamp).getTime());
      const firstEvent = Math.min(...times);
      const lastEvent = Math.max(...times);
      const duration = (lastEvent - firstEvent) / (1000 * 60);
      
      return {
        firstEvent: new Date(firstEvent),
        lastEvent: new Date(lastEvent),
        duration: Math.round(duration),
        frequency: duration > 0 ? (events.length / (duration / 60)).toFixed(1) : "N/A"
      };
    };

    const getBehaviorInsights = () => {
      if (totalEvents === 0) return ["Demonstrated independent work", "No plagiarism attempts detected", "Strong academic integrity"];
      
      const insights = [];
      if (totalEvents > 10) insights.push("Excessive copy-paste behavior indicates heavy reliance on external sources");
      if (totalEvents > 5) insights.push("Multiple plagiarism attempts suggest lack of preparation or understanding");
      if (totalEvents <= 2) insights.push("Minimal external assistance - generally good performance");
      
      const timeAnalysis = getTimeAnalysis();
      if (timeAnalysis && timeAnalysis.duration < 30) {
        insights.push("Frequent copying in short timeframe suggests panic or rushed approach");
      }
      
      return insights;
    };

    const getCodingInference = () => {
      if (events.length === 0) return "No code submissions to analyze.";
      
      const totalLines = events.reduce((sum, e) => sum + (e.code ? e.code.split('\n').length : 0), 0);
      const avgLines = events.length ? (totalLines / events.length) : 0;
      const hasFunctions = events.some(e => /function\s+\w+|\w+\s*=>/.test(e.code || ""));
      const hasComments = events.some(e => /\/\//.test(e.code || ""));
      const hasLoops = events.some(e => /\bfor\b|\bwhile\b/.test(e.code || ""));
      const hasHtml = events.some(e => /<html|<body|<div/.test(e.code || ""));

      let summary = [];
      if (avgLines > 10) summary.push("Writes moderately long code blocks.");
      else summary.push("Writes short code snippets.");
      if (hasFunctions) summary.push("Uses functions, indicating understanding of modular code.");
      if (hasLoops) summary.push("Uses loops, showing ability to handle iteration.");
      if (hasComments) summary.push("Includes comments, suggesting good coding practices.");
      if (hasHtml) summary.push("Submits HTML code, indicating web development skills.");

      if (summary.length === 1) summary.push("No advanced coding features detected.");

      return summary.join(" ");
    };

    return {
      totalEvents,
      integrityScore: getIntegrityScore(),
      riskLevel: getRiskLevel(),
      timeAnalysis: getTimeAnalysis(),
      behaviorInsights: getBehaviorInsights(),
      codingInference: getCodingInference()
    };
  }, [events]);
useEffect(() => {
  if (!Array.isArray(events) || !Array.isArray(otherCodes)) {
    setSimilarityLLM("Invalid data format.");
    return;
  }

  if (!events.length || !otherCodes.length) {
    setSimilarityLLM("Not enough data to analyze similarity.");
    return;
  }

  setSimilarityLLM("Analyzing similarity...");

  // First similarity check
  const runSimilarityCheck = async () => {
    try {
      const res = await fetch("http://localhost:8001/api/similarity-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetCode: events.map(e => e.code).join("\n\n"),
          otherCodes
        }),
      });
      const data = await res.json();
      setSimilarityLLM(data.result || "No similarity detected.");
    } catch (err) {
      console.error("Similarity check failed:", err);
      setSimilarityLLM("Error analyzing similarity.");
    }
  };

  // runSimilarityCheck();

  // Second API analysis
  fetch("http://localhost:8000/api/analyze-similarity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      events: events.map(e => ({
        timestamp: e.timestamp,
        event_type: e.event_type,
        code: e.code || ""
      })),
      other_codes: otherCodes.map(o => ({
        email: o.email,
        code: o.code
      }))
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data && data.analysis) {
        let summary = data.analysis;
        if (data.top_matches && data.top_matches.length) {
          const m = data.top_matches[0];
          summary += `\nTop match: ${m.other_email} — similarity: ${m.similarity}`;
        }
        setSimilarityLLM(summary);
      } else {
        setSimilarityLLM("Analysis returned no result.");
      }
    })
    .catch(err => {
      console.error("Similarity API error", err);
      setSimilarityLLM("Error running similarity analysis.");
    });

}, [events, otherCodes]);



  console.log("events", events);
  console.log("otherCodes", otherCodes);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading assessment report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Clean Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-400" />
              <h1 className="text-2xl font-semibold text-white">Assessment Integrity Report</h1>
            </div>
            <button
              onClick={onBack}
              className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-200 bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Student Information */}
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{ getNameFromEmail(member?.email)
 || "John Doe"}</h2>
              <div className="flex items-center space-x-2 text-gray-400 mt-1">
                <Mail className="h-4 w-4" />
                <span>{member?.email || "johndoe@email.com"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Integrity Score */}
          <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-200">Integrity Score</h3>
              <Shield className="h-5 w-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">{analytics.integrityScore}</div>
            <div className="text-sm text-gray-400">out of 100</div>
            <div className={`mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${analytics.riskLevel.bg} ${analytics.riskLevel.color} ${analytics.riskLevel.border} border`}>
              {analytics.riskLevel.level} Risk
            </div>
          </div>

          {/* Plagiarism Events */}
          <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-200">Events Detected</h3>
              <Copy className="h-5 w-5 text-orange-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">{analytics.totalEvents}</div>
            <div className="text-sm text-gray-400">plagiarism instances</div>
            {analytics.timeAnalysis && (
              <div className="mt-3 text-xs text-gray-500">
                {analytics.timeAnalysis.frequency} events/hour
              </div>
            )}
          </div>

          {/* Time Analysis */}
          <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-200">Time Analysis</h3>
              <Clock className="h-5 w-5 text-purple-400" />
            </div>
            {analytics.timeAnalysis ? (
              <>
                <div className="text-lg font-semibold text-white mb-2">
                  {analytics.timeAnalysis.duration} min
                </div>
                <div className="text-sm text-gray-400">duration span</div>
                <div className="mt-3 text-xs text-gray-500">
                  {analytics.timeAnalysis.firstEvent.toLocaleDateString()}
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-500 py-4">No events to analyze</div>
            )}
          </div>

          {/* Assessment Status */}
          <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-200">Assessment Status</h3>
              <FileText className="h-5 w-5 text-green-400" />
            </div>
            {analytics.totalEvents === 0 ? (
              <>
                <div className="text-lg font-semibold text-green-400 mb-2">Valid</div>
                <div className="text-sm text-gray-400">High confidence</div>
              </>
            ) : analytics.totalEvents <= 5 ? (
              <>
                <div className="text-lg font-semibold text-yellow-400 mb-2">Review</div>
                <div className="text-sm text-gray-400">Minor concerns</div>
              </>
            ) : (
              <>
                <div className="text-lg font-semibold text-red-400 mb-2">Invalid</div>
                <div className="text-sm text-gray-400">Major concerns</div>
              </>
            )}
          </div>
        </div>

        {/* Detailed Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Behavioral Insights */}
          <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              <span>Behavioral Analysis</span>
            </h3>
            <div className="space-y-3">
              {analytics.behaviorInsights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-700/50 rounded-lg">
                  <Activity className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-300">{insight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Event Timeline */}
          <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-400" />
              <span>Event Timeline</span>
            </h3>
            <div className="max-h-64 overflow-y-auto">
              {events.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-3 text-gray-600" />
                  <p>No plagiarism events detected</p>
                  <p className="text-sm mt-2">Strong academic integrity demonstrated</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {events.map((event, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border border-gray-600 rounded-lg bg-gray-700/30">
                      <div className="h-3 w-3 bg-orange-400 rounded-full flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-200">{event.event_type}</div>
                        <div className="text-xs text-gray-400 truncate">
                          {new Date(event.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <AlertTriangle className="h-4 w-4 text-orange-400 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Code Analysis */}
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <Terminal className="h-5 w-5 text-green-400" />
            <span>Code Analysis</span>
          </h3>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-sm text-gray-300">{analytics.codingInference}</p>
          </div>
          {events.length > 0 && (
            <div className="mt-4 max-h-40 overflow-y-auto">
              <h4 className="text-sm font-medium text-gray-200 mb-2">Code Submissions</h4>
              <div className="space-y-2">
                {events.slice(0, 3).map((event, idx) => (
                  <details key={idx} className="group">
                    <summary className="cursor-pointer text-sm text-blue-400 hover:text-blue-300">
                      Submission {idx + 1} - {new Date(event.timestamp).toLocaleString()}
                    </summary>
                    <pre className="mt-2 bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto border border-gray-600">
                      {event.code?.trim() || "No code content"}
                    </pre>
                  </details>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Code Similarity Analysis (AI) */}
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-400" />
            <span>Code Similarity Analysis (AI)</span>
          </h3>
          {/* <div className="text-slate-300 text-sm whitespace-pre-line">{similarityLLM}</div> */}
          <div className="text-slate-300 text-sm whitespace-pre-line">Not enough data to perform Analysis   </div>
        </div>

        {/* Summary & Recommendations */}
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-400" />
            <span>Assessment Summary</span>
          </h3>
          <div className="prose prose-sm max-w-none">
            {analytics.totalEvents === 0 ? (
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Shield className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-green-300">Assessment Valid</h4>
                    <div className="mt-2 text-sm text-green-200">
                      <p>High confidence in assessment results. The student demonstrated independent work with no plagiarism events detected. This indicates strong academic integrity and authentic performance.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : analytics.totalEvents <= 5 ? (
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-yellow-300">Review Recommended</h4>
                    <div className="mt-2 text-sm text-yellow-200">
                      <p>Assessment is generally valid with minor integrity concerns. Consider follow-up discussion with the student to understand the context of detected events and reinforce academic integrity expectations.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-red-300">Significant Concerns</h4>
                    <div className="mt-2 text-sm text-red-200">
                      <p>Multiple integrity violations detected. The assessment results may not accurately reflect the student's true capabilities. Immediate review and potential reassessment recommended.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function tokenizeCode(code: string): string[] {
  // Remove comments, punctuation, and split into tokens (identifiers, keywords, etc.)
  return code
    .replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "") // remove comments
    .replace(/[^\w\s]/g, " ") // remove punctuation
    .split(/\s+/)
    .filter(Boolean)
    .map(token => token.toLowerCase());
}

function calculateJaccardSimilarity(codeA: string, codeB: string): number {
  const tokensA = new Set(tokenizeCode(codeA));
  const tokensB = new Set(tokenizeCode(codeB));
  const intersection = new Set([...tokensA].filter(x => tokensB.has(x)));
  const union = new Set([...tokensA, ...tokensB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function calculateTokenSimilarity(codeA: string, codeB: string): number {
  const tokensA = new Set(tokenizeCode(codeA));
  const tokensB = new Set(tokenizeCode(codeB));
  const intersection = new Set([...tokensA].filter(x => tokensB.has(x)));
  const union = new Set([...tokensA, ...tokensB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}