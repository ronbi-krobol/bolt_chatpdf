import { useState, useEffect } from 'react';
import { Plus, FileText, MessageSquare, Folder, FolderPlus, Pencil, Shield, Youtube, GraduationCap, Monitor, Smartphone, MoreVertical, Trash2, Edit2, FolderInput, Crown } from 'lucide-react';
import { getAllPDFs, deletePDF, PDFFile } from '../services/pdfManagementService';
import { getFolders, createFolder, renameFolder, deleteFolder, movePDFToFolder, Folder as FolderType } from '../services/folderService';
import { useTranslation } from '../lib/i18n';

interface SidebarProps {
  activeFileId?: string;
  onFileSelect?: (fileId: string) => void;
  onNewChat?: () => void;
  isMobile?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ activeFileId, onFileSelect, onNewChat, isMobile = false, onClose }: SidebarProps) {
  const [pdfs, setPdfs] = useState<PDFFile[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ type: 'pdf' | 'folder'; id: string; x: number; y: number } | null>(null);
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(true);
  const { t } = useTranslation();

  const tools = [
    { icon: Pencil, label: t('aiWriter') },
    { icon: Shield, label: t('aiDetector') },
    { icon: Youtube, label: t('youtubeChat') },
    { icon: GraduationCap, label: t('aiScholar') },
    { icon: Monitor, label: t('windowsApp') },
    { icon: Smartphone, label: t('mobileApp') },
  ];

  useEffect(() => {
    loadPDFs();
    loadFolders();
  }, []);

  const loadPDFs = async () => {
    try {
      const data = await getAllPDFs();
      setPdfs(data);
    } catch (error) {
      console.error('Error loading PDFs:', error);
    }
  };

  const loadFolders = async () => {
    try {
      const data = await getFolders();
      setFolders(data);
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await createFolder(newFolderName);
      setNewFolderName('');
      setShowFolderInput(false);
      loadFolders();
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const handleDeletePDF = async (id: string) => {
    if (confirm(t('deleteConfirm'))) {
      try {
        await deletePDF(id);
        loadPDFs();
        setContextMenu(null);
      } catch (error) {
        console.error('Error deleting PDF:', error);
      }
    }
  };

  const handleDeleteFolder = async (id: string) => {
    if (confirm(t('deleteFolderConfirm'))) {
      try {
        await deleteFolder(id);
        loadFolders();
        loadPDFs();
        setContextMenu(null);
      } catch (error) {
        console.error('Error deleting folder:', error);
      }
    }
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const getPDFsInFolder = (folderId: string | null) => {
    return pdfs.filter(pdf => pdf.folder_id === folderId);
  };

  const handleFileClick = (fileId: string) => {
    onFileSelect?.(fileId);
    if (isMobile) {
      onClose?.();
    }
  };

  return (
    <>
      <div className={`${isMobile ? 'fixed inset-0 z-50 bg-dark-sidebar' : 'w-[280px] h-screen fixed left-0 top-0'} bg-dark-sidebar text-white flex flex-col`}>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-4">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-400">{t('chats')}</h3>
                <button
                  onClick={onNewChat}
                  className="p-1 hover:bg-sidebar-hover rounded transition-colors"
                  title="New Chat"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="space-y-1">
                {getPDFsInFolder(null).map((pdf) => (
                  <div key={pdf.id} className="relative group">
                    <button
                      onClick={() => handleFileClick(pdf.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                        activeFileId === pdf.id
                          ? 'bg-primary text-white'
                          : 'text-gray-300 hover:bg-sidebar-hover'
                      }`}
                    >
                      <FileText size={16} className="flex-shrink-0" />
                      <span className="truncate flex-1 text-left">{pdf.file_name}</span>
                      <span className="text-xs text-gray-500">{pdf.total_chunks} chunks</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setContextMenu({ type: 'pdf', id: pdf.id, x: e.clientX, y: e.clientY });
                      }}
                      className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-opacity"
                    >
                      <MoreVertical size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-400">{t('folders')}</h3>
                <button
                  onClick={() => setShowFolderInput(true)}
                  className="p-1 hover:bg-sidebar-hover rounded transition-colors"
                  title="New Folder"
                >
                  <FolderPlus size={16} />
                </button>
              </div>

              {showFolderInput && (
                <div className="mb-2">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                    onBlur={() => setShowFolderInput(false)}
                    placeholder="Folder name..."
                    className="w-full px-3 py-2 text-sm bg-sidebar-hover text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                  />
                </div>
              )}

              <div className="space-y-1">
                {folders.map((folder) => (
                  <div key={folder.id}>
                    <div className="relative group">
                      <button
                        onClick={() => toggleFolder(folder.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-sidebar-hover rounded-lg transition-colors"
                      >
                        <Folder size={16} className="flex-shrink-0" />
                        <span className="truncate flex-1 text-left">{folder.name}</span>
                        <span className="text-xs text-gray-500">
                          {getPDFsInFolder(folder.id).length}
                        </span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setContextMenu({ type: 'folder', id: folder.id, x: e.clientX, y: e.clientY });
                        }}
                        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-opacity"
                      >
                        <MoreVertical size={14} />
                      </button>
                    </div>

                    {expandedFolders.has(folder.id) && (
                      <div className="ml-4 mt-1 space-y-1">
                        {getPDFsInFolder(folder.id).map((pdf) => (
                          <div key={pdf.id} className="relative group">
                            <button
                              onClick={() => handleFileClick(pdf.id)}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                                activeFileId === pdf.id
                                  ? 'bg-primary text-white'
                                  : 'text-gray-300 hover:bg-sidebar-hover'
                              }`}
                            >
                              <FileText size={14} className="flex-shrink-0" />
                              <span className="truncate flex-1 text-left">{pdf.file_name}</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-400">{t('tools')}</h3>
              </div>
              <div className="space-y-1">
                {tools.map((tool) => (
                  <button
                    key={tool.label}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-sidebar-hover rounded-lg transition-colors"
                  >
                    <tool.icon size={18} />
                    <span>{tool.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-700">
          {showUpgradeBanner && (
            <div className="bg-gradient-to-r from-primary/20 to-purple-600/20 rounded-lg p-4 mb-3 border border-primary/30">
              <div className="flex items-start gap-3 mb-2">
                <Crown className="text-primary flex-shrink-0" size={24} />
                <div>
                  <h4 className="font-semibold text-white mb-1">{t('upgradeToPlusTitle')}</h4>
                  <p className="text-xs text-gray-300 mb-2">
                    {t('upgradeToPlusDesc')}
                  </p>
                  <button className="w-full bg-primary hover:bg-primary-hover text-white py-2 px-4 rounded-lg font-medium text-sm transition-all hover:scale-[1.02] active:scale-[0.98]">
                    {t('upgradeNow')}
                  </button>
                </div>
                <button
                  onClick={() => setShowUpgradeBanner(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          <div className="bg-sidebar-hover rounded-lg p-4 mb-3">
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                <MessageSquare className="text-primary" size={32} />
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center mb-3">
              {t('signUpFree')}
            </p>
          </div>
          <button className="w-full bg-primary hover:bg-primary-hover text-white py-2.5 px-4 rounded-lg font-medium transition-all hover:scale-[1.02] active:scale-[0.98]">
            {t('signUp')}
          </button>
        </div>
      </div>

      {contextMenu && (
        <div
          className="fixed bg-dark-sidebar border border-gray-700 rounded-lg shadow-xl py-1 z-50 min-w-[180px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseLeave={() => setContextMenu(null)}
        >
          {contextMenu.type === 'pdf' ? (
            <>
              <button
                onClick={() => {
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-sm text-left text-gray-300 hover:bg-sidebar-hover flex items-center gap-2"
              >
                <FolderInput size={16} />
                {t('moveToFolder')}
              </button>
              <button
                onClick={() => handleDeletePDF(contextMenu.id)}
                className="w-full px-4 py-2 text-sm text-left text-red-400 hover:bg-sidebar-hover flex items-center gap-2"
              >
                <Trash2 size={16} />
                {t('delete')}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setContextMenu(null)}
                className="w-full px-4 py-2 text-sm text-left text-gray-300 hover:bg-sidebar-hover flex items-center gap-2"
              >
                <Edit2 size={16} />
                {t('rename')}
              </button>
              <button
                onClick={() => handleDeleteFolder(contextMenu.id)}
                className="w-full px-4 py-2 text-sm text-left text-red-400 hover:bg-sidebar-hover flex items-center gap-2"
              >
                <Trash2 size={16} />
                {t('delete')}
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
