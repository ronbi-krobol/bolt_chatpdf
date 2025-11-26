import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import PDFViewerPage from './components/PDFViewerPage';
import { initializeOpenAI } from './services/optimizedEmbeddingService';
import { processUltraFastPDF, UltraFastProgress } from './services/ultraFastPDFOrchestrator';
import { checkPDFUploadLimit, incrementPDFUpload } from './services/usageLimitService';
import { getPDFById } from './services/pdfManagementService';
import { FileText, Crown } from 'lucide-react';

const MAX_FILE_SIZE = 50 * 1024 * 1024;

function App() {
  const [activePdfId, setActivePdfId] = useState<string | null>(null);
  const [activePdfName, setActivePdfName] = useState<string>('');
  const [documentText, setDocumentText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<UltraFastProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);
  const [remainingUploads, setRemainingUploads] = useState(3);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (apiKey) {
      initializeOpenAI(apiKey);
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    setError(null);

    if (file.size > MAX_FILE_SIZE) {
      setError('PDF too large! Maximum file size is 50MB. Please upload a smaller file.');
      return;
    }

    const { allowed, remaining } = await checkPDFUploadLimit();
    if (!allowed) {
      setRemainingUploads(remaining);
      setShowRateLimitModal(true);
      return;
    }

    await processFile(file);
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await processUltraFastPDF(file, (progress) => {
        setProcessingProgress(progress);
      });

      await incrementPDFUpload();
      setActivePdfId(result.fileId);
      setActivePdfName(file.name);
      setDocumentText(result.extractedText);
      setIsProcessing(false);
    } catch (error) {
      console.error('Error processing PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to process PDF: ${errorMessage}`);
      setIsProcessing(false);
      setActivePdfId(null);
    }
  };

  const handleFileSelect = async (fileId: string) => {
    try {
      const pdf = await getPDFById(fileId);
      if (pdf) {
        setActivePdfId(fileId);
        setActivePdfName(pdf.file_name);
      }
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
  };

  const handleNewChat = () => {
    setActivePdfId(null);
    setActivePdfName('');
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-light-bg flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {processingProgress?.message || 'Processing...'}
            </h2>
            {processingProgress?.details && (
              <div className="text-sm text-gray-500 mb-3 space-y-1">
                {processingProgress.details.currentPage && processingProgress.details.totalPages && (
                  <p>Page {processingProgress.details.currentPage} of {processingProgress.details.totalPages}</p>
                )}
                {processingProgress.details.chunksProcessed && processingProgress.details.totalChunks && (
                  <p>Chunks: {processingProgress.details.chunksProcessed}/{processingProgress.details.totalChunks}</p>
                )}
                {processingProgress.details.embeddingsGenerated !== undefined && processingProgress.details.totalEmbeddings && (
                  <p>Embeddings: {processingProgress.details.embeddingsGenerated}/{processingProgress.details.totalEmbeddings}</p>
                )}
              </div>
            )}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div
                className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${processingProgress?.progress || 0}%` }}
              ></div>
            </div>
            <p className="text-sm font-semibold text-gray-700">{processingProgress?.progress || 0}%</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-light-bg flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="text-red-600" size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setActivePdfId(null);
              }}
              className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showRateLimitModal) {
    return (
      <div className="min-h-screen bg-light-bg flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="text-primary" size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Daily Upload Limit Reached</h2>
            <p className="text-gray-600 mb-6">
              You've reached the free limit of 3 PDFs per day. Upgrade to Plus for unlimited uploads!
            </p>
            <div className="space-y-3">
              <button
                onClick={() => setShowRateLimitModal(false)}
                className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-medium transition-colors"
              >
                Upgrade to Plus
              </button>
              <button
                onClick={() => setShowRateLimitModal(false)}
                className="w-full text-gray-600 hover:text-gray-900 py-2 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activePdfId) {
    return (
      <PDFViewerPage
        fileName={activePdfName}
        pdfFileId={activePdfId}
        documentText={documentText}
        onFileSelect={handleFileSelect}
        onNewChat={handleNewChat}
      />
    );
  }

  return <LandingPage onFileUpload={handleFileUpload} />;
}

export default App;
