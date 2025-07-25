// Error and warning messages for questline theming plugin

import { IssueCode } from './types';

export const ERROR_MESSAGES: Record<IssueCode, string> = {
  MISSING_BG: '❌ Missing Background Layer\n\nYour questline frame needs a layer named "BG" that contains the background image.\n\nHow to fix:\n1. Add a frame named "BG" inside your questline\n2. Place your background image in this frame',
  TOO_FEW_QUESTS: '❌ Not Enough Quests\n\nYou need at least 3 quests in your questline.\n\nHow to fix:\n1. Add more quest instances to your questline\n2. Make sure each quest has a unique name',
  TOO_MANY_QUESTS: '❌ Too Many Quests\n\nYou can have a maximum of 20 quests in your questline.\n\nHow to fix:\n1. Remove some quest instances\n2. Keep only the quests you need',
  DUPLICATE_QUEST_KEY: '❌ Duplicate Quest Names\n\nTwo or more quests have the same name.\n\nHow to fix:\n1. Give each quest a unique name\n2. Check the "questKey" property in each quest instance',
  INVALID_QUEST_KEY: '❌ Invalid Quest Name\n\nQuest names can only contain lowercase letters, numbers, and hyphens.\n\nHow to fix:\n1. Use only lowercase letters (a-z)\n2. Use numbers (0-9)\n3. Use hyphens (-) instead of spaces\n4. Examples: "quest-1", "daily-challenge", "bonus-round"',
  QUEST_KEY_DOUBLE_WHITESPACE: '❌ Invalid Quest Name\n\nQuest name contains double spaces.\n\nHow to fix:\n1. Remove extra spaces from the quest name\n2. Use single spaces or hyphens instead',
  QUEST_KEY_OUT_OF_BOUNDS: '❌ Quest Positioned Outside Frame\n\nThis quest is positioned outside the questline frame.\n\nHow to fix:\n1. Move the quest inside the questline frame\n2. Make sure the entire quest is visible within the frame',
  QUEST_KEY_NOT_INSIDE_PARENT: '❌ Quest Not Fully Inside Frame\n\nThis quest extends beyond the questline frame boundaries.\n\nHow to fix:\n1. Resize or reposition the quest\n2. Make sure it fits completely within the frame',
  QUEST_KEY_AUTO_LAYOUT_ENABLED: '❌ Auto Layout Must Be Disabled\n\nThis quest has auto layout enabled, which can cause positioning issues.\n\nHow to fix:\n1. Select the quest instance\n2. In the right panel, turn off "Auto Layout"\n3. Use absolute positioning instead',
  MISSING_ACTIVE_VARIANT: '❌ Missing Quest States\n\nThis quest component is missing required states.\n\nHow to fix:\n1. Make sure your quest component has "locked", "active", "unclaimed", and "completed" states\n2. The "active" state is mandatory\n3. Check the component properties in Figma',
  MISSING_QUEST_KEY: '❌ Missing Quest Name\n\nThis quest doesn\'t have a name assigned.\n\nHow to fix:\n1. Select the quest instance\n2. In the right panel, find the "questKey" property\n3. Enter a unique name for this quest',
  IMAGE_EXPORT_FAILED: '❌ Image Export Failed\n\nOne or more images couldn\'t be exported.\n\nHow to fix:\n1. Make sure all images are properly placed in frames\n2. Check that images are not corrupted\n3. Try re-uploading the images in Figma',
  VALIDATION_FAILED: '❌ Validation Error\n\nThere\'s an issue with your questline structure.\n\nHow to fix:\n1. Check that all quest names are unique\n2. Make sure quest names follow the naming rules\n3. Verify all quests are properly positioned',
  UNKNOWN: '❌ Unexpected Error\n\nSomething went wrong while processing your questline.\n\nHow to fix:\n1. Try refreshing the plugin\n2. Check that your Figma file is saved\n3. Make sure you have the latest version of the plugin'
};
