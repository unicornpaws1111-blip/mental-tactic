import React, { useRef, useState, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Code,
  Undo2,
  Redo2,
  Eye,
  FileCode,
} from 'lucide-react';
import { MediaPickerModal } from './MediaPickerModal';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write your tactical article content here...',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showHtml, setShowHtml] = useState(false);
  const [rawHtml, setRawHtml] = useState(value);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [isLinkPromptOpen, setIsLinkPromptOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [savedRange, setSavedRange] = useState<Range | null>(null);

  // Sync incoming value to editor content if external change
  useEffect(() => {
    if (editorRef.current && !showHtml) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
    setRawHtml(value);
  }, [value, showHtml]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
      setRawHtml(html);
    }
  };

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, value);
    handleInput();
  };

  const saveCurrentSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      setSavedRange(sel.getRangeAt(0));
    }
  };

  const restoreSelection = () => {
    if (savedRange) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRange);
      }
    }
  };

  const handleOpenLinkModal = () => {
    saveCurrentSelection();
    setLinkUrl('');
    setIsLinkPromptOpen(true);
  };

  const handleApplyLink = () => {
    restoreSelection();
    if (linkUrl.trim()) {
      executeCommand('createLink', linkUrl.trim());
    }
    setIsLinkPromptOpen(false);
  };

  const handleOpenImagePicker = () => {
    saveCurrentSelection();
    setIsMediaModalOpen(true);
  };

  const handleInsertImage = (url: string) => {
    restoreSelection();
    if (editorRef.current) {
      editorRef.current.focus();
    }
    executeCommand('insertImage', url);
  };

  const formatBlock = (tag: string) => {
    executeCommand('formatBlock', tag);
  };

  return (
    <div className="border border-zinc-800 rounded-xl bg-zinc-950 overflow-hidden shadow-inner flex flex-col focus-within:border-zinc-700 transition-colors">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-zinc-900 border-b border-zinc-800 text-zinc-300 select-none">
        {/* Undo / Redo */}
        <div className="flex items-center border-r border-zinc-800 pr-1 mr-1 gap-0.5">
          <button
            type="button"
            title="Undo (Ctrl+Z)"
            onClick={() => executeCommand('undo')}
            className="p-1.5 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Redo (Ctrl+Y)"
            onClick={() => executeCommand('redo')}
            className="p-1.5 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center border-r border-zinc-800 pr-1 mr-1 gap-0.5">
          <button
            type="button"
            title="Heading 1"
            onClick={() => formatBlock('<h1>')}
            className="p-1.5 hover:text-white hover:bg-zinc-800 rounded font-bold text-xs flex items-center gap-0.5"
          >
            <Heading1 className="w-4 h-4 text-red-500" />
          </button>
          <button
            type="button"
            title="Heading 2"
            onClick={() => formatBlock('<h2>')}
            className="p-1.5 hover:text-white hover:bg-zinc-800 rounded font-bold text-xs flex items-center gap-0.5"
          >
            <Heading2 className="w-4 h-4 text-red-400" />
          </button>
          <button
            type="button"
            title="Heading 3"
            onClick={() => formatBlock('<h3>')}
            className="p-1.5 hover:text-white hover:bg-zinc-800 rounded font-bold text-xs flex items-center gap-0.5"
          >
            <Heading3 className="w-4 h-4 text-zinc-400" />
          </button>
          <button
            type="button"
            title="Paragraph"
            onClick={() => formatBlock('<p>')}
            className="px-2 py-1 hover:text-white hover:bg-zinc-800 rounded text-xs font-medium"
          >
            Text
          </button>
        </div>

        {/* Formatting */}
        <div className="flex items-center border-r border-zinc-800 pr-1 mr-1 gap-0.5">
          <button
            type="button"
            title="Bold"
            onClick={() => executeCommand('bold')}
            className="p-1.5 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Italic"
            onClick={() => executeCommand('italic')}
            className="p-1.5 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Underline"
            onClick={() => executeCommand('underline')}
            className="p-1.5 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          >
            <Underline className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Strikethrough"
            onClick={() => executeCommand('strikeThrough')}
            className="p-1.5 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
        </div>

        {/* Lists & Quotes */}
        <div className="flex items-center border-r border-zinc-800 pr-1 mr-1 gap-0.5">
          <button
            type="button"
            title="Bullet List"
            onClick={() => executeCommand('insertUnorderedList')}
            className="p-1.5 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Numbered List"
            onClick={() => executeCommand('insertOrderedList')}
            className="p-1.5 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Blockquote"
            onClick={() => formatBlock('<blockquote>')}
            className="p-1.5 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Code Block"
            onClick={() => formatBlock('<pre>')}
            className="p-1.5 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>

        {/* Alignment */}
        <div className="flex items-center border-r border-zinc-800 pr-1 mr-1 gap-0.5">
          <button
            type="button"
            title="Align Left"
            onClick={() => executeCommand('justifyLeft')}
            className="p-1.5 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Align Center"
            onClick={() => executeCommand('justifyCenter')}
            className="p-1.5 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Align Right"
            onClick={() => executeCommand('justifyRight')}
            className="p-1.5 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          >
            <AlignRight className="w-4 h-4" />
          </button>
        </div>

        {/* Media & Links */}
        <div className="flex items-center border-r border-zinc-800 pr-1 mr-1 gap-0.5">
          <button
            type="button"
            title="Insert Link"
            onClick={handleOpenLinkModal}
            className="p-1.5 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Insert Image"
            onClick={handleOpenImagePicker}
            className="p-1.5 hover:text-white hover:bg-zinc-800 rounded text-red-500 hover:text-red-400 transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>

        {/* HTML Mode toggle */}
        <button
          type="button"
          onClick={() => setShowHtml(!showHtml)}
          className={`ml-auto px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1.5 transition-colors ${
            showHtml
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
          }`}
        >
          {showHtml ? <Eye className="w-3.5 h-3.5" /> : <FileCode className="w-3.5 h-3.5" />}
          <span>{showHtml ? 'Visual' : 'HTML'}</span>
        </button>
      </div>

      {/* Editor Content Area */}
      <div className="relative min-h-[360px] p-5">
        {showHtml ? (
          <textarea
            value={rawHtml}
            onChange={(e) => {
              setRawHtml(e.target.value);
              onChange(e.target.value);
            }}
            className="w-full h-80 bg-zinc-950 text-zinc-200 font-mono text-sm p-2 outline-none resize-y border border-zinc-800 rounded"
            placeholder="Write HTML directly..."
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onBlur={handleInput}
            data-placeholder={placeholder}
            className="prose prose-invert max-w-none min-h-[320px] focus:outline-none text-zinc-200 
              [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:text-white [&>h1]:my-4 [&>h1]:font-serif
              [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-white [&>h2]:my-3
              [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:text-zinc-200 [&>h3]:my-2
              [&>p]:my-2.5 [&>p]:leading-relaxed
              [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:my-3
              [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:my-3
              [&>blockquote]:border-l-4 [&>blockquote]:border-red-600 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-zinc-400 [&>blockquote]:my-4
              [&>pre]:bg-zinc-900 [&>pre]:p-3 [&>pre]:rounded-lg [&>pre]:font-mono [&>pre]:text-sm [&>pre]:text-red-400 [&>pre]:overflow-x-auto
              [&>img]:rounded-lg [&>img]:my-4 [&>img]:max-h-96 [&>img]:object-contain [&>img]:border [&>img]:border-zinc-800
              [&>a]:text-red-500 [&>a]:underline hover:[&>a]:text-red-400
              empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-600 empty:before:pointer-events-none"
          />
        )}
      </div>

      {/* Link Dialog */}
      {isLinkPromptOpen && (
        <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex items-center gap-3">
          <input
            type="url"
            placeholder="https://example.com"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm bg-zinc-950 border border-zinc-700 rounded text-white focus:outline-none focus:border-red-500"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleApplyLink();
              }
            }}
          />
          <button
            type="button"
            onClick={handleApplyLink}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition-colors"
          >
            Insert Link
          </button>
          <button
            type="button"
            onClick={() => setIsLinkPromptOpen(false)}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Image Picker Modal */}
      <MediaPickerModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={handleInsertImage}
        title="Insert Image into Article Content"
      />
    </div>
  );
};
