import React, { useState, useEffect } from 'react';
import './index.css';
import { DiffView } from '@git-diff-view/react';
import CommentChatbot from './CommentChatbot.jsx';
import ReactMarkdown from 'react-markdown';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';


// --- Loading Spinner Component ---
const LoadingSpinner = () => (
    <div className="loading-overlay">
        <div className="spinner"></div>
        <p>AI is thinking...</p>
        <span>(This can take a moment for large reviews)</span>
    </div>
);

// --- Theme Toggle Component ---
const ThemeToggle = ({ theme, onToggle }) => (
    <button onClick={onToggle} className="theme-toggle">
        {theme === 'dark' ? '☀️' : '🌙'}
    </button>
);

// --- UPDATED: Mode Switcher ---
const ModeSwitcher = ({ mode, onModeChange, loadings }) => (
    <div className="mode-switcher">
        <button
            className={mode === 'snippet' ? 'active' : ''}
            onClick={() => onModeChange('snippet')}
        >
            Review/Refactor
            {loadings.review && <span className="loading-dot"></span>}
        </button>
        {/* --- NEW "Review PR" Button --- */}
        <button
            className={mode === 'pr' ? 'active' : ''}
            onClick={() => onModeChange('pr')}
        >
            Review PR
            {loadings.pr && <span className="loading-dot"></span>}
        </button>
        <button
            className={mode === 'explain' ? 'active' : ''}
            onClick={() => onModeChange('explain')}
        >
            Explain Code
            {loadings.explain && <span className="loading-dot"></span>}
        </button>
        <button
            className={mode === 'history' ? 'active' : ''}
            onClick={() => onModeChange('history')}
        >
            History
        </button>
    </div>
);

// --- Code Input Box (UPDATED for Review Modes) ---
const CodeInputBox = ({ onReview, onRefactor, loading }) => {
    // ... (This component remains unchanged) ...
    const [code, setCode] = useState('');
    const [filename, setFilename] = useState('example.js');
    const [reviewMode, setReviewMode] = useState('standard'); // standard, security, performance

    return (
        <div className="code-input-box">
            <h2>Review or Refactor a Code Snippet</h2>
            <p>Paste code, provide a filename, and choose an action.</p>

            <div className="input-row">
                <div className="input-group">
                    <label htmlFor="filename">Filename:</label>
                    <input
                        type="text"
                        id="filename"
                        className="filename-input"
                        value={filename}
                        onChange={(e) => setFilename(e.target.value)}
                        placeholder="e.g., myComponent.jsx, utils.py"
                    />
                </div>
                <div className="input-group">
                    <label htmlFor="review-mode">Review Mode:</label>
                    <select
                        id="review-mode"
                        className="filename-input" /* re-use style */
                        value={reviewMode}
                        onChange={(e) => setReviewMode(e.target.value)}
                    >
                        <option value="standard">Standard Review</option>
                        <option value="security">Security Audit</option>
                        <option value="performance">Performance Check</option>
                    </select>
                </div>
            </div>

            <label htmlFor="code-snippet">Code Snippet:</label>
            <textarea
                id="code-snippet"
                className="code-textarea"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste your code here..."
                rows={15}
            />
            <div className="snippet-actions">
                <button
                    onClick={() => onReview(code, filename, reviewMode)}
                    disabled={loading || !code || !filename}
                    className="snippet-review-button"
                >
                    Review Snippet
                </button>
                <button
                    onClick={() => onRefactor(code, filename)}
                    disabled={loading || !code || !filename}
                    className="snippet-refactor-button"
                >
                    Refactor Code
                </button>
            </div>
        </div>
    );
};

// --- NEW: PR Input Box ---
const PrInputBox = ({ onPrReview, loading }) => {
    const [prUrl, setPrUrl] = useState('');

    return (
        <div className="code-input-box">
            <h2>Review a GitHub Pull Request</h2>
            <p>
                Paste the full URL to a pull request. The bot must be installed on
                that repository.
            </p>

            <label htmlFor="pr-url">Pull Request URL:</label>
            <input
                type="text"
                id="pr-url"
                className="filename-input"
                value={prUrl}
                onChange={(e) => setPrUrl(e.target.value)}
                placeholder="https://github.com/owner/repo/pull/123"
            />

            <div className="snippet-actions">
                <button
                    onClick={() => onPrReview(prUrl)}
                    disabled={loading || !prUrl}
                    className="snippet-review-button"
                >
                    Review Pull Request
                </button>
            </div>
        </div>
    );
};

// --- Code Explainer Box ---
const CodeExplainerBox = ({ onExplain, loading, result }) => {
    // ... (This component remains unchanged) ...
    const [code, setCode] = useState('');
    const [filename, setFilename] = useState('example.js');

    const handleSubmit = () => {
        onExplain(code, filename);
    };

    return (
        <div className="code-explainer-box">
            <div className="explainer-input-section">
                <h2>Code Explainer 💡</h2>
                <p>Paste any code snippet, and the AI will explain it in plain English.</p>
                <label htmlFor="filename-explain">Filename (for language detection):</label>
                <input
                    type="text"
                    id="filename-explain"
                    className="filename-input"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    placeholder="e.g., myComponent.jsx, utils.py"
                />
                <label htmlFor="code-snippet-explain">Code Snippet:</label>
                <textarea
                    id="code-snippet-explain"
                    className="code-textarea"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Paste your code here..."
                    rows={15}
                />
                <button onClick={handleSubmit} disabled={loading || !code || !filename} className="snippet-review-button">
                    {loading ? 'Thinking...' : 'Explain This Code'}
                </button>
            </div>
            <div className="explainer-output-section">
                <h3>Explanation</h3>
                <div className="explainer-result">
                    {loading && !result && (
                        <div className="loading-overlay" style={{padding: '20px'}}>
                            <div className="spinner"></div>
                        </div>
                    )}
                    {!loading && !result && <p className="placeholder-text">Your explanation will appear here...</p>}
                    <ReactMarkdown>{result}</ReactMarkdown>
                </div>
            </div>
        </div>
    );
};

// --- Refactor Result Display ---
const RefactorResult = ({ result, onClear, theme }) => {
    // ... (This component remains unchanged) ...
    const [showChat, setShowChat] = useState(false);
    return (
        <div className="refactor-result">
            <button onClick={onClear} className="start-new-review-button">
                Start New Review
            </button>
            <h2>AI Refactor Results</h2>
            <div className="mentor-feedback">
                <div className="mentor-header">
                    <h3>🤖 AI Refactor Explanation</h3>
                    <button className="chat-toggle-button" onClick={() => setShowChat(!showChat)}>
                        {showChat ? 'Close Chat' : 'Discuss 💬'}
                    </button>
                </div>
                <div className="markdown-content">
                    <ReactMarkdown>{result.explanation || "No explanation provided."}</ReactMarkdown>
                </div>
                {showChat && (
                    <CommentChatbot originalComment={result.explanation} />
                )}
            </div>
            {result.educationalLinks && result.educationalLinks.length > 0 && (
                <EducationalLinks links={result.educationalLinks} />
            )}
            <div className="code-comparison">
                <ReactDiffViewer
                    oldValue={result.originalCode || ''}
                    newValue={result.refactoredCode || ''}
                    splitView={true}
                    useDarkTheme={theme === 'dark'}
                    compareMethod={DiffMethod.WORDS}
                    leftTitle="Original Code"
                    rightTitle="Refactored Code"
                />
            </div>
        </div>
    );
};


// --- Helper Components ---
// ... (All helper components: getSeverityIcon, SuggestedFix, ReviewSummary, MentorFeedback, EducationalLinks, CommentLine, HistoryItem, HistoryDashboard... are UNCHANGED) ...
const getSeverityIcon = (severity) => {
    if (severity === 'error') return '🚫';
    if (severity === 'warning') return '⚠️';
    return '💡';
};

const SuggestedFix = ({ theme, ...props }) => {
    const [applied, setApplied] = useState(false);
    return (
        <div className="suggested-fix">
            <SyntaxHighlighter
                language="javascript"
                style={theme === 'dark' ? vscDarkPlus : prism}
                showLineNumbers
            >
                {props.suggestedFix || ''}
            </SyntaxHighlighter>

            {!applied ? (
                <button onClick={() => setApplied(true)} className="apply-fix-button">
                    Apply Fix (Simulated)
                </button>
            ) : (
                <span className="fix-applied">✓ Applied</span>
            )}
        </div>
    );
};

const ReviewSummary = ({ files }) => {
    let totalComments = 0;
    const commentCounts = { error: 0, warning: 0, info: 0 };
    let suggestedFixes = 0;
    let averageScore = 'N/A';
    let keyTakeaway = 'No key takeaways.';

    if (files && files.length > 0) {
        let scoreSum = 0;
        let scoreCount = 0;
        keyTakeaway = files[0]?.review?.keyTakeaway || "Review complete.";

        files.forEach(file => {
            if (!file || file.type === 'deleted') return;
            const review = file.review;
            if (!review) return;

            if (review.comments) {
                review.comments.forEach(comment => {
                    commentCounts[comment.severity] = (commentCounts[comment.severity] || 0) + 1;
                    totalComments++;
                    if (comment.suggestedFix) suggestedFixes++;
                });
            }

            if (review.codeHealthScore) {
                const scoreMap = { 'A+': 95, 'A': 90, 'A-': 87, 'B+': 83, 'B': 80, 'B-': 77, 'C+': 73, 'C': 70, 'C-': 67, 'D': 60, 'F': 50 };
                const reverseScoreMap = { 95: 'A+', 90: 'A', 87: 'A-', 83: 'B+', 80: 'B', 77: 'B-', 73: 'C+', 70: 'C', 67: 'C-', 60: 'D', 50: 'F' };
                if (scoreMap[review.codeHealthScore]) {
                    scoreSum += scoreMap[review.codeHealthScore];
                    scoreCount++;
                }
                if(scoreCount > 0) {
                    const avg = scoreSum / scoreCount;
                    const closest = Object.keys(reverseScoreMap).reduce((prev, curr) =>
                        (Math.abs(curr - avg) < Math.abs(prev - avg) ? curr : prev)
                    );
                    averageScore = reverseScoreMap[closest];
                }
            }
        });
    }

    if (!files || files.length === 0 || (totalComments === 0 && !files.some(f => f.review?.codeHealthScore))) {
        return null;
    }

    return (
        <div className="review-summary">
            <div className="summary-grid">
                <div className="summary-item score">
                    <h3><span className="summary-icon">🩺</span>Code Health Score</h3>
                    <div className="summary-count score-grade">{averageScore}</div>
                    <div className="summary-breakdown key-takeaway">
                        {keyTakeaway}
                    </div>
                </div>
                <div className="summary-item">
                    <h3><span className="summary-icon">🐞</span>Issues Found</h3>
                    <div className="summary-count">{totalComments}</div>
                    <div className="summary-breakdown">
                        {commentCounts.error > 0 && (
                            <div className="summary-severity error">
                                <span className="severity-icon">{getSeverityIcon('error')}</span>
                                <span className="severity-label">Errors:</span>
                                <span className="severity-count">{commentCounts.error}</span>
                            </div>
                        )}
                        {commentCounts.warning > 0 && (
                            <div className="summary-severity warning">
                                <span className="severity-icon">{getSeverityIcon('warning')}</span>
                                <span className="severity-label">Warnings:</span>
                                <span className="severity-count">{commentCounts.warning}</span>
                            </div>
                        )}
                        {commentCounts.info > 0 && (
                            <div className="summary-severity info">
                                <span className="severity-icon">{getSeverityIcon('info')}</span>
                                <span className="severity-label">Info:</span>
                                <span className="severity-count">{commentCounts.info}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="summary-item">
                    <h3><span className="summary-icon">🛠️</span>Suggested Fixes</h3>
                    <div className="summary-count">{suggestedFixes}</div>
                </div>
            </div>
        </div>
    );
};

const MentorFeedback = ({ feedback }) => {
    const [copied, setCopied] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const feedbackText = feedback || "...";

    const copyToClipboard = () => {
        navigator.clipboard.writeText(feedbackText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="mentor-feedback">
            <div className="mentor-header">
                <h3>🧠 AI Mentor's Feedback</h3>
                <div className="comment-buttons">
                    <button className="chat-toggle-button" onClick={() => setShowChat(!showChat)}>
                        {showChat ? 'Close Chat' : 'Discuss 💬'}
                    </button>
                    <button onClick={copyToClipboard} className="copy-button">
                        {copied ? '✅ Copied!' : '📋 Copy'}
                    </button>
                </div>
            </div>
            <div className="markdown-content">
                <ReactMarkdown>{feedbackText}</ReactMarkdown>
            </div>
            {showChat && (
                <CommentChatbot originalComment={feedbackText} />
            )}
        </div>
    );
};

const EducationalLinks = ({ links }) => {
    if (!links || links.length === 0) {
        return null;
    }
    return (
        <div className="educational-links">
            <h3>🎓 Further Reading</h3>
            <ul>
                {links.map((link, index) => (
                    <li key={index}>
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                            {link.topic}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const CommentLine = ({ file, comment, index, isResolved, onToggleResolved, theme }) => {
    const [showChat, setShowChat] = useState(false);
    const getSeverityClass = (severity) => {
        if (severity === 'error') return 'comment-error';
        if (severity === 'warning') return 'comment-warning';
        return 'comment-info';
    };
    return (
        <div className={`comment-line ${getSeverityClass(comment.severity)} ${isResolved ? 'resolved' : ''}`}>
            <span className="line-number old"></span>
            <span className="line-number new">
        {comment.lineNumber}
      </span>
            <span className="line-prefix">
        {isResolved ? '✅' : getSeverityIcon(comment.severity)}
      </span>
            <span className="line-content">
        <div className="comment-header">
          <strong>[{comment.severity.toUpperCase()}]:</strong> {comment.comment}
            <div className="comment-buttons">
            <button className="chat-toggle-button" onClick={() => setShowChat(!showChat)}>
              {showChat ? 'Close Chat' : 'Discuss 💬'}
            </button>
            <button
                className="resolve-button"
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleResolved(file.newPath, index);
                }}
            >
              {isResolved ? 'Unresolve' : 'Resolve'}
            </button>
          </div>
        </div>
                {comment.suggestedFix && !isResolved && (
                    <SuggestedFix
                        theme={theme} // Pass theme
                        filePath={file.newPath}
                        lineNumber={comment.lineNumber}
                        suggestedFix={comment.suggestedFix}
                    />
                )}
                {showChat && (
                    <CommentChatbot originalComment={comment.comment} />
                )}
      </span>
        </div>
    );
};

const HistoryItem = ({ item, theme }) => {
    const getPreview = (data) => {
        try {
            if (typeof data === 'string') return data.substring(0, 150) + (data.length > 150 ? '...' : '');
            if (data?.explanation) return data.explanation.substring(0, 150) + (data.explanation.length > 150 ? '...' : '');
            if (data?.files?.[0]?.review?.keyTakeaway) return data.files[0].review.keyTakeaway;
            if (data?.originalCode) return `Refactored ${data.originalCode.split('\n')[0]}...`;
            return 'No preview available.';
        } catch (e) {
            console.error("Error getting history preview:", e, item);
            return "Error loading preview.";
        }
    };
    const getTitle = (item) => {
        const title = item.title || 'Untitled';
        switch (item.type) {
            case 'review': return `Review: ${title}`;
            case 'refactor': return `Refactor: ${title}`;
            case 'explain': return `Explain: ${title}`;
            case 'pr': return `PR Review: ${title}`; // --- NEW History Type ---
            default: return title;
        }
    };
    const getIcon = (type) => {
        switch (type) {
            case 'review': return '🩺';
            case 'refactor': return '🛠️';
            case 'explain': return '💡';
            case 'pr': return '🚀'; // --- NEW History Icon ---
            default: return '🤖';
        }
    };
    const getScore = (item) => {
        try {
            // --- UPDATED: Also get score for 'pr' type ---
            if ((item.type === 'review' || item.type === 'pr') && item.data?.files?.[0]?.review?.codeHealthScore) {
                const score = item.data.files[0].review.codeHealthScore;
                return (
                    <span className={`history-score ${score.charAt(0)}`}>
                        {score}
                    </span>
                );
            }
        } catch (e) { /* do nothing */ }
        return null;
    };

    return (
        <div className="history-item-card">
            <div className="history-item-header">
                <span className="history-item-icon">{getIcon(item.type)}</span>
                <div className="history-item-title-group">
                    <strong>{getTitle(item)}</strong>
                    <small>{new Date(item.id).toLocaleString()}</small>
                </div>
                {getScore(item)}
            </div>
            <div className="history-item-body">
                <p>{getPreview(item.data)}</p>
                {item.type === 'refactor' && item.data?.originalCode && (
                    <SyntaxHighlighter
                        language="diff"
                        style={theme === 'dark' ? vscDarkPlus : prism}
                        customStyle={{ fontSize: '0.8em', maxHeight: '100px' }}
                    >
                        {`- ${item.data.originalCode.split('\n')[0] || ''}...\n+ ${item.data.refactoredCode.split('\n')[0] || ''}...`}
                    </SyntaxHighlighter>
                )}
            </div>
        </div>
    );
};

const HistoryDashboard = ({ history, onClear, theme }) => (
    <div className="history-dashboard">
        <div className="history-header">
            <h2>Interaction History</h2>
            <button onClick={onClear} className="clear-history-button">
                Clear History
            </button>
        </div>
        {history.length === 0 ? (
            <p>No interactions found. Use any AI tool to save your history.</p>
        ) : (
            <div className="history-list-grid">
                {history.map(item => (
                    <HistoryItem key={item.id} item={item} theme={theme} />
                ))}
            </div>
        )}
    </div>
);


// --- apiRequest function is UNCHANGED ---
const apiRequest = async (endpoint, body, setLoading, setError) => {
    setLoading(true);
    if (setError) setError('');

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data = await response.json(); // Get the full JSON response

        if (!response.ok) {
            throw new Error(data.details || data.error || `Request to ${endpoint} failed`);
        }

        return data; // Return the full JSON data

    } catch (err) {
        if (setError) setError(err.message);
        else console.error(`API Error ${endpoint}:`, err);
        return null;
    } finally {
        setLoading(false);
    }
};


// --- Main App Component ---
function App() {
    // --- STATE ---
    const [files, setFiles] = useState([]);
    const [error, setError] = useState(null); // Global error
    const [message, setMessage] = useState('');
    const [expandedFiles, setExpandedFiles] = useState({});
    const [resolvedComments, setResolvedComments] = useState({});
    const [theme, setTheme] = useState('dark');
    const [mode, setMode] = useState('snippet'); // snippet, pr, explain, history

    // --- LIFTED STATE ---
    const [reviewLoading, setReviewLoading] = useState(false);
    const [refactorResult, setRefactorResult] = useState(null);
    const [prReviewLoading, setPrReviewLoading] = useState(false); // --- NEW Loading State ---

    const [explainLoading, setExplainLoading] = useState(false);
    const [explainerResult, setExplainerResult] = useState('');

    const [reviewHistory, setReviewHistory] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('reviewHistory') || '[]');
        } catch (e) {
            console.error("Failed to parse history:", e);
            return [];
        }
    });

    // --- EFFECTS ---
    useEffect(() => {
        try {
            localStorage.setItem('reviewHistory', JSON.stringify(reviewHistory));
        } catch (e) {
            console.error("Failed to save history:", e);
        }
    }, [reviewHistory]);

    useEffect(() => {
        document.body.className = theme;
    }, [theme]);

    // --- FUNCTIONS ---
    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const saveToHistory = (type, title, data) => {
        const newHistoryItem = {
            id: new Date().toISOString(),
            type, // 'review', 'refactor', 'explain', 'pr'
            title, // e.g., "example.js"
            data,  // The full data (files array, result object, or result string)
        };
        setReviewHistory(prev => [newHistoryItem, ...prev]);
    };

    const handleApiResponse = (data, reviewType, target) => {
        if (data.message) setMessage(data.message);
        const reviewedFiles = data.files || [];
        const newExpandedState = {};
        reviewedFiles.forEach(file => { newExpandedState[file.newPath] = true; });
        setFiles(reviewedFiles);
        setExpandedFiles(newExpandedState);

        if (reviewedFiles.length > 0) {
            saveToHistory(reviewType, target, { files: reviewedFiles });
        }
    };

    // --- Handlers ---

    const handleSnippetReview = async (code, filename, reviewMode) => {
        setReviewLoading(true);
        setError(null);
        setFiles([]);
        setRefactorResult(null);
        try {
            const data = await apiRequest(
                '/api/review-snippet',
                { code, filename, mode: reviewMode },
                setReviewLoading,
                setError
            );
            if (data) handleApiResponse(data, 'review', `${filename} (${reviewMode})`);
        } catch (err) {
            setError(err.message);
        } finally {
            setReviewLoading(false);
        }
    };

    // --- NEW: PR Review Handler ---
    const handlePrReview = async (prUrl) => {
        setPrReviewLoading(true);
        setError(null);
        setFiles([]);
        setRefactorResult(null);
        try {
            const data = await apiRequest(
                '/api/review-pr',
                { prUrl },
                setPrReviewLoading,
                setError
            );
            // We use 'pr' as the reviewType for history
            if (data) handleApiResponse(data, 'pr', prUrl.split('/').slice(-3).join('/'));
        } catch (err) {
            setError(err.message);
        } finally {
            setPrReviewLoading(false);
        }
    };

    const handleRefactor = async (code, filename) => {
        setReviewLoading(true);
        setError(null);
        setFiles([]);
        setRefactorResult(null);
        try {
            const data = await apiRequest(
                '/api/refactor',
                { code, filename },
                setReviewLoading,
                setError
            );
            if (data) {
                setRefactorResult(data);
                saveToHistory('refactor', filename, data);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setReviewLoading(false);
        }
    };

    const handleExplain = async (code, filename) => {
        const data = await apiRequest(
            '/api/explain',
            { code, filename },
            setExplainLoading,
            setError
        );
        if (data && data.explanation) {
            setExplainerResult(data.explanation);
            saveToHistory('explain', filename, data.explanation);
        }
    };

    const clearHistory = () => {
        setReviewHistory([]);
    };

    const toggleCommentResolved = (filePath, commentIndex) => {
        const commentKey = `${filePath}-${commentIndex}`;
        setResolvedComments(prev => ({
            ...prev,
            [commentKey]: !prev[commentKey]
        }));
    };

    const isCommentResolved = (filePath, commentIndex) => {
        const commentKey = `${filePath}-${commentIndex}`;
        return resolvedComments[commentKey] || false;
    };

    const resetAppView = () => {
        setFiles([]);
        setMessage('');
        setRefactorResult(null);
        setError(null);
        setMode('snippet');
    };

    // --- Main Render Logic ---
    const renderMainContent = () => {
        // Show global error first
        if (error) return <div className="error-box"><strong>Error:</strong> {error}</div>;

        // --- RENDER LOGIC FOR REVIEW RESULTS (REUSABLE) ---
        // Both Snippet and PR reviews will show this view
        if (refactorResult) {
            return (
                <RefactorResult result={refactorResult} onClear={resetAppView} theme={theme} />
            );
        }

        if (files.length > 0) {
            return (
                <>
                    <button onClick={resetAppView} className="start-new-review-button">
                        Start New Review
                    </button>
                    {(reviewLoading || prReviewLoading) && <LoadingSpinner />}
                    <ReviewSummary files={files} />
                    <div className="diff-container">
                        {files.map((file) => (
                            <div key={file.newPath} className="file-diff">
                                <div className="file-header" onClick={() => setExpandedFiles(p => ({...p, [file.newPath]: !p[file.newPath]}))}>
                                    <h2>
                                        <span className={`expand-toggle ${expandedFiles[file.newPath] ? 'expanded' : 'collapsed'}`}>
                                            {expandedFiles[file.newPath] ? '▼' : '▶'}
                                        </span>
                                        {file.newPath}
                                        <span className="file-score-badge">{file.review?.codeHealthScore}</span>
                                    </h2>
                                    <div className="file-summary">
                                        <span>{file.review?.comments?.length || 0} issues</span>
                                        {file.review?.effortEstimation && (
                                            <span className="effort-badge">
                                                Effort: {file.review.effortEstimation}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {expandedFiles[file.newPath] && (
                                    <>
                                        {file.review?.overallFeedback && (
                                            <MentorFeedback feedback={file.review?.overallFeedback} />
                                        )}
                                        {file.review?.educationalLinks && file.review.educationalLinks.length > 0 && (
                                            <EducationalLinks links={file.review.educationalLinks} />
                                        )}
                                        {file.hunks && file.hunks.length > 0 && (
                                            <DiffView hunks={file.hunks} oldPath={file.oldPath} newPath={file.newPath}>
                                                {(hunks) =>
                                                    (hunks || []).map((hunk) => (
                                                        <React.Fragment key={hunk.key}>
                                                            {(hunk.lines || []).map((line) => (
                                                                <div key={line.key} className={`diff-line ${line.type}`}>
                                                                    <span className="line-number old">{line.oldLineNumber}</span>
                                                                    <span className="line-number new">{line.newLineNumber}</span>
                                                                    <span className="line-prefix">{line.prefix}</span>
                                                                    <span className="line-content">{line.content}</span>
                                                                </div>
                                                            ))}
                                                            {file.review?.comments &&
                                                                file.review.comments.map((comment, index) => {
                                                                    if (
                                                                        hunk &&
                                                                        comment.lineNumber >= hunk.newStart &&
                                                                        comment.lineNumber <= hunk.newStart + hunk.newLines
                                                                    ) {
                                                                        return (
                                                                            <CommentLine
                                                                                key={index}
                                                                                file={file}
                                                                                comment={comment}
                                                                                index={index}
                                                                                isResolved={isCommentResolved(file.newPath, index)}
                                                                                onToggleResolved={toggleCommentResolved}
                                                                                theme={theme}
                                                                            />
                                                                        );
                                                                    }
                                                                    return null;
                                                                })}
                                                        </React.Fragment>
                                                    ))
                                                }
                                            </DiffView>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            );
        }
        // --- END OF REUSABLE RENDER LOGIC ---


        // --- Mode-specific Input Views ---
        if (mode === 'history') {
            return <HistoryDashboard history={reviewHistory} onClear={clearHistory} theme={theme} />;
        }

        if (mode === 'explain') {
            if (explainLoading) return <LoadingSpinner />;
            return <CodeExplainerBox
                onExplain={handleExplain}
                loading={explainLoading}
                result={explainerResult}
                theme={theme}
            />;
        }

        // --- NEW: Show PR Input Box for 'pr' mode ---
        if (mode === 'pr') {
            if (prReviewLoading) return <LoadingSpinner />;
            return <PrInputBox onPrReview={handlePrReview} loading={prReviewLoading} />;
        }

        // --- Default view is 'snippet' mode ---
        if (mode === 'snippet') {
            if (reviewLoading) return <LoadingSpinner />;
            if (message) return <div className="message-box">{message}</div>;

            // Default view for 'snippet' mode
            return <CodeInputBox onReview={handleSnippetReview} onRefactor={handleRefactor} loading={reviewLoading} />;
        }
    };

    // Calculate loading states for tabs
    const tabLoadings = {
        review: reviewLoading,
        pr: prReviewLoading, // --- NEW ---
        explain: explainLoading,
    };

    return (
        <div className={`container ${theme}`}>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <main>
                <h1><span className="header-icon">🤖</span> AI Code Review Assistant</h1>
                <ModeSwitcher mode={mode} onModeChange={setMode} loadings={tabLoadings} />
                {renderMainContent()}
            </main>
        </div>
    );
}

export default App;