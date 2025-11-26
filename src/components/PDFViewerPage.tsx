import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import PDFDetailsPanel from './PDFDetailsPanel';
import ChatPanel from './ChatPanel';
import GodModeBar from './GodModeBar';
import GodModeResultModal from './GodModeResultModal';

interface PDFViewerPageProps {
  fileName: string;
  pdfFileId: string;
  documentText?: string;
  onFileSelect?: (fileId: string) => void;
  onNewChat?: () => void;
}

export default function PDFViewerPage({ fileName, pdfFileId, documentText, onFileSelect, onNewChat }: PDFViewerPageProps) {
  const [godModeResult, setGodModeResult] = useState<any>(null);
  const [godModeResultType, setGodModeResultType] = useState<string>('');
  const [showResultModal, setShowResultModal] = useState(false);

  const handleGodModeResult = (result: any, type: string) => {
    if (type === 'excel' || type === 'slides') {
      return;
    }
    setGodModeResult(result);
    setGodModeResultType(type);
    setShowResultModal(true);
  };

  return (
    <div className="flex h-screen bg-light-bg">
      <Sidebar
        activeFileId={pdfFileId}
        onFileSelect={onFileSelect}
        onNewChat={onNewChat}
      />

      <div className="flex-1 ml-[280px] flex flex-col">
        <Header />

        <div className="flex-1 flex overflow-hidden">
          <div className="w-[40%] border-r border-gray-200">
            <PDFDetailsPanel fileName={fileName} />
          </div>

          <div className="flex-1">
            <ChatPanel fileName={fileName} pdfFileId={pdfFileId} documentText={documentText} />
          </div>
        </div>
      </div>

      {documentText && (
        <>
          <GodModeBar
            documentText={documentText}
            fileName={fileName}
            onResult={handleGodModeResult}
          />
          <GodModeResultModal
            isOpen={showResultModal}
            onClose={() => setShowResultModal(false)}
            result={godModeResult}
            type={godModeResultType}
          />
        </>
      )}
    </div>
  );
}
