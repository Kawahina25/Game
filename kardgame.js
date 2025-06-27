// kardgame.js

// 全てのカードデータ
const allCards = [
    { name: "拳で", effect: "5ダメージを与える", action: (isPlayer) => isPlayer ? damageEnemy(5) : damagePlayer(5), count: 2, icon: '👊', type: 'attack' },
    { name: "ビンタ", effect: "3ダメージを与える", action: (isPlayer) => isPlayer ? damageEnemy(3) : damagePlayer(3), count: 3, icon: '🖐️', type: 'attack' },
    { name: "デコピン", effect: "1ダメージを与える", action: (isPlayer) => isPlayer ? damageEnemy(1) : damagePlayer(1), count: 3, icon: '👉', type: 'attack' },
    { name: "ぼろぼろの鎧", effect: "2ターンの間、ダメージを1軽減する", action: (isPlayer) => {
        const targetState = isPlayer ? gameState.player : gameState.enemy;
        const targetElement = isPlayer ? document.querySelector('.player p') : document.querySelector('.enemy p');
        const statusId = isPlayer ? 'playerArmor' : 'enemyArmor';

        // すでに防御状態の場合は効果を発動しない
        if (targetState.armor > 0 || targetState.shield > 0) {
            return "しかし、すでに守れているため、効果が打ち消されてしまった！";
        }
        targetState.armor = 2;
        updateStatusDisplay(targetElement, '鎧', 'gray', statusId);
        return isPlayer ? "防御態勢！次のダメージを1軽減します" : "ライバルが防御態勢に入りました";
    }, count: 2, icon: '🪖', type: 'defense' },
    { name: "転んでしまった", effect: "自分に1ダメージ", action: (isPlayer) => {
        showBadCardEffect();
        return isPlayer ? "やってしまった..." + damagePlayer(1) : "やってしまった..." + damageEnemy(1);
    }, count: 1, isBad: true, icon: '💥', type: 'bad' },
    { name: "頭をぶつけてしまった", effect: "自分に3ダメージ", action: (isPlayer) => {
        showBadCardEffect();
        return isPlayer ? "やってしまった..." + damagePlayer(3) : "やってしまった..." + damageEnemy(3);
    }, count: 1, isBad: true, icon: '🤕', type: 'bad' },
    { name: "普通のポーション", effect: "HPを3回復", action: (isPlayer) => isPlayer ? "ラッキー♪ " + healPlayer(3) : "ラッキー♪ " + healEnemy(3), count: 2, heal: true, icon: '🧪', type: 'heal' },
    { name: "良いポーション", effect: "HPを5回復", action: (isPlayer) => {
        gameState.usedSpecialCards.push("HP5回復");
        return isPlayer ? "ラッキー♪ " + healPlayer(5) : "ラッキー♪ " + healEnemy(5);
    }, count: 2, heal: true, rare: true, special: true, icon: '✨🧪', type: 'heal' },
    { name: "サボり魔", effect: "効果はなかった", action: () => {
        showBadCardEffect();
        return "ハズレ...何も効果がなかった" + noEffect();
    }, count: 1, isBad: true, icon: '👻', type: 'bad' },
    { name: "盾よ守れ！", effect: "2ターンの間、ダメージを2軽減", action: (isPlayer) => {
        const targetState = isPlayer ? gameState.player : gameState.enemy;
        const targetElement = isPlayer ? document.querySelector('.player p') : document.querySelector('.enemy p');
        const statusId = isPlayer ? 'playerShield' : 'enemyShield';

        // すでに防御状態の場合は効果を発動しない
        if (targetState.shield > 0 || targetState.armor > 0) {
            return "しかし、すでに守れているため、効果が打ち消されてしまった！";
        }
        targetState.shield = 2;
        updateStatusDisplay(targetElement, '盾', 'blue', statusId, 'bold');
        gameState.usedSpecialCards.push("防御");
        return isPlayer ? "防御態勢！次のダメージを2軽減します" : "ライバルが防御態勢に入りました";
    }, count: 2, special: true, icon: '🛡️', type: 'rare' }, // レアカードに分類
    { name: "毒物混入", effect: "毒を与える", action: (isPlayer) => {
        const targetState = isPlayer ? gameState.enemy : gameState.player;
        const targetElement = isPlayer ? document.querySelector('.enemy p') : document.querySelector('.player p');
        const statusId = isPlayer ? 'enemyPoison' : 'playerPoison';

        targetState.poison = 2;
        updateStatusDisplay(targetElement, '毒', 'purple', statusId);
        gameState.usedSpecialCards.push("毒");
        return isPlayer ? "ライバルに毒を与えました！" : "あなたは毒を受けました！";
    }, count: 1, rare: true, special: true, icon: '☠️', type: 'rare' }, // レアカードに分類
    { name: "ぶん殴る", effect: "10ダメージを与える", action: (isPlayer) => isPlayer ? damageEnemy(10) : damagePlayer(10), count: 1, rare: true, icon: '💢', type: 'rare' }, // レアカードに分類
    // レジェンドカード (count: 0で、chanceに基づいて抽選で出現)
    { name: "最高のポーション", effect: "HPが全回復", action: (isPlayer) => {
        const targetState = isPlayer ? gameState.player : gameState.enemy;
        const targetElement = isPlayer ? document.querySelector('.player') : document.querySelector('.enemy');
        targetState.hp = gameState.maxHP;
        animateHpChange(targetElement, '#66ff66');
        return "✨レジェンドカード✨ " + (isPlayer ? "あなたのHPが全回復しました！" : "ライバルのHPが全回復しました！");
    }, count: 0, legendary: true, chance: 0.05, icon: '💖', type: 'legendary' },
    { name: "あべこべ", effect: "HP入れ替え", action: (isPlayer) => {
        const tempHP = gameState.player.hp;
        gameState.player.hp = gameState.enemy.hp;
        gameState.enemy.hp = tempHP;
        animateHpChange(document.querySelector('.player'), '#ffcc00');
        animateHpChange(document.querySelector('.enemy'), '#ffcc00');
        showBadCardEffect(); // 入れ替えはプレイヤーにとって必ずしも良いとは限らないため
        return "あなたとライバルのHPが入れ替わりました！";
    }, count: 1, isBad: true, icon: '🔄', type: 'legendary' }, // レジェンドカードに分類
    { name: "封じちゃえ ♪", effect: "行動を封じる", action: (isPlayer) => {
        const selfState = isPlayer ? gameState.player : gameState.enemy;
        const opponentState = isPlayer ? gameState.enemy : gameState.player;
        const selfElement = isPlayer ? document.querySelector('.player p') : document.querySelector('.enemy p');
        const opponentElement = isPlayer ? document.querySelector('.enemy p') : document.querySelector('.player p');
        const selfStatusId = isPlayer ? 'playerSealed' : 'enemySealed';
        const opponentStatusId = isPlayer ? 'enemySealed' : 'playerSealed';

        opponentState.sealed = 2;
        updateStatusDisplay(opponentElement, '封', 'red', opponentStatusId);
        selfState.extraTurns = 2; // 行動を封じた側が追加行動
        return "✨レジェンドカード✨ " + (isPlayer ? "ライバルの行動を2ターン封じました！あなたは追加で2回行動できます！" : "あなたの行動が2ターン封じられました！ライバルは追加で2回行動します！");
    }, count: 0, legendary: true, chance: 0.02, icon: '🔒', type: 'legendary' },
    { name: "一撃必殺", effect: "一撃必殺", action: (isPlayer) => {
        const targetState = isPlayer ? gameState.enemy : gameState.player;
        const targetElement = isPlayer ? document.querySelector('.enemy') : document.querySelector('.player');
        targetState.hp = 0;
        animateHpChange(targetElement, '#ff0000');
        return "✨伝説のカード✨ 一撃必殺！" + (isPlayer ? "ライバルのHPが0になりました！" : "あなたのHPが0になりました！");
    }, count: 0, legendary: true, chance: 0.003, icon: '🎯', type: 'legendary' },
    { name: "神のご加護？", effect: "2ラウンド無敵", action: (isPlayer) => {
        const targetState = isPlayer ? gameState.player : gameState.enemy;
        const targetElement = isPlayer ? document.querySelector('.player p') : document.querySelector('.enemy p');
        const statusId = isPlayer ? 'playerInvincible' : 'enemyInvincible';
        targetState.invincible = 2; // 2ラウンド無敵
        updateStatusDisplay(targetElement, '無', 'gold', statusId, 'bold');
        return "✨伝説のカード✨ " + (isPlayer ? "あなたは2ラウンドの間無敵になりました！" : "ライバルは2ラウンドの間無敵になりました！");
    }, count: 0, legendary: true, chance: 0.005, icon: '😇', type: 'legendary' }
];

// ゲームの状態を管理するオブジェクト
let gameState = {
    maxHP: 30, // デフォルト値
    numCardsInHand: 5, // 新しい設定: 手札の枚数 (デフォルト5枚)
    enableHealCards: true, // 新しい設定: 回復カードの有効/無効 (デフォルトON)
    enableBadCards: true,  // 新しい設定: ハプニングカードの有効/無効 (デフォルトON)
    enableRareCards: true, // 新しい設定: レアカードの有効/無効 (デフォルトON)
    player: {
        hp: 30,
        shield: 0,
        poison: 0,
        armor: 0,
        sealed: 0,
        extraTurns: 0,
        invincible: 0,
    },
    enemy: {
        hp: 30,
        shield: 0,
        poison: 0,
        armor: 0,
        sealed: 0,
        extraTurns: 0,
        invincible: 0,
    },
    isPlayerTurn: true,
    remainingCards: [],
    currentRound: 1,
    isAnimating: false,
    usedRareCards: [], // レアカードの効果名（例: "次のダメージを2軽減"）
    usedSpecialCards: [], // 特殊カードの効果名（例: "防御", "毒", "HP5回復"）
    usedLegendaryCards: false, // レジェンドカードが一度でも引かれたかどうか
    lastPlayedCardName: "" // 直前に使用されたカードの名前
};

// DOM要素
const playerHpElement = document.getElementById('playerHp');
const enemyHpElement = document.getElementById('enemyHp');
const playerSkullElement = document.getElementById('playerSkull');
const enemySkullElement = document.getElementById('enemySkull');
const playerElement = document.querySelector('.player');
const enemyElement = document.querySelector('.enemy');
const messageElement = document.getElementById('message');
const cardsContainer = document.getElementById('cards');
const gameSettingsScreen = document.getElementById('gameSettings'); // ID変更
const gameAreaScreen = document.getElementById('gameArea');
const quitButton = document.getElementById('quitButton');
const cardInfoPopup = document.getElementById('cardInfo');
const confirmQuitPopup = document.getElementById('confirmQuit');
const roundNotification = document.getElementById('roundNotification');
const overlay = document.getElementById('overlay'); // オーバーレイ要素
const gameSetNotification = document.getElementById('gameSetNotification'); // ゲームセット通知要素

// 新しく追加するDOM要素
const startScreen = document.getElementById('startScreen');
const startNewGameButton = document.getElementById('startNewGame');
const showCardsOnStartButton = document.getElementById('showCardsOnStart');
const showCardsOnSettingsButton = document.getElementById('showCardsOnSettings'); // 新しいボタン


// ヘルパー関数: HP変更時の背景色アニメーション
function animateHpChange(element, color) {
    element.style.backgroundColor = color;
    setTimeout(() => {
        element.style.backgroundColor = '#eee';
    }, 500);
}

// ヘルパー関数: 状態表示の追加/更新/削除
function updateStatusDisplay(parent, text, color, id, fontWeight = 'normal') {
    let statusElement = document.getElementById(id);
    if (!statusElement) {
        statusElement = document.createElement('span');
        statusElement.id = id;
        statusElement.style.color = color;
        statusElement.style.fontWeight = fontWeight;
        parent.appendChild(statusElement);
    }
    statusElement.textContent = ` ${text}`; // スペースを入れて見やすく
    if (text === '') { // テキストが空なら削除
        statusElement.remove();
    }
}


// HP表示の更新
function updateHP() {
    playerHpElement.textContent = gameState.player.hp;
    enemyHpElement.textContent = gameState.enemy.hp;

    // HPが5以下になったら赤色で表示し、背景色も変更
    if (gameState.player.hp <= 5 && gameState.player.hp > 0) {
        playerHpElement.style.color = 'red';
        playerElement.classList.add('danger');
    } else {
        playerHpElement.style.color = '';
        playerElement.classList.remove('danger');
    }

    if (gameState.enemy.hp <= 5 && gameState.enemy.hp > 0) {
        enemyHpElement.style.color = 'red';
        enemyElement.classList.add('danger');
    } else {
        enemyHpElement.style.color = '';
        enemyElement.classList.remove('danger');
    }
}

// プレイヤーへのダメージ
function damagePlayer(amount) {
    // 無敵効果の適用
    if (gameState.player.invincible > 0) {
        return `あなたは無敵状態のため、ダメージを受けませんでした！`;
    }

    // シールド効果の適用
    if (gameState.player.shield > 0) {
        const reducedAmount = Math.max(0, amount - 2);
        gameState.player.shield--;
        if (gameState.player.shield === 0) {
            updateStatusDisplay(document.querySelector('.player p'), '', 'blue', 'playerShield');
        }
        amount = reducedAmount;
    } else if (gameState.player.armor > 0) { // 鎧効果の適用
        const reducedAmount = Math.max(0, amount - 1);
        gameState.player.armor--;
        if (gameState.player.armor === 0) {
            updateStatusDisplay(document.querySelector('.player p'), '', 'gray', 'playerArmor');
        }
        amount = reducedAmount;
    }

    const oldHP = gameState.player.hp;
    gameState.player.hp = Math.max(0, gameState.player.hp - amount);
    animateHpChange(playerElement, '#ff6666');

    return `あなたに${amount}ダメージ！`;
}

// エネミーへのダメージ
function damageEnemy(amount) {
    // 無敵効果の適用
    if (gameState.enemy.invincible > 0) {
        return `ライバルは無敵状態のため、ダメージを受けませんでした！`;
    }

    // シールド効果の適用
    if (gameState.enemy.shield > 0) {
        const reducedAmount = Math.max(0, amount - 2);
        gameState.enemy.shield--;
        if (gameState.enemy.shield === 0) {
            updateStatusDisplay(document.querySelector('.enemy p'), '', 'blue', 'enemyShield');
        }
        amount = reducedAmount;
    } else if (gameState.enemy.armor > 0) { // 鎧効果の適用
        const reducedAmount = Math.max(0, amount - 1);
        gameState.enemy.armor--;
        if (gameState.enemy.armor === 0) {
            updateStatusDisplay(document.querySelector('.enemy p'), '', 'gray', 'enemyArmor');
        }
        amount = reducedAmount;
    }

    const oldHP = gameState.enemy.hp;
    gameState.enemy.hp = Math.max(0, gameState.enemy.hp - amount);
    animateHpChange(enemyElement, '#ff6666');

    return `ライバルに${amount}ダメージ！`;
}

// プレイヤーの回復
function healPlayer(amount) {
    gameState.player.hp = Math.min(gameState.maxHP, gameState.player.hp + amount);
    animateHpChange(playerElement, '#66ff66');
    return `あなたのHPが${amount}回復！`;
}

// エネミーの回復
function healEnemy(amount) {
    gameState.enemy.hp = Math.min(gameState.maxHP, gameState.enemy.hp + amount);
    animateHpChange(enemyElement, '#66ff66');
    return `ライバルのHPが${amount}回復！`;
}

// 効果なし
function noEffect() {
    messageElement.style.backgroundColor = '#cccccc';
    setTimeout(() => {
        messageElement.style.backgroundColor = '#e8f5e9';
    }, 500);
    return "";
}

// ハズレカード演出
function showBadCardEffect() {
    cardsContainer.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
    cardsContainer.style.boxShadow = '0 0 10px red';
    cardsContainer.style.transition = 'all 0.3s';

    const badLuckSpan = document.createElement('span');
    badLuckSpan.textContent = '【ハズレ】';
    badLuckSpan.style.color = 'red';
    badLuckSpan.style.fontWeight = 'bold';
    badLuckSpan.style.marginRight = '5px';

    if (messageElement.firstChild) {
        messageElement.insertBefore(badLuckSpan, messageElement.firstChild);
    } else {
        messageElement.appendChild(badLuckSpan);
    }

    setTimeout(() => {
        cardsContainer.style.backgroundColor = '';
        cardsContainer.style.boxShadow = '';
        if (badLuckSpan.parentNode === messageElement) {
            messageElement.removeChild(badLuckSpan);
        }
    }, 1000);
}

// ラウンド通知表示
function showRoundNotification(round) {
    roundNotification.textContent = `${round}ラウンド目`;
    roundNotification.style.display = 'block';
    overlay.style.display = 'block'; // オーバーレイ表示

    setTimeout(() => {
        roundNotification.style.display = 'none';
        overlay.style.display = 'none'; // オーバーレイ非表示
        updateRoundDisplay();
    }, 2000);
}

// ラウンド表示更新
function updateRoundDisplay() {
    let roundDisplay = document.getElementById('currentRoundDisplay');
    if (!roundDisplay) {
        roundDisplay = document.createElement('div');
        roundDisplay.id = 'currentRoundDisplay';
        document.getElementById('gameContainer').appendChild(roundDisplay);
    }
    roundDisplay.textContent = `${gameState.currentRound}ラウンド目`;
}

// カードをシャッフルし、手札を生成
function shuffleCards() {
    let deck = [];
    // レジェンドカードは常に抽選対象
    const legendaryCards = allCards.filter(card => card.legendary);
    
    // 設定に基づいてデッキを構築
    const filteredCards = allCards.filter(card => {
        // レジェンドカードはここでフィルタリングしない (後で個別に抽選するため)
        if (card.legendary) return false;

        // 回復カードが無効なら除外
        if (card.type === 'heal' && !gameState.enableHealCards) return false;
        // ハプニングカードが無効なら除外
        if (card.type === 'bad' && !gameState.enableBadCards) return false;
        // レアカードが無効なら除外 (typeが'rare'またはrareプロパティを持つがlegendaryではないもの)
        if (card.type === 'rare' && !gameState.enableRareCards) return false;

        return true; // 条件を満たせば含める
    });

    // フィルタリングされたカードをcountの数だけデッキに追加
    filteredCards.forEach(card => {
        for (let i = 0; i < card.count; i++) {
            deck.push({ ...card });
        }
    });

    // レジェンドカードの抽選
    if (!gameState.usedLegendaryCards) {
        legendaryCards.forEach(card => {
            if (Math.random() < card.chance) {
                deck.push({ ...card });
            }
        });
    }

    // デッキをシャッフル
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // デッキが空の場合のリカバリー
    if (deck.length === 0) {
        console.warn("デッキが空になりました。デフォルトの攻撃カードを追加します。");
        deck.push(allCards.find(c => c.name === "拳で"));
        deck.push(allCards.find(c => c.name === "ビンタ"));
    }

    // ダメージカードが最低2枚、回復カードが最低1枚含まれるまで再シャッフル（最大試行回数を設ける）
    // ただし、設定で回復カードやハプニングカードがOFFの場合、この条件は緩和されるべき
    let damageCardCount = 0;
    let healCardCount = 0;
    let attempts = 0;
    const maxAttempts = 100;

    let tempRemainingCards = []; // 一時的に選ばれたカード
    do {
        // デッキから手札の枚数分だけスライス
        const currentHandSize = Math.min(gameState.numCardsInHand, deck.length);
        tempRemainingCards = deck.slice(0, currentHandSize);

        damageCardCount = tempRemainingCards.filter(card => card.type === 'attack').length;
        healCardCount = tempRemainingCards.filter(card => card.type === 'heal').length;
        attempts++;

        // 設定がOFFの場合はそのカードの必須条件を緩和
        const minDamageCardsMet = damageCardCount >= 2;
        const minHealCardsMet = !gameState.enableHealCards || healCardCount >= 1; // 回復OFFなら回復カード不要

        if (minDamageCardsMet && minHealCardsMet) {
            break; // 条件を満たしたらループを抜ける
        }

        // 条件を満たさない場合は、デッキを再シャッフルして再試行
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        if (attempts >= maxAttempts) {
            console.warn("手札の組み合わせ生成に失敗しました。現在の手札で続行します。");
            break;
        }
    } while (true); // 無限ループ防止は attempts で制御

    gameState.remainingCards = tempRemainingCards;
    renderCards();
}

// カードの表示
function renderCards() {
    cardsContainer.innerHTML = '';
    gameState.remainingCards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.textContent = '?'; // カードの裏面
        cardElement.dataset.index = index; // 選択されたカードのインデックスを保持
        cardElement.addEventListener('click', () => {
            // 選択されたカードをハイライト
            document.querySelectorAll('.card').forEach(c => {
                c.classList.remove('selected');
            });
            cardElement.classList.add('selected');

            // 少し遅延させてからカードを処理（選択エフェクトを見せるため）
            setTimeout(() => {
                playCard(parseInt(cardElement.dataset.index));
            }, 300);
        });
        cardsContainer.appendChild(cardElement);
    });
}

// プレイヤーがカードを使用
function playCard(index) {
    if (!gameState.isPlayerTurn || gameState.isAnimating) return;
    gameState.isAnimating = true;

    // ターン開始時の状態減少処理（無敵、毒、封印）
    applyTurnStartEffects(true); // プレイヤーのターンなのでtrue

    // 封印されている場合はスキップ
    if (gameState.player.sealed > 0) {
        gameState.player.sealed--;
        if (gameState.player.sealed === 0) {
            updateStatusDisplay(document.querySelector('.player p'), '', 'red', 'playerSealed');
        }
        messageElement.innerHTML = "あなたは行動を封じられています！このターンはスキップします。";
        updateHP();

        setTimeout(() => {
            gameState.isPlayerTurn = false;
            gameState.isAnimating = false;
            enemyTurn();
        }, 2000);
        return;
    }

    // ターン開始時の毒ダメージ処理
    if (gameState.player.poison > 0) {
        messageElement.innerHTML = "毒のダメージ！あなたに1ダメージ！";
        gameState.player.hp = Math.max(0, gameState.player.hp - 1);
        gameState.player.poison--;
        if (gameState.player.poison === 0) {
            updateStatusDisplay(document.querySelector('.player p'), '', 'purple', 'playerPoison');
        }
        updateHP();

        if (checkGameEnd()) {
            gameState.isAnimating = false;
            return;
        }

        setTimeout(() => {
            messageElement.textContent = `あなたのターンです。カードを選んでください。`;
            continuePlayerTurn(index); // 毒ダメージ後、引き続きカードを使用
        }, 1500);
        return;
    }

    continuePlayerTurn(index);
}

// プレイヤーがカードを使用する実際のロジック
function continuePlayerTurn(index) {
    const card = gameState.remainingCards[index];
    gameState.lastPlayedCardName = card.name; // 最後に使われたカード名を保存
    messageElement.textContent = `あなたはカードを引いた！さぁ結果は...`;
    gameState.remainingCards.splice(index, 1); // 使用したカードを削除

    // レアカードの場合、使用済みリストに追加 (3ラウンド後に再出現可能にするための簡易ロジック)
    if (card.rare) {
        gameState.usedRareCards.push(card.effect);
        setTimeout(() => { // 3ラウンド後を模倣 (実際はラウンドカウントで判定すべきだが簡易的に)
            const idx = gameState.usedRareCards.indexOf(card.effect);
            if (idx > -1) gameState.usedRareCards.splice(idx, 1);
        }, 3000 * 3); // 約9秒後に再出現
    }

    // 特殊カードの場合、使用済みリストに追加
    if (card.special) {
        const specialEffectName = card.effect.includes("ダメージを2軽減") ? "防御" :
                                  card.effect.includes("毒を与える") ? "毒" :
                                  card.effect.includes("HPを5回復") ? "HP5回復" : "";
        if (specialEffectName) {
            gameState.usedSpecialCards.push(specialEffectName);
            setTimeout(() => { // 3ラウンド後を模倣
                const idx = gameState.usedSpecialCards.indexOf(specialEffectName);
                if (idx > -1) gameState.usedSpecialCards.splice(idx, 1);
            }, 3000 * 3);
        }
    }

    // レジェンドカードの場合、使用済みフラグを立てる
    if (card.legendary) {
        gameState.usedLegendaryCards = true;
    }

    renderCards(); // カード表示を更新
    setTimeout(() => {
        const message = card.action(true); // プレイヤーがカードを使用
        if (message) {
            messageElement.innerHTML = `「${card.name}」だ！${message}`;
        }
        updateHP();

        if (checkGameEnd()) {
            gameState.isAnimating = false;
            return;
        }

        // 追加ターンがある場合
        if (gameState.player.extraTurns > 0) {
            gameState.player.extraTurns--;
            gameState.isPlayerTurn = true; // プレイヤーのターンを継続
            setTimeout(() => {
                gameState.isAnimating = false;
                messageElement.textContent = "追加ターン！あなたのターンです。カードを選んでください。";
                if (gameState.remainingCards.length === 0) { // カードがなくなったら次のラウンドへ
                    gameState.currentRound++;
                    showRoundNotification(gameState.currentRound);
                    setTimeout(() => {
                        shuffleCards();
                    }, 2500);
                }
            }, 2000);
        } else {
            gameState.isPlayerTurn = false; // 敵のターンへ
            setTimeout(() => {
                gameState.isAnimating = false;
                if (gameState.remainingCards.length === 0) { // カードがなくなったら次のラウンドへ
                    gameState.currentRound++;
                    showRoundNotification(gameState.currentRound);
                    setTimeout(() => {
                        shuffleCards();
                        enemyTurn();
                    }, 2500);
                } else {
                    enemyTurn();
                }
            }, 2000);
        }
    }, 2000); // メッセージ表示後、2秒待ってから効果発動
}

// エネミーのターン
function enemyTurn() {
    messageElement.textContent = `ライバルのターンです。`;

    // ターン開始時の状態減少処理（無敵、毒、封印）
    applyTurnStartEffects(false); // エネミーのターンなのでfalse

    // 封印されている場合はスキップ
    if (gameState.enemy.sealed > 0) {
        gameState.enemy.sealed--;
        if (gameState.enemy.sealed === 0) {
            updateStatusDisplay(document.querySelector('.enemy p'), '', 'red', 'enemySealed');
        }
        messageElement.innerHTML = "ライバルは行動を封じられています！このターンはスキップします。";
        updateHP();

        setTimeout(() => {
            gameState.isPlayerTurn = true;
            messageElement.textContent = "あなたのターンです。カードを選んでください。";
            if (gameState.remainingCards.length === 0) {
                gameState.currentRound++;
                showRoundNotification(gameState.currentRound);
                setTimeout(() => {
                    shuffleCards();
                }, 2500);
            }
        }, 1500);
        return;
    }

    // ターン開始時の毒ダメージ処理
    if (gameState.enemy.poison > 0) {
        messageElement.innerHTML = "毒のダメージ！ライバルに1ダメージ！";
        gameState.enemy.hp = Math.max(0, gameState.enemy.hp - 1);
        gameState.enemy.poison--;
        if (gameState.enemy.poison === 0) {
            updateStatusDisplay(document.querySelector('.enemy p'), '', 'purple', 'enemyPoison');
        }
        updateHP();

        if (checkGameEnd()) {
            return;
        }

        setTimeout(() => {
            messageElement.textContent = `ライバルのターンです。`;
            setTimeout(() => {
                continueEnemyTurn(); // 毒ダメージ後、引き続きカードを使用
            }, 1000);
        }, 1500);
        return;
    }

    setTimeout(() => {
        continueEnemyTurn();
    }, 1000); // 少し待ってからカード選択
}

// エネミーがカードを使用する実際のロジック
function continueEnemyTurn() {
    if (gameState.remainingCards.length === 0) {
        gameState.currentRound++;
        showRoundNotification(gameState.currentRound);
        setTimeout(() => {
            shuffleCards();
            setTimeout(performEnemyCardAction, 2500); // カードシャッフル後、敵の行動へ
        }, 2500);
        return;
    }
    performEnemyCardAction();
}

function performEnemyCardAction() {
    let randomIndex = Math.floor(Math.random() * gameState.remainingCards.length);
    let card = gameState.remainingCards[randomIndex];
    gameState.lastPlayedCardName = card.name; // 最後に使われたカード名を保存
    messageElement.textContent = `ライバルはカードを引いた！さぁ結果は...`;
    gameState.remainingCards.splice(randomIndex, 1);

    // レアカードの場合、使用済みリストに追加 (3ラウンド後に再出現可能にするための簡易ロジック)
    if (card.rare) {
        gameState.usedRareCards.push(card.effect);
        setTimeout(() => {
            const idx = gameState.usedRareCards.indexOf(card.effect);
            if (idx > -1) gameState.usedRareCards.splice(idx, 1);
        }, 3000 * 3);
    }

    // 特殊カードの場合、使用済みリストに追加
    if (card.special) {
        const specialEffectName = card.effect.includes("ダメージを2軽減") ? "防御" :
                                  card.effect.includes("毒を与える") ? "毒" :
                                  card.effect.includes("HPを5回復") ? "HP5回復" : "";
        if (specialEffectName) {
            gameState.usedSpecialCards.push(specialEffectName);
            setTimeout(() => {
                const idx = gameState.usedSpecialCards.indexOf(specialEffectName);
                if (idx > -1) gameState.usedSpecialCards.splice(idx, 1);
            }, 3000 * 3);
        }
    }

    // レジェンドカードの場合、使用済みフラグを立てる
    if (card.legendary) {
        gameState.usedLegendaryCards = true;
    }

    renderCards();
    setTimeout(() => {
        const message = card.action(false); // エネミーがカードを使用
        if (message) {
            messageElement.innerHTML = `ライバルのターン: 「${card.name}」だ！${message}`;
        }
        updateHP();

        if (checkGameEnd()) {
            return;
        }

        // 追加ターンがある場合
        if (gameState.enemy.extraTurns > 0) {
            gameState.enemy.extraTurns--;
            gameState.isPlayerTurn = false; // エネミーのターンを継続
            setTimeout(() => {
                messageElement.textContent = "ライバルの追加ターン！";
                setTimeout(() => {
                    if (gameState.remainingCards.length === 0) {
                        gameState.currentRound++;
                        showRoundNotification(gameState.currentRound);
                        setTimeout(() => {
                            shuffleCards();
                            enemyTurn();
                        }, 2500);
                    } else {
                        enemyTurn();
                    }
                }, 1500);
            }, 2000);
        } else {
            gameState.isPlayerTurn = true; // プレイヤーのターンへ
            setTimeout(() => {
                if (gameState.remainingCards.length === 0) {
                    gameState.currentRound++;
                    showRoundNotification(gameState.currentRound);
                    setTimeout(() => {
                        shuffleCards();
                        messageElement.textContent = "新しいターンが始まりました。あなたのターンです。カードを選んでください。";
                    }, 2500);
                } else {
                    setTimeout(() => {
                        messageElement.textContent = "あなたのターンです。カードを選んでください。";
                    }, 1500);
                }
            }, 2000);
        }
    }, 1500); // メッセージ表示後、1.5秒待ってから効果発動
}


// ターン開始時に適用される効果 (無敵カウントダウン、毒ダメージ)
function applyTurnStartEffects(isPlayerTurn) {
    const targetState = isPlayerTurn ? gameState.player : gameState.enemy;
    const opponentState = isPlayerTurn ? gameState.enemy : gameState.player;
    const targetElement = isPlayerTurn ? document.querySelector('.player p') : document.querySelector('.enemy p');
    const opponentElement = isPlayerTurn ? document.querySelector('.enemy p') : document.querySelector('.player p');

    // 無敵効果の減少
    if (targetState.invincible > 0) {
        targetState.invincible--;
        if (targetState.invincible === 0) {
            updateStatusDisplay(targetElement, '', 'gold', isPlayerTurn ? 'playerInvincible' : 'enemyInvincible');
        }
    }
    if (opponentState.invincible > 0) {
        opponentState.invincible--;
        if (opponentState.invincible === 0) {
            updateStatusDisplay(opponentElement, '', 'gold', isPlayerTurn ? 'enemyInvincible' : 'playerInvincible');
        }
    }
}


// 結果画面の表示
function showResultScreen(isVictory) {
    gameAreaScreen.style.display = 'none';
    quitButton.style.display = 'none';
    overlay.style.display = 'block'; // オーバーレイ表示

    let resultScreen = document.getElementById('resultScreen');
    if (!resultScreen) {
        resultScreen = document.createElement('div');
        resultScreen.id = 'resultScreen';
        resultScreen.className = 'result-screen'; // CSSクラスを適用
        document.getElementById('gameContainer').appendChild(resultScreen);
    } else {
        resultScreen.style.display = 'block';
    }

    let resultContent = '';

    if (isVictory) {
        resultContent += `<h2 style="color: #4CAF50;">Your Victory!</h2>`;
        // 自滅カードで相手が敗北した場合
        if (['転んでしまった', '頭をぶつけてしまった', 'サボり魔', 'あべこべ'].includes(gameState.lastPlayedCardName) && !gameState.isPlayerTurn) {
            resultContent += `<p>相手は自滅した。ラッキー ♪</p>`;
        } else {
            resultContent += `<p>「${gameState.lastPlayedCardName}」でとどめをさした！</p>`;
        }
    } else {
        resultContent += `<h2 style="color: #f44336;">Game Over</h2>`;
        // 自滅カードで自分が敗北した場合
        if (['転んでしまった', '頭をぶつけてしまった', 'サボり魔', 'あべこべ'].includes(gameState.lastPlayedCardName) && gameState.isPlayerTurn) {
             resultContent += `<p>ハズレカードを引き、自滅してしまった...</p>`;
        } else {
            resultContent += `<p>「${gameState.lastPlayedCardName}」でやられてしまった！</p>`;
        }
    }

    resultContent += `<div class="button-group">`;
    resultContent += `<button id="playAgainBtn" class="start-game-button">もう一度プレイ</button>`; // CSSクラスを再利用
    resultContent += `<button id="changeHpBtn" class="show-cards-button">ゲーム設定</button>`; // HP変更からゲーム設定に変更
    resultContent += `</div>`;

    resultScreen.innerHTML = resultContent;

    document.getElementById('playAgainBtn').addEventListener('click', () => {
        resultScreen.style.display = 'none';
        overlay.style.display = 'none';
        gameAreaScreen.style.display = 'flex'; // flexに変更
        quitButton.style.display = 'block';
        resetGame();
    });

    document.getElementById('changeHpBtn').addEventListener('click', () => {
        resultScreen.style.display = 'none';
        overlay.style.display = 'none';
        gameSettingsScreen.style.display = 'flex'; // ゲーム設定画面を表示
        resetGame(); // ゲーム設定画面に戻る際もリセット
    });
}

// ゲーム終了判定
function checkGameEnd() {
    if (gameState.player.hp <= 0 || gameState.enemy.hp <= 0) {
        // Skullアイコン表示
        if (gameState.player.hp <= 0) {
            playerSkullElement.style.display = 'inline';
            playerHpElement.textContent = "";
        } else {
            enemySkullElement.style.display = 'inline';
            enemyHpElement.textContent = "";
        }

        // Game Set通知を表示
        gameSetNotification.style.display = 'block';
        overlay.style.display = 'block'; // オーバーレイ表示

        setTimeout(() => {
            gameSetNotification.style.display = 'none'; // 通知を非表示
            showResultScreen(gameState.player.hp > 0); // プレイヤーのHPが0より大きければ勝利
        }, 1500);

        return true;
    }
    updateHP();
    return false;
}

// ゲームのリセット
function resetGame() {
    // 現在の設定を維持しつつ、ゲーム状態を初期化
    gameState = {
        maxHP: gameState.maxHP,
        numCardsInHand: gameState.numCardsInHand,
        enableHealCards: gameState.enableHealCards,
        enableBadCards: gameState.enableBadCards,
        enableRareCards: gameState.enableRareCards,
        player: {
            hp: gameState.maxHP,
            shield: 0,
            poison: 0,
            armor: 0,
            sealed: 0,
            extraTurns: 0,
            invincible: 0,
        },
        enemy: {
            hp: gameState.maxHP,
            shield: 0,
            poison: 0,
            armor: 0,
            sealed: 0,
            extraTurns: 0,
            invincible: 0,
        },
        isPlayerTurn: true,
        remainingCards: [],
        currentRound: 1,
        isAnimating: false,
        usedRareCards: [],
        usedSpecialCards: [],
        usedLegendaryCards: false,
        lastPlayedCardName: ""
    };

    // 状態表示をクリア
    updateStatusDisplay(document.querySelector('.player p'), '', 'purple', 'playerPoison');
    updateStatusDisplay(document.querySelector('.enemy p'), '', 'purple', 'enemyPoison');
    updateStatusDisplay(document.querySelector('.player p'), '', 'red', 'playerSealed');
    updateStatusDisplay(document.querySelector('.enemy p'), '', 'red', 'enemySealed');
    updateStatusDisplay(document.querySelector('.player p'), '', 'blue', 'playerShield');
    updateStatusDisplay(document.querySelector('.enemy p'), '', 'blue', 'enemyShield');
    updateStatusDisplay(document.querySelector('.player p'), '', 'gray', 'playerArmor');
    updateStatusDisplay(document.querySelector('.enemy p'), '', 'gray', 'enemyArmor');
    updateStatusDisplay(document.querySelector('.player p'), '', 'gold', 'playerInvincible');
    updateStatusDisplay(document.querySelector('.enemy p'), '', 'gold', 'enemyInvincible');

    playerSkullElement.style.display = 'none';
    enemySkullElement.style.display = 'none';
    playerHpElement.style.color = '';
    enemyHpElement.style.color = '';

    updateRoundDisplay(); // ラウンド表示を更新
    // shuffleCards(); // 設定画面に戻った際にすぐシャッフルしない
    updateHP(); // HP表示を更新
    messageElement.textContent = "あなたのターンです。カードを選んでください。"; // これはゲームエリアの初期メッセージなので、設定画面では表示されない
}


// イベントリスナーのセットアップ
document.addEventListener('DOMContentLoaded', () => {
    // 画面の初期表示設定
    startScreen.style.display = 'flex'; // ゲーム開始画面を初期表示
    gameSettingsScreen.style.display = 'none'; // HP選択画面をゲーム設定画面に
    gameAreaScreen.style.display = 'none';
    quitButton.style.display = 'none'; // 開始画面では対戦終了ボタンは非表示
    document.getElementById('resultScreen').style.display = 'none'; // 結果画面も非表示に

    // HP選択
    document.querySelectorAll('.hp-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.hp-option').forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            gameState.maxHP = parseInt(this.getAttribute('data-hp'));
        });
    });

    // 手札枚数選択
    document.querySelectorAll('.hand-size-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.hand-size-option').forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            gameState.numCardsInHand = parseInt(this.getAttribute('data-cards'));
        });
    });

    // カード種類ON/OFFトグル
    document.getElementById('toggleHealCards').addEventListener('change', function() {
        gameState.enableHealCards = this.checked;
    });
    document.getElementById('toggleBadCards').addEventListener('change', function() {
        gameState.enableBadCards = this.checked;
    });
    document.getElementById('toggleRareCards').addEventListener('change', function() {
        gameState.enableRareCards = this.checked;
    });


    // 対戦を終わらせるボタン
    quitButton.addEventListener('click', () => {
        confirmQuitPopup.style.display = 'block';
        overlay.style.display = 'block';
    });

    // 対戦終了確認（YES）
    document.getElementById('quitYes').addEventListener('click', () => {
        confirmQuitPopup.style.display = 'none';
        overlay.style.display = 'none';
        gameAreaScreen.style.display = 'none';
        quitButton.style.display = 'none';
        gameSettingsScreen.style.display = 'flex'; // ゲーム設定画面に戻る
        resetGame(); // 設定画面に戻る際にゲーム状態をリセット
    });

    // 対戦終了確認（NO）
    document.getElementById('quitNo').addEventListener('click', () => {
        confirmQuitPopup.style.display = 'none';
        overlay.style.display = 'none';
    });

    // ゲーム開始画面からの「ゲーム開始」ボタン
    startNewGameButton.addEventListener('click', () => {
        startScreen.style.display = 'none'; // 開始画面を非表示
        gameSettingsScreen.style.display = 'flex'; // ゲーム設定画面を表示 (flexに変更)
        // ここではresetGame()は呼ばない。設定画面でユーザーが設定を変更できるようにするため。
    });

    // ゲーム設定画面からの「ゲーム開始」ボタン
    document.getElementById('startGame').addEventListener('click', () => {
        const resultScreen = document.getElementById('resultScreen');
        if (resultScreen) {
            resultScreen.style.display = 'none';
        }
        
        gameSettingsScreen.style.display = 'none'; // ゲーム設定画面を非表示
        gameAreaScreen.style.display = 'flex'; // flexに変更
        quitButton.style.display = 'block';
        overlay.style.display = 'none'; // 開始時はオーバーレイを消す

        // 選択されたHPを設定してゲームを初期化
        gameState.player.hp = gameState.maxHP;
        gameState.enemy.hp = gameState.maxHP;
        updateHP();

        // ゲーム開始
        gameState.remainingCards = []; // カードをクリア
        gameState.currentRound = 1;
        showRoundNotification(gameState.currentRound);
        setTimeout(() => {
            shuffleCards();
        }, 2000); // ラウンド通知表示後にシャッフル
    });

    // ゲーム中のカード種類確認ボタン
    document.getElementById('showCardsInGame').addEventListener('click', showCardInfo);
    // ゲーム開始画面のカード種類確認ボタン
    showCardsOnStartButton.addEventListener('click', showCardInfo);
    // ゲーム設定画面のカード種類確認ボタン
    showCardsOnSettingsButton.addEventListener('click', showCardInfo); // 新しいボタンのイベントリスナー

    // カード情報ポップアップを閉じる
    document.getElementById('closeCardInfo').addEventListener('click', () => {
        cardInfoPopup.style.display = 'none';
        overlay.style.display = 'none';
    });

    // ゲーム開始時のHP表示とカードシャッフルは、ゲーム開始ボタンが押された後に行うためDOMContentLoadedでは呼ばない
    // ただし、ゲーム設定画面でリセットボタンが押された場合のために初期化しておく
    resetGame();
});

// カード情報表示関数
function showCardInfo() {
    const cardInfoContent = document.getElementById('cardInfoContent');
    cardInfoContent.innerHTML = '';

    const createCardSection = (title, cards, className) => {
        let sectionHtml = `<div class="card-section ${className}">`;
        sectionHtml += `<h4>${title}</h4>`;
        cards.forEach(card => {
            // タイプに基づいてテキストの色クラスを決定
            let textColorClass = '';
            if (card.type === 'attack' || card.type === 'defense') {
                textColorClass = 'normal-text';
            } else if (card.type === 'bad') {
                textColorClass = 'bad-text';
            } else if (card.type === 'heal') {
                textColorClass = 'normal-text'; // 回復系も通常色
            } else if (card.type === 'rare') {
                textColorClass = 'rare-text';
            } else if (card.type === 'legendary') {
                textColorClass = 'legendary-text';
            } else {
                textColorClass = 'other-text'; // その他の特殊効果
            }

            sectionHtml += `<p class="card-entry"><span class="card-icon">${card.icon || ''}</span><span class="card-text"><strong class="${textColorClass}">${card.name}</strong>: ${card.effect}`;
            if (card.legendary) {
                sectionHtml += ` <span style="font-size: 0.9em; color: #888;">(出現確率: ${card.chance * 100}%)</span>`;
            }
            sectionHtml += `</span></p>`;
        });
        sectionHtml += `</div>`;
        return sectionHtml;
    };

    // allCardsに新しいtypeプロパティを追加
    // 通常カード (攻撃、防御など)
    const normalCards = allCards.filter(card => 
        !card.isBad && !card.rare && !card.legendary && (card.type === 'attack' || card.type === 'defense' || card.type === 'heal')
    );
    // ハプニングカード (isBadのみ)
    const badCards = allCards.filter(card => 
        card.isBad && !card.legendary && card.name !== "あべこべ"
    ); 
    // レアカード (rareプロパティを持つがlegendaryではないもの)
    const rareCards = allCards.filter(card => 
        card.rare && !card.legendary
    );
    // レジェンドカード (legendaryプロパティを持つもの)
    const legendaryCards = allCards.filter(card => card.legendary);

    cardInfoContent.innerHTML += createCardSection('通常カード （出やすいカード）', normalCards, 'normal');
    cardInfoContent.innerHTML += createCardSection('ハプニングカード （デメリットでしかない）', badCards, 'bad');
    cardInfoContent.innerHTML += createCardSection('レアカード （使うと3ラウンド間、再出現しなくなる）', rareCards, 'rare');
    cardInfoContent.innerHTML += createCardSection('レジェンドカード （出る確率めちゃくちゃ低い）', legendaryCards, 'legendary');

    // 特殊効果の補足説明
    cardInfoContent.innerHTML += createCardSection('その他、特殊効果について', [
        { name: '鎧', effect: 'ダメージ1軽減', icon: '🪖' },
        { name: '盾', effect: 'ダメージ2軽減', icon: '🛡️' },
        { name: '毒', effect: '毎ターン1ダメージ', icon: '☠️' },
        { name: '封', effect: '行動不能', icon: '🔒' },
        { name: '無', effect: '無敵状態（ダメージを受けない）', icon: '😇' }
    ], 'other');


    cardInfoPopup.style.display = 'block';
    overlay.style.display = 'block'; // オーバーレイ表示
}
