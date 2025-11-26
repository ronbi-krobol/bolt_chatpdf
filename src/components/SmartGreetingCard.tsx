import { Sparkles, Clock, Tag } from 'lucide-react';
import { SmartGreeting } from '../services/smartGreetingService';

interface SmartGreetingCardProps {
  greeting: SmartGreeting;
  onQuestionClick: (question: string) => void;
}

export default function SmartGreetingCard({ greeting, onQuestionClick }: SmartGreetingCardProps) {
  return (
    <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 rounded-2xl p-6 mb-6 border border-purple-100 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
          <Sparkles className="text-white" size={20} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Document Ready!</h3>
          <p className="text-gray-700 leading-relaxed">{greeting.summary}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4 text-sm">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 backdrop-blur-sm rounded-full">
          <Tag size={14} className="text-purple-600" />
          <span className="text-gray-700 font-medium">{greeting.metadata.documentType}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 backdrop-blur-sm rounded-full">
          <Clock size={14} className="text-blue-600" />
          <span className="text-gray-700 font-medium">
            {greeting.metadata.estimatedReadTime} min read
          </span>
        </div>
      </div>

      {greeting.metadata.keyTopics.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-600 mb-2">Key Topics:</p>
          <div className="flex flex-wrap gap-2">
            {greeting.metadata.keyTopics.map((topic, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-white/70 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700 border border-gray-200"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-700 mb-3">Suggested Questions:</p>
        {greeting.suggestedQuestions.map((item, index) => (
          <button
            key={index}
            onClick={() => onQuestionClick(item.question)}
            className="w-full text-left p-4 bg-white/80 backdrop-blur-sm hover:bg-white border border-gray-200 hover:border-purple-300 rounded-xl transition-all hover:shadow-md group"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                {item.icon}
              </span>
              <p className="text-gray-800 font-medium flex-1">{item.question}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
