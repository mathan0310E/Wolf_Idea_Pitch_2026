"use client";

import * as React from "react";
import { Upload, X, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  onFileSelect: (file: File | null, base64Url: string) => void;
  error?: string;
  accept?: string;
  maxSizeBytes?: number;
  label?: string;
}

export function FileDropzone({
  onFileSelect,
  error,
  accept = "image/jpeg,image/png,image/webp",
  maxSizeBytes = 5 * 1024 * 1024, // 5MB
  label = "Upload Payment Screenshot",
}: FileDropzoneProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setLocalError(null);
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      setLocalError("Only JPG, PNG, and WEBP image files are allowed.");
      return;
    }
    if (file.size > maxSizeBytes) {
      setLocalError(`File size must be less than ${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSelectedFile(file);
      setPreviewUrl(result);
      onFileSelect(file, result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setLocalError(null);
    onFileSelect(null, "");
    if (inputRef.current) inputRef.current.value = "";
  };

  const activeError = error || localError;

  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="block text-xs font-medium uppercase tracking-wider text-zinc-300">
          {label} <span className="text-[#E50914]">*</span>
        </label>
      )}

      {previewUrl ? (
        <div className="relative rounded-xl border border-emerald-500/30 bg-[#1E1E1E] p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-black border border-white/10 flex-shrink-0">
              {/* eslint-disable-next-html-element */}
              <img
                src={previewUrl}
                alt="Payment screenshot preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-white truncate">
                {selectedFile?.name}
              </span>
              <span className="text-xs text-zinc-400">
                {((selectedFile?.size || 0) / 1024).toFixed(1)} KB
              </span>
              <span className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5 font-medium">
                <CheckCircle className="w-3.5 h-3.5" /> Ready for verification
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={removeFile}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Remove screenshot"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 bg-[#1E1E1E]/50 hover:bg-[#1E1E1E] flex flex-col items-center justify-center gap-2",
            dragActive ? "border-[#E50914] bg-[#E50914]/5" : "border-white/15",
            activeError ? "border-[#E50914] bg-[#E50914]/5" : ""
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
          />
          <div className="p-3 rounded-full bg-[#151515] text-[#E50914] border border-white/10">
            <Upload className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">
              Click or drag & drop payment screenshot
            </p>
            <p className="text-xs text-zinc-400">
              Supports JPG, PNG, WEBP (Max 5MB)
            </p>
          </div>
        </div>
      )}

      {activeError && (
        <p className="text-xs text-[#E50914] flex items-center gap-1 font-medium">
          <span>⚠</span> {activeError}
        </p>
      )}
    </div>
  );
}
