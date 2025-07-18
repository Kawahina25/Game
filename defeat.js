// defeat.js

// ゲームの状態を管理するオブジェクト (localStorageからロードされる)
let gameState = {
    // 敗北画面では、以下のプロパティのみが必要ですが、
    // localStorageからロードする関数は共通のものを使用します
    lastPlayedCardName: "",
    maxHP: 30, // HPバーの表示のために必要
    player: { hp: 0 }, // 敗北判定のために必要
    enemy: { hp: 0 } // 敗北判定のために必要
};

// localStorageからgameStateをロードする関数 (play.jsなどと共通)
function loadGameState() {
    const savedState = localStorage.getItem('kardgame_gameState');
    if (savedState) {
        // actionプロパティは不要なので復元しない
        const parsedState = JSON.parse(savedState);
        Object.assign(gameState, parsedState);
        console.log("GameState loaded from localStorage (defeat.js):", gameState);
    } else {
        console.warn("No saved game state found for defeat screen.");
        // デフォルト値で初期化するか、エラー表示
        gameState.lastPlayedCardName = "不明なカード";
        gameState.player.hp = 0; // 敗北状態を仮定
        gameState.enemy.hp = 1;
    }
}

// gameStateをlocalStorageに保存する関数 (play.jsなどと共通)
function saveGameState() {
    // 敗北画面では通常、ゲーム状態を保存する必要はありませんが、
    // "ゲーム設定"に戻る際に設定が失われないようにするために呼び出されます
    const stateToSave = { ...gameState };
    // selectedSkillのactionプロパティは保存しない（循環参照を防ぐため）
    if (stateToSave.selectedSkill) {
        stateToSave.selectedSkill = { 
            name: stateToToSave.selectedSkill.name,
            icon: stateToToSave.selectedSkill.icon,
            effect: stateToToSave.selectedSkill.effect
        };
    }
    localStorage.setItem('kardgame_gameState', JSON.stringify(stateToSave));
    console.log("GameState saved to localStorage (defeat.js).");
}

// 結果画面の表示
function showResultScreen(isVictory) {
    const resultScreen = document.getElementById('resultScreen');
    if (!resultScreen) {
        console.error("Error: resultScreen element not found.");
        return;
    }

    let mainTitle = '';
    let messageParagraph = '';

    // 敗北時を固定
    mainTitle = '☠️ 敗北...だと... ☠️';
    messageParagraph = `あなたの敗北だ...。「${gameState.lastPlayedCardName}」が致命傷になってしまった。`;

    let resultContent = `
        <h2 class="defeat-title">${mainTitle}</h2>
        <p class="defeat-message">${messageParagraph}</p>
        <div class="button-group">
            <button id="playAgainBtn" class="start-game-button">もう一度プレイ</button>
            <button id="changeHpBtn" class="show-cards-button">ゲーム設定</button>
        </div>
    `;

    resultScreen.innerHTML = resultContent;
    resultScreen.style.display = 'block'; // 結果画面を表示

    // イベントリスナーの設定
    document.getElementById('playAgainBtn').addEventListener('click', () => {
        // ゲーム状態を保存してplay.htmlへ遷移
        // 新しいゲームとして初期化するため、gameStateをリセット
        const currentSettings = {
            maxHP: gameState.maxHP,
            numCardsInHand: gameState.numCardsInHand,
            enableHealCards: gameState.enableHealCards,
            enableBadCards: gameState.enableBadCards,
            enableRareCards: gameState.enableRareCards,
            enableSkills: gameState.enableSkills,
        };
        // ゲーム進行に関する全ての状態を初期値にリセット
        gameState.player = { hp: currentSettings.maxHP, shield: 0, poison: 0, armor: 0, sealed: 0, extraTurns: 0, invincible: 0 };
        gameState.enemy = { hp: currentSettings.maxHP, shield: 0, poison: 0, armor: 0, sealed: 0, extraTurns: 0, invincible: 0 };
        gameState.isPlayerTurn = true;
        gameState.remainingCards = [];
        gameState.currentRound = 1; // ここでラウンドを1にリセット
        gameState.isAnimating = false;
        gameState.usedRareCards = [];
        gameState.usedSpecialCards = [];
        gameState.usedLegendaryCards = false;
        gameState.lastPlayedCardName = "";
        gameState.usedNoReappearCards = [];
        gameState.selectedSkill = null; // スキルもリセット
        gameState.skillUsedThisGame = false;
        gameState.skillCooldownRound = 0;
        gameState.skillActiveEffects = {
            skipNextEnemyTurn: false, immuneToBadCards: 0, riskAndReturn: 0, divineBlessing: 0, divineBlessingDebuff: 0
        };
        gameState.skillConfirmCallback = null;
        gameState.playedCardsHistory = []; // NEW: 履歴もリセット
        Object.assign(gameState, currentSettings); // 設定を再度適用

        saveGameState(); 
        window.location.href = 'play.html'; 
    });

    document.getElementById('changeHpBtn').addEventListener('click', () => {
        // ゲーム状態を保存してgamesetting.htmlへ遷移
        saveGameState(); 
        window.location.href = 'gamesetting.html'; 
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadGameState(); // ゲーム状態をロード
    // 敗北画面なので、isVictoryはfalseで固定
    showResultScreen(false); 
});
