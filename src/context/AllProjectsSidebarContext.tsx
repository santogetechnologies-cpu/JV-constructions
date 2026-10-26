import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AllProjectsSidebarContextType {
  isOpen: boolean;
  openSidebar: (projectIdToExpand?: string) => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
}

const AllProjectsSidebarContext = createContext<AllProjectsSidebarContextType | undefined>(undefined);

export const AllProjectsSidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const openSidebar = (projectIdToExpand?: string) => {
    if (projectIdToExpand) {
      setSelectedProjectId(projectIdToExpand);
    }
    setIsOpen(true);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  const toggleSidebar = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <AllProjectsSidebarContext.Provider
      value={{
        isOpen,
        openSidebar,
        closeSidebar,
        toggleSidebar,
        selectedProjectId,
        setSelectedProjectId,
      }}
    >
      {children}
    </AllProjectsSidebarContext.Provider>
  );
};

export const useAllProjectsSidebar = (): AllProjectsSidebarContextType => {
  const context = useContext(AllProjectsSidebarContext);
  if (!context) {
    throw new Error('useAllProjectsSidebar must be used within an AllProjectsSidebarProvider');
  }
  return context;
};
