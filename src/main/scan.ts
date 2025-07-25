import { QUESTLINE_PREFIX, MIN_QUESTS, MAX_QUESTS, QUEST_KEY_SLUG_REGEX } from '@shared/constants';
import { slugify, hasDoubleWhitespace, isInsideBounds } from '@shared/utils';
import { Issue, ScanResult } from './types';
import { ERROR_MESSAGES } from './errors';

/**************************************
 * Type helpers & guards
 **************************************/

type ComponentPropValue = string | number | boolean;

function hasComponentProperties(node: SceneNode): node is FrameNode & { componentProperties: Record<string, { value: ComponentPropValue }> } {
  return 'componentProperties' in node && typeof (node as any).componentProperties === 'object';
}

function isQuestGroup(node: SceneNode): node is GroupNode & { componentProperties: Record<string, { value: ComponentPropValue }> } {
  return node.type === 'GROUP' && 'componentProperties' in node && typeof (node as any).componentProperties === 'object';
}

function isGeometryWithFills(node: SceneNode): node is SceneNode & GeometryMixin {
  return 'fills' in node;
}

function bytesToBase64(bytes: Uint8Array): string {
  try {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  } catch (e) {
    console.log('EXPORT DEBUG: btoa failed, trying alternative base64 encoding');
    // Fallback base64 encoding
    const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    while (i < bytes.length) {
      const byte1 = bytes[i++];
      const byte2 = i < bytes.length ? bytes[i++] : 0;
      const byte3 = i < bytes.length ? bytes[i++] : 0;
      
      const enc1 = byte1 >> 2;
      const enc2 = ((byte1 & 3) << 4) | (byte2 >> 4);
      const enc3 = ((byte2 & 15) << 2) | (byte3 >> 6);
      const enc4 = byte3 & 63;
      
      result += base64Chars[enc1] + base64Chars[enc2] + 
                (i > bytes.length + 1 ? '=' : base64Chars[enc3]) + 
                (i > bytes.length ? '=' : base64Chars[enc4]);
    }
    return result;
  }
}

function firstImagePaint(node: GeometryMixin): ImagePaint | null {
  if (!Array.isArray(node.fills)) return null;
  return (node.fills as ReadonlyArray<Paint>).find(
    (p): p is ImagePaint => p.type === 'IMAGE' && !!(p as ImagePaint).imageHash
  ) || null;
}

const GET_BYTES_TIMEOUT = 3000;

async function safeGetBytes(img: Image, timeoutMs = GET_BYTES_TIMEOUT): Promise<Uint8Array | null> {
  let settled = false;
  return new Promise<Uint8Array | null>((resolve) => {
    img.getBytesAsync().then(bytes => {
      if (settled) return;
      settled = true;
      resolve(bytes);
    }).catch(err => {
      if (settled) return;
      console.log('getBytesAsync error', err);
      settled = true;
      resolve(null);
    });
    setTimeout(() => {
      if (settled) return;
      console.log('getBytesAsync timed out');
      settled = true;
      resolve(null);
    }, timeoutMs);
  });
}

async function imageFillToDataURL(node: GeometryMixin, issues?: Issue[], nodeId?: string): Promise<string | null> {
  const paint = firstImagePaint(node);
  if (!paint) return null;
  const img = figma.getImageByHash(paint.imageHash!);
  if (!img) return null;
  const bytes = await safeGetBytes(img, GET_BYTES_TIMEOUT);
  if (!bytes) {
    if (issues && nodeId) {
      issues.push({
        code: 'IMAGE_EXPORT_FAILED',
        message: 'Image fill could not be loaded (possibly missing or broken). Please re-upload the image in Figma.',
        nodeId,
        level: 'error',
      });
    }
    return null;
  }
  return `data:image/png;base64,${bytesToBase64(bytes)}`;
}

// Rendered PNG of a node (fallback)
async function exportRenderedPNG(node: SceneNode): Promise<Uint8Array | null> {
  if (!('exportAsync' in node)) return null;
  try {
    return await (node as ExportMixin).exportAsync({ format: 'PNG', useAbsoluteBounds: true });
  } catch (e) {
    console.log('EXPORT DEBUG: exportRenderedPNG failed', e);
    return null;
  }
}

function toStringProp(v: ComponentPropValue): string {
  if (typeof v === 'string') return v;
  return String(v);
}

// Type guard for nodes that support .findAll
function hasFindAll(node: SceneNode): node is FrameNode | GroupNode | ComponentNode | InstanceNode {
  return 'findAll' in node && typeof (node as any).findAll === 'function';
}

function findImageNode(parent: SceneNode): (SceneNode & GeometryMixin) | null {
  let candidates: (SceneNode & GeometryMixin)[] = [];
  if (hasFindAll(parent)) {
    candidates = parent.findAll((n: SceneNode) => {
      if (!isGeometryWithFills(n)) return false;
      if (n.name !== 'Image') return false;
      // Limit to common geometry types to avoid SliceNode etc.
      return (
        n.type === 'FRAME' ||
        n.type === 'RECTANGLE' ||
        n.type === 'ELLIPSE' ||
        n.type === 'POLYGON' ||
        n.type === 'STAR' ||
        n.type === 'VECTOR' ||
        n.type === 'BOOLEAN_OPERATION' ||
        n.type === 'LINE'
      ) && !!firstImagePaint(n);
    }) as (SceneNode & GeometryMixin)[];
  }
  return candidates[0] || null;
}

/**************************************
 * Main scan function
 **************************************/

export async function scanQuestline(): Promise<ScanResult> {
  console.log('SCAN DEBUG: scanQuestline started');
  const selection = figma.currentPage.selection;
  console.log('SCAN DEBUG: got selection', selection.length, selection.map(n => n.name));
  const issues: Issue[] = [];

  // --- Locate questline root ---
  let root: FrameNode | undefined;
  
  if (selection.length === 0) {
    issues.push({ code: 'UNKNOWN', message: 'Please select a questline frame to scan.', level: 'error' });
    console.log('SCAN DEBUG: no selection');
    return emptyResult(issues);
  }
  
  const selectedQuestlines = selection.filter(
    node => node.type === 'FRAME' && node.name.trim().toLowerCase().startsWith(QUESTLINE_PREFIX.toLowerCase())
  ) as FrameNode[];
  console.log('SCAN DEBUG: selectedQuestlines', selectedQuestlines.length, selectedQuestlines.map(n => n.name));

  if (selectedQuestlines.length === 1) {
    root = selectedQuestlines[0];
    console.log('SCAN DEBUG: using selected questline', root.name);
  } else if (selectedQuestlines.length > 1) {
    issues.push({ code: 'UNKNOWN', message: 'Multiple questline frames selected. Please select only one questline frame.', level: 'error' });
    console.log('SCAN DEBUG: multiple questline frames selected, aborting');
    return emptyResult(issues);
  } else {
    issues.push({ code: 'UNKNOWN', message: 'Selected node is not a questline frame. Please select a frame named "Questline: <name>".', level: 'error' });
    console.log('SCAN DEBUG: no questline frame selected');
    return emptyResult(issues);
  }
  console.log('SCAN DEBUG: questline root found', root.name);

  const questlineId = slugify(root.name.replace(QUESTLINE_PREFIX, ''));
  const frameSize = { width: root.width, height: root.height };
  const bg = root.findOne(node => node.name.toLowerCase() === 'bg');
  let backgroundFillUrl: string | undefined;
  if (bg && 'exportAsync' in bg) {
    backgroundFillUrl = await safeExportNodeAsPng(bg);
    if (!backgroundFillUrl) {
      issues.push({
        code: 'IMAGE_EXPORT_FAILED',
        message: 'Background image could not be exported. Please re-upload the image in Figma.',
        nodeId: bg.id,
        level: 'error',
      });
      console.log('SCAN DEBUG: BG exportAsync failed');
    }
  }
  console.log('SCAN DEBUG: bg layer found?', !!bg);

  console.log('SCAN DEBUG: root.children length', root.children.length);

  const quests: ScanResult['quests'] = [];
  const questKeys = new Set<string>(); // Track quest keys for duplicate detection
  
  console.log('SCAN DEBUG: Starting quest processing, root.children.length:', root.children.length);
  
  for (const node of root.children) {
    console.log('SCAN DEBUG: child', node.name, node.type);
    const isCandidate =
      (node.type === 'INSTANCE' && 'componentProperties' in node) ||
      (isQuestGroup(node) && 'componentProperties' in node) ||
      (node.type === 'GROUP' && Array.isArray((node as any).children) && (node as any).children.some((child: any) => child.type === 'FRAME' && child.name === 'Image'));
    console.log('SCAN DEBUG: isCandidate', isCandidate);
    if (!isCandidate) continue;
    // Extract questKey
    let questKeyRaw = '';
    if (node.type === 'INSTANCE' && 'componentProperties' in node) {
      for (const key of Object.keys((node as any).componentProperties)) {
        if (key.startsWith('questKey')) {
          questKeyRaw = String((node as any).componentProperties[key].value);
          break;
        }
      }
    } else if (node.type === 'GROUP' && 'componentProperties' in node) {
      for (const key of Object.keys((node as any).componentProperties)) {
        if (key.startsWith('questKey')) {
          questKeyRaw = String((node as any).componentProperties[key].value);
          break;
        }
      }
    } else if (node.type === 'GROUP' && Array.isArray((node as any).children)) {
      const textNode = (node as any).children.find((child: any) => child.type === 'TEXT');
      if (textNode && typeof textNode.characters === 'string') {
        questKeyRaw = textNode.characters;
      }
    }
    console.log('SCAN DEBUG: questKeyRaw', questKeyRaw);
    
    // Validate quest key
    if (!questKeyRaw || questKeyRaw.trim() === '') {
      issues.push({
        code: 'MISSING_QUEST_KEY',
        message: `Quest key is missing for node "${node.name}". Please add a questKey property.`,
        nodeId: node.id,
        level: 'error',
      });
      continue;
    }
    
    const questKey = questKeyRaw.trim();
    if (!QUEST_KEY_SLUG_REGEX.test(questKey)) {
      issues.push({
        code: 'INVALID_QUEST_KEY',
        message: `Invalid quest key "${questKey}". Must be lowercase, alphanumeric, with hyphens only.`,
        nodeId: node.id,
        level: 'error',
      });
      continue;
    }
    
    if (hasDoubleWhitespace(questKey)) {
      issues.push({
        code: 'QUEST_KEY_DOUBLE_WHITESPACE',
        message: `Quest key "${questKey}" contains double whitespace.`,
        nodeId: node.id,
        level: 'error',
      });
      continue;
    }
    
    // Check for duplicate quest keys
    if (questKeys.has(questKey)) {
      issues.push({
        code: 'DUPLICATE_QUEST_KEY',
        message: `Duplicate quest key "${questKey}". Each quest must have a unique name.`,
        nodeId: node.id,
        level: 'error',
      });
      continue;
    }
    
    // Add to tracked keys
    questKeys.add(questKey);
    
    // Find image node
    let imageNode: (SceneNode & GeometryMixin) | null = null;
    if (node.type === 'GROUP' && Array.isArray((node as any).children)) {
      imageNode = (node as any).children.find((c: any) => isGeometryWithFills(c) && c.name === 'Image' && !!firstImagePaint(c)) || null;
      console.log('SCAN DEBUG: GROUP node children:', (node as any).children?.map((c: any) => ({ name: c.name, type: c.type, hasFills: isGeometryWithFills(c), hasImagePaint: !!firstImagePaint(c) })));
    } else if (node.type === 'INSTANCE' && hasFindAll(node)) {
      imageNode = findImageNode(node);
      console.log('SCAN DEBUG: INSTANCE node, findImageNode result:', imageNode ? imageNode.name : 'null');
    }
    console.log('SCAN DEBUG: imageNode', imageNode ? imageNode.name : null, imageNode ? imageNode.type : null);
    if (!imageNode) {
      console.log('SCAN DEBUG: No imageNode found for quest', questKey, 'node:', node.name, 'type:', node.type);
      continue;
    }
    // Export quest image in all three states (locked, closed, and open)
    let lockedImgUrl: string | undefined = undefined;
    let closedImgUrl: string | undefined = undefined;
    let doneImgUrl: string | undefined = undefined;
    
    console.log('SCAN DEBUG: about to export quest images for', questKeyRaw);
    
    try {
      if ('exportAsync' in imageNode) {
        console.log('SCAN DEBUG: imageNode has exportAsync, attempting export');
        
        // Always export all three states: locked, closed, and open
        if (node.type === 'INSTANCE' && 'componentProperties' in node) {
          const instance = node as InstanceNode;
          const originalState = instance.componentProperties.State?.value;
          
          try {
            // First, export locked state
            instance.setProperties({ State: 'locked' });
            await new Promise(resolve => setTimeout(resolve, 100)); // Wait for Figma to update
            
            // Re-find the image node in locked state
            let lockedImageNode: (SceneNode & GeometryMixin) | null = null;
            if (hasFindAll(instance)) {
              lockedImageNode = findImageNode(instance);
            }
            
            if (lockedImageNode) {
              lockedImgUrl = await safeExportNodeAsPng(lockedImageNode);
              console.log('SCAN DEBUG: locked state export result for', questKeyRaw, ':', lockedImgUrl ? 'SUCCESS' : 'FAILED');
            }
            
            // Then, export closed state
            instance.setProperties({ State: 'closed' });
            await new Promise(resolve => setTimeout(resolve, 100)); // Wait for Figma to update
            
            // Re-find the image node in closed state
            let closedImageNode: (SceneNode & GeometryMixin) | null = null;
            if (hasFindAll(instance)) {
              closedImageNode = findImageNode(instance);
            }
            
            if (closedImageNode) {
              closedImgUrl = await safeExportNodeAsPng(closedImageNode);
              console.log('SCAN DEBUG: closed state export result for', questKeyRaw, ':', closedImgUrl ? 'SUCCESS' : 'FAILED');
            }
            
            // Finally, export open state
            instance.setProperties({ State: 'open' });
            await new Promise(resolve => setTimeout(resolve, 100)); // Wait for Figma to update
            
            // Re-find the image node in open state
            let openImageNode: (SceneNode & GeometryMixin) | null = null;
            if (hasFindAll(instance)) {
              openImageNode = findImageNode(instance);
            }
            
            if (openImageNode) {
              doneImgUrl = await safeExportNodeAsPng(openImageNode);
              console.log('SCAN DEBUG: open state export result for', questKeyRaw, ':', doneImgUrl ? 'SUCCESS' : 'FAILED');
            } else {
              console.log('SCAN DEBUG: could not find image node in open state for', questKeyRaw);
              doneImgUrl = lockedImgUrl; // Fallback to locked image
            }
            
            // Restore original state
            if (originalState) {
              instance.setProperties({ State: originalState });
            }
          } catch (e) {
            console.log('SCAN DEBUG: failed to export states for', questKeyRaw, e);
            // Fallback: use current state for all three
            lockedImgUrl = await safeExportNodeAsPng(imageNode);
            closedImgUrl = lockedImgUrl;
            doneImgUrl = lockedImgUrl;
          }
        } else {
          // For non-instance nodes, export current state for all three
          lockedImgUrl = await safeExportNodeAsPng(imageNode);
          closedImgUrl = lockedImgUrl;
          doneImgUrl = lockedImgUrl;
        }
        
        if (!lockedImgUrl) {
          issues.push({
            code: 'IMAGE_EXPORT_FAILED',
            message: 'Quest image could not be exported. Please re-upload the image in Figma.',
            nodeId: node.id,
            level: 'error',
          });
          console.log('SCAN DEBUG: quest', questKeyRaw, 'exportAsync failed, skipping export');
        } else {
          console.log('SCAN DEBUG: quest', questKeyRaw, 'exportAsync succeeded, lockedImgUrl length:', lockedImgUrl.length, 'doneImgUrl length:', doneImgUrl?.length);
        }
      } else {
        issues.push({
          code: 'IMAGE_EXPORT_FAILED',
          message: 'Quest image node does not support export. Please use a Frame or Rectangle.',
          nodeId: node.id,
          level: 'error',
        });
        console.log('SCAN DEBUG: quest', questKeyRaw, 'image node does not support exportAsync');
      }
      console.log('SCAN DEBUG: finished quest image export', questKeyRaw);
    } catch (e) {
      console.log('EXPORT DEBUG: quest', questKeyRaw, 'image export error', e);
    }
          quests.push({
        nodeId: node.id,
        questKey: questKey, // Use validated questKey
        x: imageNode.x + node.x,
        y: imageNode.y + node.y,
        w: imageNode.width,
        h: imageNode.height,
        rotation: (imageNode as any).rotation || 0,
        lockedNodeId: imageNode.id,
        closedNodeId: imageNode.id,
        doneNodeId: imageNode.id,
        lockedImgUrl: lockedImgUrl, // State=locked image
        closedImgUrl: closedImgUrl, // State=closed image
        doneImgUrl: doneImgUrl,     // State=open image
      });
    console.log('SCAN DEBUG: quest added, total now', quests.length);
    console.log('SCAN DEBUG: Added quest:', { questKey, nodeId: node.id, x: imageNode.x + node.x, y: imageNode.y + node.y });
  }

  console.log('SCAN DEBUG: Final quest count:', quests.length);
  console.log('SCAN DEBUG: All quests:', quests.map(q => ({ questKey: q.questKey, nodeId: q.nodeId })));

  if (quests.length < MIN_QUESTS) {
    issues.push({ code: 'TOO_FEW_QUESTS', message: ERROR_MESSAGES.TOO_FEW_QUESTS, nodeId: root.id, level: 'error' });
  }
  if (quests.length > MAX_QUESTS) {
    issues.push({ code: 'TOO_MANY_QUESTS', message: ERROR_MESSAGES.TOO_MANY_QUESTS, nodeId: root.id, level: 'error' });
  }

  // Return a minimal ScanResult for now
  const result: ScanResult = {
    questlineId,
    frameSize,
    backgroundNodeId: bg ? bg.id : '',
    backgroundFillUrl,
    quests,
    issues,
  };
  console.log('SCAN DEBUG: returning scan result', result);
  return result;
}

/**************************************
 * Helpers
 **************************************/

function emptyResult(issues: Issue[]): ScanResult {
  return {
    questlineId: '',
    frameSize: { width: 0, height: 0 },
    backgroundNodeId: '',
    quests: [],
    issues,
  };
}

async function safeExportNodeAsPng(node: SceneNode): Promise<string | undefined> {
  console.log('EXPORT DEBUG: safeExportNodeAsPng called for', node.name, 'type:', node.type);
  if (!('exportAsync' in node)) {
    console.log('EXPORT DEBUG: node does not have exportAsync');
    return undefined;
  }
  try {
    console.log('EXPORT DEBUG: calling exportAsync on', node.name);
    const bytes = await node.exportAsync({ format: 'PNG' });
    console.log('EXPORT DEBUG: exportAsync succeeded for', node.name, 'bytes:', bytes.length);
    const result = `data:image/png;base64,${bytesToBase64(bytes)}`;
    console.log('EXPORT DEBUG: base64 conversion successful, result length:', result.length);
    return result;
  } catch (e) {
    console.log('EXPORT DEBUG: exportAsync failed for', node.name, e);
    return undefined;
  }
}
