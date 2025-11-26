import { useState } from 'react';
import { Download, Volume2, Languages, Copy, Share2, RefreshCw, VolumeX } from 'lucide-react';
import {
  downloadAsPDF,
  playAudio,
  stopAudio,
  translateText,
  copyToClipboard,
  shareText,
  SUPPORTED_LANGUAGES,
} from '../services/responseActionsService';

interface ResponseActionButtonsProps {
  question: string;
  answer: string;
  pageReferences?: string[];
  onRegenerate?: () => void;
}

export default function ResponseActionButtons({
  question,
  answer,
  pageReferences,
  onRegenerate,
}: ResponseActionButtonsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranslateMenu, setShowTranslateMenu] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const handleDownloadPDF = () => {
    const textToDownload = translatedText || answer;
    downloadAsPDF(question, textToDownload, pageReferences);
  };

  const handlePlayAudio = async () => {
    if (isPlaying) {
      stopAudio();
      setIsPlaying(false);
    } else {
      try {
        const textToPlay = translatedText || answer;
        await playAudio(textToPlay);
        setIsPlaying(true);

        setTimeout(() => {
          setIsPlaying(false);
        }, (textToPlay.length / 15) * 1000);
      } catch (error) {
        console.error('Audio playback error:', error);
      }
    }
  };

  const handleTranslate = async (languageCode: string) => {
    setIsTranslating(true);
    setShowTranslateMenu(false);

    try {
      const translated = await translateText(answer, languageCode);
      setTranslatedText(translated);
    } catch (error) {
      console.error('Translation error:', error);
      alert('Translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = translatedText || answer;
    copyToClipboard(textToCopy);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleShare = () => {
    const textToShare = translatedText || answer;
    shareText(textToShare, question);
  };

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      <button
        onClick={handleDownloadPDF}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
        title="Download as PDF"
      >
        <Download size={16} />
        Download PDF
      </button>

      <button
        onClick={handlePlayAudio}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
        title={isPlaying ? 'Stop Audio' : 'Play Audio'}
      >
        {isPlaying ? <VolumeX size={16} /> : <Volume2 size={16} />}
        {isPlaying ? 'Stop' : 'Play Audio'}
      </button>

      <div className="relative">
        <button
          onClick={() => setShowTranslateMenu(!showTranslateMenu)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
          title="Translate"
          disabled={isTranslating}
        >
          <Languages size={16} />
          {isTranslating ? 'Translating...' : translatedText ? 'Translated' : 'Translate'}
        </button>

        {showTranslateMenu && (
          <div className="absolute z-10 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleTranslate(lang.code)}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 transition-colors"
              >
                {lang.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleCopy}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
        title="Copy to Clipboard"
      >
        <Copy size={16} />
        {copiedText ? 'Copied!' : 'Copy'}
      </button>

      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
        title="Share"
      >
        <Share2 size={16} />
        Share
      </button>

      {onRegenerate && (
        <button
          onClick={onRegenerate}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
          title="Regenerate Answer"
        >
          <RefreshCw size={16} />
          Regenerate
        </button>
      )}

      {translatedText && (
        <button
          onClick={() => setTranslatedText(null)}
          className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium text-blue-700"
        >
          Show Original
        </button>
      )}
    </div>
  );
}
