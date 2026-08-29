import React, { useState, useRef } from 'react';
import { ProjectItem, ProjectFile } from '../../types';
import { formatFileSize, formatTimeAgo } from '../../services/projectService';
import {
  Paperclip,
  Upload,
  Plus,
  Trash2,
  Download,
  ExternalLink,
  File,
  FileText,
  Image as ImageIcon,
  FileCode,
  Archive,
  Clock,
  Eye,
} from 'lucide-react';

interface ProjectFilesTabProps {
  project: ProjectItem;
  onAddFile: (fileData: {
    name: string;
    url: string;
    size?: number;
    type?: string;
  }) => void;
  onDeleteFile: (fileId: string) => void;
}

export const ProjectFilesTab: React.FC<ProjectFilesTabProps> = ({
  project,
  onAddFile,
  onDeleteFile,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState<ProjectFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const files = project.files || [];

  const handleFileUpload = (file: globalThis.File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onAddFile({
        name: file.name,
        url: dataUrl,
        size: file.size,
        type: file.type || file.name.split('.').pop(),
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach((f) => handleFileUpload(f));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach((f) => handleFileUpload(f));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getFileIcon = (file: ProjectFile) => {
    const type = (file.type || '').toLowerCase();
    const name = (file.name || '').toLowerCase();

    if (type.includes('image') || name.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) {
      return <ImageIcon className="w-5 h-5 text-purple-600" />;
    }
    if (type.includes('pdf') || name.endsWith('.pdf')) {
      return <FileText className="w-5 h-5 text-red-600" />;
    }
    if (name.match(/\.(ts|tsx|js|jsx|json|py|html|css|cpp|java|go|sql)$/)) {
      return <FileCode className="w-5 h-5 text-indigo-600" />;
    }
    if (name.match(/\.(zip|tar|gz|rar|7z)$/)) {
      return <Archive className="w-5 h-5 text-amber-600" />;
    }
    return <File className="w-5 h-5 text-slate-600" />;
  };

  const handleDownload = (file: ProjectFile) => {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-4">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        className="hidden"
      />

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleFileDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
            : 'border-slate-300 hover:border-indigo-400 bg-white/80 hover:bg-slate-50/80'
        }`}
      >
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
          <Upload className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-black text-slate-800">
          Upload Files & Project Attachments
        </h4>
        <p className="text-xs text-slate-500 mt-1">
          Drag & drop documents, PDFs, specs, designs or{' '}
          <span className="text-indigo-600 font-bold underline">browse files</span>
        </p>
      </div>

      {/* File Count Header */}
      <div className="text-xs text-slate-500 font-semibold px-1 flex items-center justify-between">
        <span>
          {files.length} {files.length === 1 ? 'file' : 'files'} attached
        </span>
      </div>

      {/* Files List */}
      {files.length === 0 ? (
        <div className="py-8 text-center bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <Paperclip className="w-8 h-8 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">No files uploaded yet</h4>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Attach specs, reference images, research papers, PDFs, or design assets.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 p-4 flex flex-col justify-between shadow-xs transition-all group"
            >
              <div>
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                    {getFileIcon(file)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs sm:text-sm font-bold text-slate-800 truncate" title={file.name}>
                      {file.name}
                    </h5>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span>{formatTimeAgo(file.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Image preview thumbnail if applicable */}
                {file.url.startsWith('data:image/') && (
                  <div
                    onClick={() => setPreviewFile(file)}
                    className="w-full h-24 rounded-xl overflow-hidden bg-slate-100 mb-2 cursor-pointer border border-slate-100"
                  >
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-1 pt-2 border-t border-slate-100">
                {file.url.startsWith('data:image/') && (
                  <button
                    type="button"
                    onClick={() => setPreviewFile(file)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    title="Preview Image"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDownload(file)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Remove file "${file.name}"?`)) {
                      onDeleteFile(file.id);
                    }
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Delete File"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Full-Screen Preview Modal */}
      {previewFile && (
        <div
          onClick={() => setPreviewFile(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-2xl max-h-[85vh] bg-white rounded-2xl p-4 overflow-hidden shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800 truncate">{previewFile.name}</h4>
              <button
                onClick={() => setPreviewFile(null)}
                className="px-2 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
            </div>
            <img
              src={previewFile.url}
              alt={previewFile.name}
              className="max-h-[65vh] w-auto mx-auto rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
