import React, { useState } from 'react';
import { Image as ImageIcon, Plus, Trash2, Calendar } from 'lucide-react';
import { MemoryItem } from '../types';

interface MemoryBankManagerProps {
  memories: MemoryItem[];
  onAddMemory: (memory: { title: string; description: string; imageUrl: string; category: 'Family' | 'Travel' | 'Career' | 'Hobbies' }) => void;
}

export const MemoryBankManager: React.FC<MemoryBankManagerProps> = ({ memories, onAddMemory }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState<'Family' | 'Travel' | 'Career' | 'Hobbies'>('Family');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    onAddMemory({
      title: title.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&auto=format&fit=crop&q=80',
      category
    });
    setTitle('');
    setDescription('');
    setImageUrl('');
  };

  return (
    <div className="space-y-4">
      {/* Upload Form */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Plus className="w-5 h-5 text-rose-500" />
          <span>Add Family Memory Photo</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sarah's College Graduation"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Guwahati University ceremony with family"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-rose-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-sm transition-all"
          >
            <ImageIcon className="w-4 h-4" /> Upload Photo to Memory Bank
          </button>
        </form>
      </div>

      {/* Memory Cards Grid */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">Patient's Active Memory Bank</h3>
        <div className="space-y-3">
          {memories.map((mem) => (
            <div key={mem.id} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center gap-3">
              <img src={mem.imageUrl} alt={mem.title} className="w-16 h-16 rounded-xl object-cover shadow-sm shrink-0" />
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{mem.title}</h4>
                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{mem.description}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-1">{mem.date} • {mem.category}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
