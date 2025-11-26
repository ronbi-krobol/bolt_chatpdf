import jsPDF from 'jspdf';

export interface ResponseAction {
  id: string;
  label: string;
  icon: string;
  action: () => void | Promise<void>;
}

export function downloadAsPDF(
  question: string,
  answer: string,
  pageReferences?: string[]
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = 20;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Question & Answer', margin, yPosition);
  yPosition += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Question:', margin, yPosition);
  yPosition += 8;

  doc.setFont('helvetica', 'normal');
  const questionLines = doc.splitTextToSize(question, maxWidth);
  doc.text(questionLines, margin, yPosition);
  yPosition += questionLines.length * 7 + 10;

  doc.setFont('helvetica', 'bold');
  doc.text('Answer:', margin, yPosition);
  yPosition += 8;

  doc.setFont('helvetica', 'normal');
  const answerLines = doc.splitTextToSize(answer, maxWidth);

  for (let i = 0; i < answerLines.length; i++) {
    if (yPosition > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      yPosition = 20;
    }
    doc.text(answerLines[i], margin, yPosition);
    yPosition += 7;
  }

  if (pageReferences && pageReferences.length > 0) {
    yPosition += 10;
    if (yPosition > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      yPosition = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.text('References:', margin, yPosition);
    yPosition += 8;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text(pageReferences.join(', '), margin, yPosition);
  }

  doc.save('answer.pdf');
}

export async function playAudio(text: string): Promise<void> {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (voice) => voice.lang.startsWith('en') && voice.name.includes('Google')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  } else {
    throw new Error('Text-to-speech not supported in this browser');
  }
}

export function stopAudio(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export async function translateText(
  text: string,
  targetLanguage: string
): Promise<string> {
  try {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`
    );

    const data = await response.json();
    const translated = data[0].map((item: any) => item[0]).join('');
    return translated;
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error('Translation failed. Please try again.');
  }
}

export function copyToClipboard(text: string): void {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text);
  } else {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Fallback: Unable to copy', err);
    }
    document.body.removeChild(textArea);
  }
}

export function shareText(text: string, title: string = 'Shared from ChatPDF'): void {
  if (navigator.share) {
    navigator
      .share({
        title,
        text,
      })
      .catch((err) => console.error('Error sharing:', err));
  } else {
    copyToClipboard(text);
  }
}

export const SUPPORTED_LANGUAGES = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'th', name: 'Thai' },
  { code: 'tr', name: 'Turkish' },
  { code: 'pl', name: 'Polish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'sv', name: 'Swedish' },
  { code: 'da', name: 'Danish' },
];
