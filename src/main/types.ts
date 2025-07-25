import { EventHandler } from '@create-figma-plugin/utilities'

// Types for questline theming plugin

export interface Quest {
  questKey: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  lockedImg: string; // path to PNG file (State=locked)
  activeImg: string; // path to PNG file (State=active) - mandatory
  unclaimedImg: string; // path to PNG file (State=unclaimed)
  completedImg: string; // path to PNG file (State=completed)
}

export interface QuestlineExport {
  questlineId: string;
  frameSize: { width: number; height: number };
  background: { exportUrl: string };
  quests: Quest[];
}

export type IssueLevel = 'error' | 'warning';

export interface Issue {
  code: IssueCode;
  message: string;
  nodeId?: string;
  level: IssueLevel;
}

export type IssueCode =
  | 'MISSING_BG'
  | 'TOO_FEW_QUESTS'
  | 'TOO_MANY_QUESTS'
  | 'DUPLICATE_QUEST_KEY'
  | 'INVALID_QUEST_KEY'
  | 'QUEST_KEY_DOUBLE_WHITESPACE'
  | 'QUEST_KEY_OUT_OF_BOUNDS'
  | 'QUEST_KEY_NOT_INSIDE_PARENT'
  | 'QUEST_KEY_AUTO_LAYOUT_ENABLED'
  | 'MISSING_ACTIVE_VARIANT'
  | 'MISSING_QUEST_KEY'
  | 'IMAGE_EXPORT_FAILED'
  | 'VALIDATION_FAILED'
  | 'UNKNOWN';

export interface ScanResult {
  questlineId: string;
  frameSize: { width: number; height: number };
  backgroundNodeId: string;
  backgroundFillUrl?: string;
  quests: Array<{
    nodeId: string;
    questKey: string;
    x: number;
    y: number;
    w: number;
    h: number;
    rotation: number;
    lockedNodeId: string;
    activeNodeId: string;
    unclaimedNodeId: string;
    completedNodeId: string;
    lockedImgUrl?: string;
    activeImgUrl?: string;
    unclaimedImgUrl?: string;
    completedImgUrl?: string;
    isFlattened?: boolean;
  }>;
  issues: Issue[];
}
