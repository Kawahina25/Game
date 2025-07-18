// skill.js

// 全てのカードデータ (情報表示用 - play.jsと共通)
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
    { name: "最高のポーション", effect: "HPが全回復", count: 0, legendary: true, chance: 0.05, icon: '💖', type: 'legendary' },
    { name: "あべこべ", effect: "HP入れ替え", count: 1, isBad: true, icon: '🔄', type: 'bad', noReappearRounds: 2, reappearEffectName: "あべこべ" },
    { name: "封じちゃえ ♪", effect: "行動を封じる", count: 0, legendary: true, chance: 0.02, icon: '🔒', type: 'legendary' },
    { name: "一撃必殺", effect: "一撃必殺", count: 0, legendary: true, chance: 0.003, icon: '🎯', type: 'legendary' },
    { name: "神のご加護を", effect: "2ラウンド無敵", count: 0, legendary: true, chance: 0.005, icon: '😇', type: 'legendary' }
];

// 全てのスキルデータ (gamesetting.js, play.jsと共通)
const allSkills = [
    { 
        name: "スキップ", 
        icon: "💨",
        effect: "次の相手のターン、60%の確率でカードの効果がなくなる。ただし、確率を外すと、自分がその効果を食らってしまう。", 
        // actionプロパティはplay.jsでのみ使用するため、ここでは定義しないか、ダミー関数にする
        action: () => {} 
    },
    { 
        name: "透視", 
        icon: "🔮",
        effect: "スキルを使うと、任意でカードを1枚選び、そのカードの効果が分かる。", 
        action: () => {}
    },
    { 
        name: "慎重に", 
        icon: "🐢",
        effect: "3ターンの間、ハプニングカードの効果を受けない。", 
        action: () => {}
    },
    { 
        name: "リスクandリターン", 
        icon: "🔥",
        effect: "2ターンの間、攻撃する際に＋2の追加攻撃をする。ただし、受けるダメージも＋2される。", 
        action: () => {}
    },
    { 
        name: "ご加護を", 
        icon: "✨",
        effect: "回復系と防御系の効果が＋3される。ただし、スキルが終わると、3ターンの間、回復系と防御系の効果を受けれなくなる。", 
        action: () => {}
    }
];

// ゲームの状態を管理するオブジェクト (localStorageからロードされる)
let gameState = {
    maxHP: 30,
    numCardsInHand: 5,
    enableHealCards: true,
    enableBadCards: true,
    enableRareCards: true,
    enableSkills: true,
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
    selectedSkill: null, // プレイヤーが選択したスキル
    skillUsedThisGame: false,
    skillCooldownRound: 0,
    skillActiveEffects: {
        skipNextEnemyTurn: false, immuneToBadCards: 0, riskAndReturn: 0, divineBlessing: 0, divineBlessingDebuff: 0
    },
    skillConfirmCallback: null
};

// DOM要素の宣言
let skillSelectScreen;
let skillOptionsContainer;
let showSkillInfoOnSelectButton;
let cardInfoPopup;
let cardInfoContent;
let closeCardInfoButton;
let skillSelectionConfirmPopup;
let selectedSkillInfo;
let confirmSkillSelectionYesButton;
let confirmSkillSelectionNoButton;
let overlay;


// localStorageからgameStateをロードする関数 (gamesetting.jsと共通)
function loadGameState() {
    const savedState = localStorage.getItem('kardgame_gameState');
    if (savedState) {
        // JSON.parseのreviver関数を使って、actionプロパティを関数に戻す
        const parsedState = JSON.parse(savedState, (key, value) => {
            // selectedSkillのactionはskill.jsでは不要なので復元しない
            // play.jsで復元される
            return value;
        });
        Object.assign(gameState, parsedState);
        console.log("GameState loaded from localStorage (skill.js):", gameState);
    } else {
        console.log("No saved game state found, starting fresh (skill.js).");
    }
}

// gameStateをlocalStorageに保存する関数 (gamesetting.jsと共通)
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
    console.log("GameState saved to localStorage (skill.js).");
}

// 全てのゲーム画面とポップアップを非表示にする共通関数 (skill.js用)
function hideAllScreens() {
    if (skillSelectScreen) skillSelectScreen.style.display = 'none';
    if (cardInfoPopup) cardInfoPopup.style.display = 'none';
    if (skillSelectionConfirmPopup) skillSelectionConfirmPopup.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
}

// カード情報表示関数 (gamestart.jsと共通)
function showCardInfo() {
    cardInfoContent.innerHTML = '';
    document.getElementById('cardInfo').querySelector('.popup-title').textContent = "スキル詳細"; // スキル詳細用にタイトル変更

    const createCardSection = (title, cards, className) => {
        let sectionHtml = `<div class="card-section ${className}">`;
        sectionHtml += `<h4>${title}</h4>`;
        cards.forEach(card => {
            // allCardsではなくallSkillsから情報を取得
            sectionHtml += `<p class="card-entry"><span class="card-icon">${card.icon || ''}</span><span class="card-text"><strong>${card.name}</strong>: ${card.effect}`;
            sectionHtml += `</span></p>`;
        });
        sectionHtml += `</div>`;
        return sectionHtml;
    };

    // allSkillsを表示
    cardInfoContent.innerHTML += createCardSection('全スキル一覧', allSkills, 'normal');

    cardInfoPopup.style.display = 'block';
    overlay.style.display = 'block';
}

// スキル選択画面の表示
function showSkillSelectScreen() {
    hideAllScreens();
    skillSelectScreen.style.display = 'flex';
    skillOptionsContainer.innerHTML = ''; // 既存の選択肢をクリア

    // スキル機能が有効でない場合は、この画面を表示しない（gamesetting.jsで既にチェック済みだが念のため）
    if (!gameState.enableSkills) {
        // gamesetting.htmlに戻る
        window.location.href = 'gamesetting.html';
        return;
    }

    // 5つのスキルからランダムに3つ選択
    const shuffledSkills = [...allSkills].sort(() => 0.5 - Math.random());
    const randomSkills = shuffledSkills.slice(0, 3);

    if (randomSkills.length === 0) {
        skillOptionsContainer.innerHTML = `<p style="color:gray;">現在、選択可能なスキルがありません...</p>`;
    } else {
        randomSkills.forEach(skill => {
            const skillCard = document.createElement('div');
            skillCard.className = 'skill-option-card';
            skillCard.innerHTML = `
                <h4>${skill.icon} ${skill.name}</h4>
                <p>${skill.effect}</p>
                <button class="select-button" data-skill-name="${skill.name}">これを選ぶ</button>
            `;
            skillOptionsContainer.appendChild(skillCard);
        });

        // 各スキル選択ボタンにイベントリスナーを設定
        document.querySelectorAll('.skill-option-card .select-button').forEach(button => {
            button.addEventListener('click', function() {
                const skillName = this.dataset.skillName;
                const tempSelectedSkill = allSkills.find(s => s.name === skillName);
                
                // 選択されたスキルカードをハイライト
                document.querySelectorAll('.skill-option-card').forEach(card => {
                    card.classList.remove('selected');
                });
                this.closest('.skill-option-card').classList.add('selected');

                // スキル選択確認ポップアップを表示
                showSkillSelectionConfirmPopup(tempSelectedSkill);
            });
        });
    }
}

// スキル選択確認ポップアップの表示と処理
function showSkillSelectionConfirmPopup(skill) {
    skillSelectionConfirmPopup.style.display = 'block';
    overlay.style.display = 'block';
    gameState.isAnimating = true; // ポップアップ表示中はアニメーションを有効に
    console.log("スキル選択確認ポップアップ表示: isAnimating = true");
    
    skillSelectionConfirmPopup.querySelector('.popup-title').textContent = "このスキルでいいか？";
    selectedSkillInfo.innerHTML = `
        <h4>${skill.icon} ${skill.name}</h4>
        <p>${skill.effect}</p>
    `;

    confirmSkillSelectionYesButton.textContent = "大丈夫だ";
    confirmSkillSelectionYesButton.onclick = () => {
        console.log("スキル選択確認: 大丈夫だボタンが押された");
        gameState.selectedSkill = skill; // スキルを正式に決定
        gameState.skillUsedThisGame = false;
        gameState.skillCooldownRound = gameState.currentRound + 3; // 初回選択時なので、3ラウンド後に更新される

        // ポップアップを閉じ、ゲーム画面へリダイレクト
        skillSelectionConfirmPopup.style.display = 'none';
        overlay.style.display = 'none';
        gameState.isAnimating = false; // ここでアニメーションフラグをリセット
        console.log("スキル選択確認ポップアップ閉じる（大丈夫だ）: isAnimating = false");

        saveGameState(); // ゲーム開始前に現在の設定を保存
        window.location.href = 'play.html'; // play.htmlへ遷移
    };

    confirmSkillSelectionNoButton.textContent = "全然だめだ";
    confirmSkillSelectionNoButton.onclick = () => {
        console.log("スキル選択確認: 全然だめだボタンが押された");
        skillSelectionConfirmPopup.style.display = 'none';
        overlay.style.display = 'none';
        gameState.isAnimating = false; // ここでアニメーションフラグをリセット
        console.log("スキル選択確認ポップアップ閉じる（全然だめだ）: isAnimating = false");
        showSkillSelectScreen(); // スキル選択画面に戻る
    };
}


document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の割り当て
    skillSelectScreen = document.getElementById('skillSelectScreen');
    skillOptionsContainer = document.getElementById('skillOptions');
    showSkillInfoOnSelectButton = document.getElementById('showSkillInfoOnSelect');
    cardInfoPopup = document.getElementById('cardInfo');
    cardInfoContent = document.getElementById('cardInfoContent');
    closeCardInfoButton = document.getElementById('closeCardInfo');
    skillSelectionConfirmPopup = document.getElementById('skillSelectionConfirmPopup');
    selectedSkillInfo = document.getElementById('selectedSkillInfo');
    confirmSkillSelectionYesButton = document.getElementById('confirmSkillSelectionYes');
    confirmSkillSelectionNoButton = document.getElementById('confirmSkillSelectionNo');
    overlay = document.getElementById('overlay');

    // 初期表示設定
    hideAllScreens();
    skillSelectScreen.style.display = 'flex'; // スキル選択画面のみ表示

    loadGameState(); // localStorageからゲーム状態をロード

    // イベントリスナー
    showSkillInfoOnSelectButton.addEventListener('click', showCardInfo);
    closeCardInfoButton.addEventListener('click', () => {
        cardInfoPopup.style.display = 'none';
        overlay.style.display = 'none';
    });

    // スキル選択画面を表示（DOMContentLoadedで直接呼び出す）
    showSkillSelectScreen();
});
