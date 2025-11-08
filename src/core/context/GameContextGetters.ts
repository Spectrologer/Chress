/**
 * Game Context Getters - Convenience property accessors
 * Extracted from GameContext to reduce file size
 */

import type { Player } from '@entities/Player';
import type { Enemy } from '@entities/Enemy';
import type { Grid } from '../SharedTypes';
import type { GridManager } from '@managers/GridManager';
import type { UIManager } from '@ui/UIManager';
import type { OverlayManager } from '@ui/OverlayManager';
import type { InventoryUI } from '@ui/InventoryUI';
import type { RadialInventoryUI } from '@ui/RadialInventoryUI';
import type { Coordinates } from '../PositionTypes';
import type { SoundManager as ISoundManager } from '../../types/game.js';
import type { ServiceContainer } from '../ServiceContainer';
import type { GameWorld } from '../GameWorld';
import type { GameUI } from '../GameUI';
import type { GameAudio } from '../GameAudio';

/**
 * Mixin for GameContext getters and setters
 * This provides convenient property access to nested subsystem properties
 */
export class GameContextGetters {
    world!: GameWorld;
    ui!: GameUI;
    audio!: GameAudio;
    _services!: ServiceContainer | null;

    get player(): Player | null { return this.world.player; }
    set player(value: Player | null) { this.world.player = value; }

    get enemies(): Enemy[] { return this.world.enemies; }
    set enemies(value: Enemy[]) { this.world.enemies = value; }

    get grid(): Grid | null { return this.world.grid; }
    set grid(value: Grid | null) { this.world.grid = value; }

    get gridManager(): GridManager | null {
        if (!this._services) return null;
        return this._services.get('gridManager');
    }

    get zones(): Map<string, any> { return this.world.zones; }
    set zones(value: Map<string, any>) { this.world.zones = value; }

    get specialZones(): Map<string, any> { return this.world.specialZones; }
    set specialZones(value: Map<string, any>) { this.world.specialZones = value; }

    get partnerCubes(): Map<string, any> { return this.world.partnerCubes; }
    set partnerCubes(value: Map<string, any>) { this.world.partnerCubes = value; }

    get cubeLinkages(): Map<string, any> { return this.world.cubeLinkages; }
    set cubeLinkages(value: Map<string, any>) { this.world.cubeLinkages = value; }

    get defeatedEnemies(): Set<string> { return this.world.defeatedEnemies; }
    set defeatedEnemies(value: Set<string>) { this.world.defeatedEnemies = value; }

    get currentRegion(): string | null { return this.world.currentRegion; }
    set currentRegion(value: string | null) { this.world.currentRegion = value; }

    get canvas(): HTMLCanvasElement | null { return this.ui.canvas; }
    set canvas(value: HTMLCanvasElement | null) { this.ui.canvas = value; }

    get ctx(): CanvasRenderingContext2D | null { return this.ui.ctx; }
    set ctx(value: CanvasRenderingContext2D | null) { this.ui.ctx = value; }

    get mapCanvas(): HTMLCanvasElement | null { return this.ui.mapCanvas; }
    set mapCanvas(value: HTMLCanvasElement | null) { this.ui.mapCanvas = value; }

    get mapCtx(): CanvasRenderingContext2D | null { return this.ui.mapCtx; }
    set mapCtx(value: CanvasRenderingContext2D | null) { this.ui.mapCtx = value; }

    get gameStarted(): boolean { return this.ui.gameStarted; }
    set gameStarted(value: boolean) { this.ui.gameStarted = value; }

    get previewMode(): boolean { return this.ui.previewMode; }
    set previewMode(value: boolean) { this.ui.previewMode = value; }

    get uiManager(): UIManager | null { return this.ui.uiManager; }
    set uiManager(value: UIManager | null) { this.ui.uiManager = value; }

    get overlayManager(): OverlayManager | null { return this.ui.overlayManager; }
    set overlayManager(value: OverlayManager | null) { this.ui.overlayManager = value; }

    get inventoryUI(): InventoryUI | null { return this.ui.inventoryUI; }
    set inventoryUI(value: InventoryUI | null) { this.ui.inventoryUI = value; }

    get radialInventoryUI(): RadialInventoryUI | null { return this.ui.radialInventoryUI; }
    set radialInventoryUI(value: RadialInventoryUI | null) { this.ui.radialInventoryUI = value; }

    get _lastPlayerPos(): Coordinates | null { return this.ui._lastPlayerPos; }
    set _lastPlayerPos(value: Coordinates | null) { this.ui._lastPlayerPos = value; }

    get soundManager(): ISoundManager | null { return this.audio.soundManager as ISoundManager | null; }
    set soundManager(value: ISoundManager | null) { this.audio.soundManager = value; }

    get consentManager(): object | null { return this.audio.consentManager; }
    set consentManager(value: object | null) { this.audio.consentManager = value; }
}
