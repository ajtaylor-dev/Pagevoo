import React, { useState } from 'react';
import {
  GripVertical,
  Search,
  Clock,
  FolderTree,
  Tags,
  User,
  Mail,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Widget {
  id: string;
  type: string;
  title: string;
  config: Record<string, any>;
}

interface WidgetManagerProps {
  widgets: string[];
  onWidgetsChange: (widgets: string[]) => void;
}

const AVAILABLE_WIDGETS = [
  { type: 'search', name: 'Search', icon: Search, description: 'Search form for your site' },
  { type: 'recent_posts', name: 'Recent Posts', icon: Clock, description: 'Show latest posts' },
  { type: 'categories', name: 'Categories', icon: FolderTree, description: 'List of post categories' },
  { type: 'tags', name: 'Tags', icon: Tags, description: 'Tag cloud' },
  { type: 'about', name: 'About', icon: User, description: 'About the author/site' },
  { type: 'newsletter', name: 'Newsletter', icon: Mail, description: 'Email subscription form' },
];

const WidgetManager: React.FC<WidgetManagerProps> = ({ widgets, onWidgetsChange }) => {
  const [activeWidgets, setActiveWidgets] = useState<string[]>(widgets);
  const [expandedWidget, setExpandedWidget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const addWidget = (type: string) => {
    if (!activeWidgets.includes(type)) {
      const newWidgets = [...activeWidgets, type];
      setActiveWidgets(newWidgets);
      saveWidgets(newWidgets);
    }
  };

  const removeWidget = (type: string) => {
    const newWidgets = activeWidgets.filter((w) => w !== type);
    setActiveWidgets(newWidgets);
    saveWidgets(newWidgets);
  };

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    const newWidgets = [...activeWidgets];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex >= 0 && newIndex < newWidgets.length) {
      [newWidgets[index], newWidgets[newIndex]] = [newWidgets[newIndex], newWidgets[index]];
      setActiveWidgets(newWidgets);
      saveWidgets(newWidgets);
    }
  };

  const saveWidgets = async (widgetList: string[]) => {
    setSaving(true);
    try {
      onWidgetsChange(widgetList);
    } finally {
      setSaving(false);
    }
  };

  const getWidgetInfo = (type: string) => {
    return AVAILABLE_WIDGETS.find((w) => w.type === type);
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-400 text-sm">
        Add and arrange widgets for your sidebar. Drag to reorder.
      </p>

      <div className="grid grid-cols-2 gap-6">
        {/* Active Widgets */}
        <div>
          <h5 className="font-medium text-white mb-3">Active Widgets</h5>
          <div className="space-y-2">
            {activeWidgets.length === 0 ? (
              <div className="p-4 bg-[#2a2a4a] rounded-lg text-center text-gray-400 text-sm">
                No widgets added. Add widgets from the Available Widgets panel.
              </div>
            ) : (
              activeWidgets.map((type, index) => {
                const widget = getWidgetInfo(type);
                if (!widget) return null;

                return (
                  <div
                    key={type}
                    className="bg-[#2a2a4a] rounded-lg border border-gray-600 overflow-hidden"
                  >
                    <div
                      className="flex items-center gap-2 p-3 cursor-pointer"
                      onClick={() => setExpandedWidget(expandedWidget === type ? null : type)}
                    >
                      <GripVertical className="w-4 h-4 text-gray-500 cursor-move" />
                      <widget.icon className="w-4 h-4 text-purple-400" />
                      <span className="flex-1 text-white text-sm">{widget.name}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveWidget(index, 'up');
                          }}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveWidget(index, 'down');
                          }}
                          disabled={index === activeWidgets.length - 1}
                          className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeWidget(type);
                          }}
                          className="p-1 text-gray-400 hover:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {expandedWidget === type && (
                      <div className="p-3 border-t border-gray-600 bg-[#1a1a2e]">
                        <p className="text-sm text-gray-400">{widget.description}</p>
                        {/* Widget-specific settings could go here */}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Available Widgets */}
        <div>
          <h5 className="font-medium text-white mb-3">Available Widgets</h5>
          <div className="space-y-2">
            {AVAILABLE_WIDGETS.filter((w) => !activeWidgets.includes(w.type)).map((widget) => (
              <div
                key={widget.type}
                className="flex items-center gap-3 p-3 bg-[#2a2a4a] rounded-lg border border-gray-600 hover:border-purple-500 cursor-pointer transition-colors"
                onClick={() => addWidget(widget.type)}
              >
                <widget.icon className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <p className="text-white text-sm">{widget.name}</p>
                  <p className="text-xs text-gray-500">{widget.description}</p>
                </div>
                <Plus className="w-4 h-4 text-purple-400" />
              </div>
            ))}

            {AVAILABLE_WIDGETS.filter((w) => !activeWidgets.includes(w.type)).length === 0 && (
              <div className="p-4 bg-[#2a2a4a] rounded-lg text-center text-gray-400 text-sm">
                All widgets have been added.
              </div>
            )}
          </div>
        </div>
      </div>

      {saving && (
        <div className="text-center text-sm text-purple-400">Saving changes...</div>
      )}
    </div>
  );
};

export default WidgetManager;
