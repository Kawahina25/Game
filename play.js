// play.js

// 全てのカードデータ (gamestart.js, gamesetting.js, skill.jsと共有)
const allCards = [
    { name: "拳で", effect: "5ダメージを与える", action: (isPlayer) => isPlayer ? damageEnemy(5) : damagePlayer(5), count: 2, icon: '👊', type: 'attack' },
    { name: "ビンタ", effect: "3ダメージを与える", action: (isPlayer) => isPlayer ? damageEnemy(3) : damagePlayer(3), count: 3, icon: '🖐️', type: 'attack' },
    { name: "デコピン", effect: "1ダメージを与える", action: (isPlayer) => isPlayer ? damageEnemy(1) : damagePlayer(1), count: 3, icon: '👉', type: 'attack' },
    { name: "ぼろぼろの鎧", effect: "2ターンの間、ダメージを1軽減する", action: (isPlayer) => {
        const targetState = isPlayer ? gameState.player : gameState.enemy;
        const targetElement = isPlayer ? playerStatusEffectsElement : enemyStatusEffectsElement;
        const statusId = isPlayer ? 'playerArmor' : 'enemyArmor';
        if (targetState.armor > 0 || targetState.shield > 0) {
            return "しかし、すでに守れているため、効果が打ち消されてしまった！";
        }
        targetState.armor = 2;
        updateStatusDisplay(targetElement, '🪖', 'gray', statusId);
        return isPlayer ? "防御態勢！次のダメージを1軽減します" : "ライバルが防御態勢に入りました";
    }, count: 2, icon: '🪖', type: 'defense' },
    { name: "転んでしまった", effect: "自分に1ダメージ", action: (isPlayer) => {
        showBadCardEffect();
        return isPlayer ? "やってしまった..." + damagePlayer(1) : "やってしまった..." + damageEnemy(1);
    }, count: 1, isBad: true, icon: '💥', type: 'bad' },
    { name: "頭をぶつけてしまった", effect: "自分に3ダメージ", action: (isPlayer) => {
        showBadCardEffect();
        return isPlayer ? "やってしまった..." + damagePlayer(3) : "やってしまった..." + damageEnemy(3);
    }, count: 1, isBad: true, icon: '🤕', type: 'bad', noReappearRounds: 2, reappearEffectName: "頭をぶつけてしまった" },
    { name: "普通のポーション", effect: "HPを3回復", action: (isPlayer) => isPlayer ? "ラッキー♪ " + healPlayer(3) : "ラッキー♪ " + healEnemy(3), count: 2, heal: true, icon: '🧪', type: 'heal' },
    { name: "良いポーション", effect: "HPを5回復", action: (isPlayer) => {
        gameState.usedSpecialCards.push("HP5回復");
        return isPlayer ? "ラッキー♪ " + healPlayer(5) : "ラッキー♪ " + healEnemy(5);
    }, count: 2, heal: true, rare: true, special: true, icon: '✨🧪', type: 'heal' },
    { name: "サボり魔", effect: "効果はなかった", action: () => {
        showBadCardEffect();
        return "ハズレ...何も効果がなかった" + noEffect();
    }, count: 1, isBad: true, icon: '👻', type: 'bad' },
    { name: "盾よ守れ！", effect: "2ターンの間、ダメージを2軽減する", action: (isPlayer) => {
        const targetState = isPlayer ? gameState.player : gameState.enemy;
        const targetElement = isPlayer ? playerStatusEffectsElement : enemyStatusEffectsElement;
        const statusId = isPlayer ? 'playerShield' : 'enemyShield';
        if (targetState.shield > 0 || targetState.armor > 0) {
            return "しかし、すでに守れているため、効果が打ち消されてしまった！";
        }
        targetState.shield = 2;
        updateStatusDisplay(targetElement, '🛡️', 'blue', statusId, 'bold');
        gameState.usedSpecialCards.push("防御");
        return isPlayer ? "防御態勢！次のダメージを2軽減します" : "ライバルが防御態勢に入りました";
    }, count: 2, special: true, icon: '🛡️', type: 'rare', rare: true },
    { name: "毒物混入", effect: "毒を与える", action: (isPlayer) => {
        const targetState = isPlayer ? gameState.enemy : gameState.player;
        const targetElement = isPlayer ? enemyStatusEffectsElement : playerStatusEffectsElement;
        const statusId = isPlayer ? 'enemyPoison' : 'playerPoison';
        targetState.poison = 2;
        updateStatusDisplay(targetElement, '☠️', 'purple', statusId);
        gameState.usedSpecialCards.push("毒");
        return isPlayer ? "ライバルに毒を与えました！" : "あなたは毒を受けました！";
    }, count: 1, rare: true, special: true, icon: '☠️', type: 'rare' },
    { name: "ぶん殴る", effect: "10ダメージを与える", action: (isPlayer) => isPlayer ? damageEnemy(10) : damagePlayer(10), count: 1, rare: true, icon: '💢', type: 'rare' },
    { name: "最高のポーション", effect: "HPが全回復", action: (isPlayer) => {
        const targetState = isPlayer ? gameState.player : gameState.enemy;
        const targetElement = isPlayer ? document.querySelector('.player') : document.querySelector('.enemy');
        targetState.hp = gameState.maxHP;
        return "✨レジェンドカード✨ " + (isPlayer ? "あなたのHPが全回復しました！" : "ライバルのHPが全回復しました！");
    }, count: 0, legendary: true, chance: 0.05, icon: '💖', type: 'legendary' },
    { name: "あべこべ", effect: "HP入れ替え", action: (isPlayer) => {
        const tempHP = gameState.player.hp;
        gameState.player.hp = gameState.enemy.hp;
        gameState.enemy.hp = tempHP;
        showBadCardEffect();
        return "あなたとライバルのHPが入れ替わりました！";
    }, count: 1, isBad: true, icon: '🔄', type: 'bad', noReappearRounds: 2, reappearEffectName: "あべこべ" },
    { name: "封じちゃえ ♪", effect: "行動を封じる", action: (isPlayer) => {
        const selfState = isPlayer ? gameState.player : gameState.enemy;
        const opponentState = isPlayer ? gameState.enemy : gameState.player;
        const selfElement = isPlayer ? playerStatusEffectsElement : enemyStatusEffectsElement;
        const opponentElement = isPlayer ? enemyStatusEffectsElement : playerStatusEffectsElement;
        const selfStatusId = isPlayer ? 'playerSealed' : 'enemySealed';
        const opponentStatusId = isPlayer ? 'enemySealed' : 'playerSealed';
        opponentState.sealed = 2;
        updateStatusDisplay(opponentElement, '🔒', 'red', opponentStatusId);
        selfState.extraTurns = 2;
        return "✨レジェンドカード✨ " + (isPlayer ? "ライバルの行動を2ターン封じました！あなたは追加で2回行動できます！" : "あなたの行動が2ターン封じられました！ライバルは追加で2回行動します！");
    }, count: 0, legendary: true, chance: 0.02, icon: '🔒', type: 'legendary' },
    { name: "一撃必殺", effect: "一撃必殺", action: (isPlayer) => {
        const targetState = isPlayer ? gameState.enemy : gameState.player;
        const targetElement = isPlayer ? document.querySelector('.enemy') : document.querySelector('.player');
        targetState.hp = 0;
        return "✨伝説のカード✨ 一撃必殺！" + (isPlayer ? "ライバルのHPが0になりました！" : "あなたのHPが0になりました！");
    }, count: 0, legendary: true, chance: 0.003, icon: '🎯', type: 'legendary' },
    { name: "神のご加護を", effect: "2ラウンド無敵", action: (isPlayer) => {
        const targetState = isPlayer ? gameState.player : gameState.enemy;
        const targetElement = isPlayer ? playerStatusEffectsElement : enemyStatusEffectsElement;
        const statusId = isPlayer ? 'playerInvincible' : 'enemyInvincible';
        targetState.invincible = 2;
        updateStatusDisplay(targetElement, '😇', 'gold', statusId, 'bold');
        return "✨伝説のカード✨ " + (isPlayer ? "あなたは2ラウンドの間無敵になりました！" : "ライバルは2ラウンドの間無敵になりました！");
    }, count: 0, legendary: true, chance: 0.005, icon: '😇', type: 'legendary' }
];

// 全てのスキルデータ (gamestart.js, gamesetting.js, skill.jsと共有)
const allSkills = [
    { 
        name: "スキップ", 
        icon: "💨",
        effect: "次の相手のターン、60%の確率でカードの効果がなくなる。ただし、確率を外すと、自分がその効果を食らってしまう。", 
        action: (isPlayer) => {
            if (isPlayer) {
                const success = Math.random() < 0.6;
                if (success) {
                    gameState.skillActiveEffects.skipNextEnemyTurn = true;
                    return "成功！次の相手のターンは無効化されます！";
                } else {
                    damagePlayer(3);
                    return "失敗！効果が無効になり、あなたは3ダメージを受けてしまった！";
                }
            }
            return "";
        }
    },
    { 
        name: "透視", 
        icon: "🔮",
        effect: "スキルを使うと、任意でカードを1枚選び、そのカードの効果が分かる。", 
        action: (isPlayer) => {
            if (isPlayer) {
                const remainingCardNames = gameState.remainingCards.map(card => `「${card.name}」(${card.effect})`).join('、');
                if (remainingCardNames) {
                    return `「透視」発動！手札のカードは次の通りです: ${remainingCardNames}`;
                } else {
                    return `「透視」発動！手札にはもうカードがありません。`;
                }
            }
            return "";
        }
    },
    { 
        name: "慎重に", 
        icon: "🐢",
        effect: "3ターンの間、ハプニングカードの効果を受けない。", 
        action: (isPlayer) => {
            if (isPlayer) {
                gameState.skillActiveEffects.immuneToBadCards = gameState.currentRound + 3;
                updateStatusDisplay(playerStatusEffectsElement, '🐢', 'green', 'playerImmuneToBad');
                return "「慎重に」発動！3ターンの間、ハプニングカードを無効化します。";
            }
            return "";
        }
    },
    { 
        name: "リスクandリターン", 
        icon: "🔥",
        effect: "2ターンの間、攻撃する際に＋2の追加攻撃をする。ただし、受けるダメージも＋2される。", 
        action: (isPlayer) => {
            if (isPlayer) {
                gameState.skillActiveEffects.riskAndReturn = gameState.currentRound + 2;
                updateStatusDisplay(playerStatusEffectsElement, '🔥', 'orange', 'playerRiskAndReturn');
                return "「リスクandリターン」発動！2ターンの間、攻撃力と被ダメージが+2されます。";
            }
            return "";
        }
    },
    { 
        name: "ご加護を", 
        icon: "✨",
        effect: "回復系と防御系の効果が＋3される。ただし、スキルが終わると、3ターンの間、回復系と防御系の効果を受けれなくなる。", 
        action: (isPlayer) => {
            if (isPlayer) {
                gameState.skillActiveEffects.divineBlessing = gameState.currentRound + 1;
                updateStatusDisplay(playerStatusEffectsElement, '✨', 'gold', 'playerDivineBlessing');
                return "「ご加護を」発動！次の回復・防御効果が強化されます。";
            }
            return "";
        }
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
    usedRareCards: [],
    usedSpecialCards: [],
    usedLegendaryCards: false,
    lastPlayedCardName: "",
    usedNoReappearCards: [],
    selectedSkill: null,
    skillUsedThisGame: false,
    skillCooldownRound: 0,
    skillActiveEffects: {
        skipNextEnemyTurn: false,
        immuneToBadCards: 0,
        riskAndReturn: 0,
        divineBlessing: 0,
        divineBlessingDebuff: 0
    },
    skillConfirmCallback: null
};

// DOM要素の宣言 (DOMContentLoaded内で割り当てる)
let playerHpElement;
let enemyHpElement;
let playerSkullElement;
let enemySkullElement;
let playerElement;
let enemyElement;
let messageElement;
let cardsContainer;
let gameAreaScreen;
let quitButton;
let cardInfoPopup;
let confirmQuitPopup;
let roundNotification;
let overlay;
let gameSetNotification;
let resultScreen;
let currentRoundDisplay;
let playerHpBarElement;
let enemyHpBarElement;
let playerStatusEffectsElement;
let enemyStatusEffectsElement;

// スキル関連DOM要素 (play.html用)
let activeSkillButton;
let activeSkillButtonIcon;
let activeSkillButtonName;
let activeSkillButtonCooldown;
let skillConfirmPopup;
let skillConfirmTitle;
let skillConfirmDescription;
let useSkillYesButton;
let useSkillNoButton;

// localStorageからgameStateをロードする関数
function loadGameState() {
    const savedState = localStorage.getItem('kardgame_gameState');
    if (savedState) {
        // JSON.parseのreviver関数を使って、actionプロパティを関数に戻す
        const parsedState = JSON.parse(savedState, (key, value) => {
            if (key === 'selectedSkill' && value && value.name) {
                // selectedSkillのaction関数を復元
                const skillDef = allSkills.find(s => s.name === value.name);
                if (skillDef) {
                    return { ...value, action: skillDef.action };
                }
            }
            return value;
        });
        Object.assign(gameState, parsedState);
        console.log("GameState loaded from localStorage:", gameState);
    } else {
        console.log("No saved game state found, starting fresh.");
    }
}

// gameStateをlocalStorageに保存する関数
function saveGameState() {
    // selectedSkillのactionプロパティは保存しない（循環参照を防ぐため）
    const stateToSave = { ...gameState };
    if (stateToSave.selectedSkill) {
        stateToSave.selectedSkill = { 
            name: stateToSave.selectedSkill.name,
            icon: stateToSave.selectedSkill.icon,
            effect: stateToSave.selectedSkill.effect
        }; // actionプロパertyを除外
    }
    localStorage.setItem('kardgame_gameState', JSON.stringify(stateToSave));
    console.log("GameState saved to localStorage.");
}


// ヘルパー関数: HP変更時の背景色アニメーション
function animateHpChange(element, color) { /* ... */ }

// ヘルパー関数: 状態表示の追加/更新/削除
function updateStatusDisplay(parent, emoji, color, id, fontWeight = 'normal') {
    let statusElement = document.getElementById(id);
    if (!statusElement) {
        statusElement = document.createElement('span');
        statusElement.id = id;
        statusElement.style.color = color;
        statusElement.style.fontWeight = fontWeight;
        statusElement.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
        statusElement.style.border = `1px solid ${color}`;
        statusElement.style.borderRadius = '4px';
        statusElement.style.padding = '2px 5px';
        statusElement.style.fontSize = '1.2em';

        if (parent) { 
            parent.appendChild(statusElement); 
            console.log(`Status element '${id}' created and appended to`, parent);
        } else {
            console.error(`Error: Parent element for status ID '${id}' is null. Cannot append child.`);
            return;
        }
    }
    statusElement.textContent = emoji;
    if (emoji === '') {
        if (statusElement.parentNode) {
            statusElement.remove();
            console.log(`Status element '${id}' removed.`);
        }
    }
}

// HP表示の更新
function updateHP() {
    playerHpElement.textContent = gameState.player.hp;
    enemyHpElement.textContent = gameState.enemy.hp;
    playerHpBarElement.style.width = `${(gameState.player.hp / gameState.maxHP) * 100}%`;
    enemyHpBarElement.style.width = `${(gameState.enemy.hp / gameState.maxHP) * 100}%`;

    if (gameState.player.hp <= 5 && gameState.player.hp > 0) {
        playerElement.classList.add('danger');
    } else {
        playerElement.classList.remove('danger');
    }
    if (gameState.enemy.hp <= 5 && gameState.enemy.hp > 0) {
        enemyElement.classList.add('danger');
    } else {
        enemyElement.classList.remove('danger');
    }
    
    if (gameState.player.hp <= 0) {
        playerHpElement.style.display = 'none';
        playerSkullElement.style.display = 'inline';
    } else {
        playerHpElement.style.display = 'inline';
        playerSkullElement.style.display = 'none';
    }
    if (gameState.enemy.hp <= 0) {
        enemyHpElement.style.display = 'none';
        enemySkullElement.style.display = 'inline';
    } else {
        enemyHpElement.style.display = 'inline';
        enemySkullElement.style.display = 'none';
    }
}

// プレイヤーへのダメージ
function damagePlayer(amount) {
    // ご加護をデバフの影響
    if (gameState.skillActiveEffects.divineBlessingDebuff > gameState.currentRound) {
        amount += 3; // デバフ中はダメージ+3
        messageElement.innerHTML += ` <span style="color:red; font-weight:bold;">(ご加護をデバフにより+3ダメージ！)</span>`;
    }
    // リスクandリターン被ダメージ追加
    if (gameState.skillActiveEffects.riskAndReturn > gameState.currentRound) {
        amount += 2; // 被ダメージ+2
        messageElement.innerHTML += ` <span style="color:red; font-weight:bold;">(リスクandリターンにより+2ダメージ！)</span>`;
    }

    // 無敵効果の適用
    if (gameState.player.invincible > 0) {
        return `あなたは無敵状態のため、ダメージを受けませんでした！`;
    }

    // シールド効果の適用
    if (gameState.player.shield > 0) {
        const reducedAmount = Math.max(0, amount - 2);
        gameState.player.shield--;
        if (gameState.player.shield === 0) {
            updateStatusDisplay(playerStatusEffectsElement, '', 'blue', 'playerShield'); // 絵文字が消えるように空文字列を渡す
        }
        amount = reducedAmount;
    } else if (gameState.player.armor > 0) { // 鎧効果の適用
        const reducedAmount = Math.max(0, amount - 1);
        gameState.player.armor--;
        if (gameState.player.armor === 0) {
            updateStatusDisplay(playerStatusEffectsElement, '', 'gray', 'playerArmor'); // 絵文字が消えるように空文字列を渡す
        }
        amount = reducedAmount;
    }

    const oldHP = gameState.player.hp;
    gameState.player.hp = Math.max(0, gameState.player.hp - amount);

    return `あなたに${amount}ダメージ！`;
}

// エネミーへのダメージ
function damageEnemy(amount) {
    // リスクandリターン追加攻撃
    if (gameState.skillActiveEffects.riskAndReturn > gameState.currentRound) {
        amount += 2; // 与ダメージ+2
        messageElement.innerHTML += ` <span style="color:lime; font-weight:bold;">(リスクandリターンにより+2ダメージ！)</span>`;
    }

    // 無敵効果の適用
    if (gameState.enemy.invincible > 0) {
        return `ライバルは無敵状態のため、ダメージを受けませんでした！`;
    }

    // シールド効果の適用
    if (gameState.enemy.shield > 0) {
        const reducedAmount = Math.max(0, amount - 2);
        gameState.enemy.shield--;
        if (gameState.enemy.shield === 0) {
            updateStatusDisplay(enemyStatusEffectsElement, '', 'blue', 'enemyShield'); // 絵文字が消えるように空文字列を渡す
        }
        amount = reducedAmount;
    } else if (gameState.enemy.armor > 0) { // 鎧効果の適用
        const reducedAmount = Math.max(0, amount - 1);
        gameState.enemy.armor--;
        if (gameState.enemy.armor === 0) {
            updateStatusDisplay(enemyStatusEffectsElement, '', 'gray', 'enemyArmor'); // 絵文字が消えるように空文字列を渡す
        }
        amount = reducedAmount;
    }

    const oldHP = gameState.enemy.hp;
    gameState.enemy.hp = Math.max(0, gameState.enemy.hp - amount);

    return `ライバルに${amount}ダメージ！`;
}

// プレイヤーの回復
function healPlayer(amount) {
    // ご加護をスキル適用
    if (gameState.skillActiveEffects.divineBlessing > gameState.currentRound) {
        amount += 3; // 回復量+3
        messageElement.innerHTML += ` <span style="color:lime; font-weight:bold;">(ご加護をスキルにより+3回復！)</span>`;
    }
    // ご加護をデバフの影響
    if (gameState.skillActiveEffects.divineBlessingDebuff > gameState.currentRound) {
        amount = Math.max(0, amount - 3); // デバフ中は回復量-3 (最低0)
        messageElement.innerHTML += ` <span style="color:red; font-weight:bold;">(ご加護をデバフにより-3回復！)</span>`;
    }

    gameState.player.hp = Math.min(gameState.maxHP, gameState.player.hp + amount);
    return `あなたのHPが${amount}回復！`;
}

// エネミーの回復
function healEnemy(amount) {
    gameState.enemy.hp = Math.min(gameState.maxHP, gameState.enemy.hp + amount);
    return `ライバルのHPが${amount}回復！`;
}

// 効果なし
function noEffect() {
    messageElement.style.backgroundColor = '#cccccc';
    setTimeout(() => {
        messageElement.style.backgroundColor = 'rgba(50, 50, 50, 0.8)'; // デザインに合わせて変更
    }, 800);
    return "";
}

// ハズレカード演出 (慎重にスキルで無効化される可能性あり)
function showBadCardEffect() {
    // 慎重にスキルがアクティブなら効果を無効化
    if (gameState.skillActiveEffects.immuneToBadCards > gameState.currentRound && gameState.isPlayerTurn) {
        messageElement.innerHTML = `「慎重に」スキルでハプニングカードを無効化しました！`;
        updateStatusDisplay(playerStatusEffectsElement, '🐢', 'green', 'playerImmuneToBad'); // 効果を維持
        return; // 効果を無効化し、それ以上ダメージを与えない
    }

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
    }, 1500);
}

// ラウンド通知表示
function showRoundNotification(round, callback = () => {}) { // callback引数を追加
    roundNotification.textContent = `${round}ラウンド目`;
    roundNotification.style.display = 'block';
    overlay.style.display = 'block'; // オーバーレイ表示

    currentRoundDisplay.style.display = 'none'; // ラウンド通知中はゲームエリアのラウンド表示を非表示に

    setTimeout(() => {
        roundNotification.style.display = 'none';
        overlay.style.display = 'none'; // オーバーレイ非表示
        updateRoundDisplay(); // ラウンド表示を更新
        currentRoundDisplay.style.display = 'block'; // ゲームエリアのラウンド表示を再表示
        callback(); // アニメーション完了後にコールバックを実行
    }, 2500);
}

// ラウンド表示更新
function updateRoundDisplay() {
    currentRoundDisplay.textContent = `${gameState.currentRound}ラウンド目`;
}

// カードをシャッフルし、手札を生成
function shuffleCards() {
    let deck = [];
    
    // 全てのカードをフィルタリング
    let availableCards = allCards.filter(card => {
        // カードON/OFF設定に基づいて除外
        if (card.type === 'heal' && !gameState.enableHealCards) return false;
        if (card.type === 'bad' && !gameState.enableBadCards) return false;
        // rareかつlegendaryではないカードは、rare設定がOFFなら除外
        if (card.rare && !card.legendary && !gameState.enableRareCards) return false;

        // NEW: usedNoReappearCards に含まれるカードを現在のラウンドと比較して除外
        const usedEntry = gameState.usedNoReappearCards.find(entry => entry.name === card.name);
        if (usedEntry && gameState.currentRound < usedEntry.reappearRound) {
            return false; // 再出現指定ラウンドに達していない場合は除外
        }
        return true;
    });

    // 攻撃カード、防御/回復カード、ハプニングカード、レジェンドカードのプールを分ける
    let attackCardsPool = availableCards.filter(card => card.type === 'attack');
    let defenseHealCardsPool = availableCards.filter(card => card.type === 'defense' || card.type === 'heal' || (card.type === 'rare' && (card.name === "盾よ守れ！" || card.name === "神のご加護？"))); // rareの防御/回復系も含む
    let badCardsPool = availableCards.filter(card => card.type === 'bad' || (card.type === 'rare' && card.name === "毒物混入")); // rareのハプニング系も含む
    let legendaryCardsPool = availableCards.filter(card => card.type === 'legendary');

    let currentHand = [];
    let attempts = 0;
    const maxAttempts = 200; 

    do {
        currentHand = []; // 手札をリセット
        let tempPossibleCards = [...availableCards]; // 抽選可能なカードを毎回リセット
        
        // 必須カードの確保
        let ensuredCards = [];
        
        // 攻撃カードを2枚確保 (同じ種類が出てもOK)
        // 攻撃カードプールからランダムに2枚選んで追加 (重複あり)
        let addedAttackCardsCount = 0;
        const tempAttackPoolShuffled = [...attackCardsPool].sort(() => 0.5 - Math.random());
        for(let i = 0; i < tempAttackPoolShuffled.length && addedAttackCardsCount < 2; i++) {
            ensuredCards.push(tempAttackPoolShuffled[i]);
            addedAttackCardsCount++;
        }

        // 防御/回復系カードを1枚確保
        // enabled が false の場合、この条件はスキップされます
        if (defenseHealCardsPool.length > 0 && (gameState.enableHealCards || gameState.enableRareCards)) {
            const selectedDefenseHealCard = defenseHealCardsPool[Math.floor(Math.random() * defenseHealCardsPool.length)];
            ensuredCards.push(selectedDefenseHealCard);
        } else if (defenseHealCardsPool.length > 0 && !(gameState.enableHealCards || gameState.enableRareCards)) {
            // 設定で無効だが、手札生成のロジック上、防御/回復系が必須の場合の注意
            console.log("Defense/Heal cards are disabled but shuffle logic might require them.");
        }


        // ハプニング系カードを1枚確保
        if (badCardsPool.length > 0 && gameState.enableBadCards) {
            const selectedBadCard = badCardsPool[Math.floor(Math.random() * badCardsPool.length)];
            ensuredCards.push(selectedBadCard);
        } else if (badCardsPool.length > 0 && !gameState.enableBadCards) {
            // 設定で無効だが、手札生成のロジック上、ハプニング系が必須の場合の注意
             console.log("Bad cards are disabled but shuffle logic might require them.");
        }


        // 確保したカードを手札に追加（重複は避ける）
        // Setを使ってユニークなカードを確保。この時点ではまだ枚数を気にしない。
        currentHand = Array.from(new Set(ensuredCards)); 

        // 残りの手札の枠を埋める
        while (currentHand.length < gameState.numCardsInHand) {
            let availableForFiller = tempPossibleCards.filter(card => !currentHand.includes(card));
            if (availableForFiller.length === 0) {
                // 埋めるカードがもうない場合、ループを抜ける
                break;
            }
            const randomFillerIndex = Math.floor(Math.random() * availableForFiller.length);
            currentHand.push(availableForFiller[randomFillerIndex]);
            // 追加したカードを次回の抽選から除外するために、tempPossibleCardsからも削除する
            tempPossibleCards = tempPossibleCards.filter(card => card !== availableForFiller[randomFillerIndex]);
        }
        
        // レジェンドカードは確率で追加 (手札枚数を超過する可能性もあるが、ゲーム性として許容)
        if (!gameState.usedLegendaryCards && legendaryCardsPool.length > 0) {
            const potentialLegendaryCard = legendaryCardsPool[Math.floor(Math.random() * legendaryCardsPool.length)];
            if (Math.random() < potentialLegendaryCard.chance) {
                currentHand.push(potentialLegendaryCard);
                gameState.usedLegendaryCards = true; // 一度引いたらフラグを立てる
            }
        }
        
        // 最終的な手札の枚数を保証（超過分は切り詰める）
        // numCardsInHandを超える場合は、ランダムに切り詰める
        if (currentHand.length > gameState.numCardsInHand) {
            currentHand = currentHand.sort(() => 0.5 - Math.random()).slice(0, gameState.numCardsInHand);
        }

        // 条件チェック
        const attackCardsInHand = currentHand.filter(card => card.type === 'attack');
        const defenseHealCardsInHand = currentHand.filter(card => card.type === 'defense' || card.type === 'heal' || (card.type === 'rare' && (card.name === "盾よ守れ！" || card.name === "神のご加護？")));
        const badCardsInHand = currentHand.filter(card => card.type === 'bad' || (card.type === 'rare' && card.name === "毒物混入"));

        // 攻撃カードは最低2枚以上
        const minAttackMet = attackCardsInHand.length >= 2;
        // 防御系or回復系が1枚 (設定が無効の場合は条件を無視)
        const minDefenseHealMet = (!gameState.enableHealCards && !gameState.enableRareCards) || defenseHealCardsInHand.length >= 1; 
        // ハプニング系が1枚 (設定が無効の場合は条件を無視)
        const minBadMet = !gameState.enableBadCards || badCardsInHand.length >= 1; 

        if (minAttackMet && minDefenseHealMet && minBadMet && currentHand.length === gameState.numCardsInHand) { // NEW: 手札枚数も条件に含める
            break; 
        }

        attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
        console.warn("手札の組み合わせ生成に失敗しました。現在の手札で続行します。条件を満たさない可能性があります。");
        // フォールバックロジックは残し、問題があった場合に備える
        // 必要に応じて、ここでさらに厳密なフォールバックを作成することも可能
    }

    gameState.remainingCards = currentHand;
    renderCards();
}


// カードの表示
function renderCards() {
    cardsContainer.innerHTML = '';
    gameState.remainingCards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.textContent = ''; // カードのテキストを空にする
        cardElement.dataset.index = index; // 選択されたカードのインデックスを保持
        cardElement.addEventListener('click', () => {
            document.querySelectorAll('.card').forEach(c => {
                c.classList.remove('selected');
            });
            cardElement.classList.add('selected');

            setTimeout(() => {
                playCard(parseInt(cardElement.dataset.index));
            }, 500);
        });
        cardsContainer.appendChild(cardElement);
    });
}

// プレイヤーがカードを使用
function playCard(index) {
    if (!gameState.isPlayerTurn || gameState.isAnimating) return;
    gameState.isAnimating = true;
    console.log("Player turn: Card selected, isAnimating set to true.");

    applyTurnStartEffects(true);

    // スキップスキルが発動している場合の処理
    if (gameState.skillActiveEffects.skipNextEnemyTurn) { 
        gameState.skillActiveEffects.skipNextEnemyTurn = false; // スキルを消費
        messageElement.innerHTML = `「スキップ」スキルが発動！相手の攻撃は無効化されました！`;
        updateHP();
        console.log("Skip skill active for enemy turn. Skipping enemy card action.");
        setTimeout(() => {
            startPlayerTurn();
        }, 2000);
        return;
    }

    if (gameState.player.sealed > 0) {
        gameState.player.sealed--;
        if (gameState.player.sealed === 0) {
            updateStatusDisplay(playerStatusEffectsElement, '', 'red', 'playerSealed');
        }
        messageElement.innerHTML = "あなたは行動を封じられています！このターンはスキップします。";
        updateHP();
        console.log("Player is sealed. Skipping turn.");

        setTimeout(() => {
            prepareEnemyTurn(); // 敵のターン準備を呼び出す
        }, 3000);
        return;
    }

    if (gameState.player.poison > 0) {
        messageElement.innerHTML = "毒のダメージ！あなたに1ダメージ！";
        gameState.player.hp = Math.max(0, gameState.player.hp - 1);
        gameState.player.poison--;
        if (gameState.player.poison === 0) {
            updateStatusDisplay(playerStatusEffectsElement, '', 'purple', 'playerPoison');
        }
        updateHP();
        console.log("Player poisoned. Taking 1 damage.");

        if (checkGameEnd()) {
            gameState.isAnimating = false;
            console.log("Player poisoned and game ended. isAnimating set to false.");
            return;
        }

        setTimeout(() => {
            messageElement.textContent = `あなたのターンです。カードを選んでください。`;
            console.log("Player poisoned turn. Continuing with card action.");
            continuePlayerTurn(index);
        }, 2000);
        return;
    }

    console.log("No sealed or poison effect for player. Continuing with card action.");
    continuePlayerTurn(index);
}

// プレイヤーがカードを使用する実際のロジック
function continuePlayerTurn(index) {
    const card = gameState.remainingCards[index];
    gameState.lastPlayedCardName = card.name;
    messageElement.textContent = `あなたはカードを引いた！さぁ結果は...`;
    gameState.remainingCards.splice(index, 1);
    console.log(`Player drew card: ${card.name}. Remaining cards:`, gameState.remainingCards);

    // NEW: 使用されたカードがnoReappearRoundsを持つ場合、一時停止リストに追加
    if (card.noReappearRounds) {
        gameState.usedNoReappearCards.push({
            name: card.name,
            reappearRound: gameState.currentRound + card.noReappearRounds
        });
        console.log(`Card '${card.name}' added to noReappear list. Reappear in round ${gameState.currentRound + card.noReappearRounds}.`);
    }

    if (card.rare) { // rareプロパティを持つカードはusedRareCardsにも追加 (今後の拡張性のため)
        // note: usedRareCardsは現在、shuffleCardsで使用されていないため、機能していません。
        gameState.usedRareCards.push(card.effect); 
        // このsetTimeoutロジックは、以前のレアカード再出現ロジックの名残ですが、
        // now usedNoReappearCards is the primary mechanism for temporary removal.
        setTimeout(() => { 
            const idx = gameState.usedRareCards.indexOf(card.effect);
            if (idx > -1) gameState.usedRareCards.splice(idx, 1);
        }, 4000 * 3); 
    }

    // specialプロパティを持つカードもusedSpecialCardsにも追加 (今後の拡張性のため)
    if (card.special) {
        // note: usedSpecialCardsは現在、shuffleCardsで使用されていないため、機能していません。
        const specialEffectName = card.effect.includes("ダメージを2軽減") ? "防御" :
                                  card.effect.includes("毒を与える") ? "毒" :
                                  card.effect.includes("HPを5回復") ? "HP5回復" : "";
        if (specialEffectName) {
            gameState.usedSpecialCards.push(specialEffectName);
            setTimeout(() => { 
                const idx = gameState.usedSpecialCards.indexOf(specialEffectName);
                if (idx > -1) gameState.usedSpecialCards.splice(idx, 1);
            }, 4000 * 3);
        }
    }


    if (card.legendary) {
        gameState.usedLegendaryCards = true;
    }

    renderCards();
    console.log("Player cards rendered. Waiting for card action.");

    // Initial delay for "さぁ結果は..."
    setTimeout(() => { 
        try {
            console.log("setTimeout callback started for player card action.");
            const message = card.action(true); // カード効果を実行
            console.log("Card action executed. Message:", message);

            if (message) {
                messageElement.innerHTML = `「${card.name}」だ！${message}`;
            }
            updateHP();
            console.log("HP updated after player card action.");

            if (checkGameEnd()) {
                gameState.isAnimating = false;
                console.log("Game ended after player card action. isAnimating set to false.");
                return;
            }

            console.log("Game not ended. Proceeding with message display delay.");

            // NEW: Delay for user to read the card effect message before next turn's message
            setTimeout(() => { // この遅延でカード効果メッセージが表示されます
                if (gameState.player.extraTurns > 0) {
                    gameState.player.extraTurns--;
                    console.log("Player extra turn initiated. Calling startPlayerTurn.");
                    startPlayerTurn(); // プレイヤーがもう一度ターンを得る
                } else {
                    if (gameState.remainingCards.length === 0) {
                        gameState.currentRound++;
                        console.log(`Starting round ${gameState.currentRound} transition after player turn.`);
                        showRoundNotification(gameState.currentRound, () => { // コールバックを渡す
                            shuffleCards();
                            prepareEnemyTurn(); // ラウンド通知が消えてから敵のターン準備を呼び出す
                        });
                    } else {
                        console.log("Player turn ended. No extra turn. Calling prepareEnemyTurn.");
                        prepareEnemyTurn(); // 通常の敵のターンへの移行
                    }
                }
            }, 2500); // 2.5秒間、カード効果メッセージを表示

        } catch (error) {
            console.error("Error during player card action or turn progression:", error);
            messageElement.innerHTML = `カードの効果処理中にエラーが発生しました。<br>コンソールを確認してください。<br>ゲームを再開するにはページをリロードしてください。`;
            gameState.isAnimating = false;
        }
    }, 1500); // Initial delay for "さぁ結果は..." (この後、2.5秒の表示遅延が続く)
}

// エネミーのターン
function enemyTurn() {
    messageElement.textContent = `ライバルのターンです。`;
    gameState.isAnimating = true; // 敵のターン中はアニメーションをtrueに
    console.log("Enemy turn started. isAnimating set to true.");

    applyTurnStartEffects(false);

    // スキップスキルが発動している場合の処理
    if (gameState.skillActiveEffects.skipNextEnemyTurn) { 
        gameState.skillActiveEffects.skipNextEnemyTurn = false; // スキルを消費
        messageElement.innerHTML = `「スキップ」スキルが発動！相手の攻撃は無効化されました！`;
        updateHP();
        console.log("Skip skill active for enemy turn. Skipping enemy card action.");
        setTimeout(() => {
            startPlayerTurn();
        }, 2000);
        return;
    }

    if (gameState.enemy.sealed > 0) {
        gameState.enemy.sealed--;
        if (gameState.enemy.sealed === 0) {
            updateStatusDisplay(enemyStatusEffectsElement, '', 'red', 'enemySealed');
        }
        messageElement.innerHTML = "ライバルは行動を封じられています！このターンはスキップします。";
        updateHP();
        console.log("Enemy is sealed. Skipping turn.");

        setTimeout(() => {
            startPlayerTurn(); // プレイヤーのターンを呼び出す
        }, 2500);
        return;
    }

    if (gameState.enemy.poison > 0) {
        messageElement.innerHTML = "毒のダメージ！ライバルに1ダメージ！";
        gameState.enemy.hp = Math.max(0, gameState.enemy.hp - 1);
        gameState.enemy.poison--;
        if (gameState.enemy.poison === 0) {
            updateStatusDisplay(enemyStatusEffectsElement, '', 'purple', 'enemyPoison');
        }
        updateHP();
        console.log("Enemy poisoned. Taking 1 damage.");

        if (checkGameEnd()) {
            gameState.isAnimating = false; // ゲーム終了時はアニメーションフラグをリセット
            console.log("Enemy poisoned and game ended.");
            return;
        }

        setTimeout(() => {
            messageElement.textContent = `ライバルのターンです。`;
            console.log("Enemy poisoned turn. Continuing with card action.");
            setTimeout(() => {
                continueEnemyTurn();
            }, 1500);
        }, 2000);
        return;
    }

    console.log("No sealed or poison effect for enemy. Proceeding with enemy card selection.");
    setTimeout(() => {
        continueEnemyTurn();
    }, 1500);
}

// エネミーがカードを使用する実際のロジック
function continueEnemyTurn() {
    if (gameState.remainingCards.length === 0) {
        gameState.currentRound++;
        showRoundNotification(gameState.currentRound, () => { // コールバックを渡す
            shuffleCards();
            startPlayerTurn(); // ラウンド通知が消えてからプレイヤーのターンを開始
        });
        return;
    }
    performEnemyCardAction();
}

function performEnemyCardAction() {
    let randomIndex = Math.floor(Math.random() * gameState.remainingCards.length);
    let card = gameState.remainingCards[randomIndex];
    gameState.lastPlayedCardName = card.name;
    messageElement.textContent = `ライバルのターン: 「${card.name}」だ！さぁ結果は...`;
    gameState.remainingCards.splice(randomIndex, 1);
    console.log(`Enemy drew card: ${card.name}. Remaining cards:`, gameState.remainingCards);

    // NEW: 使用されたカードがnoReappearRoundsを持つ場合、一時停止リストに追加
    if (card.noReappearRounds) {
        gameState.usedNoReappearCards.push({
            name: card.name,
            reappearRound: gameState.currentRound + card.noReappearRounds
        });
        console.log(`Card '${card.name}' added to noReappear list. Reappear in round ${gameState.currentRound + card.noReappearRounds}.`);
    }

    if (card.rare) { // rareプロパティを持つカードはusedRareCardsにも追加 (今後の拡張性のため)
        // note: usedRareCardsは現在、shuffleCardsで使用されていないため、機能していません。
        gameState.usedRareCards.push(card.effect);
        setTimeout(() => {
            const idx = gameState.usedRareCards.indexOf(card.effect);
            if (idx > -1) gameState.usedRareCards.splice(idx, 1);
        }, 4000 * 3);
    }

    // specialプロパティを持つカードもusedSpecialCardsにも追加 (今後の拡張性のため)
    if (card.special) {
        // note: usedSpecialCardsは現在、shuffleCardsで使用されていないため、機能していません。
        const specialEffectName = card.effect.includes("ダメージを2軽減") ? "防御" :
                                  card.effect.includes("毒を与える") ? "毒" :
                                  card.effect.includes("HPを5回復") ? "HP5回復" : "";
        if (specialEffectName) {
            gameState.usedSpecialCards.push(specialEffectName);
            setTimeout(() => {
                const idx = gameState.usedSpecialCards.indexOf(specialEffectName);
                if (idx > -1) gameState.usedSpecialCards.splice(idx, 1);
            }, 4000 * 3);
        }
    }

    if (card.legendary) {
        gameState.usedLegendaryCards = true;
    }

    renderCards();
    console.log("Enemy cards rendered. Waiting for card action.");

    // Initial delay for "さぁ結果は..."
    setTimeout(() => {
        try {
            console.log("setTimeout callback started for enemy card action.");
            const message = card.action(false);
            console.log("Card action executed. Message:", message);

            if (message) {
                messageElement.innerHTML = `ライバルのターン: 「${card.name}」だ！${message}`;
            }
            updateHP();
            console.log("HP updated after enemy card action.");

            if (checkGameEnd()) {
                gameState.isAnimating = false;
                console.log("Game ended after enemy card action.");
                return;
            }

            console.log("Game not ended. Proceeding with message display delay.");

            // NEW: Delay for user to read the card effect message before next turn's message
            setTimeout(() => { // この遅延でカード効果メッセージが表示されます
                if (gameState.enemy.extraTurns > 0) {
                    gameState.enemy.extraTurns--;
                    console.log("Enemy extra turn initiated. Calling enemyTurn.");
                    enemyTurn(); // 敵がもう一度ターンを得る
                } else {
                    if (gameState.remainingCards.length === 0) {
                        gameState.currentRound++;
                        console.log(`Starting round ${gameState.currentRound} transition after enemy turn.`);
                        showRoundNotification(gameState.currentRound, () => { // コールバックを渡す
                            shuffleCards();
                            startPlayerTurn(); // ラウンド通知が消えてからプレイヤーのターンを開始
                        });
                    } else {
                        console.log("Enemy turn ended. Calling startPlayerTurn.");
                        startPlayerTurn(); // 通常のプレイヤーのターンへの移行
                    }
                }
            }, 2500); // 2.5秒間、カード効果メッセージを表示

        } catch (error) {
            console.error("Error during enemy card action or turn progression:", error);
            messageElement.innerHTML = `ライバルのカード効果処理中にエラーが発生しました。<br>コンソールを確認してください。<br>ゲームを再開するにはページをリロードしてください。`;
            gameState.isAnimating = false;
        }
    }, 1500); // Initial delay for "さぁ結果は..." (この後、2.5秒の表示遅延が続く)
}


// ターン開始時に適用される効果 (無敵カウントダウン、毒ダメージ)
function applyTurnStartEffects(isPlayerTurn) {
    const targetState = isPlayerTurn ? gameState.player : gameState.enemy;
    const opponentState = isPlayerTurn ? gameState.enemy : gameState.player;
    // 修正: ステータス表示の親要素を .status-effects-container に変更
    const targetElement = isPlayerTurn ? playerStatusEffectsElement : enemyStatusEffectsElement;
    const opponentElement = isPlayerTurn ? enemyStatusEffectsElement : playerStatusEffectsElement;

    // 無敵効果の減少
    if (targetState.invincible > 0) {
        targetState.invincible--;
        if (targetState.invincible === 0) {
            updateStatusDisplay(targetElement, '', 'gold', isPlayerTurn ? 'playerInvincible' : 'enemyInvincible'); // 絵文字が消えるように空文字列を渡す
        }
    }
    if (opponentState.invincible > 0) {
        opponentState.invincible--;
        if (opponentState.invincible === 0) {
            updateStatusDisplay(opponentElement, '', 'gold', isPlayerTurn ? 'enemyInvincible' : 'playerInvincible'); // 絵文字が消えるように空文字列を渡す
        }
    }

    // NEW: usedNoReappearCards の有効期限チェックと削除
    gameState.usedNoReappearCards = gameState.usedNoReappearCards.filter(entry => {
        if (gameState.currentRound >= entry.reappearRound) {
            console.log(`Card '${entry.name}' is now available again.`);
            return false; // 再出現ラウンドに達したらリストから削除
        }
        return true; // まだ再出現すべきではない場合は残す
    });

    // NEW: スキル効果の期限チェックと解除
    if (gameState.skillActiveEffects.immuneToBadCards && gameState.currentRound > gameState.skillActiveEffects.immuneToBadCards) {
        console.log("Skill '慎重に' effect ended.");
        gameState.skillActiveEffects.immuneToBadCards = 0;
        updateStatusDisplay(playerStatusEffectsElement, '', 'green', 'playerImmuneToBad'); // 効果解除の絵文字を削除
    }
    if (gameState.skillActiveEffects.riskAndReturn && gameState.currentRound > gameState.skillActiveEffects.riskAndReturn) {
        console.log("Skill 'リスクandリターン' effect ended.");
        gameState.skillActiveEffects.riskAndReturn = 0;
        updateStatusDisplay(playerStatusEffectsElement, '', 'orange', 'playerRiskAndReturn'); // 効果解除の絵文字を削除
        // リスクandリターンのデバフは無いので、ここでは何もしない
    }
    if (gameState.skillActiveEffects.divineBlessing && gameState.currentRound > gameState.skillActiveEffects.divineBlessing) {
        console.log("Skill 'ご加護を' effect ended. Applying debuff.");
        gameState.skillActiveEffects.divineBlessing = 0;
        // ご加護をのデバフを適用
        gameState.skillActiveEffects.divineBlessingDebuff = gameState.currentRound + 3; // 3ラウンドデバフ
        updateStatusDisplay(playerStatusEffectsElement, '👎', 'red', 'playerDivineBlessingDebuff'); // デバフ絵文字表示
        updateStatusDisplay(playerStatusEffectsElement, '', 'gold', 'playerDivineBlessing'); // 効果解除の絵文字を削除
    }
    if (gameState.skillActiveEffects.divineBlessingDebuff && gameState.currentRound > gameState.skillActiveEffects.divineBlessingDebuff) {
        console.log("Skill 'ご加護を' debuff ended.");
        gameState.skillActiveEffects.divineBlessingDebuff = 0;
        updateStatusDisplay(playerStatusEffectsElement, '', 'red', 'playerDivineBlessingDebuff'); // デバフ絵文字削除
    }

}


// 結果画面の表示
function showResultScreen(isVictory) {
    hideAllScreens(); 
    
    overlay.style.display = 'block';
    resultScreen.style.display = 'block';
    resultScreen.innerHTML = ''; // 既存の内容をクリア

    let mainTitle = '';
    let messageParagraph = '';

    // 勝利時のメッセージを固定
    if (isVictory) {
        mainTitle = '🏆 あなたの勝ちだ！ 🏆'; 
        messageParagraph = `あなたの勝ちだ！「${gameState.lastPlayedCardName}」がとどめの一撃となった！`;
    } else { // 敗北時を固定
        mainTitle = '☠️ 敗北...だと... ☠️';
        messageParagraph = `あなたの敗北だ...。「${gameState.lastPlayedCardName}」が致命傷になってしまった。`;
    }

    let resultContent = `
        <h2 class="${isVictory ? 'victory-title' : 'defeat-title'}">${mainTitle}</h2>
        <p class="${isVictory ? 'victory-message' : 'defeat-message'}">${messageParagraph}</p>
        <div class="button-group">
            <button id="playAgainBtn" class="start-game-button">もう一度プレイ</button>
            <button id="changeHpBtn" class="show-cards-button">ゲーム設定</button>
        </div>
    `;

    resultScreen.innerHTML = resultContent;

    document.getElementById('playAgainBtn').addEventListener('click', () => {
        resultScreen.style.display = 'none';
        overlay.style.display = 'none';
        // gamesetting.htmlに戻る前にgameStateを保存
        saveGameState();
        window.location.href = 'gamestart.html'; // gamestart.htmlへ遷移してリセット
    });

    document.getElementById('changeHpBtn').addEventListener('click', () => {
        resultScreen.style.display = 'none';
        overlay.style.display = 'none';
        // gamesetting.htmlに戻る前にgameStateを保存
        saveGameState();
        window.location.href = 'gamesetting.html'; // gamesetting.htmlへ遷移してリセット
    });
}

// ゲーム終了判定
function checkGameEnd() {
    if (gameState.player.hp <= 0 || gameState.enemy.hp <= 0) {
        // Skullアイコン表示はupdateHPで制御
        
        // Game Set通知の表示を1秒遅延
        setTimeout(() => { // NEW: Game Set表示の遅延
            gameSetNotification.style.display = 'block';
            overlay.style.display = 'block';

            // Game Set通知が1.5秒表示され、その後非表示になる。
            // その後、結果画面を表示する。
            setTimeout(() => { 
                gameSetNotification.style.display = 'none'; // Game Set通知を非表示にする
                showResultScreen(gameState.player.hp > 0); // 結果画面を表示
            }, 1500); // Game Setが表示されてから1.5秒後に結果画面

        }, 1000); // HPが0になってからGame Setが表示されるまでの1秒遅延

        return true;
    }
    updateHP();
    return false;
}

// ゲームのリセット (play.js用)
function resetGame() {
    // 現在の設定を維持したまま、ゲームの状態を初期化
    // ただし、enable系のフラグは既存の値を引き継ぐ
    gameState = {
        maxHP: gameState.maxHP,
        numCardsInHand: gameState.numCardsInHand,
        enableHealCards: gameState.enableHealCards,
        enableBadCards: gameState.enableBadCards,
        enableRareCards: gameState.enableRareCards,
        enableSkills: gameState.enableSkills,
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
        lastPlayedCardName: "",
        usedNoReappearCards: [], // NEW: リセット時にこれもクリア
        selectedSkill: null, // NEW: スキルもリセット
        skillUsedThisGame: false, // NEW: スキル使用フラグもリセット
        skillCooldownRound: 0, // NEW: スキルクールダウンもリセット
        skillActiveEffects: { // NEW: アクティブスキル効果もリセット
            skipNextEnemyTurn: false,
            immuneToBadCards: 0,
            riskAndReturn: 0,
            divineBlessing: 0,
            divineBlessingDebuff: 0
        },
        skillConfirmCallback: null
    };

    // DOM要素のクリアはplay.jsのresetGameで実行される
    if (playerStatusEffectsElement) playerStatusEffectsElement.innerHTML = '';
    if (enemyStatusEffectsElement) enemyStatusEffectsElement.innerHTML = '';

    updateRoundDisplay();
    updateHP(); // HP表示を更新してHPバーとSkullアイコンを初期状態に
    messageElement.textContent = "あなたのターンです。カードを選んでください。"; // これはゲームエリアの初期メッセージなので、設定画面では表示されない
    
    // スキルボタンを非表示にし、活性化を解除
    if (activeSkillButton) { // DOM要素がロードされているか確認
        activeSkillButton.style.display = 'none';
        activeSkillButton.disabled = false;
        activeSkillButton.classList.remove('used');
    }
}

// 全てのゲーム画面とポップアップを非表示にする共通関数 (play.js用)
function hideAllScreens() {
    // play.htmlにある画面のみを操作
    if (gameAreaScreen) gameAreaScreen.style.display = 'none';
    if (cardInfoPopup) cardInfoPopup.style.display = 'none';
    if (confirmQuitPopup) confirmQuitPopup.style.display = 'none';
    if (roundNotification) roundNotification.style.display = 'none';
    if (gameSetNotification) gameSetNotification.style.display = 'none';
    if (resultScreen) resultScreen.style.display = 'none';
    if (skillConfirmPopup) skillConfirmPopup.style.display = 'none';

    if (overlay) overlay.style.display = 'none';
    if (quitButton) quitButton.style.display = 'none';
    if (currentRoundDisplay) currentRoundDisplay.style.display = 'none';
    if (activeSkillButton) activeSkillButton.style.display = 'none'; // スキルボタンも隠す
}

// プレイヤーのターンを開始する関数
function startPlayerTurn() {
    gameState.isPlayerTurn = true;
    gameState.isAnimating = false; // プレイヤーの操作を有効にする
    messageElement.textContent = "あなたのターンです。カードを選んでください。";
    console.log("Player turn started. isAnimating set to false.");
    
    // NEW: スキル管理ロジック
    if (gameState.enableSkills) {
        // クールダウンが経過した、またはまだスキルが選択されていない場合
        // (selectedSkillがnullなのは初回選択時のみ)
        if (gameState.selectedSkill === null || gameState.currentRound >= gameState.skillCooldownRound) {
            // ここでランダムに1つのスキルを割り当てる（3つから選ぶのは初回のみ）
            // 初回選択画面で選ばれたスキルは selectedSkill に格納されているので、
            // その後のラウンド更新時には selectedSkill 以外から選ぶ、というロジックは不要
            // 全てのスキルの中からランダムに選び直す
            const availableSkillsForNewSelection = allSkills; 
            
            if (availableSkillsForNewSelection.length > 0) {
                // 新しいスキルをランダムに選択して割り当て
                gameState.selectedSkill = availableSkillsForNewSelection[Math.floor(Math.random() * availableSkillsForNewSelection.length)];
                gameState.skillUsedThisGame = false; // 新しいスキルなので未使用に
                gameState.skillCooldownRound = gameState.currentRound + 3; // 次のスキル出現は3ラウンド後

                // UIの更新
                activeSkillButtonIcon.textContent = gameState.selectedSkill.icon;
                activeSkillButtonName.textContent = "スキル発動！"; // ここを「スキル発動！」に固定
                activeSkillButtonCooldown.textContent = `あと${gameState.skillCooldownRound - gameState.currentRound}R`;
                activeSkillButton.style.display = 'flex'; // ボタンを表示
                activeSkillButton.disabled = false; // ボタンを有効化
                activeSkillButton.classList.remove('used'); // 使用済みスタイルを削除

                if (gameState.currentRound > 1) { // 最初のラウンド以外でスキルが更新された場合
                    messageElement.innerHTML += `<br><span style="color:#FFD700; font-weight:bold;">新しいスキル「${gameState.selectedSkill.name}」が利用可能になりました！</span>`;
                }
                console.log(`New skill assigned: ${gameState.selectedSkill.name}. Cooldown until round ${gameState.skillCooldownRound}`);
            } else {
                // 再出現可能なスキルがない場合
                gameState.selectedSkill = null; // スキルなしの状態にする
                activeSkillButton.style.display = 'none'; // ボタンを非表示
                messageElement.innerHTML += `<br><span style="color:gray; font-weight:bold;">現在利用可能なスキルはありません。</span>`;
                console.warn("No skills available for selection at this time.");
            }
        } else {
            // クールダウン中の場合、残りラウンド数を更新して表示
            activeSkillButton.style.display = 'flex'; // ボタンを表示
            activeSkillButton.disabled = gameState.skillUsedThisGame; // 使用済みなら無効
            activeSkillButton.classList.toggle('used', gameState.skillUsedThisGame); // 使用済みスタイル適用
            
            const roundsRemaining = gameState.skillCooldownRound - gameState.currentRound;
            activeSkillButtonCooldown.textContent = `あと${roundsRemaining}R`;
        }
    } else {
        // スキル機能がオフの場合
        gameState.selectedSkill = null;
        activeSkillButton.style.display = 'none'; // スキルボタンを完全に非表示
    }
}

// 敵のターン準備をする関数
function prepareEnemyTurn() {
    gameState.isPlayerTurn = false; // 敵のターンに切り替える
    console.log("Preparing for enemy turn.");
    
    // スキルボタンを無効化
    if (activeSkillButton) {
        activeSkillButton.disabled = true;
    }
    enemyTurn();
}

// カード情報表示関数 (play.jsに残る)
function showCardInfo() {
    // cardInfoPopupとoverlayがplay.htmlに存在することを確認
    if (!cardInfoPopup || !overlay) {
        console.error("Error: cardInfoPopup or overlay element not found in play.html.");
        return;
    }

    // cardInfoContentもここで取得するように変更
    const cardInfoContent = document.getElementById('cardInfoContent');
    if (!cardInfoContent) {
        console.error("Error: cardInfoContent element not found in play.html.");
        return;
    }

    cardInfoContent.innerHTML = '';
    // ポップアップのタイトルを「カードの種類と効果」に設定し直す
    cardInfoPopup.querySelector('.popup-title').textContent = "カードの種類と効果";


    const createCardSection = (title, cards, className) => {
        let sectionHtml = `<div class="card-section ${className}">`;
        sectionHtml += `<h4>${title}</h4>`;
        cards.forEach(card => {
            let textColorClass = '';
            if (card.type === 'attack' || card.type === 'defense' || card.type === 'heal') { // heal も normal-text に分類
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

            sectionHtml += `<p class="card-entry"><span class="card-icon">${card.icon || ''}</span><span class="card-text"><strong class="${textColorClass}">${card.name}</strong>: ${card.effect}`;
            sectionHtml += `</span></p>`;
        });
        sectionHtml += `</div>`;
        return sectionHtml;
    };

    const normalCards = allCards.filter(card => 
        !card.isBad && !card.rare && !card.legendary && (card.type === 'attack' || card.type === 'defense' || card.type === 'heal')
    );
    // レアカードセクションに「盾よ守れ！」を含めるため、rareカードのフィルタリング条件を調整
    // card.rareがtrueで、かつcard.legendaryがfalseのカードをフィルタリング
    const rareCards = allCards.filter(card => 
        card.rare && !card.legendary
    );
    // ハプニングカードはisBadがtrueで、かつlegendaryではないカード
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
    console.log("「カードの種類を確認」ポップアップ表示");
}

// スキル発動確認ポップアップの表示 (ゲーム中のスキル使用時)
function showSkillConfirmPopup() {
    if (!gameState.selectedSkill || gameState.skillUsedThisGame || !gameState.isPlayerTurn || gameState.isAnimating) {
        console.log("Skill button disabled or conditions not met for activation.");
        if (!gameState.selectedSkill) {
             messageElement.textContent = "現在、発動できるスキルがありません。";
        } else if (gameState.skillUsedThisGame) {
             messageElement.textContent = "このスキルは既に使用済みです。次のスキルまでお待ちください。";
        }
        return;
    }

    skillConfirmTitle.textContent = `${gameState.selectedSkill.icon} ${gameState.selectedSkill.name}`;
    skillConfirmDescription.textContent = gameState.selectedSkill.effect;
    skillConfirmPopup.style.display = 'block';
    overlay.style.display = 'block';
    gameState.isAnimating = true;

    gameState.skillConfirmCallback = (useIt) => {
        skillConfirmPopup.style.display = 'none';
        overlay.style.display = 'none';
        
        if (useIt) {
            console.log(`Using skill: ${gameState.selectedSkill.name}`);
            gameState.skillUsedThisGame = true;
            activeSkillButton.disabled = true;
            activeSkillButton.classList.add('used');
            activeSkillButtonCooldown.textContent = "使用済み";

            const skillMessage = gameState.selectedSkill.action(true);
            if (skillMessage) {
                messageElement.innerHTML = `スキル発動！ ${skillMessage}`;
            }
            updateHP();
            checkGameEnd();
            
            setTimeout(() => {
                gameState.isAnimating = false;
                if (gameState.player.extraTurns <= 0) {
                     prepareEnemyTurn();
                } else {
                    startPlayerTurn();
                }
            }, 2500);
            
        } else {
            console.log("Skill use cancelled.");
            gameState.isAnimating = false;
        }
        gameState.skillConfirmCallback = null;
    };
}


// イベントリスナーのセットアップ
document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の割り当て (play.htmlに存在する要素のみ)
    playerHpElement = document.getElementById('playerHp');
    enemyHpElement = document.getElementById('enemyHp');
    playerSkullElement = document.getElementById('playerSkull');
    enemySkullElement = document.getElementById('enemySkull');
    playerElement = document.querySelector('.player');
    enemyElement = document.querySelector('.enemy');
    messageElement = document.getElementById('message');
    cardsContainer = document.getElementById('cards');
    gameAreaScreen = document.getElementById('gameArea');
    quitButton = document.getElementById('quitButton');
    cardInfoPopup = document.getElementById('cardInfo');
    // cardInfoContentはshowCardInfo関数内で取得するように変更
    confirmQuitPopup = document.getElementById('confirmQuit');
    roundNotification = document.getElementById('roundNotification');
    overlay = document.getElementById('overlay');
    gameSetNotification = document.getElementById('gameSetNotification');
    resultScreen = document.getElementById('resultScreen');
    currentRoundDisplay = document.getElementById('currentRoundDisplay');
    playerHpBarElement = document.getElementById('playerHpBar');
    enemyHpBarElement = document.getElementById('enemyHpBar');
    playerStatusEffectsElement = document.getElementById('playerStatusEffects');
    enemyStatusEffectsElement = document.getElementById('enemyStatusEffects');

    activeSkillButton = document.getElementById('activeSkillButton');
    // activeSkillButtonがnullでないことを確認してからquerySelectorを呼び出す
    activeSkillButtonIcon = activeSkillButton ? activeSkillButton.querySelector('.skill-icon') : null;
    activeSkillButtonName = activeSkillButton ? activeSkillButton.querySelector('.skill-name') : null;
    activeSkillButtonCooldown = activeSkillButton ? activeSkillButton.querySelector('.skill-cooldown') : null;
    
    skillConfirmPopup = document.getElementById('skillConfirmPopup');
    // skillConfirmPopupがnullでないことを確認してからquerySelectorを呼び出す
    skillConfirmTitle = skillConfirmPopup ? skillConfirmPopup.querySelector('.popup-title') : null;
    skillConfirmDescription = skillConfirmPopup ? skillConfirmPopup.querySelector('.skill-confirm-description') : null;
    useSkillYesButton = document.getElementById('useSkillYes');
    useSkillNoButton = document.getElementById('useSkillNo');

    // デバッグログで要素が取得できたか確認
    console.log('play.js DOM Elements initialized:');
    console.log('playerStatusEffectsElement:', playerStatusEffectsElement);
    console.log('enemyStatusEffectsElement:', enemyStatusEffectsElement);
    console.log('messageElement:', messageElement);
    console.log('activeSkillButton:', activeSkillButton);
    console.log('cardInfoPopup:', cardInfoPopup); // cardInfoPopupの取得確認
    console.log('skillConfirmPopup:', skillConfirmPopup); // skillConfirmPopupの取得確認


    // 初期設定
    loadGameState(); // localStorageからgameStateをロード

    // ゲーム開始時の初期化処理
    hideAllScreens(); // まずは全て隠す
    gameAreaScreen.style.display = 'flex'; // ゲームエリアを表示
    quitButton.style.display = 'block'; // 対戦終了ボタンを表示
    currentRoundDisplay.style.display = 'block'; // ラウンド表示を表示

    // ロードしたgameStateでHPを更新
    gameState.player.hp = gameState.maxHP;
    gameState.enemy.hp = gameState.maxHP;
    updateHP();

    // カードのシャッフルとターン開始
    gameState.remainingCards = []; // カードをクリア
    // currentRound は localStorage からロードされるので、そのまま使用
    showRoundNotification(gameState.currentRound, () => {
        shuffleCards();
        startPlayerTurn();
    });


    // イベントリスナーの割り当て
    if (quitButton) {
        quitButton.addEventListener('click', () => {
            confirmQuitPopup.style.display = 'block';
            overlay.style.display = 'block';
        });
    }

    if (document.getElementById('quitYes')) { // quitYesボタンの存在を確認
        document.getElementById('quitYes').addEventListener('click', () => {
            confirmQuitPopup.style.display = 'none';
            overlay.style.display = 'none';
            saveGameState(); // ゲーム設定画面に戻る前にgameStateを保存
            window.location.href = 'gamesetting.html'; // gamesetting.htmlへ遷移
        });
    }

    if (document.getElementById('quitNo')) { // quitNoボタンの存在を確認
        document.getElementById('quitNo').addEventListener('click', () => {
            confirmQuitPopup.style.display = 'none';
            overlay.style.display = 'none';
        });
    }

    if (document.getElementById('showCardsInGame')) { // 「カードの種類を確認」ボタンの存在を確認
        document.getElementById('showCardsInGame').addEventListener('click', showCardInfo);
    }
    
    if (document.getElementById('closeCardInfo')) { // closeCardInfoボタンの存在を確認
        document.getElementById('closeCardInfo').addEventListener('click', () => {
            if (cardInfoPopup) cardInfoPopup.style.display = 'none';
            if (overlay) overlay.style.display = 'none';
            // ポップアップタイトルを元に戻す（念のため）
            if (cardInfoPopup) cardInfoPopup.querySelector('.popup-title').textContent = "カードの種類と効果";
        });
    }

    // スキルボタンのイベントリスナー
    if (activeSkillButton) { // activeSkillButtonがnullでないことを確認
        activeSkillButton.addEventListener('click', showSkillConfirmPopup);
    }
    if (useSkillYesButton) { // useSkillYesButtonの存在を確認
        useSkillYesButton.addEventListener('click', () => {
            if (gameState.skillConfirmCallback) {
                gameState.skillConfirmCallback(true);
            }
        });
    }
    if (useSkillNoButton) { // useSkillNoButtonの存在を確認
        useSkillNoButton.addEventListener('click', () => {
            if (gameState.skillConfirmCallback) {
                gameState.skillConfirmCallback(false);
            }
        });
    }
});
