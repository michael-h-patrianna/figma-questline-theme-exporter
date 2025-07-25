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

/**
 * Find quest elements in the specific component structure:
 * Quest Component
 * ├── Properties (group)
 * │   └── questKey (Text node)
 * └── Visuals (frame)
 *     └── Image (frame with image fill) + optional additional elements
 */
function findQuestElements(parent: SceneNode, questKey: string): {
  type: 'simple' | 'complex';
  node: SceneNode;
  bounds: { x: number; y: number; width: number; height: number };
} | null {
  if (!hasFindAll(parent)) return null;
  
  // Find the Visuals frame
  const visualsFrame = parent.findOne(n => n.name === 'Visuals');
  if (!visualsFrame || !('children' in visualsFrame)) {
    console.log('SCAN DEBUG: No Visuals frame found in quest', questKey);
    return null;
  }
  
  const children = visualsFrame.children;
  console.log('SCAN DEBUG: Visuals frame children for quest', questKey, ':', children.map(c => c.name));
  console.log('SCAN DEBUG: Children count:', children.length);
  
  // Check if it's simple (just Image) or complex (multiple elements)
  const imageChild = children.find(c => c.name === 'Image');
  const hasMultipleElements = children.length > 1;
  const hasImageAndOthers = imageChild && hasMultipleElements;
  
  console.log('SCAN DEBUG: Analysis for quest', questKey, ':');
  console.log('  - Has Image child:', !!imageChild);
  console.log('  - Has multiple elements:', hasMultipleElements);
  console.log('  - Has Image + others:', hasImageAndOthers);
  console.log('  - All children names:', children.map(c => c.name));
  
  if (imageChild && !hasMultipleElements) {
    // Simple quest: just the Image frame
    console.log('SCAN DEBUG: Simple quest structure for', questKey, '- found Image frame');
    return {
      type: 'simple',
      node: imageChild,
      bounds: {
        x: imageChild.x + visualsFrame.x + parent.x,
        y: imageChild.y + visualsFrame.y + parent.y,
        width: imageChild.width,
        height: imageChild.height
      }
    };
  } else if (hasMultipleElements) {
    // Complex quest: multiple elements in Visuals frame (including Image + siblings)
    console.log('SCAN DEBUG: Complex quest structure for', questKey, '- found', children.length, 'elements in Visuals');
    console.log('SCAN DEBUG: Elements:', children.map(c => c.name));
    console.log('SCAN DEBUG: Will export entire Visuals frame for', questKey);
    
    return {
      type: 'complex',
      node: visualsFrame,
      bounds: {
        x: visualsFrame.x + parent.x,
        y: visualsFrame.y + parent.y,
        width: visualsFrame.width,
        height: visualsFrame.height
      }
    };
  }
  
  console.log('SCAN DEBUG: No valid quest structure found for', questKey);
  return null;
}

/**
 * Find questKey from the Properties group
 */
function findQuestKey(parent: SceneNode): string | null {
  if (!hasFindAll(parent)) return null;
  
  // Find the Properties group
  const propertiesGroup = parent.findOne(n => n.name === 'Properties');
  if (!propertiesGroup || !('children' in propertiesGroup)) {
    console.log('SCAN DEBUG: No Properties group found');
    return null;
  }
  
  // Find questKey text node
  const questKeyNode = propertiesGroup.children.find(n => 
    n.type === 'TEXT' && n.name.toLowerCase().includes('questkey')
  ) as TextNode | undefined;
  
  if (questKeyNode && questKeyNode.characters) {
    console.log('SCAN DEBUG: Found questKey:', questKeyNode.characters);
    return questKeyNode.characters;
  }
  
  console.log('SCAN DEBUG: No questKey text found in Properties group');
  return null;
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
    // Extract questKey - try new structure first, then fallback to old methods
    let questKeyRaw = '';
    
    // Try new component structure first
    const newQuestKey = findQuestKey(node);
    if (newQuestKey) {
      questKeyRaw = newQuestKey;
      console.log('SCAN DEBUG: Found questKey using new structure:', questKeyRaw);
    } else {
      // Fallback to old methods
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
      console.log('SCAN DEBUG: questKeyRaw (fallback):', questKeyRaw);
    }
    
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
    
    // Find image node and quest bounds - try new structure first, then fallback
    let imageNode: (SceneNode & GeometryMixin) | null = null;
    let questBounds: { x: number; y: number; width: number; height: number } | null = null;
    
    // Try new component structure first
    const questElements = findQuestElements(node, questKey);
    if (questElements) {
      imageNode = questElements.node as SceneNode & GeometryMixin;
      questBounds = questElements.bounds;
      console.log('SCAN DEBUG: Found quest elements using new structure:', questElements.type, 'node:', imageNode.name);
    } else {
      // Fallback to old methods
      if (node.type === 'GROUP' && Array.isArray((node as any).children)) {
        imageNode = (node as any).children.find((c: any) => isGeometryWithFills(c) && c.name === 'Image' && !!firstImagePaint(c)) || null;
        console.log('SCAN DEBUG: GROUP node children:', (node as any).children?.map((c: any) => ({ name: c.name, type: c.type, hasFills: isGeometryWithFills(c), hasImagePaint: !!firstImagePaint(c) })));
      } else if (node.type === 'INSTANCE' && hasFindAll(node)) {
        imageNode = findImageNode(node);
        console.log('SCAN DEBUG: INSTANCE node, findImageNode result:', imageNode ? imageNode.name : 'null');
      }
      
      if (imageNode) {
        questBounds = {
          x: imageNode.x + node.x,
          y: imageNode.y + node.y,
          width: imageNode.width,
          height: imageNode.height
        };
      }
    }
    
    console.log('SCAN DEBUG: imageNode', imageNode ? imageNode.name : null, imageNode ? imageNode.type : null);
    if (!imageNode || !questBounds) {
      console.log('SCAN DEBUG: No imageNode found for quest', questKey, 'node:', node.name, 'type:', node.type);
      continue;
    }
    // Export quest image in all four states (locked, active, unclaimed, completed)
    let lockedImgUrl: string | undefined = undefined;
    let activeImgUrl: string | undefined = undefined;
    let unclaimedImgUrl: string | undefined = undefined;
    let completedImgUrl: string | undefined = undefined;
    
    console.log('SCAN DEBUG: about to export quest images for', questKeyRaw);
    
    try {
      if ('exportAsync' in imageNode) {
        console.log('SCAN DEBUG: imageNode has exportAsync, attempting export');
        
        // Handle different export strategies based on quest type
        if (questElements?.type === 'complex') {
          // For complex quests, export the entire Visuals frame for each state
          console.log('SCAN DEBUG: Exporting complex quest for', questKeyRaw, '- using Visuals frame');
          
          if (node.type === 'INSTANCE' && 'componentProperties' in node) {
            const instance = node as InstanceNode;
            const originalState = instance.componentProperties.State?.value;
            
            try {
              // First, export locked state
              instance.setProperties({ State: 'locked' });
              await new Promise(resolve => setTimeout(resolve, 100)); // Wait for Figma to update
              
              // Re-find the Visuals frame in locked state
              let lockedVisualsFrame: SceneNode | null = null;
              if (hasFindAll(instance)) {
                lockedVisualsFrame = instance.findOne(n => n.name === 'Visuals');
              }
              
              if (lockedVisualsFrame) {
                lockedImgUrl = await safeExportNodeAsPng(lockedVisualsFrame);
                console.log('SCAN DEBUG: locked state export result for', questKeyRaw, ':', lockedImgUrl ? 'SUCCESS' : 'FAILED');
              }
              
              // Then, export active state (mandatory)
              instance.setProperties({ State: 'active' });
              await new Promise(resolve => setTimeout(resolve, 100)); // Wait for Figma to update
              
              // Re-find the Visuals frame in active state
              let activeVisualsFrame: SceneNode | null = null;
              if (hasFindAll(instance)) {
                activeVisualsFrame = instance.findOne(n => n.name === 'Visuals');
              }
              
              if (activeVisualsFrame) {
                activeImgUrl = await safeExportNodeAsPng(activeVisualsFrame);
                console.log('SCAN DEBUG: active state export result for', questKeyRaw, ':', activeImgUrl ? 'SUCCESS' : 'FAILED');
              }
              
              // Then, export unclaimed state
              instance.setProperties({ State: 'unclaimed' });
              await new Promise(resolve => setTimeout(resolve, 100)); // Wait for Figma to update
              
              // Re-find the Visuals frame in unclaimed state
              let unclaimedVisualsFrame: SceneNode | null = null;
              if (hasFindAll(instance)) {
                unclaimedVisualsFrame = instance.findOne(n => n.name === 'Visuals');
              }
              
              if (unclaimedVisualsFrame) {
                unclaimedImgUrl = await safeExportNodeAsPng(unclaimedVisualsFrame);
                console.log('SCAN DEBUG: unclaimed state export result for', questKeyRaw, ':', unclaimedImgUrl ? 'SUCCESS' : 'FAILED');
              }
              
              // Finally, export completed state
              instance.setProperties({ State: 'completed' });
              await new Promise(resolve => setTimeout(resolve, 100)); // Wait for Figma to update
              
              // Re-find the Visuals frame in completed state
              let completedVisualsFrame: SceneNode | null = null;
              if (hasFindAll(instance)) {
                completedVisualsFrame = instance.findOne(n => n.name === 'Visuals');
              }
              
              if (completedVisualsFrame) {
                completedImgUrl = await safeExportNodeAsPng(completedVisualsFrame);
                console.log('SCAN DEBUG: completed state export result for', questKeyRaw, ':', completedImgUrl ? 'SUCCESS' : 'FAILED');
              } else {
                console.log('SCAN DEBUG: could not find Visuals frame in completed state for', questKeyRaw);
                completedImgUrl = activeImgUrl; // Fallback to active image
              }
              
              // Restore original state
              if (originalState) {
                instance.setProperties({ State: originalState });
              }
            } catch (e) {
              console.log('SCAN DEBUG: failed to export states for', questKeyRaw, e);
              // Fallback: use current state for all three
              lockedImgUrl = await safeExportNodeAsPng(imageNode);
              activeImgUrl = lockedImgUrl;
              unclaimedImgUrl = lockedImgUrl;
              completedImgUrl = lockedImgUrl;
            }
          } else {
            // For non-instance complex quests, export current state for all four
            lockedImgUrl = await safeExportNodeAsPng(imageNode);
            activeImgUrl = lockedImgUrl;
            unclaimedImgUrl = lockedImgUrl;
            completedImgUrl = lockedImgUrl;
          }
        } else {
          // For simple quests, export just the Image frame for each state
          console.log('SCAN DEBUG: Exporting simple quest for', questKeyRaw, '- using Image frame');
          
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
              
              // Then, export active state (mandatory)
              instance.setProperties({ State: 'active' });
              await new Promise(resolve => setTimeout(resolve, 100)); // Wait for Figma to update
              
              // Re-find the image node in active state
              let activeImageNode: (SceneNode & GeometryMixin) | null = null;
              if (hasFindAll(instance)) {
                activeImageNode = findImageNode(instance);
              }
              
              if (activeImageNode) {
                activeImgUrl = await safeExportNodeAsPng(activeImageNode);
                console.log('SCAN DEBUG: active state export result for', questKeyRaw, ':', activeImgUrl ? 'SUCCESS' : 'FAILED');
              }
              
              // Then, export unclaimed state
              instance.setProperties({ State: 'unclaimed' });
              await new Promise(resolve => setTimeout(resolve, 100)); // Wait for Figma to update
              
              // Re-find the image node in unclaimed state
              let unclaimedImageNode: (SceneNode & GeometryMixin) | null = null;
              if (hasFindAll(instance)) {
                unclaimedImageNode = findImageNode(instance);
              }
              
              if (unclaimedImageNode) {
                unclaimedImgUrl = await safeExportNodeAsPng(unclaimedImageNode);
                console.log('SCAN DEBUG: unclaimed state export result for', questKeyRaw, ':', unclaimedImgUrl ? 'SUCCESS' : 'FAILED');
              }
              
              // Finally, export completed state
              instance.setProperties({ State: 'completed' });
              await new Promise(resolve => setTimeout(resolve, 100)); // Wait for Figma to update
              
              // Re-find the image node in completed state
              let completedImageNode: (SceneNode & GeometryMixin) | null = null;
              if (hasFindAll(instance)) {
                completedImageNode = findImageNode(instance);
              }
              
              if (completedImageNode) {
                completedImgUrl = await safeExportNodeAsPng(completedImageNode);
                console.log('SCAN DEBUG: completed state export result for', questKeyRaw, ':', completedImgUrl ? 'SUCCESS' : 'FAILED');
              } else {
                console.log('SCAN DEBUG: could not find image node in completed state for', questKeyRaw);
                completedImgUrl = activeImgUrl; // Fallback to active image
              }
              
              // Restore original state
              if (originalState) {
                instance.setProperties({ State: originalState });
              }
            } catch (e) {
              console.log('SCAN DEBUG: failed to export states for', questKeyRaw, e);
              // Fallback: use current state for all four
              lockedImgUrl = await safeExportNodeAsPng(imageNode);
              activeImgUrl = lockedImgUrl;
              unclaimedImgUrl = lockedImgUrl;
              completedImgUrl = lockedImgUrl;
            }
          } else {
            // For non-instance nodes, export current state for all four
            lockedImgUrl = await safeExportNodeAsPng(imageNode);
            activeImgUrl = lockedImgUrl;
            unclaimedImgUrl = lockedImgUrl;
            completedImgUrl = lockedImgUrl;
          }
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
          console.log('SCAN DEBUG: quest', questKeyRaw, 'exportAsync succeeded, lockedImgUrl length:', lockedImgUrl.length, 'activeImgUrl length:', activeImgUrl?.length);
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
        x: questBounds.x,
        y: questBounds.y,
        w: questBounds.width,
        h: questBounds.height,
        rotation: (imageNode as any).rotation || 0,
        lockedNodeId: imageNode.id,
        activeNodeId: imageNode.id,
        unclaimedNodeId: imageNode.id,
        completedNodeId: imageNode.id,
        lockedImgUrl: lockedImgUrl, // State=locked image
        activeImgUrl: activeImgUrl, // State=active image (mandatory)
        unclaimedImgUrl: unclaimedImgUrl, // State=unclaimed image
        completedImgUrl: completedImgUrl, // State=completed image
        isFlattened: questElements?.type === 'complex',
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
