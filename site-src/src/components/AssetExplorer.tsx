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
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedState, setCopiedState] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{path: string, name: string} | null>(null);

  const ITEMS_PER_PAGE = 24;

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
      setCurrentPage(1);
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
      setCurrentPage(1);
      setSearchQuery('');
  };

  const navigateRoot = () => {
      if (!manifest) return;
      setCurrentPath([]);
      setCurrentNode(manifest.root);
      setCurrentPage(1);
      setSearchQuery('');
  }

  const copyToClipboard = (text: string, id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(text).then(() => {
          setCopiedState(id);
          setTimeout(() => setCopiedState(null), 2000);
      });
  }

  // UseEffect for search reset
  useEffect(() => {
      setCurrentPage(1);
  }, [searchQuery]);

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

  // Filter and Pagination Logic
  const filteredItems = currentNode.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="w-full p-6 min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <header className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-emerald-500">mri</span> Qbox Assets
        </h1>

        {/* Search Bar */}
        <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
            <input
                type="text"
                placeholder="Pesquisar nesta pasta..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-zinc-600"
            />
        </div>
      </header>

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
            {totalItems} itens
        </span>
      </nav>

      {/* Content Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 mb-8">
        {/* Directories */}
        {paginatedItems.filter(n => n.type === 'directory').map((dir) => (
          <div
            key={dir.path}
            onClick={() => navigateTo(dir.name)}
            className="group cursor-pointer p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 hover:border-emerald-500/50 transition-all flex flex-col items-center justify-center text-center gap-3 relative select-none"
          >
            <div className="text-emerald-500/80 group-hover:text-emerald-400 transition-colors">
              <Folder className="w-10 h-10" />
            </div>
            <span className="font-medium truncate w-full text-sm text-zinc-300 group-hover:text-white">{dir.name}</span>
            <span className="text-xs text-zinc-500">{dir.children?.length || 0} itens</span>
          </div>
        ))}

        {/* Files */}
        {paginatedItems.filter(n => n.type === 'file').map((file) => {
            const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);
            const copyNameId = `name-${file.path}`;
            const copyPathId = `path-${file.path}`;

            return (
          <div
            key={file.path}
            className="group relative p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 hover:border-zinc-700 transition-all flex flex-col items-center gap-3"
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

            <div className="w-full flex items-center justify-between gap-2">
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
        )})}
      </div>

      {paginatedItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-4">
              <Folder className="w-12 h-12 opacity-20" />
              <p>Nenhum item encontrado.</p>
          </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8 pb-8">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 hover:text-white transition-colors"
              >
                  Anterior
              </button>
              <span className="text-sm text-zinc-500">
                  Página <span className="text-zinc-300 font-medium">{currentPage}</span> de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 hover:text-white transition-colors"
              >
                  Próxima
              </button>
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
  );
};
