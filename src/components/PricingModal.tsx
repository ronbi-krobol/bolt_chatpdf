import { X, Check, Crown } from 'lucide-react';
import { useTranslation } from '../lib/i18n';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-4xl w-full relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
          <p className="text-gray-600">Unlock unlimited PDFs and messages with ChatPDF Plus</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="border-2 border-gray-200 rounded-2xl p-6">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Free</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold text-gray-900">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2">
                <Check size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">10 PDFs per month</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">120 messages per day</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">3 PDFs at once</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Basic support</span>
              </li>
            </ul>

            <button
              onClick={onClose}
              className="w-full py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Current Plan
            </button>
          </div>

          <div className="border-2 border-primary rounded-2xl p-6 bg-gradient-to-br from-primary/5 to-purple-500/5 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <Crown className="text-primary" size={32} />
            </div>

            <div className="mb-4">
              <div className="inline-block px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full mb-2">
                MOST POPULAR
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Plus</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold text-gray-900">$5</span>
                <span className="text-gray-600">/month</span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2">
                <Check size={20} className="text-primary flex-shrink-0 mt-0.5" />
                <span className="text-gray-900 font-medium">Unlimited PDFs</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={20} className="text-primary flex-shrink-0 mt-0.5" />
                <span className="text-gray-900 font-medium">Unlimited messages</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={20} className="text-primary flex-shrink-0 mt-0.5" />
                <span className="text-gray-900 font-medium">Up to 2000 pages per PDF</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={20} className="text-primary flex-shrink-0 mt-0.5" />
                <span className="text-gray-900 font-medium">Larger file sizes (50MB)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={20} className="text-primary flex-shrink-0 mt-0.5" />
                <span className="text-gray-900 font-medium">Priority support</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={20} className="text-primary flex-shrink-0 mt-0.5" />
                <span className="text-gray-900 font-medium">Advanced AI models</span>
              </li>
            </ul>

            <button className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors">
              {t('upgradeNow')}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>All plans include secure cloud storage and data encryption</p>
        </div>
      </div>
    </div>
  );
}
