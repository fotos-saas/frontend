import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PokePresetService } from './poke-preset.service';
import { PokeActionService } from './poke-action.service';
import {
  Poke,
  PokePreset,
  PokeDailyLimit,
  PokeCategory,
  MissingCategory,
  MissingSummary,
} from '../models/poke.models';
import { ReactionEmoji } from '@shared/constants';

/**
 * Poke Service (Facade)
 *
 * Backward compatible facade a PokePresetService és PokeActionService fölött.
 */
@Injectable({
  providedIn: 'root'
})
export class PokeService {
  private readonly presetService = inject(PokePresetService);
  private readonly actionService = inject(PokeActionService);

  // === SIGNALS (delegált) ===

  get presets() { return this.presetService.presets; }
  get sentPokes() { return this.actionService.sentPokes; }
  get receivedPokes() { return this.actionService.receivedPokes; }
  get dailyLimit() { return this.actionService.dailyLimit; }
  get unreadCount() { return this.actionService.unreadCount; }
  get missingCategories() { return this.presetService.missingCategories; }
  get missingSummary() { return this.presetService.missingSummary; }
  get loading() { return this.presetService.loading; }

  // === COMPUTED (delegált) ===

  get hasUnread() { return this.actionService.hasUnread; }
  get hasReachedDailyLimit() { return this.actionService.hasReachedDailyLimit; }
  get totalMissing() { return this.actionService.totalMissing; }
  get newPokeNotification$() { return this.actionService.newPokeNotification$; }

  presetsForCategory(category: PokeCategory | null) { return this.presetService.presetsForCategory(category); }

  // === PRESET DELEGÁLÁS ===

  loadPresets(category?: PokeCategory) { return this.presetService.loadPresets(category); }
  loadMissingUsers() { return this.presetService.loadMissingUsers(); }

  // === ACTION DELEGÁLÁS ===

  sendPoke(targetId: number, category?: PokeCategory, presetKey?: string, customMessage?: string) {
    return this.actionService.sendPoke(targetId, category, presetKey, customMessage);
  }
  loadSentPokes() { return this.actionService.loadSentPokes(); }
  loadReceivedPokes() { return this.actionService.loadReceivedPokes(); }
  addReaction(pokeId: number, reaction: ReactionEmoji) { return this.actionService.addReaction(pokeId, reaction); }
  markAsRead(pokeId: number) { return this.actionService.markAsRead(pokeId); }
  markAllAsRead() { return this.actionService.markAllAsRead(); }
  refreshUnreadCount() { return this.actionService.refreshUnreadCount(); }
  refreshDailyLimit() { return this.actionService.refreshDailyLimit(); }
  initialize() { return this.actionService.initialize(); }

  // === WEBSOCKET ===

  subscribeToNotifications(projectId: number, guestSessionId: number) {
    this.actionService.subscribeToNotifications(projectId, guestSessionId);
  }
  unsubscribeFromNotifications() { this.actionService.unsubscribeFromNotifications(); }

  // === RESET ===

  clear() { this.actionService.clear(); }
}
