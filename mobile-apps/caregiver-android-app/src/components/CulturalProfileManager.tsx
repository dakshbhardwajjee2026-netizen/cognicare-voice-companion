import React, { useState } from 'react';
import { User, Save } from 'lucide-react';
import { CulturalProfile } from '../types';

interface CulturalProfileManagerProps {
  profile?: CulturalProfile;
  onSaveProfile: (profile: CulturalProfile) => void;
}

export const CulturalProfileManager: React.FC<CulturalProfileManagerProps> = ({ profile, onSaveProfile }) => {
  const [formData, setFormData] = useState<CulturalProfile>({
    language: profile?.language || 'en',
    honorific: profile?.honorific || 'Kaka',
    patientName: profile?.patientName || 'David Kaka',
    age: profile?.age || 74,
    profession: profile?.profession || 'Retired Mathematics Teacher',
    hobbies: profile?.hobbies || ['Gardening', 'Classical Music'],
    keyMemories: profile?.keyMemories || ['Married to Sunita in 1978']
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          <span>Cultural & Personal Profile</span>
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Patient Full Name</label>
          <input
            type="text"
            value={formData.patientName}
            onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Honorific Title</label>
            <select
              value={formData.honorific}
              onChange={(e) => setFormData({ ...formData, honorific: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
            >
              <option value="Kaka">Kaka</option>
              <option value="Uncle">Uncle</option>
              <option value="Aunty">Aunty</option>
              <option value="Grandpa">Grandpa</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Primary Language</label>
            <select
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="as">Assamese</option>
              <option value="mn">Manipuri</option>
              <option value="bn">Bengali</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Profession & Backstory</label>
          <input
            type="text"
            value={formData.profession}
            onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-sm transition-all"
        >
          <Save className="w-4 h-4" /> Save Cultural Settings
        </button>
      </form>
    </div>
  );
};
