import React, { useState, useRef, useEffect } from 'react';
import { Globe, Search, Check, ChevronDown, Sparkles } from 'lucide-react';
import { SUPPORTED_LANGUAGES, LanguageOption, getLanguageOption } from '../services/i18n';

interface LanguagePickerProps {
  currentLanguage: string;
  onChangeLanguage: (langId: string) => void;
  variant?: 'header' | 'card' | 'compact';
}

export const LanguagePicker: React.FC<LanguagePickerProps> = ({
  currentLanguage,
  onChangeLanguage,
  variant = 'header',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeLang = getLanguageOption(currentLanguage);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(
    (lang) =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.native.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const regions: ('North-East India' | 'India' | 'Global')[] = [
    'North-East India',
    'India',
    'Global',
  ];

  return (
    <div ref={dropdownRef} className="relative inline-block text-left z-30">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-1.5 transition active:scale-95 shadow-sm rounded-xl font-bold ${
          variant === 'card'
            ? 'w-full justify-between bg-stone-50 hover:bg-purple-50 border border-slate-300 p-3 text-slate-800 text-sm'
            : 'bg-white/90 hover:bg-white text-slate-800 border border-stone-200 px-3 py-1.5 text-xs'
        }`}
        title="Select Platform & Kai Voice Language"
      >
        <div className="flex items-center space-x-1.5">
          <Globe className="w-4 h-4 text-purple-600 flex-shrink-0" />
          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-extrabold rounded-md font-mono">
            {activeLang.badge}
          </span>
          <span className="truncate max-w-[100px] sm:max-w-[130px]">
            {activeLang.native} ({activeLang.name})
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Modal Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-stone-200 p-4 space-y-3 z-50 animate-fade-in max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <div className="flex items-center space-x-1.5 text-slate-800 font-black text-sm">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Select Language (ভাষা নির্বাচন)</span>
            </div>
            <span className="text-[10px] font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
              25+ Languages
            </span>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Assamese, Manipuri, Hindi, Bengali..."
              className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Languages Categorized List */}
          <div className="overflow-y-auto flex-grow space-y-4 pr-1">
            {regions.map((region) => {
              const group = filteredLanguages.filter((l) => l.region === region);
              if (group.length === 0) return null;

              return (
                <div key={region} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-400 bg-stone-100 px-2.5 py-1 rounded-lg">
                    <span>{region}</span>
                    {region === 'North-East India' && (
                      <span className="text-[9px] text-purple-700 font-extrabold bg-purple-100 px-1.5 rounded">
                        NE Special
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {group.map((lang) => {
                      const isSelected = lang.id === currentLanguage;

                      return (
                        <button
                          key={lang.id}
                          onClick={() => {
                            onChangeLanguage(lang.id);
                            setIsOpen(false);
                          }}
                          className={`p-2.5 rounded-xl border text-left font-bold text-xs transition flex items-center justify-between ${
                            isSelected
                              ? 'bg-purple-50 border-purple-400 text-purple-900 shadow-sm'
                              : 'bg-white border-stone-100 text-slate-800 hover:bg-stone-50 hover:border-slate-200'
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <span className="w-6 h-6 rounded-lg bg-stone-100 text-purple-800 text-[10px] font-black flex items-center justify-center flex-shrink-0 font-mono">
                              {lang.badge}
                            </span>
                            <div className="truncate">
                              <p className="truncate font-black">{lang.native}</p>
                              <p className="text-[10px] text-slate-400 font-medium truncate">{lang.name}</p>
                            </div>
                          </div>

                          {isSelected && <Check className="w-4 h-4 text-purple-600 flex-shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
