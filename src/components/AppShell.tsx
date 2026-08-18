import React, { useState } from 'react';
import { 
  Package, Truck, CheckCircle, Search, Menu, X, 
  Bot, MapPin, ClipboardList, Layers, 
  BarChart3, StickyNote, LogOut
} from 'lucide-react';
import adoLogoFull from '../assets/ado-logo-full.png.asset.json';
import type { View } from '../views';
import Dashboard from './Dashboard';
import ConsignmentsView from './ConsignmentsView';
import ClientsView from './ClientsView';
import InventoryView from './InventoryView';
import AIAssistantView from './AIAssistantView';
import LotManagerView from './LotManagerView';
import AnalyticsView from './AnalyticsView';
import NotesView from './NotesView';


export default function AppShell({ userEmail, onSignOut }: { userEmail: string; onSignOut: () => void }) {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedClientFilter, setSelectedClientFilter] = useState<string | null>(null);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: Package },
    { id: 'inventory', label: 'Inventory Stock', icon: ClipboardList },
    { id: 'guangzhou', label: 'Guangzhou Warehouse', icon: MapPin },
    { id: 'yiwu', label: 'Yiwu Warehouse', icon: MapPin },
    { id: 'lots', label: 'Lot Batch Manager', icon: Layers },
    { id: 'clients', label: 'Client Directory', icon: Truck },
    { id: 'notes', label: 'Notes & Voice Memos', icon: StickyNote },
    { id: 'analytics', label: 'Freight Analytics', icon: BarChart3 },
    { id: 'ai', label: 'ADO BISHAL Assistant', icon: Bot },
  ] as const;

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            onViewChange={setCurrentView} 
            onClientSelect={(c) => { 
              setSelectedClientFilter(c); 
              setCurrentView('guangzhou'); 
            }} 
          />
        );
      case 'inventory':
        return <InventoryView />;
      case 'guangzhou':
        return (
          <ConsignmentsView 
            origin="Guangzhou" 
            clientFilter={selectedClientFilter} 
            onClearClientFilter={() => setSelectedClientFilter(null)} 
          />
        );
      case 'yiwu':
        return (
          <ConsignmentsView 
            origin="Yiwu" 
            clientFilter={selectedClientFilter} 
            onClearClientFilter={() => setSelectedClientFilter(null)} 
          />
        );
      case 'lots':
        return <LotManagerView />;
      case 'clients':
        return (
          <ClientsView 
            onClientSelect={(c) => { 
              setSelectedClientFilter(c); 
              setCurrentView('guangzhou'); 
            }} 
          />
        );
      case 'notes':
        return <NotesView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'ai':
        return <AIAssistantView />;
      default:
        return (
          <Dashboard 
            onViewChange={setCurrentView} 
            onClientSelect={() => {}} 
          />
        );
    }
  };

  const getHeaderTitle = () => {
    const item = navItems.find(n => n.id === currentView);
    return item ? item.label : 'Dashboard';
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-sky-50 font-sans text-slate-900">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 bg-white text-slate-700 w-64 z-20 flex flex-col flex-shrink-0 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 border-r border-sky-200 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Brand Header */}
        <div className="p-5 border-b border-sky-100 bg-sky-50/70 relative">
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="lg:hidden absolute top-3 right-3 text-slate-400 hover:text-slate-700 p-1"
          >
            <X size={18} />
          </button>
          <div className="flex flex-col items-center text-center space-y-2">
            <img
              src={adoLogoFull.url}
              alt="ADO International"
              className="h-20 w-auto max-w-full object-contain"
            />
            <span className="text-[11px] font-extrabold text-sky-800 tracking-wide leading-tight">
              ADO International Transport Nepal
            </span>
          </div>
        </div>


        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 custom-scrollbar overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  if (item.id !== 'guangzhou' && item.id !== 'yiwu') {
                    setSelectedClientFilter(null);
                  }
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive 
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30' 
                    : 'text-slate-600 hover:text-sky-800 hover:bg-sky-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon size={17} className={isActive ? 'text-white' : 'text-sky-500'} />
                  <span>{item.label}</span>
                </div>
                {item.id === 'ai' && (
                  <span className="text-[9px] font-black bg-blue-500 text-white px-1.5 py-0.5 rounded-full uppercase">
                    AI
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-3.5 mt-auto border-t border-slate-800/60 bg-slate-900/40">
          <div className="bg-slate-900/80 p-3 rounded-xl flex items-center space-x-3 border border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/30 shrink-0 flex items-center justify-center text-blue-300 font-black text-xs">
              AB
            </div>
            <div className="text-left flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">{userEmail || 'ADO Bishal Logistics'}</div>
              <button
                onClick={onSignOut}
                className="text-[10px] text-slate-400 hover:text-white font-medium flex items-center space-x-1"
              >
                <LogOut size={11} />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10 shrink-0 shadow-2xs">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
                {getHeaderTitle()}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Kathmandu HQ Active</span>
            </div>
          </div>
        </header>

        {/* View Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-4 bg-slate-50 custom-scrollbar">
          <div className="w-full min-w-0">
            {renderView()}
          </div>


        </main>
      </div>
    </div>
  );
}
