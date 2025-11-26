import { supabase } from '../lib/supabase';

export interface PDFFile {
  id: string;
  file_name: string;
  file_size: number;
  upload_date: string;
  processing_status: string;
  total_chunks: number;
  folder_id: string | null;
  thumbnail_url: string | null;
  is_deleted: boolean;
}

export async function getAllPDFs(): Promise<PDFFile[]> {
  const { data, error } = await supabase
    .from('pdf_files')
    .select('*')
    .eq('is_deleted', false)
    .order('upload_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getPDFById(id: string): Promise<PDFFile | null> {
  const { data, error } = await supabase
    .from('pdf_files')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function deletePDF(id: string): Promise<void> {
  const { error } = await supabase
    .from('pdf_files')
    .update({ is_deleted: true })
    .eq('id', id);

  if (error) throw error;
}

export async function permanentlyDeletePDF(id: string): Promise<void> {
  const { error } = await supabase
    .from('pdf_files')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export function exportChatAsText(messages: Array<{ role: string; content: string }>): string {
  let text = 'Chat Export\n';
  text += '='.repeat(50) + '\n\n';

  messages.forEach((msg, index) => {
    const role = msg.role === 'user' ? 'You' : 'AI Assistant';
    text += `${role}:\n${msg.content}\n\n`;
    if (index < messages.length - 1) {
      text += '-'.repeat(50) + '\n\n';
    }
  });

  return text;
}

export function exportChatAsMarkdown(messages: Array<{ role: string; content: string }>, fileName: string): string {
  let markdown = `# Chat: ${fileName}\n\n`;

  messages.forEach((msg) => {
    const role = msg.role === 'user' ? '**You**' : '**AI Assistant**';
    markdown += `${role}:\n\n${msg.content}\n\n---\n\n`;
  });

  return markdown;
}

export function downloadFile(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
