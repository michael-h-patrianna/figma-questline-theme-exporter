import { h } from 'preact';
import { render, Button } from '@create-figma-plugin/ui';
import { useState, useRef, useLayoutEffect, useEffect } from 'preact/hooks';
import { usePluginMessages } from './hooks/usePluginMessages';
import { PreviewCanvas } from './components/PreviewCanvas';
import { ErrorBanner } from './components/ErrorBanner';
import { QuestTable } from './components/QuestTable';
import JSZip from 'jszip';
import { ScanResult, QuestlineExport, Issue } from '@main/types';

const darkBg = '#181A20';
const darkPanel = '#23262F';
const accent = '#3772FF';
const textColor = '#F4F4F4';
const textSecondary = '#A3A3A3';
const border = '#23262F';
const borderRadius = 8;

// Initial resize will be handled by useEffect

async function copyToClipboard(text: string) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for Figma plugin iframe
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    return true;
  } catch {
    return false;
  }
}

function App() {
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [exportResult, setExportResult] = useState<{ json: QuestlineExport | null; issues: Issue[] } | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [previewMode, setPreviewMode] = useState<'wireframe' | 'locked' | 'active' | 'unclaimed' | 'completed'>('wireframe');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const uiPanelRef = useRef<HTMLDivElement>(null);
  const [uiPanelHeight, setUiPanelHeight] = useState<number>(600);

  const { sendScan, sendExport } = usePluginMessages(
    (result: ScanResult) => {
      setIsScanning(false);
      setScanProgress(0);
      setScan(result);
      if (result && result.issues && result.issues.some((i: Issue) => i.level === 'error')) {
        const errorCount = result.issues.filter((i: Issue) => i.level === 'error').length;
        setToast({ 
          msg: `Scan completed with ${errorCount} issue${errorCount > 1 ? 's' : ''}. Please review and fix the problems shown.`, 
          type: 'error' 
        });
      } else {
        const questCount = result.quests?.length || 0;
        setToast({ 
          msg: `Scan successful! Found ${questCount} quest${questCount !== 1 ? 's' : ''}. Ready to export.`, 
          type: 'success' 
        });
      }
    },
    (result: { json: QuestlineExport | null; issues: Issue[] }) => {
      console.log('UI DEBUG: Received export result:', result);
      setExportResult(result);
      if (result && result.issues && result.issues.some((i: Issue) => i.level === 'error')) {
        const errorCount = result.issues.filter((i: Issue) => i.level === 'error').length;
        setToast({ 
          msg: `Export failed with ${errorCount} error${errorCount > 1 ? 's' : ''}. Please fix the issues and try again.`, 
          type: 'error' 
        });
      } else {
        setToast({ 
          msg: 'Export successful! Your assets are ready to download.', 
          type: 'success' 
        });
      }
    },
    (progress: number) => {
      setScanProgress(progress);
    }
  );



  function showToast(msg: string, type: 'success' | 'error' | 'info' = 'info') {
    setToast({ msg, type });
    const timeout = setTimeout(() => setToast(null), 5000);
    // Allow click to dismiss
    (window as any).__toastrTimeout = timeout;
  }

  async function handleCopyJson() {
    if (exportResult && exportResult.json) {
      // Only copy the required JSON structure, not the full export result
      const jsonToCopy = exportResult.json;
      const ok = await copyToClipboard(JSON.stringify(jsonToCopy, null, 2));
      showToast(
        ok ? 'Export data copied to clipboard!' : 'Copy failed - try again', 
        ok ? 'success' : 'error'
      );
    } else {
      showToast('No export data available. Please export your questline first.', 'error');
    }
  }



  async function handleScan() {
    setIsScanning(true);
    setScanProgress(0);
    await sendScan();
  }

  async function handleExport() {
    console.log('UI DEBUG: Export button clicked, scan:', scan);
    if (!scan) {
      showToast('Please scan your questline first to export assets', 'error');
      return;
    }
    
    // Check for errors before exporting
    if (scan.issues && scan.issues.some((i: Issue) => i.level === 'error')) {
      showToast('Please fix all errors before exporting. Review the issues shown above.', 'error');
      return;
    }
    
    console.log('UI DEBUG: Sending export with scan data');
    showToast('Preparing your assets for download...', 'info');
    await sendExport(scan);
  }

  // Handle export with folder selection
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.pluginMessage?.type === 'EXPORT_WITH_FOLDER') {
        const { questlineId, images, json } = event.data.pluginMessage;
        console.log('UI DEBUG: Received export request for:', questlineId, 'images:', images.length, 'with JSON');
        
        // Show folder selection dialog
        handleFolderSelection(questlineId, images, json);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  async function handleFolderSelection(questlineId: string, images: Array<{name: string, data: Uint8Array}>, json: any) {
    try {
      // Create a folder name
      const folderName = `questline-${questlineId.replace(/[^a-z0-9-]/g, '-')}`;
      
      console.log('UI DEBUG: Creating ZIP with', images.length, 'images + JSON for folder:', folderName);
      
      // Create a single ZIP file containing all images and JSON
      const zip = new JSZip();
      const folder = zip.folder(folderName);
      
      // Add all images
      for (const image of images) {
        folder?.file(image.name, image.data);
      }
      
      // Add positions.json with the questline data
      const jsonString = JSON.stringify(json, null, 2);
      folder?.file('positions.json', jsonString);
      
      console.log('UI DEBUG: Generating ZIP blob...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      console.log('UI DEBUG: ZIP blob generated, size:', zipBlob.size);
      
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folderName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('UI DEBUG: Download triggered');
      showToast(`Export complete! Your questline assets (${images.length} images + data) are ready for download.`, 'success');
      
    } catch (error) {
      console.log('UI DEBUG: Export failed:', error);
      showToast('Export failed. Please try again or check your internet connection.', 'error');
    }
  }





  // Track UI panel height for preview scaling
  useLayoutEffect(() => {
    if (uiPanelRef.current) {
      setUiPanelHeight(uiPanelRef.current.offsetHeight);
    }
  }, [scan, exportResult]);

  // Calculate preview width based on questline aspect ratio
  let previewWidth = 400;
  if (scan && scan.frameSize && scan.frameSize.width && scan.frameSize.height) {
    // Use a fixed height and calculate width based on aspect ratio
    const previewHeight = 300; // Fixed height for consistent sizing
    const aspectRatio = scan.frameSize.width / scan.frameSize.height;
    const calculatedWidth = Math.round(previewHeight * aspectRatio);
    previewWidth = Math.max(320, Math.min(600, calculatedWidth)); // Min 320px, max 600px
  }

  // Auto-resize plugin window to fit content
  useEffect(() => {
    if (typeof parent !== 'undefined' && parent.postMessage && uiPanelRef.current) {
      // Calculate total width: UI panel + preview panel + gap + padding
      const uiPanelWidth = uiPanelRef.current.offsetWidth;
      const previewPanelWidth = previewWidth + 48; // preview width + padding
      const totalWidth = uiPanelWidth + previewPanelWidth + 24 + 48; // 24px gap + 48px padding (24px on each side)
      
      // Calculate total height: max of UI panel height or minimum 700px, plus extra padding
      const totalHeight = Math.max(uiPanelHeight + 80, 700); // 48px padding top + bottom + extra buffer
      
      console.log('RESIZE DEBUG:', { uiPanelWidth, previewWidth, previewPanelWidth, uiPanelHeight, totalWidth, totalHeight });
      
      parent.postMessage({ pluginMessage: { type: 'RESIZE', width: totalWidth, height: totalHeight } }, '*');
    }
  }, [uiPanelHeight, previewWidth, scan, exportResult]);

  // Extract BG fill as data URL for preview
  let bgFillUrl: string | undefined = undefined;
  if (scan && scan.backgroundFillUrl) {
    bgFillUrl = scan.backgroundFillUrl;
  }
  // Extract quest image fills as data URLs for all states
  const previewQuests = (scan?.quests || []).map((q: any) => ({
    ...q,
    lockedImgUrl: q.lockedImgUrl,
    activeImgUrl: q.activeImgUrl,
    unclaimedImgUrl: q.unclaimedImgUrl,
    completedImgUrl: q.completedImgUrl,
  }));
  


  return (
    <div style={{ 
      background: darkBg, 
      padding: 24, 
      color: textColor, 
      fontFamily: 'Inter, sans-serif', 
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
      width: '100%',
      height: '100%'
    }}>
                   <div style={{ marginBottom: 16 }}>
               <h2 style={{ 
                 color: textColor, 
                 margin: 0, 
                 fontWeight: 700, 
                 letterSpacing: 1,
                 fontSize: 24
               }}>Questline Theme Export</h2>
               <p style={{ 
                 color: textSecondary, 
                 margin: '8px 0 0 0', 
                 fontSize: 14,
                 lineHeight: 1.4
               }}>
                 Export your questline designs as ready-to-use assets and positioning data.
               </p>
             </div>
      
      <div style={{ 
        display: 'flex', 
        gap: 24, 
        flex: 1,
        minHeight: 0,
        overflow: 'hidden'
      }}>
        {/* Main UI Panel */}
        <div ref={uiPanelRef} style={{ 
          flex: '0 0 400px',
          maxWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
                           {/* Action Buttons */}
                 <div style={{ 
                   display: 'flex', 
                   gap: 8, 
                   flexWrap: 'wrap'
                 }}>
                   <Button onClick={handleScan} disabled={isScanning}>
                     {isScanning ? 'Scanning...' : 'Scan Questline'}
                   </Button>
                   <Button onClick={handleExport} disabled={!scan}>
                     Export Assets
                   </Button>
                   <Button onClick={handleCopyJson} disabled={!exportResult?.json}>
                     Copy JSON
                   </Button>
                 </div>
                 
                 {/* Instructions */}
                 {!scan && (
                   <div style={{ 
                     background: 'rgba(55, 114, 255, 0.1)', 
                     border: '1px solid rgba(55, 114, 255, 0.3)', 
                     borderRadius, 
                     padding: 16, 
                     marginTop: 16
                   }}>
                     <div style={{ 
                       color: textSecondary, 
                       fontWeight: 600, 
                       marginBottom: 8,
                       fontSize: 14
                     }}>
                       How to use this plugin:
                     </div>
                     <div style={{ 
                       color: textColor, 
                       fontSize: 13, 
                       lineHeight: 1.5
                     }}>
                       1. <strong>Select your questline frame</strong> (named "Questline: ...")<br/>
                       2. <strong>Click "Scan Questline"</strong> to analyze your design<br/>
                       3. <strong>Review the results</strong> and fix any issues shown<br/>
                       4. <strong>Click "Export Assets"</strong> to download images and data
                     </div>
                   </div>
                 )}
          
          {/* Scan Result */}
          <div style={{ 
            background: darkPanel, 
            borderRadius, 
            border: `1px solid ${border}`,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            maxHeight: '300px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              color: textSecondary, 
              fontWeight: 600, 
              padding: '16px 20px',
              borderBottom: `1px solid ${border}`,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              {scan ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>Quest Analysis</span>
                  <span style={{ 
                    background: scan.issues?.some((i: Issue) => i.level === 'error') ? 'rgba(231, 76, 60, 0.2)' : 'rgba(30, 203, 122, 0.2)',
                    color: scan.issues?.some((i: Issue) => i.level === 'error') ? '#e74c3c' : '#1ecb7a',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 500
                  }}>
                    {scan.quests?.length || 0} quests
                  </span>
                </div>
              ) : (
                <span>Quest Analysis</span>
              )}
            </div>
            
            <div style={{ 
              flex: 1, 
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              padding: scan ? 0 : 20
            }}>
              {scan ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }}>
                  <ErrorBanner issues={scan.issues || []} />
                  <div style={{
                    flex: 1,
                    minHeight: 0
                  }}>
                    <QuestTable quests={scan.quests || []} issues={scan.issues || []} />
                  </div>
                </div>
              ) : (
                <div style={{ 
                  color: textSecondary, 
                  fontSize: 14, 
                  textAlign: 'center',
                  padding: 20
                }}>
                  No scan yet.
                </div>
              )}
            </div>
          </div>
          
          {/* Export Result */}
          <div style={{ 
            background: darkPanel, 
            borderRadius, 
            padding: 20, 
            border: `1px solid ${border}`,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            maxHeight: '300px'
          }}>
            <div style={{ 
              color: textSecondary, 
              fontWeight: 600, 
              marginBottom: 12,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span>Export Data</span>
              {exportResult?.json && (
                <span style={{ 
                  background: 'rgba(30, 203, 122, 0.2)',
                  color: '#1ecb7a',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 500
                }}>
                  Ready
                </span>
              )}
            </div>
            
            {exportResult ? (
              <pre style={{ 
                background: 'transparent', 
                color: textColor, 
                fontSize: 12, 
                flex: 1,
                overflow: 'auto', 
                margin: 0,
                lineHeight: 1.4,
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                maxWidth: '100%',
                maxHeight: '100%'
              }}>
                {JSON.stringify(exportResult, null, 2)}
              </pre>
            ) : (
              <div style={{ 
                color: textSecondary, 
                fontSize: 14, 
                textAlign: 'center',
                padding: 20
              }}>
                No export yet.
              </div>
            )}
          </div>
        </div>
        
        {/* Preview Panel */}
        <div style={{ 
          flex: `0 0 ${previewWidth + 48}px`,
          display: 'flex', 
          flexDirection: 'column',
          gap: 16,
          minWidth: 0,
          maxWidth: `${previewWidth + 48}px`
        }}>
                           {/* Preview Mode Switcher */}
                 <div style={{ 
                   display: 'flex', 
                   gap: 4, 
                   alignItems: 'center',
                   flexWrap: 'wrap'
                 }}>
                   <button style={{ 
                     background: previewMode === 'wireframe' ? accent : darkPanel, 
                     color: textColor, 
                     border: 'none', 
                     borderRadius: 6, 
                     padding: '6px 10px', 
                     fontWeight: 600, 
                     cursor: 'pointer',
                     fontSize: 11
                   }} onClick={() => setPreviewMode('wireframe')}>Wire</button>
                   <button style={{ 
                     background: previewMode === 'locked' ? accent : darkPanel, 
                     color: textColor, 
                     border: 'none', 
                     borderRadius: 6, 
                     padding: '6px 10px', 
                     fontWeight: 600, 
                     cursor: 'pointer',
                     fontSize: 11
                   }} onClick={() => setPreviewMode('locked')}>Locked</button>
                   <button style={{ 
                     background: previewMode === 'active' ? accent : darkPanel, 
                     color: textColor, 
                     border: 'none', 
                     borderRadius: 6, 
                     padding: '6px 10px', 
                     fontWeight: 600, 
                     cursor: 'pointer',
                     fontSize: 11
                   }} onClick={() => setPreviewMode('active')}>Active</button>
                   <button style={{ 
                     background: previewMode === 'unclaimed' ? accent : darkPanel, 
                     color: textColor, 
                     border: 'none', 
                     borderRadius: 6, 
                     padding: '6px 10px', 
                     fontWeight: 600, 
                     cursor: 'pointer',
                     fontSize: 11
                   }} onClick={() => setPreviewMode('unclaimed')}>Unclaimed</button>
                   <button style={{ 
                     background: previewMode === 'completed' ? accent : darkPanel, 
                     color: textColor, 
                     border: 'none', 
                     borderRadius: 6, 
                     padding: '6px 10px', 
                     fontWeight: 600, 
                     cursor: 'pointer',
                     fontSize: 11
                   }} onClick={() => setPreviewMode('completed')}>Done</button>
                 </div>
          
          {/* Preview Canvas */}
          <div style={{ 
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 0,
            background: darkPanel,
            borderRadius,
            border: `1px solid ${border}`
          }}>
            <PreviewCanvas
              frameSize={scan?.frameSize || { width: 0, height: 0 }}
              quests={previewQuests}
              mode={previewMode}
              previewWidth={previewWidth}
              previewHeight={300}
              backgroundFillUrl={bgFillUrl}
            />
                               {(!scan?.frameSize || !previewQuests || previewQuests.length === 0) && (
                     <div style={{ 
                       color: textSecondary, 
                       fontSize: 14,
                       textAlign: 'center',
                       padding: 40
                     }}>
                                            <div style={{ fontWeight: 600, marginBottom: 8 }}>No Preview Available</div>
                     <div style={{ fontSize: 13, opacity: 0.8 }}>
                       Scan a questline to see a live preview of your design
                     </div>
                     </div>
                   )}
          </div>
        </div>
      </div>
      {/* Progress Overlay */}
      {isScanning && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(24, 26, 32, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: darkPanel,
            borderRadius: 12,
            padding: 32,
            border: `1px solid ${border}`,
            textAlign: 'center',
            maxWidth: 400,
            width: '90%'
          }}>
            <div style={{
              color: textColor,
              fontSize: 18,
              fontWeight: 600,
              marginBottom: 24
            }}>
              Scanning Questline...
            </div>
            
            {/* Progress Bar */}
            <div style={{
              background: '#2a2d35',
              borderRadius: 8,
              height: 8,
              marginBottom: 16,
              overflow: 'hidden'
            }}>
              <div style={{
                background: `linear-gradient(90deg, ${accent} 0%, #5a8eff 100%)`,
                height: '100%',
                width: `${scanProgress}%`,
                transition: 'width 0.3s ease',
                borderRadius: 8
              }} />
            </div>
            
            <div style={{
              color: textSecondary,
              fontSize: 14
            }}>
              {Math.round(scanProgress)}% Complete
            </div>
            
            <div style={{
              color: textSecondary,
              fontSize: 12,
              marginTop: 8,
              opacity: 0.7
            }}>
              Processing images and validating structure...
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 32,
            transform: 'translateX(-50%)',
            background: toast.type === 'success' ? '#1ecb7a' : toast.type === 'error' ? '#e74c3c' : '#23262F',
            color: '#fff',
            padding: '10px 24px',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 15,
            boxShadow: '0 2px 16px #0008',
            zIndex: 9999,
            opacity: toast ? 1 : 0,
            transition: 'opacity 0.3s',
            cursor: 'pointer',
          }}
          onClick={() => {
            setToast(null);
            if ((window as any).__toastrTimeout) clearTimeout((window as any).__toastrTimeout);
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

export default render(App);
