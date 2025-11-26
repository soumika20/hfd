import React, { useRef } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  isLoading: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        disabled={isLoading}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
        className={`w-full group relative border-2 border-dashed rounded-xl p-8 md:p-12 flex flex-col items-center justify-center transition-all duration-200 
          ${isLoading 
            ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-70' 
            : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer'
          }`}
      >
        <div className={`p-4 rounded-full mb-4 transition-colors ${isLoading ? 'bg-slate-100' : 'bg-blue-50 group-hover:bg-blue-100'}`}>
          <Upload className={`w-8 h-8 ${isLoading ? 'text-slate-400' : 'text-blue-600'}`} />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Upload Incident Image</h3>
        <p className="text-sm text-slate-500 text-center max-w-sm">
          Select a photo of the accident scene or disaster area for analysis.
          <br/>
          <span className="text-xs text-slate-400 mt-2 block">Supports JPG, PNG, WEBP</span>
        </p>
      </button>
    </div>
  );
};

export default ImageUploader;
