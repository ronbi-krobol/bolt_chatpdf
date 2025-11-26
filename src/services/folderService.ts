import { supabase } from '../lib/supabase';

export interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
}

export async function createFolder(name: string, parentId?: string): Promise<Folder> {
  const { data, error } = await supabase
    .from('folders')
    .insert({
      name,
      parent_id: parentId || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getFolders(): Promise<Folder[]> {
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function renameFolder(folderId: string, newName: string): Promise<void> {
  const { error } = await supabase
    .from('folders')
    .update({ name: newName })
    .eq('id', folderId);

  if (error) throw error;
}

export async function deleteFolder(folderId: string): Promise<void> {
  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('id', folderId);

  if (error) throw error;
}

export async function movePDFToFolder(pdfId: string, folderId: string | null): Promise<void> {
  const { error } = await supabase
    .from('pdf_files')
    .update({ folder_id: folderId })
    .eq('id', pdfId);

  if (error) throw error;
}
