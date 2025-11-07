/**
 * UI-related event types and interfaces
 */

import type { Position } from '../Position';
import type { TradeData, InventoryItem } from '../SharedTypes';

// UI Event Constants
export const UIEvents = {
  MESSAGE_LOGGED: 'ui:message:logged',
  PANEL_OPENED: 'ui:panel:opened',
  PANEL_CLOSED: 'ui:panel:closed',
  UI_UPDATE_STATS: 'ui:update:stats',
  UI_SHOW_MESSAGE: 'ui:show:message',
  UI_CLOSE_PANEL: 'ui:close:panel',
  UI_DIALOG_SHOW: 'ui:dialog:show',
  UI_DIALOG_HIDE: 'ui:dialog:hide',
  UI_CONFIRMATION_SHOW: 'ui:confirmation:show',
  UI_CONFIRMATION_RESPONSE: 'ui:confirmation:response',
  UI_OVERLAY_MESSAGE_SHOW: 'ui:overlay:message:show',
  UI_OVERLAY_MESSAGE_HIDE: 'ui:overlay:message:hide',
  UI_MESSAGE_LOG: 'ui:message:log',
  UI_REGION_NOTIFICATION_SHOW: 'ui:region:notification:show',
  SIGN_MESSAGE_DISPLAYED: 'sign:message:displayed',
  SIGN_MESSAGE_CLEARED: 'sign:message:cleared',
  TRADE_INITIATED: 'trade:initiated',
  TRADE_COMPLETED: 'trade:completed',
} as const;

export type UIEventType = typeof UIEvents[keyof typeof UIEvents];

// UI Event Interfaces
export interface MessageLoggedEvent {
  message: string;
  type: string;
  timestamp: number;
}

export interface PanelOpenedEvent {
  panelId: string;
  panelType: string;
}

export interface PanelClosedEvent {
  panelId: string;
  panelType: string;
}

export interface UIUpdateStatsEvent {
  // Empty payload - used as trigger for UI updates
}

export interface UIShowMessageEvent {
  text: string;
  imageSrc?: string;
  isPersistent?: boolean;
  isLargeText?: boolean;
  useTypewriter?: boolean;
}

export interface UIClosePanelEvent {
  panelId?: string;
}

export interface UIDialogShowEvent {
  type: string;
  npc?: string;
  message?: string;
  portrait?: string;
  name?: string;
  buttonText?: string;
  playerPos?: Position;
  npcPos?: Position;
}

export interface UIDialogHideEvent {
  type: string;
}

export interface UIConfirmationShowEvent {
  message: string;
  action: string;
  data?: Record<string, any>;
  persistent?: boolean;
  largeText?: boolean;
  useTypewriter?: boolean;
}

export interface UIConfirmationResponseEvent {
  action: string;
  confirmed: boolean;
  data?: Record<string, any>;
}

export interface UIOverlayMessageShowEvent {
  text: string;
  imageSrc?: string;
  persistent?: boolean;
  largeText?: boolean;
  useTypewriter?: boolean;
}

export interface UIMessageLogEvent {
  text: string;
  category?: string;
  priority?: string;
  timestamp?: number;
}

export interface UIRegionNotificationShowEvent {
  x: number;
  y: number;
  regionName?: string;
}

export interface SignMessageDisplayedEvent {
  message?: string;
  x?: number;
  y?: number;
}

export interface SignMessageClearedEvent {
  // Empty payload
}

export interface TradeInitiatedEvent {
  npc: string;
  tradeData: TradeData;
  playerPoints: number;
}

export interface TradeCompletedEvent {
  npc: string;
  cost: number;
  reward: InventoryItem | number;
  remainingPoints: number;
}
