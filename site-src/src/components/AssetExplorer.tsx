import React, { useEffect, useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
    Folder,
    FileText,
    Search,
    Home,
    ChevronRight,
    Copy,
    Link as LinkIcon,
    Download,
    Check,
    X,
    Maximize2
} from 'lucide-react';


import { VirtuosoGrid } from 'react-virtuoso';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types based on generate_manifest.py
interface AssetNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: AssetNode[];
}

interface Manifest {
  root: AssetNode[];
  generated_at: number;
}

export const AssetExplorer: React.FC = () => {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [currentNode, setCurrentNode] = useState<AssetNode[] | null>(null);
  // Removed global search across all files since we only search current folder now,
  // keeping simple filteredItems logic is fine.
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedState, setCopiedState] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{path: string, name: string} | null>(null);

  useEffect(() => {
    fetch('/manifest.json')
      .then(res => res.json())
      .then((data: Manifest) => {
        setManifest(data);
        setCurrentNode(data.root);
      })
      .catch(err => console.error("Failed to load manifest", err));
  }, []);

  const navigateTo = (folderName: string) => {
    const folder = currentNode?.find(n => n.name === folderName && n.type === 'directory');
    if (folder && folder.children) {
      setCurrentPath([...currentPath, folderName]);
      setCurrentNode(folder.children);
      setSearchQuery('');
    }
  };

  const navigateUp = (levelIndex: number) => {
      if (!manifest) return;
      const newPath = currentPath.slice(0, levelIndex + 1);
      setCurrentPath(newPath);

      let nodes = manifest.root;
      for (const part of newPath) {
          const folder = nodes.find(n => n.name === part);
          if (folder && folder.children) {
              nodes = folder.children;
          }
      }
      setCurrentNode(nodes);
      setSearchQuery('');
  };

  const navigateRoot = () => {
      if (!manifest) return;
      setCurrentPath([]);
      setCurrentNode(manifest.root);
      setSearchQuery('');
  }

  const copyToClipboard = (text: string, id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(text).then(() => {
          setCopiedState(id);
          setTimeout(() => setCopiedState(null), 2000);
      });
  }

  // Handle ESC key to close preview
  useEffect(() => {
      const handleEsc = (e: KeyboardEvent) => {
          if (e.key === 'Escape') setPreviewImage(null);
      };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  if (!manifest) return <div className="min-h-screen flex items-center justify-center text-zinc-400">Carregando arquivos...</div>;
  if (!currentNode) return <div className="min-h-screen flex items-center justify-center text-zinc-400">Iniciando...</div>;

  // Deduplication and Filtering Logic
  const processNodes = (nodes: AssetNode[], query: string) => {
      // 1. Filter by search query first
      let filtered = nodes;
      if (query) {
          filtered = nodes.filter(item => item.name.toLowerCase().includes(query.toLowerCase()));
      }

      // 2. Separate directories and files
      const directories = filtered.filter(n => n.type === 'directory');
      const files = filtered.filter(n => n.type === 'file');

      // 3. Deduplicate files (prioritize WebP)
      const fileGroups: Record<string, AssetNode[]> = {};

      files.forEach(file => {
          const lastDotIndex = file.name.lastIndexOf('.');
          const baseName = lastDotIndex !== -1 ? file.name.substring(0, lastDotIndex) : file.name;
          // Group by base name + path directory (to start simple, just base name is risky if duplicates exist in same folder.
          // But here we are processing `currentNode` which IS a single folder. So baseName is sufficient.)
          if (!fileGroups[baseName]) {
              fileGroups[baseName] = [];
          }
          fileGroups[baseName].push(file);
      });

      const uniqueFiles: AssetNode[] = [];

      Object.values(fileGroups).forEach(group => {
          if (group.length === 1) {
              uniqueFiles.push(group[0]);
          } else {
              // Priority: webp > png > jpg > jpeg > others
              // Sort based on priority index
              group.sort((a, b) => {
                  const getPriority = (name: string) => {
                      if (name.endsWith('.webp')) return 0;
                      if (name.endsWith('.png')) return 1;
                      if (name.endsWith('.jpg')) return 2;
                      if (name.endsWith('.jpeg')) return 3;
                      return 4;
                  };
                  return getPriority(a.name) - getPriority(b.name);
              });
              uniqueFiles.push(group[0]);
          }
      });

      // Sort files alphabetically again after deduplication
      uniqueFiles.sort((a, b) => a.name.localeCompare(b.name));

      // Combine: Directories first, then Files
      return [...directories, ...uniqueFiles];
  };

  const visibleItems = processNodes(currentNode, searchQuery);

  return (
    <div className="w-full min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30">
        {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-zinc-950/60">
        <div className="w-full max-w-[1920px] mx-auto px-6 h-16 flex items-center justify-between gap-4">
            <h1 className="text-xl font-bold flex items-center gap-2 tracking-tight">
                <span className="text-emerald-500">mri</span>
                <span className="text-zinc-200">Qbox Assets</span>
            </h1>

            {/* Search Bar */}
            <div className="relative w-full max-w-md group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 group-focus-within:text-emerald-500 transition-colors" />
                <input
                    type="text"
                    placeholder="Pesquisar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-lg py-2 pl-10 pr-12 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder-zinc-600 text-zinc-200"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                    <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-1.5 font-mono text-[10px] font-medium text-zinc-500 shadow-sm opacity-50">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </div>
            </div>
        </div>
      </header>

      <div className="max-w-[1920px] mx-auto p-6">

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-zinc-400 mb-6 bg-zinc-900 p-3 rounded-lg border border-zinc-800 overflow-x-auto scrollbar-hide">
        <button onClick={navigateRoot} className="hover:text-emerald-400 font-medium px-2 py-1 rounded hover:bg-zinc-800 transition-colors flex items-center gap-1">
             <Home className="w-4 h-4" /> Início
        </button>
        {currentPath.map((folder, index) => (
            <React.Fragment key={index}>
                <span className="text-zinc-600"><ChevronRight className="w-4 h-4" /></span>
                <button
                    onClick={() => navigateUp(index)}
                    className={cn(
                        "hover:text-emerald-400 px-2 py-1 rounded hover:bg-zinc-800 transition-colors whitespace-nowrap",
                        index === currentPath.length - 1 && "font-bold text-zinc-100"
                    )}
                >
                    {folder}
                </button>
            </React.Fragment>
        ))}
        <span className="ml-auto text-xs text-zinc-500 whitespace-nowrap pl-4 border-l border-zinc-800 h-4 flex items-center">
            {visibleItems.length} itens {searchQuery && "(filtrado)"}
        </span>
      </nav>

      {/* Content Grid with Virtuoso */}
      <VirtuosoGrid
        useWindowScroll
        totalCount={visibleItems.length}
        overscan={200}
        listClassName="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 mb-8"
        itemContent={(index: number) => {
            const item = visibleItems[index];
            if (!item) return null; // Guard against potential out of bounds, though unlikely with totalCount

            if (item.type === 'directory') {
                return (
                    <div
                        onClick={() => navigateTo(item.name)}
                        className="group cursor-pointer p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 hover:border-emerald-500/50 transition-all flex flex-col items-center justify-center text-center gap-3 relative select-none h-full"
                    >
                        <div className="text-emerald-500/80 group-hover:text-emerald-400 transition-colors">
                        <Folder className="w-10 h-10" />
                        </div>
                        <span className="font-medium truncate w-full text-sm text-zinc-300 group-hover:text-white">{item.name}</span>
                        <span className="text-xs text-zinc-500">{item.children?.length || 0} itens</span>
                    </div>
                );
            }

            // File Item
            const file = item;
            const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);
            const copyNameId = `name-${file.path}`;
            const copyPathId = `path-${file.path}`;

            return (
                <div
                    className="group relative p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 hover:border-zinc-700 transition-all flex flex-col items-center gap-3 h-full"
                >
                    {isImage ? (
                        <div
                            className="w-full aspect-square bg-zinc-950 rounded-lg overflow-hidden flex items-center justify-center border border-zinc-800/50 cursor-pointer relative"
                            onClick={() => setPreviewImage({path: file.path, name: file.name})}
                        >
                            <img src={`/${file.path}`} alt={file.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Maximize2 className="text-white w-6 h-6 drop-shadow-md" />
                            </div>
                        </div>
                    ) : (
                        <div className="w-full aspect-square bg-zinc-950 rounded-lg flex items-center justify-center text-zinc-700 border border-zinc-800/50">
                            <FileText className="w-10 h-10" />
                        </div>
                    )}

                    <div className="w-full flex items-center justify-between gap-2 mt-auto">
                        <span className="text-xs font-medium truncate flex-1 text-center text-zinc-400 group-hover:text-zinc-200" title={file.name}>
                            {file.name}
                        </span>
                    </div>

                    {/* Hover Actions */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button
                            onClick={(e) => copyToClipboard(file.name, copyNameId, e)}
                            className="bg-black/80 hover:bg-emerald-600 text-white p-1.5 rounded-md shadow-lg backdrop-blur-sm transition-colors"
                            title="Copiar Nome"
                        >
                            {copiedState === copyNameId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                            onClick={(e) => copyToClipboard(file.path, copyPathId, e)}
                            className="bg-black/80 hover:bg-emerald-600 text-white p-1.5 rounded-md shadow-lg backdrop-blur-sm transition-colors"
                            title="Copiar Caminho"
                        >
                            {copiedState === copyPathId ? <Check className="w-3.5 h-3.5" /> : <LinkIcon className="w-3.5 h-3.5" />}
                        </button>
                        <a
                            href={`/${file.path}`}
                            download
                            className="bg-black/80 hover:bg-emerald-600 text-white p-1.5 rounded-md shadow-lg backdrop-blur-sm transition-colors flex items-center justify-center"
                            title="Baixar"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Download className="w-3.5 h-3.5" />
                        </a>
                    </div>
                </div>
            );
        }}
    />

      {visibleItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-4">
              <Folder className="w-12 h-12 opacity-20" />
              <p>Nenhum item encontrado.</p>
          </div>
      )}


      {/* Image Preview Modal */}
      {previewImage && (
        <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
        >
            <button
                className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
                onClick={() => setPreviewImage(null)}
            >
                <X className="w-8 h-8" />
            </button>
            <div
                className="max-w-full max-h-full relative"
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={`/${previewImage.path}`}
                    alt={previewImage.name}
                    className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm backdrop-blur-md border border-white/10">
                    {previewImage.name}
                </div>
            </div>
        </div>
      )}
      </div>
    </div>
  );
};
