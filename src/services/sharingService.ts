import { supabase } from '../lib/supabase';

export interface SharedChat {
  id: string;
  pdf_file_id: string;
  share_token: string;
  is_public: boolean;
  created_at: string;
  expires_at: string | null;
}

function generateShareToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export async function createShareLink(pdfFileId: string): Promise<string> {
  const shareToken = generateShareToken();

  const { data, error } = await supabase
    .from('shared_chats')
    .insert({
      pdf_file_id: pdfFileId,
      share_token: shareToken,
      is_public: true,
    })
    .select()
    .single();

  if (error) throw error;

  return `${window.location.origin}/share/${shareToken}`;
}

export async function getSharedChat(shareToken: string): Promise<{ pdfFileId: string; fileName: string } | null> {
  const { data: shareData, error: shareError } = await supabase
    .from('shared_chats')
    .select('pdf_file_id')
    .eq('share_token', shareToken)
    .eq('is_public', true)
    .single();

  if (shareError || !shareData) return null;

  const { data: pdfData, error: pdfError } = await supabase
    .from('pdf_files')
    .select('id, file_name')
    .eq('id', shareData.pdf_file_id)
    .single();

  if (pdfError || !pdfData) return null;

  return {
    pdfFileId: pdfData.id,
    fileName: pdfData.file_name,
  };
}

export async function deleteShareLink(pdfFileId: string): Promise<void> {
  const { error } = await supabase
    .from('shared_chats')
    .delete()
    .eq('pdf_file_id', pdfFileId);

  if (error) throw error;
}
