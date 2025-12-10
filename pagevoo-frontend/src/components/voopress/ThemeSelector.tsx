import React, { useState, useEffect } from 'react';
import { Check, Lock } from 'lucide-react';
import { api } from '../../services/api';

interface Theme {
  id: string;
  name: string;
  description: string;
  preview_image: string | null;
  tier_required: string;
  accessible: boolean;
  colors: {
    primary: string;
    secondary: string;
  };
}

interface ThemeSelectorProps {
  currentTheme: string;
  onThemeChange: (themeId: string) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onThemeChange }) => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      const response = await api.get('/v1/script-features/voopress/themes');
      setThemes(response.data || []);
    } catch (err) {
      console.error('Failed to load themes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = async (themeId: string) => {
    if (themeId === currentTheme) return;

    const theme = themes.find((t) => t.id === themeId);
    if (!theme?.accessible) return;

    setChanging(true);
    try {
      const response = await api.post('/v1/script-features/voopress/change-theme', {
        theme: themeId,
      });

      if (response.success) {
        onThemeChange(themeId);
      }
    } catch (err) {
      console.error('Failed to change theme:', err);
    } finally {
      setChanging(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-gray-400 text-sm">
        Choose a theme for your VooPress site. Changing themes will update your site layout while
        preserving your content.
      </p>

      <div className="grid grid-cols-2 gap-4">
        {themes.map((theme) => (
          <div
            key={theme.id}
            className={`relative rounded-lg border-2 cursor-pointer transition-all overflow-hidden ${
              currentTheme === theme.id
                ? 'border-purple-500 ring-2 ring-purple-500/30'
                : theme.accessible
                ? 'border-gray-600 hover:border-gray-500'
                : 'border-gray-700 opacity-60 cursor-not-allowed'
            }`}
            onClick={() => theme.accessible && handleThemeChange(theme.id)}
          >
            {/* Theme Preview */}
            <div
              className="h-28 flex items-center justify-center relative"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
              }}
            >
              <span className="text-white font-medium text-lg">{theme.name}</span>

              {/* Current Theme Badge */}
              {currentTheme === theme.id && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Locked Badge */}
              {!theme.accessible && (
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/50 rounded text-yellow-400 text-xs">
                  <Lock className="w-3 h-3" />
                  {theme.tier_required}
                </div>
              )}
            </div>

            {/* Theme Info */}
            <div className="p-3 bg-[#1a1a2e]">
              <h4 className="font-medium text-white text-sm">{theme.name}</h4>
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{theme.description}</p>
            </div>

            {/* Changing Overlay */}
            {changing && currentTheme !== theme.id && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500">
        Note: Changing themes may affect your page layouts. Your blog posts and content will be preserved.
      </p>
    </div>
  );
};

export default ThemeSelector;
