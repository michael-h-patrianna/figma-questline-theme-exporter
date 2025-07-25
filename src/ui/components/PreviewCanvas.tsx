import { h } from 'preact';

const darkPanel = '#23262F';
const border = '#3772FF';
const textColor = '#F4F4F4';
const labelBg = '#23262Fcc';

export function PreviewCanvas({ frameSize, quests, mode = 'wireframe', previewWidth = 400, previewHeight = 400, backgroundFillUrl }: {
  frameSize: { width: number; height: number };
  quests: any[];
  mode?: 'wireframe' | 'locked' | 'active' | 'unclaimed' | 'completed';
  previewWidth?: number;
  previewHeight?: number;
  backgroundFillUrl?: string;
}) {
  if (!frameSize || !quests || quests.length === 0) {
    console.log('PreviewCanvas: returning null because', { frameSize, questsLength: quests?.length });
    return null;
  }
  // Calculate scale to maintain exact aspect ratio
  const scale = Math.min(previewWidth / frameSize.width, previewHeight / frameSize.height);
  
  // Calculate actual preview dimensions to maintain aspect ratio
  const actualPreviewWidth = frameSize.width * scale;
  const actualPreviewHeight = frameSize.height * scale;



  return (
    <div
      style={{
        position: 'relative',
        width: actualPreviewWidth,
        height: actualPreviewHeight,
        background: mode === 'wireframe' ? darkPanel : backgroundFillUrl ? `url(${backgroundFillUrl}) center/cover` : darkPanel,
        border: `2px solid ${border}`,
        borderRadius: 8,
        margin: '0 auto',
        overflow: 'hidden',
      }}
    >
      {quests.map((q: any) => {
        const left = q.x * scale;
        const top = q.y * scale;
        const width = q.w * scale;
        const height = q.h * scale;
        if (mode === 'wireframe') {
          return (
            <div
              key={q.nodeId}
              style={{
                position: 'absolute',
                left,
                top,
                width,
                height,
                background: '#3772FF33',
                border: `1.5px solid ${border}`,
                borderRadius: 6,
                transform: `rotate(${q.rotation}deg)`
              }}
              title={q.questKey}
            >
              <div
                style={{
                  position: 'absolute',
                  bottom: 2,
                  left: 2,
                  right: 2,
                  background: labelBg,
                  color: textColor,
                  fontSize: 11,
                  borderRadius: 4,
                  padding: '1px 4px',
                  textAlign: 'center',
                  pointerEvents: 'none',
                }}
              >
                {q.questKey}
              </div>
            </div>
          );
        } else {
          // For locked/active/unclaimed/completed, use the exported data URLs for preview
          let imgSrc: string | undefined;
          if (mode === 'locked') {
            imgSrc = q.lockedImgUrl;
          } else if (mode === 'active') {
            imgSrc = q.activeImgUrl;
          } else if (mode === 'unclaimed') {
            imgSrc = q.unclaimedImgUrl;
          } else if (mode === 'completed') {
            imgSrc = q.completedImgUrl;
          }
          return (
            <div
              key={q.nodeId}
              style={{
                position: 'absolute',
                left,
                top,
                width,
                height,
                border: 'none',
                borderRadius: 6,
                overflow: 'hidden',
                transform: `rotate(${q.rotation}deg)`
              }}
            >
              <img src={imgSrc} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }} />
            </div>
          );
        }
      })}
    </div>
  );
}
