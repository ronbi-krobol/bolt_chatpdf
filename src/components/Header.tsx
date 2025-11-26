import { useState, useEffect } from 'react';
import { Upload, Plus, LogOut, User as UserIcon } from 'lucide-react';
import { getCurrentUser, signOut, getUserProfile, UserProfile } from '../services/authService';
import { useTranslation } from '../lib/i18n';
import LanguageSelector from './LanguageSelector';
import AuthModal from './AuthModal';

interface HeaderProps {
  onUploadClick?: () => void;
}

export default function Header({ onUploadClick }: HeaderProps) {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
      const profile = await getUserProfile(currentUser.id);
      setUserProfile(profile);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setUserProfile(null);
    setShowUserMenu(false);
  };

  return (
    <>
      <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="text-xl font-bold">
              <span className="text-gray-900">Chat</span>
              <span className="text-primary">PDF</span>
            </span>
          </div>
          {onUploadClick && (
            <button
              onClick={onUploadClick}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              <Upload size={18} />
              <span>Upload PDF</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <LanguageSelector />

          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {userProfile?.avatar_url ? (
                  <img
                    src={userProfile.avatar_url}
                    alt="User avatar"
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {userProfile?.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                {userProfile?.tier === 'plus' && (
                  <span className="text-xs font-semibold text-primary">Plus</span>
                )}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {userProfile?.email}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{userProfile?.tier} plan</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                    }}
                    className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <UserIcon size={16} />
                    Profile
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                {t('signIn')}
              </button>
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                {t('signUp')}
              </button>
            </>
          )}
        </div>
      </header>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          loadUser();
        }}
      />
    </>
  );
}
