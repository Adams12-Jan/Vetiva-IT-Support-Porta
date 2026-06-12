import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  FileCheck, 
  Smartphone,
  Heart, 
  CalendarClock, 
  Sparkles, 
  Archive, 
  Settings,
  AlertTriangle,
  History,
  QrCode
} from "lucide-react";
import { Asset, AssetCategory, User, UserRole } from "../types";

interface AssetsProps {
  assets: Asset[];
  currentUser: User;
  onRegisterAsset: (assetData: any) => Promise<void>;
  onAddServicalLog: (id: string, logData: any) => Promise<void>;
}

export default function Assets({ 
  assets, 
  currentUser, 
  onRegisterAsset, 
  onAddServicalLog 
}: AssetsProps) {
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterHealth, setFilterHealth] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(assets[0]?.id || null);

  // Registration modals & forms
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newCategory, setNewCategory] = useState<AssetCategory>(AssetCategory.LAPTOPS);
  const [newPurchaseDate, setNewPurchaseDate] = useState("");
  const [newWarrantyCheck, setNewWarrantyCheck] = useState("");
  const [newCost, setNewCost] = useState("");
  const [newAssigned, setNewAssigned] = useState("");
  const [newLoc, setNewLoc] = useState("");

  // Service Log update states
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceType, setServiceType] = useState("Preventive Care");
  const [serviceDesc, setServiceDesc] = useState("");
  const [newHealthStatus, setNewHealthStatus] = useState<"Optimal" | "Degraded" | "Critical">("Optimal");

  // QR Modal display
  const [qrCodePathModal, setQrCodePathModal] = useState("");

  const selectedAsset = assets.find(a => a.id === selectedAssetId);

  // Filtering assets
  const filteredAssets = assets.filter(a => {
    const matchesCategory = filterCategory === "All" || a.category === filterCategory;
    const matchesHealth = filterHealth === "All" || a.healthStatus === filterHealth;
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          a.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.assignedTo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesHealth && matchesSearch;
  });

  const getHealthBadgeStyle = (status: "Optimal" | "Degraded" | "Critical") => {
    switch (status) {
      case "Optimal": return "bg-emerald-950/40 text-emerald-400 border border-emerald-800/80";
      case "Degraded": return "bg-amber-955/40 text-amber-500 border border-amber-800/80";
      case "Critical": return "bg-red-95/40 text-red-400 border border-red-800/80";
      default: return "bg-slate-900 text-slate-400";
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newTag.trim() || !newPurchaseDate) {
      alert("Please specify asset specifications.");
      return;
    }
    await onRegisterAsset({
      name: newName,
      tag: newTag,
      category: newCategory,
      purchaseDate: newPurchaseDate,
      warrantyExpiry: newWarrantyCheck,
      cost: newCost,
      assignedTo: newAssigned,
      location: newLoc,
      healthStatus: "Optimal"
    });

    // Reset fields
    setNewName("");
    setNewTag("");
    setNewPurchaseDate("");
    setNewWarrantyCheck("");
    setNewCost("");
    setNewAssigned("");
    setNewLoc("");
    setShowRegisterModal(false);
  };

  const handleServiceLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !serviceDesc.trim()) return;
    await onAddServicalLog(selectedAssetId, {
      type: serviceType,
      description: serviceDesc,
      healthStatus: newHealthStatus,
      by: currentUser.name
    });
    setServiceDesc("");
    setShowServiceModal(false);
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6" id="assets-tab">
      
      {/* Left pane: Asset selection scroll list */}
      <div className="w-full md:w-80 flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shrink-0">
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white text-xs font-bold uppercase tracking-wider">IT Asset register ({filteredAssets.length})</h3>
            
            {currentUser.role !== UserRole.STAFF && (
              <button
                onClick={() => setShowRegisterModal(true)}
                className="bg-[#C4A052] hover:bg-amber-600 text-slate-950 p-1.5 rounded-lg flex items-center justify-center cursor-pointer transition-all"
                title="Register New Asset"
                id="btn-trigger-asset-register-modal"
              >
                <Plus size={15} />
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 text-slate-500" size={13} />
            <input
              type="text"
              placeholder="Search by tag, model, or user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-[11px] bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-32 py-2 text-slate-201 focus:outline-none focus:border-amber-500"
              id="asset-search"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <label className="text-slate-505 block mb-1">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300 focus:outline-none"
                id="filter-asset-category"
              >
                <option value="All">All categories</option>
                {Object.values(AssetCategory).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-slate-505 block mb-1">Health Index</label>
              <select
                value={filterHealth}
                onChange={(e) => setFilterHealth(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300 focus:outline-none"
                id="filter-asset-health"
              >
                <option value="All">All health levels</option>
                <option value="Optimal">Optimal</option>
                <option value="Degraded">Degraded</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Assets list scroll */}
        <div className="flex-grow overflow-y-auto divide-y divide-slate-900 scrollbar-thin">
          {filteredAssets.length > 0 ? (
            filteredAssets.map(a => {
              const isSel = a.id === selectedAssetId;
              return (
                <div
                  key={a.id}
                  onClick={() => setSelectedAssetId(a.id)}
                  className={`p-3.5 cursor-pointer text-left transition-all ${isSel ? 'bg-slate-900 border-l-4 border-amber-500' : 'hover:bg-slate-900/40'}`}
                  id={`asset-item-${a.id}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-slate-500">{a.tag}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${getHealthBadgeStyle(a.healthStatus)}`}>
                      {a.healthStatus}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-white truncate">{a.name}</h4>
                  
                  <div className="flex items-center justify-between text-[10px] text-slate-450 mt-2">
                    <span className="truncate max-w-[120px]">{a.assignedTo}</span>
                    <span className="text-[9px] text-[#C4A052] font-mono">{a.category}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              No registered hardware found. Expand search constraints or register items.
            </div>
          )}
        </div>
      </div>

      {/* Right pane: asset detail metadata & service history records */}
      <div className="flex-grow bg-slate-950 border border-slate-800 rounded-xl flex flex-col h-full overflow-hidden">
        {selectedAsset ? (
          <div className="flex-grow flex flex-col divide-y divide-slate-800 overflow-y-auto scrollbar-thin">
            
            {/* Top overview bento stats */}
            <div className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-left space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-slate-550">{selectedAsset.tag}</span>
                    <span className="text-xs text-[#C4A052] font-mono font-bold uppercase">{selectedAsset.category}</span>
                  </div>
                  <h2 className="text-base font-bold text-white tracking-tight">{selectedAsset.name}</h2>
                </div>

                {/* Live QR visualization trigger */}
                <button
                  type="button"
                  onClick={() => setQrCodePathModal(`/api/assets/${selectedAsset.id}/qr`)}
                  className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-slate-300 hover:text-[#C4A052] cursor-pointer flex items-center gap-2 text-xs self-start sm:self-auto shadow transition-colors"
                  id="btn-render-asset-qr"
                >
                  <QrCode size={14} className="text-amber-500" />
                  <span>Inventory QR Code</span>
                </button>
              </div>

              {/* Bento spec layout definitions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-930 rounded-lg border border-slate-850 text-xs text-left">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Deploy Location</span>
                  <p className="text-slate-200 mt-0.5 font-medium">{selectedAsset.location}</p>
                  <p className="text-[9px] text-slate-400">Owner: {selectedAsset.assignedTo}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Capital Cost</span>
                  <p className="text-[#C4A052] font-mono leading-relaxed mt-0.5 text-xs font-bold">
                    ${selectedAsset.cost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Purchase Date</span>
                  <p className="text-slate-200 mt-0.5 font-mono">{selectedAsset.purchaseDate}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Warranty Expiration</span>
                  <p className="text-slate-200 mt-0.5 font-mono">{selectedAsset.warrantyExpiry}</p>
                  {new Date(selectedAsset.warrantyExpiry).getTime() < Date.now() ? (
                    <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider block">Warranty Expired</span>
                  ) : (
                    <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider block">Covers Standard</span>
                  )}
                </div>
              </div>
            </div>

            {/* Service history timeline logging records */}
            <div className="p-6 flex-1 flex flex-col min-h-[220px] text-left">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <History size={15} className="text-amber-500" />
                  <h3 className="text-slate-200 font-bold text-xs uppercase tracking-wider">Asset service logs ({selectedAsset.serviceHistory.length})</h3>
                </div>

                {currentUser.role !== UserRole.STAFF && (
                  <button
                    onClick={() => setShowServiceModal(true)}
                    className="text-xs bg-slate-900 border border-slate-800 hover:border-slate-700 py-1.5 px-3 rounded-lg text-amber-500 cursor-pointer flex items-center gap-1.5"
                    id="btn-trigger-service-log-modal"
                  >
                    <Settings size={12} />
                    <span>Log Service Event</span>
                  </button>
                )}
              </div>

              {/* Service list panels */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[250px] pr-2 scrollbar-thin">
                {selectedAsset.serviceHistory.length > 0 ? (
                  selectedAsset.serviceHistory.map(h => (
                    <div key={h.id} className="p-3 bg-slate-930 rounded-lg border border-slate-850 flex gap-4 text-xs font-sans">
                      <div className="p-2 bg-slate-950 rounded border border-slate-800 h-10 w-10 flex items-center justify-center text-amber-500 shrink-0">
                        <FileCheck size={16} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="font-bold text-slate-200">{h.type}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400">By {h.by}</span>
                          <span className="ml-auto text-slate-500 font-mono">{h.date}</span>
                        </div>
                        <p className="text-slate-350 leading-normal">{h.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-500 py-8 text-xs">
                    No active hardware maintenance audits logged yet. Use "Log Service Event" to write activities.
                  </div>
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <Archive size={40} className="text-slate-700 mb-2" />
            <p className="text-xs">Select any system asset registry entry on the left to verify warranty details.</p>
          </div>
        )}
      </div>

      {/* MODAL: INVENTORY QR DISPLAY CODE */}
      {qrCodePathModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 max-w-sm text-center relative shadow-2xl animate-fade-in">
            <button onClick={() => setQrCodePathModal("")} className="absolute top-3 right-3 text-slate-550 hover:text-white cursor-pointer hover:underline">✕</button>
            <h3 className="text-white text-xs font-bold uppercase tracking-widest text-[#C4A052] mb-1">Corporate Hardware Token</h3>
            <p className="text-[10px] text-slate-400 mb-4 font-semibold tracking-wider">{selectedAsset?.tag}</p>
            
            {/* Direct dynamic SVG QR path on backend */}
            <div className="p-4 bg-white rounded-lg border border-slate-200 inline-block mb-3 shadow">
              <img 
                src={qrCodePathModal} 
                alt="Hardware QR" 
                className="w-48 h-48 block shrink-0 select-none pointer-events-none" 
                referrerPolicy="no-referrer"
              />
            </div>
            
            <p className="text-[9px] text-slate-500 leading-normal max-w-[220px] mx-auto text-center mt-2 flex items-center gap-1 justify-center">
              <Smartphone size={11} className="text-amber-500" />
              Scan using any standard compliant QR code terminal to check server details instantly.
            </p>
          </div>
        </div>
      )}

      {/* REGISTER NEW HARDWARE MODAL */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl w-full max-w-md overflow-hidden text-left shadow-2xl animate-fade-in">
            <div className="p-5 border-b border-slate-850 bg-slate-900/60 flex items-center justify-between font-bold text-white text-xs uppercase tracking-wider">
              Register New System Asset
            </div>

            <form onSubmit={handleRegisterSubmit} className="p-5 space-y-3" id="register-asset-form">
              <div>
                <label className="block text-xs text-slate-350 mb-1">Asset Name / Model Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., CISCO Catalyst Switch 9300"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                  id="new-asset-name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-350 mb-1">Inventory Asset Tag</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VET/IT/NET/022"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-810 rounded px-2 py-1.5 text-slate-200 font-mono font-bold"
                    id="new-asset-tag"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-350 mb-1">Category Group</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as AssetCategory)}
                    className="w-full text-xs bg-slate-900 border border-slate-810 rounded px-2 py-2 text-slate-101"
                    id="new-asset-category"
                  >
                    {Object.values(AssetCategory).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-350 mb-1">Purchase Date</label>
                  <input
                    type="date"
                    required
                    value={newPurchaseDate}
                    onChange={(e) => setNewPurchaseDate(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-805 rounded px-2 py-1"
                    id="new-asset-purchase"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-350 mb-1">Warranty Term Expiry</label>
                  <input
                    type="date"
                    value={newWarrantyCheck}
                    onChange={(e) => setNewWarrantyCheck(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-805 rounded px-2 py-1"
                    id="new-asset-warranty"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-350 mb-1">Acquisition Cost (USD)</label>
                  <input
                    type="number"
                    placeholder="e.g., 2500"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-805 rounded px-2 py-1 text-slate-205"
                    id="new-asset-cost"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-350 mb-1">Assigned Holder</label>
                  <input
                    type="text"
                    placeholder="e.g. trading Floor A"
                    value={newAssigned}
                    onChange={(e) => setNewAssigned(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-805 rounded px-2 py-1 text-slate-205"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-350 mb-1">Deploy Specific Location</label>
                <input
                  type="text"
                  placeholder="e.g. Wiring Closet B, Floor 2"
                  value={newLoc}
                  onChange={(e) => setNewLoc(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 text-slate-400 hover:bg-slate-900 text-xs font-semibold rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C4A052] hover:bg-amber-600 text-slate-950 font-bold rounded text-xs cursor-pointer"
                  id="btn-asset-save"
                >
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SERVICE LOG DIALOG */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl w-full max-w-sm overflow-hidden text-left shadow-2xl animate-fade-in">
            <div className="p-4 border-b border-slate-850 bg-slate-900/60 font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Settings size={14} className="text-amber-500" />
              Write Service Maintenance Log
            </div>

            <form onSubmit={handleServiceLogSubmit} className="p-5 space-y-4" id="log-service-form">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-350 mb-1">Service Type</label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-slate-100 focus:outline-none"
                  >
                    <option value="Preventive Care">Preventive Care</option>
                    <option value="Firmware Update">Firmware Update</option>
                    <option value="Hardware Upgrade">Hardware Upgrade</option>
                    <option value="Fault Resolution">Fault Resolution</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-350 mb-1">Adjust Health Status</label>
                  <select
                    value={newHealthStatus}
                    onChange={(e) => setNewHealthStatus(e.target.value as any)}
                    className="w-full text-xs bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-slate-100 focus:outline-none"
                    id="new-asset-health-updater"
                  >
                    <option value="Optimal">Optimal</option>
                    <option value="Degraded">Degraded</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-350 mb-1">Activity detailed explanation</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Logs check details, components adjusted, or vendor warranty updates dispatched..."
                  value={serviceDesc}
                  onChange={(e) => setServiceDesc(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded p-3 text-slate-200 focus:outline-none focus:border-amber-500"
                  id="service-notes-input"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="px-4 py-2 text-slate-400 hover:bg-slate-900 text-xs font-semibold rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded cursor-pointer"
                  id="btn-submit-service-log"
                >
                  Submit Activity Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
