import { useEffect, useCallback } from 'react';

export function usePluginMessages(
  onScanResult: (payload: any) => void,
  onExportResult: (payload: any) => void,
  onScanProgress?: (progress: number) => void
) {
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data.pluginMessage) {
        const { type, data, progress } = event.data.pluginMessage;
        if (type === 'SCAN_RESULT') onScanResult(data);
        if (type === 'EXPORT_RESULT') onExportResult(data);
        if (type === 'SCAN_PROGRESS' && onScanProgress) onScanProgress(progress);
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onScanResult, onExportResult, onScanProgress]);

  const sendScan = useCallback(() => {
    parent.postMessage({ pluginMessage: { type: 'SCAN' } }, '*');
  }, []);
  const sendExport = useCallback((scan?: any) => {
    parent.postMessage({ pluginMessage: { type: 'EXPORT', scan } }, '*');
  }, []);
  return { sendScan, sendExport };
}
