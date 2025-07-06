//大学からの時刻表 秒単位 //分単位にしています。
// (7:00→420)(19:00→1140)
//↑(時間×60, 分はそのまま足す)
//(7:30→450)(19:30→1170)
//2025/4/4更新

//休業日はあとでやる
//大学to駅のバス時刻表


document.addEventListener('DOMContentLoaded', (event) => {
    // ここに全てのJavaScriptコードを記述する
    // BusTime_FromUniversity, updateTime, updateAll, startTimer など
    let BusTime_FromUniversity = [
    27600,           // 7時台
    29400, 30000,   // 8時台
    33300, 34500, 35700, //9時台
    38400, 39300,          // 640, 655 → 10時台
    40500, 41700, 42900,   // 675, 695, 715 → 11時台
    45000, 46500,          // 750, 775 → 12時台
    47700, 48900, 50100,   // 795, 815, 835 → 13時台
    51300, 52800, 53700,   // 855, 880, 895 → 14時台
    54900, 56100, 57300,   // 915, 935, 955 → 15時台
    59700, 60900,          // 995, 1015 → 16時台
    61800, 63300,          // 1030, 1055 → 17時台
    65700, 67500,          // 1095, 1125 → 18時台
    68400, 70200,          // 1140, 1170 → 19時台
    72600,                 // 1210 → 20時台
    75600                  // 1260 → 21時台
];

//駅to大学のバス時刻表
let BusTime_FromStation = [
    28800, 29400, 30900, 32100,     // 480, 490, 515, 535 → 8時台
    33000, 34800, 35700,            // 550, 580, 595 → 9時台
    36300, 38100, 39300,            // 605, 635, 655 → 10時台
    40500, 41700, 42900,            // 675, 695, 715 → 11時台
    44400, 45600,                   // 740, 760 → 12時台
    47100, 48900, 50100,            // 785, 815, 835 → 13時台
    51300, 52500, 53700,            // 855, 875, 895 → 14時台
    54900, 56100, 57300,            // 915, 935, 955 → 15時台
    58200, 59700,                   // 970, 995 → 16時台
    61500, 63300, 64500,            // 1025, 1055, 1075 → 17時台
    66600,                          // 1110 → 18時台
    69300, 71100,                   // 1155, 1185 → 19時台
    73500,                          // 1225 → 20時台
    76500                           // 1275 → 21時台
];

// ゲージの回転範囲
//0~-325度まで、
//秒数を角度で割ることで、1秒間に進むべき角度をしめす。
// --- ゲージの動きに関する設定（ここだけ調整すればOKです） ---
// 針が動き始める残り時間 (ゲージの開始点)
// バスまで30分以上あってもゲージはMAXで止まる基準
const GAUGE_TIME_START_SECONDS = 30 * 60; // 30分 = 1800秒

// 針が動き終わる残り時間 (ゲージの終了点)
// バスまで0分になったらゲージは止まる基準
const GAUGE_TIME_END_SECONDS = 0 * 60; // 0分 = 0秒

// ゲージの角度範囲を定義 (あなたのデザインに合わせて調整)
// GAUGE_START_DEGREE: GAUGE_TIME_START_SECONDS の時の針の角度 (例: 0度)
// GAUGE_END_DEGREE: GAUGE_TIME_END_SECONDS の時の針の角度 (例: 325度)
const GAUGE_START_DEGREE = 30;   // 計算上の開始角度
const GAUGE_END_DEGREE = 323;   // 計算上の終了角度

// ゲージの全角度範囲 (計算用)
const GAUGE_DEGREE_RANGE = GAUGE_END_DEGREE - GAUGE_START_DEGREE; // (325 - 0) = 325度

// ゲージが実際に動く時間の幅 (計算用)
// ゲージの針が動くのは、GAUGE_TIME_START_SECONDS から GAUGE_TIME_END_SECONDS までの間だけです。
const GAUGE_DURATION_SECONDS = GAUGE_TIME_START_SECONDS - GAUGE_TIME_END_SECONDS; // 1800 - 0 = 1800秒 (30分間)
// --- 設定ここまで ---

//---閾値---(色の)
//30分以上は、GAUGE_TIME_START_SECONDSでする

//30分~12分の間
const color_change_threshold_3 = 12 * 60;

//12分~6分
const color_change_threshold_2 = 6 * 60;

const color_green = {r: 0, g: 255, b: 0};
const color_yellow = {r: 255, g: 255, b: 0};
const color_red = {r: 255, g: 0, b: 0};


let current_turn = 0;
//boxを回転させる関数


//バスの時刻表を取得する関数
//毎秒残り時間を計算する
function updateTime(Array, ClassName) {
    const now = new Date();
    const total_seconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds() + 1;//時刻が1秒ずれるのを+1でカバー(対症療法(根本的解決にはなってません))
    const nextBus = Array.find(time => time > total_seconds);
    
    // console.log(nextBus)
    // console.log(total_seconds)
    
    
    const container = document.getElementsByClassName(ClassName);
    for (let con of container) {
        const timeElement = con.querySelector('.time');
        const secondsElement = con.querySelector('.seconds');
        const content = con.querySelector('.content');
        const limit_text = con.querySelector('.time_flame');
        const main_bar = con.querySelector('.bar'); // ここでメインとなるバーを取得
        const sub_bar = con.querySelector('.bar2'); // ここでサブとなるバーを取得
        const white_bar = con.querySelector('.bar-white'); // ここで白で一部を隠す用のバーを取得
        let currentColor = {r:0, g:0, b:0}; // 計算される現在の色
        if(nextBus != undefined){
            //見つかった時の処理(時刻表示)
            // 次のバスの時刻から現在までの時間を計算する(残り時間を取得)
            const time_difference = nextBus - total_seconds;
            // console.log(time_difference)


            // --- ゲージの針の回転計算 ---
            if (main_bar) {
                // 1. time_difference を、ゲージが動く有効な表示範囲 (GAUGE_TIME_END_SECONDS 〜 GAUGE_TIME_START_SECONDS) に制限（クランプ）します。
                //    これにより、time_differenceが30分より長くても、0秒より短くても、針は設定した範囲に収まります。
                // const clampedDisplayTime = time_difference;
                const clampedDisplayTime = Math.min(
                    Math.max(time_difference, GAUGE_TIME_END_SECONDS), // 0秒より少なくならないようにするガード
                    GAUGE_TIME_START_SECONDS // 30分より多くならないようにするガード
                );

                // 2. 制限された残り時間を、ゲージ全体の時間に対する「割合」（0から1の小数）に変換します。
                //    ゲージの始点 (GAUGE_TIME_START_SECONDS: 30分) の時に percentage は 0 (進捗なし)
                //    ゲージの終点 (GAUGE_TIME_END_SECONDS: 0分) の時に percentage は 1 (進捗完了)
                const progressPercentage = (GAUGE_TIME_START_SECONDS - clampedDisplayTime) / GAUGE_DURATION_SECONDS;

                // 3. その「パーセント」を、ゲージの針が動く「角度」に変換します。
                //    GAUGE_START_DEGREE (0) から始まり、GAUGE_DEGREE_RANGE (325) 分、progressPercentage に応じて変化します。
                //    結果として、targetRotationDegree は 0 から 325 の範囲に収まります。
                const targetRotationDegree = GAUGE_START_DEGREE + (GAUGE_DEGREE_RANGE * progressPercentage);

                    // 4. 計算された角度をCSSに適用します。
                    //    targetRotationDegree は正の値なので、-を付けて反時計回りに動かします。
                    // console.log(targetRotationDegree);

                    // --- 180度（半周）以上でのサブバーと白バーの操作（あなたの既存ロジックを反映） ---
                    // 注意: targetRotationDegree は 0 から 325 の範囲です。
                    //       判断する180度は、この正の角度として判断します。
                    if (targetRotationDegree < 180) { // ゲージ前半 (0度から180度へ向かう間)
                        main_bar.style.transform = `rotate(-${targetRotationDegree}deg)`;
                        white_bar.style.zIndex = '0';
                        sub_bar.style.transform = 'rotate(180deg)';
                        sub_bar.classList.remove('is-visible');

                    } else { // ゲージ後半 (180度から325度へ向かう間)

                        // サブバーを残り角度分だけ回転させる
                        main_bar.style.transform = `rotate(-${targetRotationDegree}deg)`; // メインバーを半周固定
            
                        // white_bar.style.transform = `rotate(0deg)`; // メインバーを半周固定
                        sub_bar.style.transform = `rotate(-${targetRotationDegree}deg)`;
                        white_bar.classList.add('is-visible');

                        // white_bar.style.zIndex = '100';

                    }
                    // console.log(targetRotationDegree)

                    // if(targetRotationDegree - angle_previous >= 5){
                    //     main_bar.style.transform = `rotate(0deg)`; // メインバーを半周固定
                    //     white_bar.style.zIndex = `0`; // メインバーを半周固定
                    //     sub_bar.style.transform = `rotate(-180deg)`;
                    //     main_bar.style.backgroundColor = `rgb(0, 255, 0)`;
                    //     sub_bar.style.backgroundColor = `rgb(0, 255, 0)`;
                    // }else{
                    //     angle_previous = targetRotationDegree;
                    // }


            }

                const hoursStr = Math.floor(time_difference / 3600);
                const minutesStr = Math.floor((time_difference % 3600) / 60);
                const secondsStr = time_difference % 60;
                const limit_Minutes = Math.floor(nextBus / 60) - Math.floor(total_seconds / 60);
                // console.log(limit_Minutes)
                //==============================================

                //時間を表示する(時間:分)(秒)それぞれ別で表示
                const timeString = `${String(hoursStr).padStart(2, '0')}:${String(minutesStr).padStart(2, '0')}`;
                const secondsString = `${secondsStr}`
                // ==============================================


                timeElement.textContent = timeString;
                timeElement.classList.remove('time--closed');
                timeElement.classList.add('time--clock');

                secondsElement.textContent = secondsString;

                limit_text.classList.remove('time_flame--closed');

            //色の計算式
            // console.log(time_difference);

            if(time_difference >= GAUGE_TIME_START_SECONDS ){//30分以上なら黄緑固定
                main_bar.style.backgroundColor = `rgb(0, 255, 0)`;
                sub_bar.style.backgroundColor = `rgb(0, 255, 0)`;


                // console.log("30分以上");//デバッグ用
            }else if(time_difference > color_change_threshold_3){//12
                currentColor.g = 255;
                const section = GAUGE_TIME_START_SECONDS - color_change_threshold_3;
                const elapsed_time_color = GAUGE_TIME_START_SECONDS - time_difference;
                // console.log(elapsed_time_color);
                const progress = elapsed_time_color / section;//これで0~1に収める
                currentColor.r = (color_green.r + (color_yellow.r - color_green.r) * progress);
                if (main_bar) {
                main_bar.style.backgroundColor = `rgb(${Math.max(0, Math.min(255, Math.round(currentColor.r)))}, ${Math.max(0, Math.min(255, Math.round(currentColor.g)))}, ${Math.max(0, Math.min(255, Math.round(currentColor.b)))})`;
                sub_bar.style.backgroundColor = `rgb(${Math.max(0, Math.min(255, Math.round(currentColor.r)))}, ${Math.max(0, Math.min(255, Math.round(currentColor.g)))}, ${Math.max(0, Math.min(255, Math.round(currentColor.b)))})`;
                // console.log(currentColor);
                }

                // console.log(section);//1080;
                // console.log("30~12の間")//デバッグ用

//=========================12～6分===============================================
            }else if(time_difference > color_change_threshold_2){//12~6
                const section = GAUGE_TIME_START_SECONDS - color_change_threshold_2;
                const section2 = color_change_threshold_3 - color_change_threshold_2;
                const elapsed_time_color = GAUGE_TIME_START_SECONDS - time_difference;
                const elapsed_time_color2 = color_change_threshold_3 - time_difference;
                const progress = elapsed_time_color  / section;//これで0~1に収める
                const progress2 = elapsed_time_color2  / section2;//これで0~1に収める
                // console.log(progress)
                currentColor.r = (color_green.r + (color_yellow.r - color_green.r) * progress);
                currentColor.g = (color_yellow.g + (color_red.g - color_yellow.g) * progress2);
                if (main_bar) {
                main_bar.style.backgroundColor = `rgb(${Math.max(0, Math.min(255, Math.round(currentColor.r)))}, ${Math.max(0, Math.min(255, Math.round(currentColor.g)))}, ${Math.max(0, Math.min(255, Math.round(currentColor.b)))})`;
                sub_bar.style.backgroundColor = `rgb(${Math.max(0, Math.min(255, Math.round(currentColor.r)))}, ${Math.max(0, Math.min(255, Math.round(currentColor.g)))}, ${Math.max(0, Math.min(255, Math.round(currentColor.b)))})`;
                // console.log(currentColor);
                }


                // console.log(section);//720
                // console.log("12~6の間");//デバッグ用


            }else{
                currentColor.r = 255;
                if (main_bar) {
                main_bar.style.backgroundColor = `rgb(${Math.max(0, Math.min(255, Math.round(currentColor.r)))}, ${Math.max(0, Math.min(255, Math.round(currentColor.g)))}, ${Math.max(0, Math.min(255, Math.round(currentColor.b)))})`;
                sub_bar.style.backgroundColor = `rgb(${Math.max(0, Math.min(255, Math.round(currentColor.r)))}, ${Math.max(0, Math.min(255, Math.round(currentColor.g)))}, ${Math.max(0, Math.min(255, Math.round(currentColor.b)))})`;
                // console.log(currentColor);
                }
            }

// const color_green = {r: 0, g: 255, b: 0};
// const color_yellow = {r: 255, g: 255, b: 0};
// const color_red = {r: 255, g: 0, b: 0};


        }else{
            //見つからなかった時の処理(本日の営業は終了しました)
            timeElement.innerHTML = '本日の営業は<br>終了しました';
            secondsElement.classList.remove('time--clock');
            limit_text.classList.add('time--closed');
            secondsElement.textContent = '';
            limit_text.classList.add('time_flame--closed')

            main_bar.style.transform = `rotate(0deg)`; // メインバーを半周固定
            white_bar.style.zIndex = `0`; // メインバーを半周固定
            sub_bar.style.transform = `rotate(-180deg)`;
            main_bar.style.backgroundColor = `purple`
            sub_bar.style.backgroundColor = `purple`
        }

            //↓ゲージの初期化
        // if(total_seconds === nextBus){
        //     // console.log("ゲージの初期化")//デバッグ用
        //     main_bar.style.transform = `rotate(0deg)`; // メインバーを半周固定
        //     white_bar.style.zIndex = `0`; // メインバーを半周固定
        //     sub_bar.style.transform = `rotate(-180deg)`;
        //     main_bar.style.backgroundColor = `rgb(0, 255, 0)`;
        //     sub_bar.style.backgroundColor = `rgb(0, 255, 0)`;
        // }
    }
}

function rotate_box(){

    const boxes = document.querySelectorAll('.content');
    for(let i = 0; i < boxes.length; i++){
        const box = boxes[i];
        box.style.transform = `rotateX(${current_turn}turn)`;
    }
    
    current_turn += 0.25;

    console.log(`現在の角度: ${current_turn}turn`);
}

function updateAll() {
    updateTime(BusTime_FromUniversity, "from_university");
    updateTime(BusTime_FromStation, "from_station");
}

function startTimer() {
    const now = new Date();
    const delay = 1000 - now.getMilliseconds(); // 次の1秒区切りまで待つ

    setTimeout(() => {
        updateAll(); // 最初の更新
        document.body.classList.add('loaded'); // bodyにloadedクラスを追加して表示する
        setInterval(updateAll, 1000); // 以降1秒ごとに更新


        //3Dボックスの回転
        setInterval(rotate_box, 8000);
    }, delay);
}

startTimer(); // タイマーを開始
});


