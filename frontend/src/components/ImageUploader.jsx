import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, AlertCircle } from 'lucide-react';

export default function ImageUploader({ onImageSelected, isLoading }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const validateAndPassFile = (file) => {
    setError(null);
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, JPEG).');
      return;
    }

    // Pass file up to parent component
    onImageSelected(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      validateAndPassFile(files[0]);
    }
  };

  return (
    <div className="bg-pcb-card border border-pcb-border rounded-xl p-6 shadow-md">
      <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
        <ImageIcon className="w-5 h-5 text-pcb-accent" />
        Upload PCB Image
      </h2>
      <p className="text-xs text-gray-400 mb-4">
        Select or drag a optical PCB inspection image to trigger YOLO defect detection.
      </p>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-pcb-accent bg-pcb-accent/10'
            : 'border-pcb-border hover:border-gray-400 bg-pcb-dark/40'
        } ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files && validateAndPassFile(e.target.files[0])}
          accept="image/*"
          className="hidden"
        />

        <div className="bg-pcb-dark p-3 rounded-full border border-pcb-border mb-3">
          <Upload className="w-6 h-6 text-pcb-accent" />
        </div>

        <p className="text-sm font-medium text-gray-200">
          {isLoading ? 'Processing PCB Image...' : 'Click or Drag & Drop image here'}
        </p>
        <p className="text-xs text-gray-400 mt-1">Supports PNG, JPG, JPEG</p>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-xs text-pcb-danger bg-pcb-danger/10 p-2.5 rounded border border-pcb-danger/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}