import { X, Copy, Download, Check } from 'lucide-react';
import { useState } from 'react';
import { copyToClipboard } from '../services/responseActionsService';

interface GodModeResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: any;
  type: string;
}

export default function GodModeResultModal({
  isOpen,
  onClose,
  result,
  type,
}: GodModeResultModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    const textToCopy = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
    copyToClipboard(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `god-mode-${type}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderContent = () => {
    switch (type) {
      case 'summary':
        return (
          <div className="prose prose-sm max-w-none">
            <h3 className="text-lg font-bold mb-3">Document Summary</h3>
            <p className="text-gray-700 whitespace-pre-line leading-relaxed">{result}</p>
          </div>
        );

      case 'quiz':
        return (
          <div>
            <h3 className="text-lg font-bold mb-4">Quiz Questions</h3>
            <div className="space-y-4">
              {result.questions?.map((q: any, index: number) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <p className="font-semibold text-gray-900 mb-2">
                    {index + 1}. {q.question}
                  </p>
                  <div className="space-y-1 ml-4 mb-2">
                    {q.options?.map((option: string, i: number) => (
                      <div
                        key={i}
                        className={`text-sm ${
                          i === q.correct
                            ? 'text-green-700 font-semibold'
                            : 'text-gray-600'
                        }`}
                      >
                        {String.fromCharCode(65 + i)}. {option}
                      </div>
                    ))}
                  </div>
                  {q.explanation && (
                    <p className="text-xs text-gray-600 italic mt-2">
                      Explanation: {q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'entities':
        return (
          <div>
            <h3 className="text-lg font-bold mb-4">Extracted Entities</h3>
            <div className="space-y-4">
              {result.emails && result.emails.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Emails</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.emails.map((email: string, i: number) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {email}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {result.dates && result.dates.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Dates</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.dates.map((date: string, i: number) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                      >
                        {date}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {result.amounts && result.amounts.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Amounts</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.amounts.map((amount: string, i: number) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                      >
                        {amount}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {result.names && result.names.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Names</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.names.map((name: string, i: number) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'flashcards':
        return (
          <div>
            <h3 className="text-lg font-bold mb-4">Anki Flashcards</h3>
            <div className="space-y-3">
              {result.cards?.map((card: any, index: number) => (
                <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                  <p className="font-semibold text-gray-900 mb-2">Q: {card.front}</p>
                  <p className="text-gray-700 text-sm">A: {card.back}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'mindmap':
        return (
          <div>
            <h3 className="text-lg font-bold mb-4">Mind Map</h3>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
              {result}
            </pre>
            <p className="text-xs text-gray-600 mt-2">
              Copy this Mermaid code to visualize at mermaid.live
            </p>
          </div>
        );

      case 'markdown':
      case 'eli10':
      case 'contradictions':
        return (
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-line text-gray-700 leading-relaxed">{result}</div>
          </div>
        );

      default:
        return <pre className="text-sm text-gray-700">{JSON.stringify(result, null, 2)}</pre>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Result</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="text-green-600" size={20} />
              ) : (
                <Copy className="text-gray-600" size={20} />
              )}
            </button>
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="text-gray-600" size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close"
            >
              <X className="text-gray-600" size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">{renderContent()}</div>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
