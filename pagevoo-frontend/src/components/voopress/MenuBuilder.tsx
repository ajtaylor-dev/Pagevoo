import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Link,
  FileText,
  Home,
  ExternalLink,
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  url: string;
  type: 'page' | 'custom' | 'category';
  children?: MenuItem[];
}

interface Menus {
  primary: MenuItem[];
  footer: MenuItem[];
}

interface MenuBuilderProps {
  menus: Menus;
  onMenusChange: (menus: Menus) => void;
}

const DEFAULT_PAGES = [
  { label: 'Home', url: '/', type: 'page' as const },
  { label: 'About', url: '/about', type: 'page' as const },
  { label: 'Blog', url: '/blog', type: 'page' as const },
  { label: 'Contact', url: '/contact', type: 'page' as const },
];

const MenuBuilder: React.FC<MenuBuilderProps> = ({ menus, onMenusChange }) => {
  const [activeMenu, setActiveMenu] = useState<'primary' | 'footer'>('primary');
  const [menuItems, setMenuItems] = useState<MenuItem[]>(menus[activeMenu] || []);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemUrl, setNewItemUrl] = useState('');

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addMenuItem = (item: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = {
      ...item,
      id: generateId(),
    };
    const newItems = [...menuItems, newItem];
    setMenuItems(newItems);
    saveMenus(newItems);
    setShowAddItem(false);
    setNewItemLabel('');
    setNewItemUrl('');
  };

  const removeMenuItem = (id: string) => {
    const newItems = menuItems.filter((item) => item.id !== id);
    setMenuItems(newItems);
    saveMenus(newItems);
  };

  const moveMenuItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...menuItems];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex >= 0 && newIndex < newItems.length) {
      [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
      setMenuItems(newItems);
      saveMenus(newItems);
    }
  };

  const saveMenus = (items: MenuItem[]) => {
    const updatedMenus = {
      ...menus,
      [activeMenu]: items,
    };
    onMenusChange(updatedMenus);
  };

  const handleMenuSwitch = (menu: 'primary' | 'footer') => {
    setActiveMenu(menu);
    setMenuItems(menus[menu] || []);
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-400 text-sm">
        Create and manage navigation menus for your site.
      </p>

      {/* Menu Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => handleMenuSwitch('primary')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            activeMenu === 'primary'
              ? 'bg-purple-600 text-white'
              : 'bg-[#2a2a4a] text-gray-400 hover:text-white'
          }`}
        >
          Primary Menu
        </button>
        <button
          onClick={() => handleMenuSwitch('footer')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            activeMenu === 'footer'
              ? 'bg-purple-600 text-white'
              : 'bg-[#2a2a4a] text-gray-400 hover:text-white'
          }`}
        >
          Footer Menu
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Current Menu Items */}
        <div>
          <h5 className="font-medium text-white mb-3">
            {activeMenu === 'primary' ? 'Primary' : 'Footer'} Menu Items
          </h5>

          {menuItems.length === 0 ? (
            <div className="p-4 bg-[#2a2a4a] rounded-lg text-center text-gray-400 text-sm">
              No menu items. Add items from the right panel or create custom links.
            </div>
          ) : (
            <div className="space-y-2">
              {menuItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-3 bg-[#2a2a4a] rounded-lg border border-gray-600"
                >
                  <GripVertical className="w-4 h-4 text-gray-500 cursor-move" />
                  {item.type === 'page' ? (
                    <FileText className="w-4 h-4 text-blue-400" />
                  ) : (
                    <Link className="w-4 h-4 text-green-400" />
                  )}
                  <div className="flex-1">
                    <p className="text-white text-sm">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.url}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveMenuItem(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveMenuItem(index, 'down')}
                      disabled={index === menuItems.length - 1}
                      className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeMenuItem(item.id)}
                      className="p-1 text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Items Panel */}
        <div>
          <h5 className="font-medium text-white mb-3">Add Menu Items</h5>

          {/* Quick Add Pages */}
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-2">Pages</p>
            <div className="space-y-1">
              {DEFAULT_PAGES.filter(
                (page) => !menuItems.find((item) => item.url === page.url)
              ).map((page) => (
                <button
                  key={page.url}
                  onClick={() => addMenuItem(page)}
                  className="w-full flex items-center gap-2 p-2 bg-[#2a2a4a] rounded-lg text-left hover:bg-[#3a3a5a] transition-colors"
                >
                  {page.url === '/' ? (
                    <Home className="w-4 h-4 text-gray-400" />
                  ) : (
                    <FileText className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm text-white">{page.label}</span>
                  <Plus className="w-4 h-4 text-purple-400 ml-auto" />
                </button>
              ))}
            </div>
          </div>

          {/* Custom Link */}
          <div className="p-4 bg-[#2a2a4a] rounded-lg">
            <p className="text-sm text-gray-400 mb-3 flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Custom Link
            </p>

            {showAddItem ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Label</label>
                  <input
                    type="text"
                    value={newItemLabel}
                    onChange={(e) => setNewItemLabel(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1a1a2e] border border-gray-600 rounded-lg text-white text-sm"
                    placeholder="Menu label"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">URL</label>
                  <input
                    type="text"
                    value={newItemUrl}
                    onChange={(e) => setNewItemUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1a1a2e] border border-gray-600 rounded-lg text-white text-sm"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (newItemLabel && newItemUrl) {
                        addMenuItem({
                          label: newItemLabel,
                          url: newItemUrl,
                          type: 'custom',
                        });
                      }
                    }}
                    disabled={!newItemLabel || !newItemUrl}
                    className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white text-sm rounded-lg"
                  >
                    Add Link
                  </button>
                  <button
                    onClick={() => {
                      setShowAddItem(false);
                      setNewItemLabel('');
                      setNewItemUrl('');
                    }}
                    className="px-3 py-2 text-gray-400 hover:text-white text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddItem(true)}
                className="w-full flex items-center justify-center gap-2 p-2 border border-dashed border-gray-600 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Custom Link
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuBuilder;
