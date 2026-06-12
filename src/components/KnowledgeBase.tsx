import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  BookOpen, 
  ThumbsUp, 
  Eye, 
  ChevronRight, 
  Clock, 
  User, 
  Sparkles,
  Award
} from "lucide-react";
import { KbArticle, User as UserType, UserRole } from "../types";

interface KbProps {
  articles: KbArticle[];
  currentUser: UserType;
  onAddArticle: (articleData: any) => Promise<void>;
  onUpvoteArticle: (id: string) => Promise<void>;
  onViewArticle: (id: string) => Promise<void>;
}

export default function KnowledgeBase({ 
  articles, 
  currentUser, 
  onAddArticle, 
  onUpvoteArticle, 
  onViewArticle 
}: KbProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArtId, setSelectedArtId] = useState<string | null>(articles[0]?.id || null);
  const [filterTag, setFilterTag] = useState<string>("All");

  // Creation forms
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [artTitle, setArtTitle] = useState("");
  const [artCategory, setArtCategory] = useState("Market Data Connectivity");
  const [artContent, setArtContent] = useState("");
  const [artTagsString, setArtTagsString] = useState("");

  const selectedArt = articles.find(a => a.id === selectedArtId);

  // Compile unique tags for filtering options
  const allTagsSet = new Set<string>();
  articles.forEach(a => a.tags.forEach(t => allTagsSet.add(t)));
  const uniqueTagsList = Array.from(allTagsSet);

  const filteredArticles = articles.filter(a => {
    const matchesTag = filterTag === "All" || a.tags.includes(filterTag);
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          a.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesSearch;
  });

  const handleSelectArticle = (id: string) => {
    setSelectedArtId(id);
    onViewArticle(id);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artTitle.trim() || !artContent.trim()) {
      alert("Fill specified fields.");
      return;
    }

    const tagItems = artTagsString
      .split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0);

    await onAddArticle({
      title: artTitle,
      category: artCategory,
      content: artContent,
      author: currentUser.name,
      tags: tagItems.length > 0 ? tagItems : ["IT Policy", "Troubleshooting"]
    });

    setArtTitle("");
    setArtContent("");
    setArtTagsString("");
    setShowCreateModal(false);
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6" id="kb-tab">
      
      {/* Left Column: search lists and guidelines catalog */}
      <div className="w-full md:w-80 flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shrink-0">
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white text-xs font-bold uppercase tracking-wider">Trouble manuals ({filteredArticles.length})</h3>
            
            {currentUser.role !== UserRole.STAFF && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-[#C4A052] hover:bg-amber-600 text-slate-950 p-1.5 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                title="Author FAQ / Guide"
                id="btn-trigger-kb-modal"
              >
                <Plus size={15} />
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 text-slate-500" size={13} />
            <input
              type="text"
              placeholder="Search guides, Citrix, Bloomberg..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-[11px] bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-32 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
              id="kb-search"
            />
          </div>

          <div>
            <label className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Shortcut Tag filter</label>
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="w-full text-xs bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-300 focus:outline-none"
              id="filter-kb-tag"
            >
              <option value="All">All Tags Categories</option>
              {uniqueTagsList.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Guides catalog list */}
        <div className="flex-grow overflow-y-auto divide-y divide-slate-900 scrollbar-thin">
          {filteredArticles.length > 0 ? (
            filteredArticles.map(a => {
              const isSel = a.id === selectedArtId;
              return (
                <div
                  key={a.id}
                  onClick={() => handleSelectArticle(a.id)}
                  className={`p-3.5 cursor-pointer text-left transition-all ${isSel ? 'bg-slate-900 border-l-4 border-amber-500' : 'hover:bg-slate-900/40'}`}
                  id={`kb-item-${a.id}`}
                >
                  <span className="text-[9px] text-[#C4A052] font-semibold">{a.category}</span>
                  <h4 className="text-xs font-semibold text-white mt-1 leading-snug line-clamp-2">{a.title}</h4>
                  
                  {/* Upvotes / views */}
                  <div className="flex items-center gap-3 text-[10px] text-slate-550 mt-2.5">
                    <span className="flex items-center gap-1">
                      <ThumbsUp size={10} className="text-slate-500" />
                      {a.upvotes}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={10} className="text-slate-500" />
                      {a.views}
                    </span>
                    <span className="ml-auto text-[9px] font-mono">{a.id}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              No matching troubleshooting logs active. Use "+" to write.
            </div>
          )}
        </div>
      </div>

      {/* Right Column: article content display panel */}
      <div className="flex-grow bg-slate-950 border border-slate-800 rounded-xl flex flex-col h-full overflow-hidden">
        {selectedArt ? (
          <div className="p-6 flex flex-col h-full space-y-4 text-left overflow-y-auto scrollbar-thin">
            
            <div className="border-b border-slate-800 pb-4 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-[#C4A052] font-semibold">
                <span>Category: {selectedArt.category}</span>
                <span className="text-slate-500 font-mono text-[10px]">{selectedArt.id}</span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">{selectedArt.title}</h2>
              
              {/* Meta metrics */}
              <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <User size={11} className="text-[#C4A052]" />
                  Author: {selectedArt.author}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  Amended: {selectedArt.lastUpdated}
                </span>
                <span className="flex items-center gap-1">
                  <Eye size={11} />
                  Views: {selectedArt.views}
                </span>
                
                {/* Manual upvoter */}
                <button
                  type="button"
                  onClick={() => onUpvoteArticle(selectedArt.id)}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2 py-0.5 rounded text-[10px] text-[#C4A052] flex items-center gap-1 ml-auto cursor-pointer"
                  id="btn-upvote-kb"
                >
                  <ThumbsUp size={10} />
                  <span>Helpful ({selectedArt.upvotes})</span>
                </button>
              </div>
            </div>

            {/* Core textual guide body */}
            <div className="text-slate-300 text-xs leading-relaxed max-w-none whitespace-pre-line bg-slate-900 border border-slate-850 rounded-xl p-5 font-sans">
              {selectedArt.content}
            </div>

            {/* Tags footer */}
            <div className="pt-4 border-t border-slate-900 space-y-2">
              <span className="text-[10px] text-slate-550 uppercase font-bold block">Tags Keywords:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedArt.tags.map((tag, idx) => (
                  <span key={idx} className="bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-mono py-0.5 px-2 rounded-lg">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8">
            <BookOpen size={40} className="text-slate-700 mb-2 animate-pulse" />
            <p className="text-xs">No troubleshooting guide selected. Click a manual from the left list.</p>
          </div>
        )}
      </div>

      {/* CREATE KB GUIDE DIALOG */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl w-full max-w-md overflow-hidden text-left shadow-2xl animate-fade-in">
            <div className="p-5 border-b border-slate-850 bg-slate-900/60 flex items-center justify-between font-bold text-white text-xs uppercase tracking-wider">
              Author FAQs / Help Guide Page
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4" id="create-kb-form">
              <div>
                <label className="block text-xs text-slate-350 mb-1">Guide Article Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Setting up VPN client step-by-step"
                  value={artTitle}
                  onChange={(e) => setArtTitle(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                  id="new-kb-title"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-350 mb-1">Category Classification</label>
                  <select
                    value={artCategory}
                    onChange={(e) => setArtCategory(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-800 rounded px-2 py-2 text-slate-101"
                    id="new-kb-category"
                  >
                    <option value="Market Data Connectivity">Market Data Connectivity</option>
                    <option value="Remote Access Setup">Remote Access Setup</option>
                    <option value="Printer Servicing FAQ">Printer Servicing FAQ</option>
                    <option value="Accounts Credentials Help">Accounts Credentials Help</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-350 mb-1">Keywords Tags (Comma listed)</label>
                  <input
                    type="text"
                    placeholder="e.g., VPN, Cisco, Access"
                    value={artTagsString}
                    onChange={(e) => setArtTagsString(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-slate-205 font-mono"
                    id="new-kb-tags"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-3ac mb-1">Detailed Troubleshooting text (Markdown/Text)</label>
                <textarea
                  rows={6}
                  required
                  placeholder="Define technical parameters, path commands, and debugging processes detailed..."
                  value={artContent}
                  onChange={(e) => setArtContent(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded p-3 text-slate-201 focus:outline-none"
                  id="new-kb-content"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-400 hover:bg-slate-900 text-xs font-semibold rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C4A052] hover:bg-amber-600 text-slate-950 font-bold rounded text-xs cursor-pointer"
                  id="btn-kb-save"
                >
                  Publish Guide
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
