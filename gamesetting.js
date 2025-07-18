// gamesetting.js

// 全てのカードデータ (情報表示用)
const allCards = [
    { name: "拳で", effect: "5ダメージを与える", count: 2, icon: '👊', type: 'attack' },
    { name: "ビンタ", effect: "3ダメージを与える", count: 3, icon: '🖐️', type: 'attack' },
    { name: "デコピン", effect: "1ダメージを与える", count: 3, icon: '👉', type: 'attack' },
    { name: "ぼろぼろの鎧", effect: "2ターンの間、ダメージを1軽減する", count: 2, icon: '🪖', type: 'defense' },
    { name: "転んでしまった", effect: "自分に1ダメージ", count: 1, isBad: true, icon: '💥', type: 'bad' },
    { name: "頭をぶつけてしまった", effect: "自分に3ダメージ", count: 1, isBad: true, icon: '🤕', type: 'bad', noReappearRounds: 2, reappearEffectName: "頭をぶつけてしまった" },
    { name: "普通のポーション", effect: "HPを3回復", count: 2, heal: true, icon: '🧪', type: 'heal' },
    { name: "良いポーション", effect: "HPを5回復", count: 2, heal: true, rare: true, special: true, icon: '✨🧪', type: 'heal' },
    { name: "サボり魔", effect: "効果はなかった", count: 1, isBad: true, icon: '👻', type: 'bad' },
    { name: "盾よ守れ！", effect: "2ターンの間、ダメージを2軽減する", count: 2, special: true, icon: '🛡️', type: 'rare', rare: true },
    { name: "毒物混入", effect: "毒を与える", count: 1, rare: true, special: true, icon: '☠️', type: 'rare' },
    { name: "ぶん殴る", effect: "10ダメージを与える", count: 1, rare: true, icon: '💢', type: 'rare' },
    { name: "最高のポーション", effect: "HPが全回復", count: 0, legendary: true, chance: 0.03, icon: '💖', type: 'legendary' },
    { name: "あべこべ", effect: "HP入れ替え", count: 1, isBad: true, icon: '🔄', type: 'bad', noReappearRounds: 2, reappearEffectName: "頭をぶつけてしまった" },
    { name: "封じちゃえ ♪", effect: "相手の行動を2ターン封じる。あなたは追加で2回行動できる。", count: 0, legendary: true, chance: 0.01, icon: '🔒', type: 'legendary' },
    { name: "一撃必殺", effect: "一撃必殺", count: 0, legendary: true, chance: 0.001, icon: '🎯', type: 'legendary' },
    { name: "神のご加護を", effect: "2ラウンド無敵", count: 0, legendary: true, chance: 0.005, icon: '😇', type: 'legendary' }
];

// ゲームの状態を管理するオブジェクト (localStorageからロードされる)
let gameState = {
    maxHP: 30,
    numCardsInHand: 5,
    enableHealCards: true,
    enableBadCards: true,
    enableRareCards: true,
    enableSkills: true, // スキル機能の有効/無効
    // 以下のプロパティはgamesetting.htmlでは直接使用しないが、localStorage経由で引き継ぐため定義
    player: { hp: 30, shield: 0, poison: 0, armor: 0, sealed: 0, extraTurns: 0, invincible: 0 },
    enemy: { hp: 30, shield: 0, poison: 0, armor: 0, sealed: 0, extraTurns: 0, invincible: 0 },
    isPlayerTurn: true,
    remainingCards: [],
    currentRound: 1,
    isAnimating: false,
    usedRareCards: [],
    usedSpecialCards: [],
    usedLegendaryCards: false,
    lastPlayedCardName: "",
    usedNoReappearCards: [],
    selectedSkill: null,
    skillUsedThisGame: false,
    skillCooldownRound: 0,
    skillActiveEffects: {
        skipNextEnemyTurn: false, immuneToBadCards: 0, riskAndReturn: 0, divineBlessing: 0, divineBlessingDebuff: 0
    },
    skillConfirmCallback: null
};

// DOM要素の宣言
let gameSettingsScreen;
let hpSelectorOptions;
let handSizeSelectorOptions;
let toggleHealCardsCheckbox;
let toggleBadCardsCheckbox;
let toggleRareCardsCheckbox;
let toggleSkillsCheckbox;
let startGameButton;
let showCardsOnSettingsButton;
let cardInfoPopup;
let cardInfoContent;
let closeCardInfoButton;
let overlay;
let backButton; // 戻るボタンの宣言

// localStorageからgameStateをロードする関数 (kardgame.jsと共通)
function loadGameState() {
    const savedState = localStorage.getItem('kardgame_gameState');
    if (savedState) {
        // JSON.parseのreviver関数を使って、actionプロパティを関数に戻す
        const parsedState = JSON.parse(savedState, (key, value) => {
            // selectedSkillのactionはgamesetting.jsでは不要なので復元しない
            // play.jsで復元される
            return value;
        });
        Object.assign(gameState, parsedState);
        console.log("GameState loaded from localStorage:", gameState);
    } else {
        console.log("No saved game state found, starting fresh.");
    }
}

// gameStateをlocalStorageに保存する関数 (kardgame.jsと共通)
function saveGameState() {
    // selectedSkillのactionプロパティは保存しない（循環参照を防ぐため）
    const stateToSave = { ...gameState };
    if (stateToSave.selectedSkill) {
        stateToSave.selectedSkill = {
            name: stateToSave.selectedSkill.name,
            icon: stateToSave.selectedSkill.icon,
            effect: stateToSave.selectedSkill.effect
        }; // actionプロパティを除外
    }
    localStorage.setItem('kardgame_gameState', JSON.stringify(stateToSave));
    console.log("GameState saved to localStorage.");
}

// 全てのゲーム画面とポップアップを非表示にする共通関数 (gamesetting.js用)
function hideAllScreens() {
    if (gameSettingsScreen) gameSettingsScreen.style.display = 'none';
    if (cardInfoPopup) cardInfoPopup.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
}

// カード情報表示関数 (gamestart.jsと共通)
function showCardInfo() {
    cardInfoContent.innerHTML = '';
    document.getElementById('cardInfo').querySelector('.popup-title').textContent = "カードの種類と効果";

    const createCardSection = (title, cards, className) => {
        let sectionHtml = `<div class="card-section ${className}">`;
        sectionHtml += `<h4>${title}</h4>`;
        cards.forEach(card => {
            let textColorClass = '';
            if (card.type === 'attack' || card.type === 'defense' || card.type === 'heal') {
                textColorClass = 'normal-text';
            } else if (card.type === 'bad') {
                textColorClass = 'bad-text';
            } else if (card.type === 'rare') {
                textColorClass = 'rare-text';
            } else if (card.type === 'legendary') {
                textColorClass = 'legendary-text';
            } else {
                textColorClass = 'other-text';
            }
            // レジェンドカードの場合のみ確率を表示
            const probabilityText = card.legendary && card.chance !== undefined ? ` (出現率: ${card.chance * 100}%)` : '';
            sectionHtml += `<p class="card-entry"><span class="card-icon">${card.icon || ''}</span><span class="card-text"><strong class="${textColorClass}">${card.name}</strong>: ${card.effect}${probabilityText}`;
            sectionHtml += `</span></p>`;
        });
        sectionHtml += `</div>`;
        return sectionHtml;
    };

    const normalCards = allCards.filter(card =>
        !card.isBad && !card.rare && !card.legendary && (card.type === 'attack' || card.type === 'defense' || card.type === 'heal')
    );
    const rareCards = allCards.filter(card =>
        card.rare && !card.legendary
    );
    const badCards = allCards.filter(card =>
        card.isBad && !card.legendary
    );
    const legendaryCards = allCards.filter(card => card.legendary);

    cardInfoContent.innerHTML += createCardSection('通常カード （出やすいカード）', normalCards, 'normal');
    cardInfoContent.innerHTML += createCardSection('ハプニングカード （デメリットでしかない）', badCards, 'bad');
    cardInfoContent.innerHTML += createCardSection('レアカード （使うと3ラウンド間、再出現しなくなる）', rareCards, 'rare');
    cardInfoContent.innerHTML += createCardSection('レジェンドカード （出る確率めちゃくちゃ低い）', legendaryCards, 'legendary');

    cardInfoContent.innerHTML += createCardSection('その他、特殊効果について', [
        { name: '鎧', effect: 'ダメージ1軽減', icon: '🪖' },
        { name: '盾', effect: 'ダメージ2軽減', icon: '🛡️' },
        { name: '毒', effect: '毎ターン1ダメージ', icon: '☠️' },
        { name: '封', effect: '行動不能', icon: '🔒' },
        { name: '無', effect: '無敵状態（ダメージを受けない）', icon: '😇' }
    ], 'other');

    cardInfoPopup.style.display = 'block';
    overlay.style.display = 'block';
    // NEW: ポップアップのスクロール位置をリセット
    cardInfoContent.scrollTop = 0;
}

// ゲーム進行に関する状態を初期化する関数
function resetGameProgress() {
    // ユーザーがgamesetting.htmlで選択した設定は維持する
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
    gameState.playedCardsHistory = []; // 履歴もリセット

    // 設定を再度適用 (主にHPをmaxHPに設定するため)
    Object.assign(gameState, currentSettings);
    console.log("Game progress reset in gamesetting.js:", gameState);
}


document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の割り当て
    gameSettingsScreen = document.getElementById('gameSettings');
    hpSelectorOptions = document.querySelectorAll('.hp-option');
    handSizeSelectorOptions = document.querySelectorAll('.hand-size-option');
    toggleHealCardsCheckbox = document.getElementById('toggleHealCards');
    toggleBadCardsCheckbox = document.getElementById('toggleBadCards');
    toggleRareCardsCheckbox = document.getElementById('toggleRareCards');
    toggleSkillsCheckbox = document.getElementById('toggleSkills');
    startGameButton = document.getElementById('startGame');
    showCardsOnSettingsButton = document.getElementById('showCardsOnSettings');
    cardInfoPopup = document.getElementById('cardInfo');
    cardInfoContent = document.getElementById('cardInfoContent');
    closeCardInfoButton = document.getElementById('closeCardInfo');
    overlay = document.getElementById('overlay');
    backButton = document.getElementById('backButton'); // 戻るボタンの宣言

    // 初期表示設定
    hideAllScreens();
    gameSettingsScreen.style.display = 'flex'; // ゲーム設定画面のみ表示

    loadGameState(); // localStorageからゲーム状態をロード

    // ロードされたgameStateでHP設定を反映
    hpSelectorOptions.forEach(option => {
        if (parseInt(option.dataset.hp) === gameState.maxHP) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });

    // ロードされたgameStateで手札枚数設定を反映
    handSizeSelectorOptions.forEach(option => {
        if (parseInt(option.dataset.cards) === gameState.numCardsInHand) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });

    // ロードされたgameStateでカード種類ON/OFFを反映
    toggleHealCardsCheckbox.checked = gameState.enableHealCards;
    toggleBadCardsCheckbox.checked = gameState.enableBadCards;
    toggleRareCardsCheckbox.checked = gameState.enableRareCards;
    toggleSkillsCheckbox.checked = gameState.enableSkills; // スキルON/OFFも反映

    // イベントリスナー
    hpSelectorOptions.forEach(option => {
        option.addEventListener('click', function() {
            hpSelectorOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            gameState.maxHP = parseInt(this.dataset.hp);
            saveGameState(); // 設定変更時に保存
        });
    });

    handSizeSelectorOptions.forEach(option => {
        option.addEventListener('click', function() {
            handSizeSelectorOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            gameState.numCardsInHand = parseInt(this.dataset.cards);
            saveGameState(); // 設定変更時に保存
        });
    });

    toggleHealCardsCheckbox.addEventListener('change', function() {
        gameState.enableHealCards = this.checked;
        saveGameState(); // 設定変更時に保存
    });
    toggleBadCardsCheckbox.addEventListener('change', function() {
        gameState.enableBadCards = this.checked;
        saveGameState(); // 設定変更時に保存
    });
    toggleRareCardsCheckbox.addEventListener('change', function() {
        gameState.enableRareCards = this.checked;
        saveGameState(); // 設定変更時に保存
    });
    toggleSkillsCheckbox.addEventListener('change', function() {
        gameState.enableSkills = this.checked;
        saveGameState(); // 設定変更時に保存
    });

    startGameButton.addEventListener('click', () => {
        resetGameProgress(); // ゲーム開始前にゲーム進行に関する状態をリセット
        saveGameState(); // リセットされた状態を保存
        if (gameState.enableSkills) {
            window.location.href = 'skill.html'; // スキルONならskill.htmlへ
        } else {
            window.location.href = 'play.html'; // スキルOFFならplay.htmlへ
        }
    });

    showCardsOnSettingsButton.addEventListener('click', showCardInfo);
    closeCardInfoButton.addEventListener('click', () => {
        cardInfoPopup.style.display = 'none';
        overlay.style.display = 'none';
    });

    // 戻るボタンのイベントリスナー
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.location.href = 'gamestart.html'; // gamestart.htmlへ遷移
        });
    }

    // NEW: オーバーレイクリックでポップアップを閉じる処理
    if (overlay) {
        overlay.addEventListener('click', () => {
            if (cardInfoPopup && cardInfoPopup.style.display === 'block') {
                cardInfoPopup.style.display = 'none';
                overlay.style.display = 'none';
            }
        });
    }

    // NEW: ポップアップ内でのクリックがオーバーレイに伝播しないようにする
    if (cardInfoPopup) {
        cardInfoPopup.addEventListener('click', (e) => e.stopPropagation());
    }
});
