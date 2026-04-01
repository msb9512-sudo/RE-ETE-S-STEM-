import { ipcRenderer } from 'electron'

// Expose ipcRenderer to the renderer process via window object
// We use a @ts-ignore here because 'window' type augmentation is in src/types.ts 
// and might not be picked up by the electron build process context directly.
// @ts-ignore
window.ipcRenderer = {
  send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),
  on: (channel: string, func: (...args: any[]) => void) => {
    const subscription = (_event: any, ...args: any[]) => func(...args)
    ipcRenderer.on(channel, subscription)
    // Return a function to remove the listener easily
    return () => ipcRenderer.removeListener(channel, subscription)
  },
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  removeListener: (channel: string, func: (...args: any[]) => void) => ipcRenderer.removeListener(channel, func),
}