// gamestart.js

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

// DOM要素の宣言
let startScreen;
let startNewGameButton;
let showCardsOnStartButton;
let cardInfoPopup;
let cardInfoContent;
let closeCardInfoButton;
let overlay;

// 全てのゲーム画面とポップアップを非表示にする共通関数
function hideAllScreens() {
    if (startScreen) startScreen.style.display = 'none';
    if (cardInfoPopup) cardInfoPopup.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
}

// カード情報表示関数
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
    // ポップアップのスクロール位置をリセット
    cardInfoContent.scrollTop = 0;
    console.log("Card info popup shown in gamestart.js. Current display style:", cardInfoPopup.style.display); // Debug log
}

document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の割り当て
    startScreen = document.getElementById('startScreen');
    startNewGameButton = document.getElementById('startNewGame');
    showCardsOnStartButton = document.getElementById('showCardsOnStart');
    cardInfoPopup = document.getElementById('cardInfo');
    cardInfoContent = document.getElementById('cardInfoContent');
    closeCardInfoButton = document.getElementById('closeCardInfo');
    overlay = document.getElementById('overlay');

    // 初期表示設定
    hideAllScreens();
    startScreen.style.display = 'flex'; // スタート画面のみ表示

    // イベントリスナー
    startNewGameButton.addEventListener('click', () => {
        // gamesetting.htmlへ遷移
        window.location.href = 'gamesetting.html';
    });

    showCardsOnStartButton.addEventListener('click', showCardInfo);
    closeCardInfoButton.addEventListener('click', () => {
        cardInfoPopup.style.display = 'none';
        overlay.style.display = 'none';
        console.log("Card info popup closed by close button in gamestart.js."); // Debug log
    });

    // オーバーレイクリックでポップアップを閉じる処理
    if (overlay && cardInfoPopup) { // 両方の要素が存在することを確認
        overlay.addEventListener('click', () => {
            if (cardInfoPopup.style.display === 'block') { // ポップアップが実際に表示されている場合のみ閉じる
                cardInfoPopup.style.display = 'none';
                overlay.style.display = 'none';
                console.log("Card info popup closed via overlay click in gamestart.js."); // Debug log
            }
        });

        // ポップアップ内でのクリックがオーバーレイに伝播しないようにする
        cardInfoPopup.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log("Click inside card info popup, stopping propagation in gamestart.js."); // Debug log
        });
    } else {
        console.error("Overlay or cardInfoPopup element not found in gamestart.js. Cannot attach outer click listener."); // Debug log
    }
});
