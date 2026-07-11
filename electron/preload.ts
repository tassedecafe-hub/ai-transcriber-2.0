import { contextBridge, ipcRenderer } from 'electron';

export interface FileFilter {
  name: string;
  extensions: string[];
}

export interface ElectronAPI {
  openFile: (filters: FileFilter[]) => Promise<string | null>;
  saveFile: (defaultName: string, content: string) => Promise<boolean>;
}

const electronAPI: ElectronAPI = {
  openFile: (filters) => ipcRenderer.invoke('dialog:openFile', filters),
  saveFile: (defaultName, content) => ipcRenderer.invoke('dialog:saveFile', defaultName, content),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
