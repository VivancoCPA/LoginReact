import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { familyGroupService } from '../services/familyGroupService';
import { userService } from '../services/userService';
import { ConfirmDialog } from './ConfirmDialog';
import { getPhotoFullUrl } from '../utils/photo';
import type { 
  FamilyGroupItem, 
  FamilyMembershipItem, 
  FamilyExtraMembershipItem, 
  RelationshipLookup 
} from '../types/familyGroup';
import type { PagedUserItem } from '../types/user';

const getInitials = (name: string, lastName: string): string => {
  const first = name.trim().charAt(0) || '';
  const last = lastName.trim().charAt(0) || '';
  return (first + last).toUpperCase() || 'U';
};

const getAvatarColor = (id: string) => {
  const colors = [
    'bg-indigo-500 text-white',
    'bg-emerald-500 text-white',
    'bg-violet-500 text-white',
    'bg-rose-500 text-white',
    'bg-amber-500 text-white',
    'bg-sky-500 text-white',
  ];
  let sum = 0;
  for (let i = 0; i < id.length; i++) {
    sum += id.charCodeAt(i);
  }
  return colors[sum % colors.length];
};

interface FamilyGroupDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'view' | 'create' | 'edit';
  group: FamilyGroupItem | null;
  onSaveSuccess: () => void;
  currentUserId: string;
}

type TabType = 'general' | 'members' | 'extra';

export const FamilyGroupDrawer: React.FC<FamilyGroupDrawerProps> = ({
  isOpen,
  onClose,
  mode,
  group,
  onSaveSuccess,
  currentUserId,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [isSaving, setIsSaving] = useState(false);

  // Determine if the logged-in user is a member only (not the creator)
  // Non-creators operate strictly in read-only mode regardless of drawer state
  const isCreator = mode === 'create' || (group && group.userId === currentUserId);
  const isReadOnly = mode === 'view' || !isCreator;

  // ==========================================
  // TAB 1: GENERAL INFO STATE
  // ==========================================
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // TAB 2: SYSTEM MEMBERS STATE
  // ==========================================
  const [members, setMembers] = useState<FamilyMembershipItem[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [relationships, setRelationships] = useState<RelationshipLookup[]>([]);
  
  // Assign Member Form
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<PagedUserItem[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PagedUserItem | null>(null);
  const [assignRelationship, setAssignRelationship] = useState('');
  const [assignIsAdmin, setAssignIsAdmin] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignFormMode, setAssignFormMode] = useState<'create' | 'edit'>('create');

  // Member Confirm Delete
  const [isConfirmMemberOpen, setIsConfirmMemberOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<FamilyMembershipItem | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);

  // ==========================================
  // TAB 3: EXTRA MEMBERS STATE
  // ==========================================
  const [extraMembers, setExtraMembers] = useState<FamilyExtraMembershipItem[]>([]);
  const [isLoadingExtras, setIsLoadingExtras] = useState(false);
  
  // Extra Member Form (Create / Edit)
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [extraFormMode, setExtraFormMode] = useState<'create' | 'edit'>('create');
  const [selectedExtra, setSelectedExtra] = useState<FamilyExtraMembershipItem | null>(null);
  const [extraFullName, setExtraFullName] = useState('');
  const [extraIdType, setExtraIdType] = useState('Mascota');
  const [extraDescription, setExtraDescription] = useState('');
  const [extraIsActive, setExtraIsActive] = useState(true);
  const [extraPhotoFile, setExtraPhotoFile] = useState<File | null>(null);
  const [extraPhotoPreview, setExtraPhotoPreview] = useState<string | null>(null);
  const [extraNameError, setExtraNameError] = useState<string | null>(null);
  const extraPhotoInputRef = useRef<HTMLInputElement>(null);
  const [isSavingExtra, setIsSavingExtra] = useState(false);

  // Extra Member Actions Confirm
  const [isConfirmExtraOpen, setIsConfirmExtraOpen] = useState(false);
  const [extraToDelete, setExtraToDelete] = useState<FamilyExtraMembershipItem | null>(null);
  const [isDeletingExtra, setIsDeletingExtra] = useState(false);

  // ==========================================
  // INITIALIZATIONS & CLEANUPS
  // ==========================================
  
  // Cleanup preview URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      if (extraPhotoPreview) URL.revokeObjectURL(extraPhotoPreview);
    };
  }, [photoPreview, extraPhotoPreview]);

  // Load General data or retrieve lists on group change/drawer open
  useEffect(() => {
    if (isOpen) {
      setActiveTab('general');
      setShowAssignForm(false);
      setAssignFormMode('create');
      setShowExtraForm(false);
      
      // Load Relationship lookups once on drawer open
      const fetchLookups = async () => {
        try {
          const list = await familyGroupService.getRelationships();
          setRelationships(list);
          if (list.length > 0) {
            setAssignRelationship(list[0].id);
          }
        } catch (err) {
          console.error('Error fetching relationships lookup:', err);
        }
      };
      fetchLookups();

      if (group) {
        setName(group.name);
        setIsActive(group.isActive);
        setPhotoFile(null);
        setPhotoPreview(group.photoUrl ? getPhotoFullUrl(group.photoUrl) : null);
        setNameError(null);
        
        // Fetch sub-resources if group exists
        fetchMembersList();
        fetchExtrasList();
      } else {
        // Create Mode Initialization
        setName('');
        setIsActive(true);
        setPhotoFile(null);
        setPhotoPreview(null);
        setNameError(null);
        setMembers([]);
        setExtraMembers([]);
      }
    }
  }, [isOpen, group]);

  // Handle system users search query change
  useEffect(() => {
    if (!userSearchQuery.trim()) {
      setUserSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const result = await userService.getPagedUsers({
          page: 1,
          pageSize: 20,
          search: userSearchQuery,
        });
        setUserSearchResults(result.items || []);
      } catch (err) {
        console.error('Error searching users:', err);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [userSearchQuery]);

  const fetchMembersList = async () => {
    if (!group) return;
    setIsLoadingMembers(true);
    try {
      const list = await familyGroupService.getMembers(group.id);
      setMembers(list);
    } catch (err) {
      console.error('Error fetching group memberships:', err);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const fetchExtrasList = async () => {
    if (!group) return;
    setIsLoadingExtras(true);
    try {
      const list = await familyGroupService.getExtraMembers(group.id);
      setExtraMembers(list);
    } catch (err) {
      console.error('Error fetching extra memberships:', err);
    } finally {
      setIsLoadingExtras(false);
    }
  };

  // ==========================================
  // GENERAL TAB HANDLERS (GROUP SAVE)
  // ==========================================
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!val.trim()) {
      setNameError('El nombre del grupo es requerido.');
    } else if (val.trim().length < 2) {
      setNameError('El nombre debe tener al menos 2 caracteres.');
    } else {
      setNameError(null);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Size limit validation (<= 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('La foto de perfil no debe superar los 2MB de tamaño.');
        if (photoInputRef.current) photoInputRef.current.value = '';
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const isGeneralFormValid = name.trim() && name.trim().length >= 2 && !nameError;

  const handleGeneralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isGeneralFormValid || isSaving) return;

    setIsSaving(true);
    try {
      if (mode === 'create') {
        const newGroup = await familyGroupService.createFamilyGroup({
          name: name.trim(),
          userId: currentUserId, // Logged in user GUID is passed as creator
          photo: photoFile,
        });
        toast.success(`Grupo Familiar "${newGroup.name}" creado con éxito.`);
      } else if (mode === 'edit' && group) {
        await familyGroupService.updateFamilyGroup(group.id, {
          name: name.trim(),
          userId: group.userId,
          photo: photoFile,
          isActive,
        });
        toast.success(`Grupo Familiar "${name.trim()}" actualizado correctamente.`);
      }
      onSaveSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || err.response?.data?.message || err.message || 'No se pudo guardar la información del grupo.';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // MEMBERS TAB HANDLERS (SYSTEM USERS)
  // ==========================================
  const handleSelectUser = (u: PagedUserItem) => {
    setSelectedUser(u);
    setUserSearchQuery('');
    setUserSearchResults([]);
  };

  const handleAssignMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group || !selectedUser || !assignRelationship || isAssigning) return;

    if (assignFormMode === 'edit') {
      // Enforce only 1 Admin/Parent per group
      if (assignIsAdmin) {
        const hasAdmin = members.some((m) => m.isAdmin && m.userId !== selectedUser.id);
        if (hasAdmin) {
          toast.error('Solo se permite tener un Administrador (Parent) por grupo familiar.');
          return;
        }
      }

      setIsAssigning(true);
      try {
        // Remove old membership
        await familyGroupService.removeMember(group.id, selectedUser.id);
        // Add new membership with updated values
        await familyGroupService.assignMember(group.id, {
          userId: selectedUser.id,
          isAdmin: assignIsAdmin,
          relationship: assignRelationship,
        });
        toast.success('Miembro actualizado correctamente.');
        setSelectedUser(null);
        setAssignIsAdmin(false);
        setShowAssignForm(false);
        setAssignFormMode('create');
        fetchMembersList();
        onSaveSuccess();
      } catch (err: any) {
        console.error(err);
        const msg = err.response?.data?.message || err.response?.data?.detail || 'No se pudo actualizar el miembro. Verifique los datos.';
        toast.error(msg);
      } finally {
        setIsAssigning(false);
      }
      return;
    }

    // 1. Prevent duplicate assignments
    const isAlreadyMember = members.some((m) => m.userId === selectedUser.id);
    if (isAlreadyMember) {
      toast.error(`El usuario "${selectedUser.name} ${selectedUser.lastName}" ya pertenece a este grupo.`);
      return;
    }

    // 2. Enforce only 1 Admin/Parent per group
    if (assignIsAdmin) {
      const hasAdmin = members.some((m) => m.isAdmin);
      if (hasAdmin) {
        toast.error('Solo se permite tener un Administrador (Parent) por grupo familiar.');
        return;
      }
    }

    setIsAssigning(true);
    try {
      await familyGroupService.assignMember(group.id, {
        userId: selectedUser.id,
        isAdmin: assignIsAdmin,
        relationship: assignRelationship,
      });
      toast.success('Miembro asignado correctamente.');
      setSelectedUser(null);
      setAssignIsAdmin(false);
      setShowAssignForm(false);
      fetchMembersList();
      onSaveSuccess();
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || err.response?.data?.detail || 'No se pudo asignar al usuario. Verifique que no pertenezca a otro grupo.';
      toast.error(msg);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleOpenAssignMember = () => {
    setAssignFormMode('create');
    setSelectedUser(null);
    if (relationships.length > 0) {
      setAssignRelationship(relationships[0].id);
    }
    setAssignIsAdmin(false);
    setShowAssignForm(true);
  };

  const handleOpenMemberEdit = (m: FamilyMembershipItem) => {
    setAssignFormMode('edit');
    setSelectedUser({
      id: m.userId,
      email: m.userEmail || m.email || '',
      name: m.userName || m.name || '',
      lastName: m.userLastName || m.lastName || '',
      emailConfirmed: true,
      isLockedOut: false,
      createdAt: '',
      passwordConfirmed: true
    });
    setAssignRelationship(m.relationship);
    setAssignIsAdmin(m.isAdmin);
    setShowAssignForm(true);
  };

  const handleRemoveMemberClick = (m: FamilyMembershipItem) => {
    setMemberToDelete(m);
    setIsConfirmMemberOpen(true);
  };

  const handleConfirmRemoveMember = async () => {
    if (!group || !memberToDelete || isDeletingMember) return;
    setIsDeletingMember(true);
    try {
      await familyGroupService.removeMember(group.id, memberToDelete.userId);
      toast.success('Miembro desvinculado con éxito del grupo familiar.');
      setIsConfirmMemberOpen(false);
      setMemberToDelete(null);
      fetchMembersList();
      onSaveSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error('No se pudo desvincular al miembro del grupo.');
    } finally {
      setIsDeletingMember(false);
    }
  };

  // ==========================================
  // EXTRA MEMBERS TAB HANDLERS
  // ==========================================
  const handleOpenExtraCreate = () => {
    setExtraFormMode('create');
    setSelectedExtra(null);
    setExtraFullName('');
    setExtraIdType('Mascota');
    setExtraDescription('');
    setExtraIsActive(true);
    setExtraPhotoFile(null);
    setExtraPhotoPreview(null);
    setExtraNameError(null);
    setShowExtraForm(true);
  };

  const handleOpenExtraEdit = (em: FamilyExtraMembershipItem) => {
    setExtraFormMode('edit');
    setSelectedExtra(em);
    setExtraFullName(em.fullName);
    setExtraIdType(em.idType);
    setExtraDescription(em.description || '');
    setExtraIsActive(em.isActive);
    setExtraPhotoFile(null);
    setExtraPhotoPreview(em.photoUrl ? getPhotoFullUrl(em.photoUrl) : null);
    setExtraNameError(null);
    setShowExtraForm(true);
  };

  const handleExtraNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setExtraFullName(val);
    if (!val.trim()) {
      setExtraNameError('El nombre completo es requerido.');
    } else if (val.trim().length < 2) {
      setExtraNameError('El nombre debe tener al menos 2 caracteres.');
    } else {
      setExtraNameError(null);
    }
  };

  const handleExtraPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast.error('La foto de perfil no debe superar los 2MB de tamaño.');
        if (extraPhotoInputRef.current) extraPhotoInputRef.current.value = '';
        return;
      }
      setExtraPhotoFile(file);
      setExtraPhotoPreview(URL.createObjectURL(file));
    }
  };

  const isExtraFormValid = extraFullName.trim() && extraFullName.trim().length >= 2 && !extraNameError;

  const handleExtraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group || !isExtraFormValid || isSavingExtra) return;

    setIsSavingExtra(true);
    try {
      if (extraFormMode === 'create') {
        await familyGroupService.createExtraMember(group.id, {
          fullName: extraFullName.trim(),
          idType: extraIdType,
          description: extraDescription.trim() || undefined,
          photo: extraPhotoFile,
        });
        toast.success('Miembro extra registrado exitosamente.');
      } else if (extraFormMode === 'edit' && selectedExtra) {
        await familyGroupService.updateExtraMember(group.id, selectedExtra.id, {
          fullName: extraFullName.trim(),
          idType: extraIdType,
          description: extraDescription.trim() || undefined,
          photo: extraPhotoFile,
          isActive: extraIsActive,
        });
        toast.success('Miembro extra actualizado con éxito.');
      }
      setShowExtraForm(false);
      fetchExtrasList();
      onSaveSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error('Ocurrió un error al guardar el miembro extra.');
    } finally {
      setIsSavingExtra(false);
    }
  };

  const handleToggleExtraStatus = async (em: FamilyExtraMembershipItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!group) return;
    try {
      const res = await familyGroupService.toggleExtraMemberStatus(group.id, em.id);
      toast.success(
        `Miembro extra "${em.fullName}" ${res.isActive ? 'activado' : 'inactivado'} correctamente.`
      );
      fetchExtrasList();
      onSaveSuccess();
    } catch (err) {
      console.error('Error toggling extra member status:', err);
      toast.error('No se pudo cambiar el estado del miembro extra.');
    }
  };

  const handleDeleteExtraClick = (em: FamilyExtraMembershipItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setExtraToDelete(em);
    setIsConfirmExtraOpen(true);
  };

  const handleConfirmDeleteExtra = async () => {
    if (!group || !extraToDelete || isDeletingExtra) return;
    setIsDeletingExtra(true);
    try {
      await familyGroupService.deleteExtraMember(group.id, extraToDelete.id);
      toast.success('Miembro extra eliminado definitivamente del grupo.');
      setIsConfirmExtraOpen(false);
      setExtraToDelete(null);
      fetchExtrasList();
      onSaveSuccess();
    } catch (err) {
      console.error('Error deleting extra member:', err);
      toast.error('No se pudo eliminar al miembro extra.');
    } finally {
      setIsDeletingExtra(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden select-none transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      
      {/* Backdrop overlay */}
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer Frame */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className={`w-screen max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {mode === 'create' ? 'Nuevo Grupo Familiar' : isReadOnly ? 'Ver Grupo Familiar' : 'Editar Grupo Familiar'}
              </h2>
              {isReadOnly && group && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider mt-1">
                  Acceso de Solo Lectura (Miembro de Grupo)
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-slate-550 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 p-1.5 rounded-lg cursor-pointer focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Drawer Tabs Header */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/20 dark:bg-slate-950/10">
            {(['general', 'members', 'extra'] as const).map((tab) => {
              const disabled = mode === 'create' && tab !== 'general';
              
              return (
                <button
                  key={tab}
                  type="button"
                  disabled={disabled}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer focus:outline-none transition-all
                    ${activeTab === tab 
                      ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' 
                      : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'}
                    ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                  title={disabled ? 'Guarde el grupo familiar para administrar miembros' : ''}
                >
                  {tab === 'general' ? 'Información General' : tab === 'members' ? 'Miembros del Sistema' : 'Miembros Extra'}
                </button>
              );
            })}
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6">
            
            {/* ==========================================
                TAB 1: GENERAL INFO FORM
                ========================================== */}
            {activeTab === 'general' && (
              <form onSubmit={handleGeneralSubmit} className="space-y-6">
                
                {/* Photo Upload Circle Selector */}
                <div className="flex flex-col items-center gap-2">
                  <div className="relative select-none">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-24 h-24 rounded-full object-cover border border-slate-300 dark:border-slate-700"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-950/60 border border-dashed border-slate-300 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                        </svg>
                      </div>
                    )}

                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="absolute bottom-0 right-0 p-1.5 rounded-full bg-indigo-650 hover:bg-indigo-500 dark:bg-indigo-750 dark:hover:bg-indigo-600 shadow-md text-white cursor-pointer focus:outline-none transition-transform duration-200 active:scale-95"
                        title="Subir foto de grupo"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    disabled={isReadOnly}
                  />
                  {!isReadOnly && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 select-none">
                      JPG, PNG, WEBP (Máx. 2MB)
                    </span>
                  )}
                </div>

                {/* Group Name input */}
                <div className="w-full flex flex-col gap-1.5 text-left">
                  <label htmlFor="group-name" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                    Nombre de la Familia / Grupo *
                  </label>
                  <input
                    id="group-name"
                    type="text"
                    value={name}
                    onChange={handleNameChange}
                    disabled={isReadOnly || isSaving}
                    placeholder="Ej. Familia Pérez"
                    className={`w-full px-4 py-3 bg-white dark:bg-slate-900 border rounded-lg text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-colors
                      ${nameError ? 'border-red-400 focus:border-red-500' : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'}`}
                  />
                  {nameError && (
                    <span className="text-xs text-red-650 dark:text-red-450 font-bold select-none">{nameError}</span>
                  )}
                </div>

                {/* logical status toggle (Only on Edit mode and if Creator) */}
                {mode === 'edit' && isCreator && (
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl select-none text-left">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                        Estado del Grupo Familiar
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Si se inactiva, todos los miembros se verán restringidos.
                      </p>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => setIsActive((prev) => !prev)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                        ${isActive ? 'bg-indigo-650' : 'bg-slate-200 dark:bg-slate-800'}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                          ${isActive ? 'translate-x-5' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* ==========================================
                TAB 2: SYSTEM MEMBERS LIST / ASSIGNMENT
                ========================================== */}
            {activeTab === 'members' && group && (
              <div className="space-y-6">
                
                {/* Search / Assign member section (creator only, and if group is active) */}
                {isCreator && group.isActive && (
                  <div className="text-left select-none">
                    {!showAssignForm ? (
                      <button
                        type="button"
                        onClick={handleOpenAssignMember}
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/45 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                        </svg>
                        Asignar Miembro del Sistema
                      </button>
                    ) : (
                      <form onSubmit={handleAssignMemberSubmit} className="p-4 border border-indigo-100 dark:border-indigo-950 bg-indigo-50/10 dark:bg-indigo-950/5 rounded-xl space-y-4">
                        <div className="flex justify-between items-center border-b border-indigo-100/50 dark:border-indigo-950 pb-2">
                          <h4 className="text-xs font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider">
                            {assignFormMode === 'create' ? 'Asignar Nuevo Miembro' : 'Editar Relación de Miembro'}
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAssignForm(false);
                              setSelectedUser(null);
                              setAssignFormMode('create');
                            }}
                            className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer focus:outline-none"
                          >
                            Cancelar
                          </button>
                        </div>

                        {/* Search Users Input */}
                        {!selectedUser ? (
                          <div className="relative">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                              Buscar Usuario por Nombre o Correo
                            </label>
                            <input
                              type="text"
                              value={userSearchQuery}
                              onChange={(e) => setUserSearchQuery(e.target.value)}
                              placeholder="Escriba correo, nombre..."
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                            />
                            
                            {/* Autocomplete dropdown search results */}
                            {isSearchingUsers && (
                              <div className="absolute left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-b-xl shadow-lg mt-1 p-2 text-center text-xs text-slate-400 z-30">
                                Buscando usuarios...
                              </div>
                            )}

                            {userSearchResults.length > 0 && (
                              <div className="absolute left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-b-xl shadow-lg mt-1 max-h-48 overflow-y-auto z-30 text-left p-1">
                                {userSearchResults.map((u) => (
                                  <button
                                    key={u.id}
                                    type="button"
                                    onClick={() => handleSelectUser(u)}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg flex flex-col gap-0.5 cursor-pointer"
                                  >
                                    <span className="font-bold text-slate-800 dark:text-slate-100">{u.name} {u.lastName}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">{u.email}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 p-3 rounded-lg">
                            <div className="text-left">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                Selected: {selectedUser.name} {selectedUser.lastName}
                              </p>
                              <p className="text-[10px] text-slate-450 dark:text-slate-500 font-mono">
                                {selectedUser.email}
                              </p>
                            </div>
                            {assignFormMode === 'create' && (
                              <button
                                type="button"
                                onClick={() => setSelectedUser(null)}
                                className="text-xs text-red-500 hover:text-red-700 font-bold focus:outline-none"
                              >
                                Remover
                              </button>
                            )}
                          </div>
                        )}

                        {/* Relationship lookup selector */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                              Relación / Parentesco
                            </label>
                            <select
                              value={assignRelationship}
                              onChange={(e) => setAssignRelationship(e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:outline-none"
                            >
                              {relationships.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center gap-2 pt-5">
                            <input
                              id="assign-is-admin"
                              type="checkbox"
                              checked={assignIsAdmin}
                              onChange={(e) => setAssignIsAdmin(e.target.checked)}
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="assign-is-admin" className="text-xs font-bold text-slate-650 dark:text-slate-300 select-none">
                              ¿Es Administrador (Parent)?
                            </label>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={!selectedUser || isAssigning}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow cursor-pointer focus:outline-none"
                        >
                          {isAssigning 
                            ? (assignFormMode === 'create' ? 'Asignando...' : 'Actualizando...') 
                            : (assignFormMode === 'create' ? 'Confirmar Asignación' : 'Guardar Cambios')}
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* Members List */}
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-wider text-left">
                    Miembros Asociados
                  </h3>
                  
                  {isLoadingMembers ? (
                    <div className="flex justify-center py-6">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-indigo-500"></div>
                    </div>
                  ) : members.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50/50 dark:bg-slate-950/10 border rounded-xl select-none">
                      <p className="text-xs italic text-slate-400 dark:text-slate-500">
                        No hay miembros registrados en este grupo familiar.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-150 dark:divide-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/50">
                      {members.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-3.5 text-left"
                        >
                          <div className="flex items-center gap-3">
                            {/* Member Avatar */}
                            <div className="shrink-0 select-none">
                              {m.userPhotoUrl ? (
                                <img
                                  src={getPhotoFullUrl(m.userPhotoUrl)}
                                  alt={m.userName}
                                  className="w-8 h-8 rounded-full object-cover border border-slate-200"
                                />
                              ) : (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${getAvatarColor(m.userId)}`}>
                                  {getInitials(m.userName || '', m.userLastName || '')}
                                </div>
                              )}
                            </div>

                            {/* Details */}
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                <span>{m.userName} {m.userLastName}</span>
                                {m.isAdmin && (
                                  <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border border-indigo-100/40 shrink-0 select-none">
                                    ADMIN
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-450 dark:text-slate-500 font-mono truncate max-w-[200px]">
                                {m.userEmail}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-950/60 border dark:border-slate-800 text-slate-550 dark:text-slate-350 select-none">
                              {relationships.find((r) => r.id === m.relationship)?.label || m.relationship}
                            </span>

                            {/* Edit button (Creator only) */}
                            {isCreator && (
                              <button
                                type="button"
                                onClick={() => handleOpenMemberEdit(m)}
                                className="p-1 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors focus:outline-none"
                                title="Editar relación"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                                </svg>
                              </button>
                            )}

                            {/* Remove button (Creator only, and can't remove oneself) */}
                            {isCreator && m.userId !== group.userId && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMemberClick(m)}
                                className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors focus:outline-none"
                                title="Desvincular miembro"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==========================================
                TAB 3: EXTRA MEMBERS CRUD LIST
                ========================================== */}
            {activeTab === 'extra' && group && (
              <div className="space-y-6">
                
                {/* Add Extra Member Trigger button (creator only) */}
                {isCreator && !showExtraForm && (
                  <button
                    type="button"
                    onClick={handleOpenExtraCreate}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/45 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg transition-colors cursor-pointer select-none"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Añadir Miembro Extra (No-Sistema)
                  </button>
                )}

                {/* Extra Member form (Creator only) */}
                {isCreator && showExtraForm && (
                  <form onSubmit={handleExtraSubmit} className="p-4 border border-indigo-100 dark:border-indigo-950 bg-indigo-50/10 dark:bg-indigo-950/5 rounded-xl space-y-4 text-left select-none">
                    <div className="flex justify-between items-center border-b border-indigo-100/50 dark:border-indigo-950 pb-2">
                      <h4 className="text-xs font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider">
                        {extraFormMode === 'create' ? 'Registrar Miembro Extra' : 'Editar Miembro Extra'}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowExtraForm(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer focus:outline-none"
                      >
                        Cancelar
                      </button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                      
                      {/* Photo upload for extra member */}
                      <div className="flex flex-col items-center justify-center shrink-0">
                        <div className="relative">
                          {extraPhotoPreview ? (
                            <img
                              src={extraPhotoPreview}
                              alt="Extra preview"
                              className="w-16 h-16 rounded-full object-cover border"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900 border border-dashed flex items-center justify-center text-slate-400">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                              </svg>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => extraPhotoInputRef.current?.click()}
                            className="absolute bottom-0 right-0 p-1 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer focus:outline-none"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-2.5 h-2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                          </button>
                        </div>
                        
                        <input
                          ref={extraPhotoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleExtraPhotoChange}
                          className="hidden"
                        />
                      </div>

                      {/* Main text fields */}
                      <div className="flex-1 space-y-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            Nombre Completo *
                          </label>
                          <input
                            type="text"
                            value={extraFullName}
                            onChange={handleExtraNameChange}
                            placeholder="Nombre del familiar..."
                            className="w-full px-3 py-2 border rounded-lg text-xs focus:outline-none bg-white dark:bg-slate-900 border-slate-350 dark:border-slate-700"
                          />
                          {extraNameError && (
                            <span className="text-[10px] text-red-500 font-bold block mt-0.5">{extraNameError}</span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                              Tipo de Miembro *
                            </label>
                            <select
                              value={extraIdType}
                              onChange={(e) => setExtraIdType(e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg text-xs focus:outline-none bg-white dark:bg-slate-900 border-slate-350 dark:border-slate-700"
                            >
                              <option value="Mascota">Mascota</option>
                              <option value="Otros">Otros</option>
                            </select>
                          </div>

                          {/* Extra Member active toggle (only in Edit mode) */}
                          {extraFormMode === 'edit' && (
                            <div className="flex items-center gap-2 pt-5 select-none">
                              <input
                                id="extra-is-active"
                                type="checkbox"
                                checked={extraIsActive}
                                onChange={(e) => setExtraIsActive(e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <label htmlFor="extra-is-active" className="text-xs font-bold text-slate-650 dark:text-slate-350 select-none">
                                ¿Miembro Activo?
                              </label>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            Descripción / Nota
                          </label>
                          <textarea
                            rows={2}
                            value={extraDescription}
                            onChange={(e) => setExtraDescription(e.target.value)}
                            placeholder="Ej. Abuelo paterno, etc..."
                            className="w-full px-3 py-2 border rounded-lg text-xs focus:outline-none resize-none bg-white dark:bg-slate-900 border-slate-350 dark:border-slate-700"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!isExtraFormValid || isSavingExtra}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow cursor-pointer focus:outline-none"
                    >
                      {isSavingExtra ? 'Guardando...' : 'Guardar Miembro Extra'}
                    </button>
                  </form>
                )}

                {/* Extra Members list */}
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-wider text-left">
                    Miembros Extras Registrados
                  </h3>

                  {isLoadingExtras ? (
                    <div className="flex justify-center py-6">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-indigo-500"></div>
                    </div>
                  ) : extraMembers.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50/50 dark:bg-slate-950/10 border rounded-xl select-none">
                      <p className="text-xs italic text-slate-400 dark:text-slate-500">
                        No hay miembros extras registrados en este grupo.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-150 dark:divide-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/50">
                      {extraMembers.map((em) => (
                        <div
                          key={em.id}
                          className={`flex items-center justify-between p-3.5 text-left
                            ${!em.isActive ? 'bg-slate-50/40 dark:bg-slate-950/10 opacity-60' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Extra Avatar */}
                            <div className="shrink-0 select-none">
                              {em.photoUrl ? (
                                <img
                                  src={getPhotoFullUrl(em.photoUrl)}
                                  alt={em.fullName}
                                  className="w-8 h-8 rounded-full object-cover border"
                                />
                              ) : (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${getAvatarColor(String(em.id))}`}>
                                  {getInitials(em.fullName, '')}
                                </div>
                              )}
                            </div>

                            {/* Details */}
                            <div>
                              <p className={`text-xs font-bold text-slate-800 dark:text-slate-100
                                ${!em.isActive ? 'text-slate-400 dark:text-slate-500 line-through decoration-slate-450/40' : ''}`}>
                                {em.fullName}
                              </p>
                              <p className="text-[10px] text-slate-450 dark:text-slate-500 truncate max-w-[200px]">
                                {em.description || 'Sin notas.'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-100 dark:bg-slate-950/60 border text-slate-500 select-none">
                              Tipo: {em.idType}
                            </span>

                            {/* Actions (Creator only) */}
                            {isCreator && (
                              <div className="flex items-center gap-1.5 select-none">
                                <button
                                  type="button"
                                  onClick={() => handleOpenExtraEdit(em)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors focus:outline-none"
                                  title="Editar"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleExtraStatus(em, e)}
                                  className={`p-1 rounded-lg transition-colors focus:outline-none cursor-pointer
                                    ${em.isActive ? 'text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800/60' : 'text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}
                                  title={em.isActive ? 'Desactivar' : 'Activar'}
                                >
                                  {em.isActive ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-3.5 h-3.5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                                    </svg>
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-3.5 h-3.5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteExtraClick(em, e)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-red-650 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors focus:outline-none"
                                  title="Eliminar"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.34 9m-4.72 0L9 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Footer Save Action buttons */}
          {activeTab === 'general' && (
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 flex gap-4 shrink-0 select-none">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-850 dark:text-slate-350 font-semibold rounded-lg text-sm border border-slate-200 dark:border-slate-800 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleGeneralSubmit}
                  disabled={!isGeneralFormValid || isSaving}
                  className={`flex-1 py-3 px-4 bg-indigo-650 hover:bg-indigo-500 active:bg-indigo-750 text-white font-semibold rounded-lg text-sm
                    focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-lg shadow-indigo-600/20
                    flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]
                    transition-all duration-250 cursor-pointer
                    ${(!isGeneralFormValid || isSaving) ? 'opacity-50 cursor-not-allowed scale-100 hover:scale-100 hover:bg-indigo-600' : ''}`}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-r-2 border-white"></div>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar Grupo</span>
                  )}
                </button>
              )}
            </div>
          )}

        </div>
      </div>

      {/* CONFIRMATION OVERLAYS FOR DELETE SYSTEM MEMBERS */}
      <ConfirmDialog
        isOpen={isConfirmMemberOpen}
        onClose={() => {
          setIsConfirmMemberOpen(false);
          setMemberToDelete(null);
        }}
        onConfirm={handleConfirmRemoveMember}
        title="Desvincular Miembro"
        message={`¿Estás seguro de que deseas desvincular a "${memberToDelete?.userName || ''} ${memberToDelete?.userLastName || ''}" del grupo familiar?`}
        confirmText="Desvincular"
        confirmColor="danger"
        isLoading={isDeletingMember}
      />

      {/* CONFIRMATION OVERLAYS FOR DELETE EXTRA MEMBERS */}
      <ConfirmDialog
        isOpen={isConfirmExtraOpen}
        onClose={() => {
          setIsConfirmExtraOpen(false);
          setExtraToDelete(null);
        }}
        onConfirm={handleConfirmDeleteExtra}
        title="Eliminar Miembro Extra"
        message={`¿Estás seguro de que deseas eliminar permanentemente al miembro extra "${extraToDelete?.fullName || ''}" de este grupo?`}
        confirmText="Eliminar"
        confirmColor="danger"
        isLoading={isDeletingExtra}
      />

    </div>
  );
};

export default FamilyGroupDrawer;
