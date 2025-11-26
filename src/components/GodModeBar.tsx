import { useState } from 'react';
import {
  Sparkles,
  FileSpreadsheet,
  Brain,
  Presentation,
  Search,
  GitCompare,
  CreditCard,
  Network,
  Baby,
  FileCode,
  AlertTriangle,
  Wand2,
  X,
  Loader2,
} from 'lucide-react';
import {
  summarizeEntireDocument,
  extractTablesToExcel,
  generateQuizMCQ,
  createPresentationSlides,
  extractEntities,
  generateAnkiFlashcards,
  generateMindMap,
  explainLikeIm10,
  convertToMarkdown,
  findContradictions,
} from '../services/godModeService';

interface GodModeBarProps {
  documentText: string;
  fileName: string;
  onResult?: (result: any, type: string) => void;
}

export default function GodModeBar({ documentText, fileName, onResult }: GodModeBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const handleAction = async (
    action: () => Promise<any>,
    resultType: string,
    loadingMsg: string
  ) => {
    setIsLoading(true);
    setLoadingMessage(loadingMsg);
    try {
      const result = await action();
      onResult?.(result, resultType);
    } catch (error) {
      console.error('God Mode error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
      setIsOpen(false);
    }
  };

  const features = [
    {
      id: 'summarize',
      name: 'Summarize Document',
      icon: Sparkles,
      color: 'from-purple-500 to-pink-500',
      action: () =>
        handleAction(
          () => summarizeEntireDocument(documentText),
          'summary',
          'Creating comprehensive summary...'
        ),
    },
    {
      id: 'extract-tables',
      name: 'Extract Tables → Excel',
      icon: FileSpreadsheet,
      color: 'from-green-500 to-emerald-500',
      action: () =>
        handleAction(
          () => extractTablesToExcel(documentText, fileName),
          'excel',
          'Extracting tables to Excel...'
        ),
    },
    {
      id: 'quiz',
      name: 'Generate Quiz',
      icon: Brain,
      color: 'from-blue-500 to-cyan-500',
      action: () =>
        handleAction(
          () => generateQuizMCQ(documentText, 10),
          'quiz',
          'Generating quiz questions...'
        ),
    },
    {
      id: 'slides',
      name: 'Create Presentation',
      icon: Presentation,
      color: 'from-orange-500 to-red-500',
      action: () =>
        handleAction(
          () => createPresentationSlides(documentText, fileName),
          'slides',
          'Creating presentation slides...'
        ),
    },
    {
      id: 'entities',
      name: 'Extract Entities',
      icon: Search,
      color: 'from-yellow-500 to-orange-500',
      action: () =>
        handleAction(
          () => extractEntities(documentText),
          'entities',
          'Extracting emails, dates, amounts...'
        ),
    },
    {
      id: 'compare',
      name: 'Compare PDFs',
      icon: GitCompare,
      color: 'from-indigo-500 to-purple-500',
      action: () => alert('Please upload a second PDF to compare'),
    },
    {
      id: 'flashcards',
      name: 'Anki Flashcards',
      icon: CreditCard,
      color: 'from-pink-500 to-rose-500',
      action: () =>
        handleAction(
          () => generateAnkiFlashcards(documentText),
          'flashcards',
          'Creating flashcards...'
        ),
    },
    {
      id: 'mindmap',
      name: 'Generate Mind Map',
      icon: Network,
      color: 'from-teal-500 to-green-500',
      action: () =>
        handleAction(
          () => generateMindMap(documentText),
          'mindmap',
          'Creating mind map...'
        ),
    },
    {
      id: 'eli10',
      name: 'Explain Like I\'m 10',
      icon: Baby,
      color: 'from-cyan-500 to-blue-500',
      action: () =>
        handleAction(
          () => explainLikeIm10(documentText),
          'eli10',
          'Simplifying explanation...'
        ),
    },
    {
      id: 'markdown',
      name: 'Convert to Markdown',
      icon: FileCode,
      color: 'from-gray-600 to-gray-800',
      action: () =>
        handleAction(
          () => convertToMarkdown(documentText),
          'markdown',
          'Converting to Markdown...'
        ),
    },
    {
      id: 'contradictions',
      name: 'Find Contradictions',
      icon: AlertTriangle,
      color: 'from-red-500 to-orange-500',
      action: () =>
        handleAction(
          () => findContradictions(documentText),
          'contradictions',
          'Analyzing for risks...'
        ),
    },
    {
      id: 'custom',
      name: 'Ask Me Anything',
      icon: Wand2,
      color: 'from-violet-500 to-purple-500',
      action: () => alert('Use the chat to ask custom questions!'),
    },
  ];

  if (isLoading) {
    return (
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 px-6 py-4 flex items-center gap-3">
          <Loader2 className="animate-spin text-primary" size={24} />
          <span className="text-gray-900 font-medium">{loadingMessage}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 z-50 w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 group"
        title="God Mode - Superpowers"
      >
        {isOpen ? (
          <X className="text-white" size={28} />
        ) : (
          <Wand2 className="text-white group-hover:rotate-12 transition-transform" size={28} />
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed bottom-28 right-8 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 max-w-md w-96 max-h-[70vh] overflow-y-auto">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                <Wand2 className="text-purple-600" size={24} />
                God Mode
              </h3>
              <p className="text-sm text-gray-600">
                Unlock powerful document transformations
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {features.map((feature) => (
                <button
                  key={feature.id}
                  onClick={feature.action}
                  className="group relative overflow-hidden rounded-xl p-4 border-2 border-gray-200 hover:border-transparent transition-all hover:scale-105 hover:shadow-lg"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity`}
                  />
                  <feature.icon
                    className={`mx-auto mb-2 bg-gradient-to-br ${feature.color} bg-clip-text text-transparent`}
                    size={28}
                  />
                  <p className="text-xs font-semibold text-gray-900 text-center">
                    {feature.name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
