import { showUI } from '@create-figma-plugin/utilities';
import { scanQuestline } from './scan';
import { exportQuestline } from './export';
import { ScanResult, Issue } from './types';

export default function () {
  showUI({ height: 700, width: 1100 });

  figma.ui.onmessage = async (msg) => {
    if (msg.type === 'SCAN') {
      // Send initial progress
      figma.ui.postMessage({ type: 'SCAN_PROGRESS', progress: 10 });
      
      const result = await scanQuestline();
      
      // Send completion progress
      figma.ui.postMessage({ type: 'SCAN_PROGRESS', progress: 100 });
      
      figma.ui.postMessage({ type: 'SCAN_RESULT', data: result });
    } else if (msg.type === 'EXPORT') {
      console.log('EXPORT DEBUG: Starting export...');
      
      try {
        // Use existing scan result if available, otherwise scan
        let scan: ScanResult;
        if (msg.scan) {
          scan = msg.scan as ScanResult;
          console.log('EXPORT DEBUG: Using existing scan result');
        } else {
          console.log('EXPORT DEBUG: No scan provided, scanning...');
          scan = await scanQuestline();
        }
        
        console.log('EXPORT DEBUG: Scan result:', scan);
        
        if (scan.issues.some((i: Issue) => i.level === 'error')) {
          console.log('EXPORT DEBUG: Scan has errors, aborting export');
          figma.ui.postMessage({ type: 'EXPORT_RESULT', data: { json: null, issues: scan.issues } });
          return;
        }
        
        console.log('EXPORT DEBUG: Calling exportQuestline...');
        const result = await exportQuestline(scan);
        console.log('EXPORT DEBUG: Export result:', result);
        figma.ui.postMessage({ type: 'EXPORT_RESULT', data: result });
      } catch (error) {
        console.log('EXPORT DEBUG: Export failed with error:', error);
        figma.ui.postMessage({ 
          type: 'EXPORT_RESULT', 
          data: { 
            json: null, 
            issues: [{ 
              code: 'UNKNOWN', 
              message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 
              level: 'error' 
            }] 
          } 
        });
      }
    } else if (msg.type === 'RESIZE') {
      figma.ui.resize(msg.width, msg.height);
    }
  };
}
