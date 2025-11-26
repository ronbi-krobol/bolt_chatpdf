import { useState } from 'react';
import { Upload, FileText, ArrowUp } from 'lucide-react';
import Header from './Header';
import Sidebar from './Sidebar';
import { useTranslation } from '../lib/i18n';

interface LandingPageProps {
  onFileUpload: (file: File) => void;
}

export default function LandingPage({ onFileUpload }: LandingPageProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { t } = useTranslation();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    if (pdfFiles.length > 0) {
      onFileUpload(pdfFiles[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    if (pdfFiles.length > 0) {
      onFileUpload(pdfFiles[0]);
    }
  };

  return (
    <div className="flex h-screen bg-light-bg">
      <Sidebar />

      <div className="flex-1 ml-[280px] flex flex-col">
        <Header />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="bg-white rounded-chatpdf-lg shadow-sm border-2 border-dashed border-primary/30 p-12">
              <div className="text-center mb-8">
                <h1 className="text-5xl font-bold mb-4">
                  <span className="text-gray-900">{t('chatWithAnyPDF')} </span>
                  <span className="inline-flex items-center gap-2 bg-primary text-white px-4 py-1 rounded-lg">
                    PDF
                    <FileText size={32} />
                  </span>
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  {t('landingSubtitle')}
                </p>
              </div>

              <div
                className={`relative border-2 border-dashed rounded-chatpdf-lg p-12 transition-colors ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-300 bg-gray-50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{ minHeight: '400px' }}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="relative mb-6">
                    <div className="w-24 h-24 bg-white rounded-chatpdf shadow-md flex items-center justify-center">
                      <FileText size={48} className="text-gray-400" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
                      <ArrowUp size={20} className="text-white" />
                    </div>
                  </div>

                  <p className="text-lg text-gray-600 mb-6">
                    Click to upload or drag PDF here
                  </p>

                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="pdf-upload"
                    multiple
                  />

                  <label
                    htmlFor="pdf-upload"
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-all font-medium cursor-pointer mb-8 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg"
                  >
                    <Upload size={20} />
                    <span>{t('uploadPDF')}</span>
                  </label>

                  <div className="relative">
                    <svg
                      viewBox="0 0 300 60"
                      className="w-[300px] h-[60px]"
                    >
                      <text
                        x="150"
                        y="35"
                        textAnchor="middle"
                        className="text-primary font-bold"
                        style={{
                          fontFamily: 'Comic Sans MS, cursive',
                          fontSize: '16px',
                          fill: '#635BFF',
                        }}
                      >
                        DRAG + DROP YOUR PDF FILE HERE
                      </text>
                      <path
                        d="M 30 45 Q 150 50 270 45"
                        stroke="#635BFF"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  Free users can upload PDFs up to 120 pages
                </p>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-gray-600 mb-4">Trusted by millions worldwide</p>
              <div className="flex items-center justify-center gap-8 text-gray-400">
                <div className="text-sm">10M+ PDFs analyzed</div>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="text-sm">50M+ questions answered</div>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="text-sm">500K+ users</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
