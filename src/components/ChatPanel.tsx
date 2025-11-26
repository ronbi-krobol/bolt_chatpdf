import { useState, useRef, useEffect } from 'react';
import { Send, Zap, Sparkles, HelpCircle, Package, Share2, Download, MoreVertical, FileText, MessageCircle } from 'lucide-react';
import { generateChatResponse } from '../services/chatService';
import { storeChatMessage, getChatHistory } from '../services/vectorSearchService';
import { createShareLink } from '../services/sharingService';
import { exportChatAsText, exportChatAsMarkdown, downloadFile } from '../services/pdfManagementService';
import { checkMessageLimit, incrementMessageCount } from '../services/usageLimitService';
import { generateSmartGreeting, SmartGreeting } from '../services/smartGreetingService';
import SmartGreetingCard from './SmartGreetingCard';
import ResponseActionButtons from './ResponseActionButtons';
import VoiceInput from './VoiceInput';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
  showSuggestions?: boolean;
  isStreaming?: boolean;
}

interface ChatPanelProps {
  fileName: string;
  pdfFileId: string;
  documentText?: string;
}

export default function ChatPanel({ fileName, pdfFileId, documentText }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isHighQuality, setIsHighQuality] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);
  const [smartGreeting, setSmartGreeting] = useState<SmartGreeting | null>(null);
  const [isLoadingGreeting, setIsLoadingGreeting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
    if (documentText && !smartGreeting) {
      generateGreeting();
    }
  }, [pdfFileId, documentText]);

  const generateGreeting = async () => {
    if (!documentText || isLoadingGreeting) return;
    setIsLoadingGreeting(true);
    try {
      const greeting = await generateSmartGreeting(documentText, fileName);
      setSmartGreeting(greeting);
    } catch (error) {
      console.error('Error generating smart greeting:', error);
    } finally {
      setIsLoadingGreeting(false);
    }
  };

  const loadChatHistory = async () => {
    try {
      const history = await getChatHistory(pdfFileId);
      const formattedMessages: Message[] = history.map((msg, index) => ({
        id: `${index}`,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(),
        showSuggestions: index === history.length - 1 && msg.role === 'assistant' && history.length === 1,
      }));

      if (formattedMessages.length === 0) {
        setMessages([
          {
            id: '0',
            role: 'assistant',
            content: `Hey there! I've processed your PDF: "${fileName}". Ask me anything about it!`,
            timestamp: new Date(),
            showSuggestions: true,
          },
        ]);
      } else {
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const suggestedQuestions = [
    {
      icon: Sparkles,
      text: 'Summarize this tender notice',
    },
    {
      icon: HelpCircle,
      text: 'What are the eligibility requirements for the tender?',
    },
    {
      icon: Package,
      text: 'What specific items are included in the scope of the supply?',
    },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleShare = async () => {
    try {
      const link = await createShareLink(pdfFileId);
      setShareLink(link);
      navigator.clipboard.writeText(link);
      alert('Share link copied to clipboard!');
    } catch (error) {
      console.error('Error creating share link:', error);
      alert('Failed to create share link');
    }
  };

  const handleExportText = () => {
    const text = exportChatAsText(messages.map(m => ({ role: m.role, content: m.content })));
    downloadFile(text, `${fileName}-chat.txt`, 'text/plain');
  };

  const handleExportMarkdown = () => {
    const markdown = exportChatAsMarkdown(
      messages.map(m => ({ role: m.role, content: m.content })),
      fileName
    );
    downloadFile(markdown, `${fileName}-chat.md`, 'text/markdown');
  };

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const { allowed, remaining } = await checkMessageLimit();
    if (!allowed) {
      setShowRateLimitModal(true);
      return;
    }

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);

    await storeChatMessage(pdfFileId, 'user', messageText);
    await incrementMessageCount();

    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      showSuggestions: false,
      isStreaming: true,
    };

    setMessages((prev) => [...prev, aiMessage]);

    try {
      const fullResponse = await generateChatResponse(
        pdfFileId,
        messageText,
        (chunk) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, content: msg.content + chunk }
                : msg
            )
          );
        }
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? { ...msg, isStreaming: false }
            : msg
        )
      );

      await storeChatMessage(pdfFileId, 'assistant', fullResponse);
    } catch (error) {
      console.error('Error generating response:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? {
                ...msg,
                content:
                  'Sorry, I encountered an error while processing your question. Please try again.',
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    handleSend(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 truncate">{fileName}</h2>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreVertical size={20} />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-10">
              <button
                onClick={() => {
                  handleShare();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Share2 size={16} />
                Share Chat
              </button>
              <button
                onClick={() => {
                  handleExportText();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <FileText size={16} />
                Export as Text
              </button>
              <button
                onClick={() => {
                  handleExportMarkdown();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Download size={16} />
                Export as Markdown
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <div className="max-w-3xl mx-auto space-y-6">
          {smartGreeting && messages.length <= 1 && (
            <SmartGreetingCard
              greeting={smartGreeting}
              onQuestionClick={handleSuggestedQuestion}
            />
          )}
          {messages.map((message, index) => (
            <div key={message.id} className="animate-message-stream">
              {message.role === 'assistant' ? (
                <div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">AI</span>
                    </div>
                    <div className="flex-1">
                      <div className="bg-primary/10 rounded-2xl rounded-tl-none px-5 py-4">
                        <p className="text-gray-900 leading-relaxed whitespace-pre-line">
                          {message.content}
                          {message.isStreaming && (
                            <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse"></span>
                          )}
                        </p>
                      </div>
                      {!message.isStreaming && index > 0 && (
                        <ResponseActionButtons
                          question={messages[index - 1]?.content || ''}
                          answer={message.content}
                          onRegenerate={() => handleSend(messages[index - 1]?.content)}
                        />
                      )}
                    </div>
                  </div>

                  {message.showSuggestions && index === messages.length - 1 && !isLoading && (
                    <div className="ml-11 mt-4 space-y-2">
                      {suggestedQuestions.map((question, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestedQuestion(question.text)}
                          className="w-full flex items-center gap-3 px-4 py-3 border-2 border-primary/30 rounded-xl text-left hover:bg-primary/5 hover:border-primary transition-colors group"
                        >
                          <question.icon
                            size={18}
                            className="text-primary flex-shrink-0"
                          />
                          <span className="text-gray-800 text-sm">
                            {question.text}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex gap-3 justify-end">
                  <div className="flex-1 max-w-[80%]">
                    <div className="bg-primary rounded-2xl rounded-tr-none px-5 py-4">
                      <p className="text-white leading-relaxed whitespace-pre-line">
                        {message.content}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-700 text-sm font-semibold">You</span>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-gray-200 p-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3">
            <VoiceInput
              onTranscript={(text) => {
                setInput((prev) => prev + ' ' + text);
              }}
              disabled={isLoading}
            />
            <div className="flex-1">
              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask any question..."
                  rows={1}
                  disabled={isLoading}
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary resize-none disabled:bg-gray-50 disabled:text-gray-500"
                  style={{ minHeight: '52px', maxHeight: '120px' }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsHighQuality(!isHighQuality)}
                    disabled={isLoading}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isHighQuality
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } disabled:opacity-50`}
                  >
                    <Zap size={14} />
                    <span>{isHighQuality ? 'High quality' : 'Fast'}</span>
                  </button>
                </div>
                <div className="text-xs text-gray-500">
                  {input.length} characters
                </div>
              </div>
            </div>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 w-12 h-12 bg-primary hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send size={20} className="text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {showRateLimitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="text-primary" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Daily Limit Reached</h3>
              <p className="text-gray-600">
                You've reached the free limit of 50 messages per day. Upgrade to Plus for unlimited messages!
              </p>
            </div>
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
      )}
    </div>
  );
}
