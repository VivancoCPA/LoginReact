import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { userService } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { getPhotoFullUrl } from '../utils/photo';

interface UserScopeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
}

export const UserScopeDrawer: React.FC<UserScopeDrawerProps> = ({
  isOpen,
  onClose,
  onSaveSuccess,
}) => {
  const { user: currentUser } = useAuth();
  const [scopelessUsers, setScopelessUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [associatingId, setAssociatingId] = useState<string | null>(null);

  const adminId = currentUser?.id;

  const fetchScopelessUsers = async () => {
    if (!adminId) return;
    setIsLoading(true);
    try {
      // Fetch unscoped users directly from the backend
      const unscoped = await userService.getUnscopedUsers();
      
      // Filter out the current admin if they are present in the list
      const filtered = unscoped.filter((u: any) => u.id !== adminId);
      
      setScopelessUsers(filtered);
    } catch (err: any) {
      console.error('Error fetching unscoped users:', err);
      toast.error('No se pudieron cargar los usuarios disponibles.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && adminId) {
      fetchScopelessUsers();
      setSearchTerm('');
    }
  }, [isOpen, adminId]);

  if (!isOpen) return null;

  const getInitials = (u: any) => {
    const first = u.name ? u.name[0] : '';
    const last = u.lastName ? u.lastName[0] : '';
    return (first + last).toUpperCase() || 'U';
  };

  const handleAssociate = async (userId: string) => {
    if (!adminId) return;
    setAssociatingId(userId);
    try {
      await userService.associateUserToScope(adminId, userId);
      toast.success('Usuario asociado correctamente al scope.');
      
      // Remove from drawer list immediately
      setScopelessUsers((prev) => prev.filter((u) => u.id !== userId));
      
      // Notify parent to refresh the grid
      onSaveSuccess();
    } catch (err: any) {
      console.error('Error associating user:', err);
      const msg = err.response?.data?.detail || err.response?.data?.message || 'No se pudo asociar el usuario.';
      toast.error(msg);
    } finally {
      setAssociatingId(null);
    }
  };

  const filteredUsers = scopelessUsers.filter((u) => {
    const fullName = `${u.name} ${u.lastName || ''}`.toLowerCase();
    const email = (u.email || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden animate-fadeIn select-none">
      {/* Backdrop blur overlay */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-over Right Drawer Panel */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full z-10 transition-transform duration-300 ease-out transform translate-x-0">
        
        {/* Header Action Bar */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/20 text-left">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
              Asociar Usuarios al Scope
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
              Incorpore usuarios sin ámbito asignado a su scope de administración.
            </span>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer focus:outline-none transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Input block */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/40 bg-white dark:bg-slate-900">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21-21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/10">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-r-2 border-indigo-500"></div>
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Buscando usuarios disponibles...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-white dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-850 rounded-2xl">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-slate-350 dark:text-slate-600 mb-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
              </svg>
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {searchTerm ? 'No se encontraron coincidencias' : 'Sin usuarios disponibles'}
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs leading-relaxed">
                {searchTerm 
                  ? 'Intente ajustar los términos de búsqueda.' 
                  : 'Todos los usuarios del sistema ya pertenecen a un ámbito de administración.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredUsers.map((user) => (
                <div 
                  key={user.id} 
                  className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-xl hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-bold shadow-inner">
                      {user.photoUrl ? (
                        <img 
                          src={getPhotoFullUrl(user.photoUrl)} 
                          alt="Avatar" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{getInitials(user)}</span>
                      )}
                    </div>
                    
                    <div className="text-left min-w-0">
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {user.name} {user.lastName}
                      </h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAssociate(user.id)}
                    disabled={associatingId !== null}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-150 text-indigo-650 dark:bg-indigo-950/45 dark:hover:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/20 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {associatingId === user.id ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-t border-r border-indigo-600 dark:border-indigo-400"></div>
                        <span>Asociando...</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        <span>Asociar</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 flex justify-end select-none">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-650 dark:text-slate-450 hover:text-slate-850 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-805 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all duration-200 cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};

export default UserScopeDrawer;
