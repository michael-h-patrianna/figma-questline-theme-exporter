import { ScanResult, QuestlineExport, Issue } from './types';
import { ERROR_MESSAGES } from './errors';
import { QUEST_KEY_SLUG_REGEX, MIN_QUESTS, MAX_QUESTS } from '@shared/constants';

export async function exportQuestline(scan: ScanResult): Promise<{ json: QuestlineExport | null; issues: Issue[] }> {
  console.log('EXPORT DEBUG: exportQuestline called with scan:', scan);
  const issues: Issue[] = [];
  
  // Check for scan errors first
  if (scan.issues.some((i) => i.level === 'error')) {
    console.log('EXPORT DEBUG: Scan has errors, returning early');
    return { json: null, issues: scan.issues };
  }

  // Validate the scan result using custom validation
  try {
    // Validate questlineId
    if (!QUEST_KEY_SLUG_REGEX.test(scan.questlineId)) {
      throw new Error('Invalid questlineId format');
    }

    // Validate quest count
    if (scan.quests.length < MIN_QUESTS) {
      throw new Error(`At least ${MIN_QUESTS} quests required`);
    }
    if (scan.quests.length > MAX_QUESTS) {
      throw new Error(`No more than ${MAX_QUESTS} quests allowed`);
    }

    // Validate quest keys
    const questKeys = scan.quests.map(q => q.questKey.trim().toLowerCase());
    const uniqueKeys = new Set(questKeys);
    if (uniqueKeys.size !== questKeys.length) {
      throw new Error('Quest keys must be unique (case-insensitive, trimmed)');
    }

    // Validate individual quest keys
    for (const quest of scan.quests) {
      if (!QUEST_KEY_SLUG_REGEX.test(quest.questKey)) {
        throw new Error(`Invalid questKey format: ${quest.questKey}`);
      }
      if (/\s{2,}/.test(quest.questKey)) {
        throw new Error(`Quest key cannot have double whitespace: ${quest.questKey}`);
      }
    }
  } catch (validationError) {
    issues.push({ 
      code: 'VALIDATION_FAILED', 
      message: `Validation failed: ${validationError instanceof Error ? validationError.message : 'Unknown validation error'}`, 
      level: 'error' 
    });
    return { json: null, issues };
  }

  // Collect all images for batch export
  const images: Array<{name: string, data: Uint8Array}> = [];

  // Export background image
  try {
    console.log('EXPORT DEBUG: Exporting background image...');
    const bgNode = figma.getNodeById(scan.backgroundNodeId) as SceneNode;
    if (!bgNode) throw new Error('Background node not found');
    const bgPng = await bgNode.exportAsync({ format: 'PNG' });
    console.log('EXPORT DEBUG: Background image exported, size:', bgPng.length);
    images.push({ name: 'questline-bg.png', data: bgPng });
  } catch (e) {
    console.log('EXPORT DEBUG: Background export failed:', e);
    issues.push({ 
      code: 'IMAGE_EXPORT_FAILED', 
      message: `Background image could not be exported: ${e instanceof Error ? e.message : 'Unknown error'}`, 
      level: 'error' 
    });
    return { json: null, issues };
  }

  // Export quest images
  const quests = [];
  for (const quest of scan.quests) {
    try {
      const instanceNode = figma.getNodeById(quest.nodeId) as InstanceNode;
      if (!instanceNode || instanceNode.type !== 'INSTANCE') {
        throw new Error('Quest instance not found');
      }

      // Store original state
      const originalState = instanceNode.componentProperties?.State?.value;

      // Export locked state
      instanceNode.setProperties({ State: 'locked' });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      let lockedImageNode: SceneNode | null = null;
      if ('findAll' in instanceNode) {
        lockedImageNode = instanceNode.findOne(child => 
          child.type === 'FRAME' && child.name === 'Image'
        ) as SceneNode | null;
      }
      
      if (!lockedImageNode || !('exportAsync' in lockedImageNode)) {
        throw new Error('Image frame not found for locked state');
      }
      
      const lockedImg = await lockedImageNode.exportAsync({ format: 'PNG' });
      console.log('EXPORT DEBUG: Quest locked image exported for', quest.questKey, 'size:', lockedImg.length);
      images.push({ name: `quest-${quest.questKey}-locked.png`, data: lockedImg });

      // Export active state (mandatory)
      instanceNode.setProperties({ State: 'active' });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      let activeImageNode: SceneNode | null = null;
      if ('findAll' in instanceNode) {
        activeImageNode = instanceNode.findOne(child => 
          child.type === 'FRAME' && child.name === 'Image'
        ) as SceneNode | null;
      }
      
      if (!activeImageNode || !('exportAsync' in activeImageNode)) {
        throw new Error('Image frame not found for active state');
      }
      
      const activeImg = await activeImageNode.exportAsync({ format: 'PNG' });
      console.log('EXPORT DEBUG: Quest active image exported for', quest.questKey, 'size:', activeImg.length);
      images.push({ name: `quest-${quest.questKey}-active.png`, data: activeImg });

      // Export unclaimed state
      instanceNode.setProperties({ State: 'unclaimed' });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      let unclaimedImageNode: SceneNode | null = null;
      if ('findAll' in instanceNode) {
        unclaimedImageNode = instanceNode.findOne(child => 
          child.type === 'FRAME' && child.name === 'Image'
        ) as SceneNode | null;
      }
      
      if (!unclaimedImageNode || !('exportAsync' in unclaimedImageNode)) {
        throw new Error('Image frame not found for unclaimed state');
      }
      
      const unclaimedImg = await unclaimedImageNode.exportAsync({ format: 'PNG' });
      console.log('EXPORT DEBUG: Quest unclaimed image exported for', quest.questKey, 'size:', unclaimedImg.length);
      images.push({ name: `quest-${quest.questKey}-unclaimed.png`, data: unclaimedImg });

      // Export completed state
      instanceNode.setProperties({ State: 'completed' });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      let completedImageNode: SceneNode | null = null;
      if ('findAll' in instanceNode) {
        completedImageNode = instanceNode.findOne(child => 
          child.type === 'FRAME' && child.name === 'Image'
        ) as SceneNode | null;
      }
      
      if (!completedImageNode || !('exportAsync' in completedImageNode)) {
        throw new Error('Image frame not found for completed state');
      }
      
      const completedImg = await completedImageNode.exportAsync({ format: 'PNG' });
      console.log('EXPORT DEBUG: Quest completed image exported for', quest.questKey, 'size:', completedImg.length);
      images.push({ name: `quest-${quest.questKey}-completed.png`, data: completedImg });

      // Restore original state
      if (originalState) {
        instanceNode.setProperties({ State: originalState });
      }
    } catch (e) {
      issues.push({ 
        code: 'IMAGE_EXPORT_FAILED', 
        message: `Quest image export failed for ${quest.questKey}: ${e instanceof Error ? e.message : 'Unknown error'}`, 
        nodeId: quest.nodeId, 
        level: 'error' 
      });
      return { json: null, issues };
    }

    quests.push({
      questKey: quest.questKey,
      x: quest.x,
      y: quest.y,
      w: quest.w,
      h: quest.h,
      rotation: quest.rotation,
      lockedImg: `quest-${quest.questKey}-locked.png`,
      activeImg: `quest-${quest.questKey}-active.png`,
      unclaimedImg: `quest-${quest.questKey}-unclaimed.png`,
      completedImg: `quest-${quest.questKey}-completed.png`,
    });
  }

  const json: QuestlineExport = {
    questlineId: scan.questlineId,
    frameSize: scan.frameSize,
    background: { exportUrl: 'questline-bg.png' },
    quests,
  };

  // Send all images and JSON together for folder selection
  console.log('EXPORT DEBUG: Sending', images.length, 'images + JSON for folder selection');
  figma.ui.postMessage({ 
    type: 'EXPORT_WITH_FOLDER', 
    questlineId: scan.questlineId,
    images: images,
    json: json
  });

  return { json, issues };
}


