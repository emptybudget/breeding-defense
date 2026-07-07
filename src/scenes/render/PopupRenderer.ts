import Phaser from 'phaser';
import { GameState } from '../../game/GameState';
import { Reward, UnitData } from '../../game/types';
import { SoundManager } from '../SoundManager';
import { GameOverPopup } from './popups/GameOverPopup';
import { PausePopup } from './popups/PausePopup';
import { RecipePopup } from './popups/RecipePopup';
import { RewardPopup } from './popups/RewardPopup';
import { SoulShopPopup } from './popups/SoulShopPopup';
import { showTutorial } from './popups/TutorialPopup';
import { UnitActionSheet, UnitActionSheetOptions } from './popups/UnitActionSheet';
import { VictoryPopup } from './popups/VictoryPopup';

// 얇은 파사드 — 팝업 모듈을 모아서 외부에 단일 진입점을 제공한다.
// 실제 구현은 ./popups/* 에 종류별로 분리되어 있다.
export class PopupRenderer {
  private scene: Phaser.Scene;

  private pausePopup: PausePopup;
  private recipePopup: RecipePopup;
  private gameOverPopup: GameOverPopup;
  private victoryPopup: VictoryPopup;
  private rewardPopup: RewardPopup;
  private soulShopPopup: SoulShopPopup;
  private unitActionSheet: UnitActionSheet;

  constructor(
    scene: Phaser.Scene,
    state: GameState,
    onRestart: () => void,
    onGemContinue: () => void,
    onInfiniteMode: () => void,
    onStageSelect: () => void,
    onAdRevive: () => void,
    onGemChange: (delta: number) => void,
    sfx: SoundManager,
  ) {
    this.scene = scene;
    this.pausePopup = new PausePopup(scene, state, sfx);
    this.recipePopup = new RecipePopup(scene, sfx);
    this.gameOverPopup = new GameOverPopup(scene, state, onRestart, onGemContinue, onStageSelect, onAdRevive, sfx);
    this.victoryPopup = new VictoryPopup(scene, state, onRestart, onInfiniteMode, onStageSelect, sfx);
    this.rewardPopup = new RewardPopup(scene, state, onGemChange, sfx);
    this.soulShopPopup = new SoulShopPopup(scene, state, sfx);
    this.unitActionSheet = new UnitActionSheet(scene, sfx);
  }

  get hasGameOverPopup(): boolean {
    return this.gameOverPopup.isShown;
  }

  get hasRewardPopup(): boolean {
    return this.rewardPopup.isShown;
  }

  get hasVictoryPopup(): boolean {
    return this.victoryPopup.isShown;
  }

  showTutorial(onDismiss: () => void): void {
    showTutorial(this.scene, onDismiss);
  }

  showPause(
    onResume: () => void,
    onQuit: () => void,
    sound: { muted: () => boolean; toggle: () => void },
    onRecipeBook?: () => void,
    speed2x?: { getMult: () => number; toggle: () => void },
  ): void {
    this.pausePopup.show(onResume, onQuit, sound, onRecipeBook, speed2x);
  }

  showUnitActions(
    unit: UnitData,
    opts: UnitActionSheetOptions,
    onNest: () => void,
    onSell: () => void,
    onClose: () => void,
  ): void {
    this.unitActionSheet.show(unit, opts, onNest, onSell, onClose);
  }

  showRecipeBook(onClose: () => void, discovered: ReadonlySet<string>): void {
    this.recipePopup.showRecipeBook(onClose, discovered);
  }

  showGameOver(isNewRecord = false): void {
    this.gameOverPopup.show(isNewRecord);
  }

  hideGameOver(): void {
    this.gameOverPopup.hide();
  }

  showVictory(isNewRecord = false): void {
    this.victoryPopup.show(isNewRecord);
  }

  showReward(count: 2 | 3, pregenerated?: Reward[], opts?: { title?: string; allowExpand?: boolean }): void {
    this.rewardPopup.show(count, pregenerated, opts);
  }

  showSoulShop(onUnitSummon: (unit: UnitData) => void, onClose: () => void): void {
    this.soulShopPopup.show(onUnitSummon, onClose);
  }
}
