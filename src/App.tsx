import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useApp } from './context';
import Dashboard from './pages/Dashboard';
import Resumos from './pages/Resumos';
import Flashcards from './pages/Flashcards';
import Simulados from './pages/Simulados';
import Dissertativa from './pages/Dissertativa';
import Progresso from './pages/Progresso';
import Configuracoes from './pages/Configuracoes';
import ImportarFuvest from './pages/ImportarFuvest';
import {
  Home, BookOpen, Brain, ClipboardList,
  BarChart2, Settings, Moon, Sun, FileUp,
} from 'lucide-react';

const bottomLinks = [
  { to: '/', label: 'Início', icon: Home, end: true },
  { to: '/resumos', label: 'Resumos', icon: BookOpen },
  { to: '/flashcards', label: 'Flashcards', icon: Brain },
  { to: '/simulados', label: 'Simulados', icon: ClipboardList },
  { to: '/progresso', label: 'Progresso', icon: BarChart2 },
];

const sideLinks = [
  ...bottomLinks,
  { to: '/dissertativa', label: 'Dissertativa', icon: ClipboardList },
  { to: '/importar-fuvest', label: 'Importar FUVEST', icon: FileUp },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
];

export default function App() {
  const { state, toggleDarkMode, reviewCardIds } = useApp();
  const location = useLocation();

  const sideNavCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? 'bg-emerald-600 text-white shadow-sm'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`;

  const bottomNavCls = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-0.5 py-1.5 transition-all flex-1 ${
      isActive
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-gray-400 dark:text-gray-500'
    }`;

  return (
    <div className="min-h-screen flex bg-gray-50/80 dark:bg-gray-950">

      {/* Sidebar — desktop only */}
      <aside className="hidden lg:flex flex-col w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 fixed top-0 left-0 h-full z-20">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">🐾 Residência Vet</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">USP · FUVEST</p>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {sideLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={sideNavCls}>
              <Icon size={16} />
              <span>{label}</span>
              {to === '/flashcards' && reviewCardIds.length > 0 && (
                <span className="ml-auto bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {reviewCardIds.length > 99 ? '99+' : reviewCardIds.length}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={toggleDarkMode}
            className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {state.darkMode ? <Sun size={15} /> : <Moon size={15} />}
            {state.darkMode ? 'Modo claro' : 'Modo escuro'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col lg:ml-56 min-w-0">

        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-5 py-3.5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-sm">🐾</div>
            <span className="text-sm font-extrabold text-gray-900 dark:text-white tracking-tight">Residência Vet</span>
          </div>
          <div className="flex items-center gap-3">
            {reviewCardIds.length > 0 && (
              <span className="bg-orange-500 text-white text-xs rounded-full px-2.5 py-1 font-bold">
                {reviewCardIds.length}
              </span>
            )}
            <button onClick={toggleDarkMode} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400">
              {state.darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 overflow-auto" key={location.pathname}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/resumos" element={<Resumos />} />
            <Route path="/flashcards" element={<Flashcards />} />
            <Route path="/simulados" element={<Simulados />} />
            <Route path="/dissertativa" element={<Dissertativa />} />
            <Route path="/progresso" element={<Progresso />} />
            <Route path="/importar-fuvest" element={<ImportarFuvest />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Routes>
        </main>

        {/* Bottom nav — mobile only */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 flex items-center px-1 pt-1 pb-safe z-20"
             style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
          {bottomLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={bottomNavCls}>
              {({ isActive }) => (
                <>
                  <div className={`relative flex items-center justify-center rounded-2xl transition-all w-12 h-7 ${
                    isActive
                      ? 'bg-emerald-100 dark:bg-emerald-900/60'
                      : ''
                  }`}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                    {to === '/flashcards' && reviewCardIds.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">
                        {reviewCardIds.length > 9 ? '9+' : reviewCardIds.length}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] transition-all ${isActive ? 'font-bold' : 'font-medium'}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
