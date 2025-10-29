/**
 * アプリアイコンとスプラッシュ画像を生成するスクリプト
 * native-app-icon.pngから以下を生成：
 * - icon.png (1024x1024px)
 * - adaptive-icon.png (1024x1024px)
 * - splash.png (2048x2048px)
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// パスの設定
const assetsDir = path.join(__dirname, '..', 'assets');
const sourceIcon = path.join(assetsDir, 'native-app-icon.png');
const outputIcon = path.join(assetsDir, 'icon.png');
const outputAdaptiveIcon = path.join(assetsDir, 'adaptive-icon.png');
const outputSplash = path.join(assetsDir, 'splash.png');

// スプラッシュ画面の背景色（アイコンのグラデーションを際立たせる白）
const SPLASH_BG_COLOR = { r: 255, g: 255, b: 255, alpha: 1 }; // 白

async function generateIcons() {
  try {
    console.log('📱 アプリアイコンとスプラッシュ画像の生成を開始します...\n');

    // ソース画像の情報を取得
    const sourceMetadata = await sharp(sourceIcon).metadata();
    console.log(`ソース画像: ${sourceMetadata.width}x${sourceMetadata.height}px`);

    // 1. icon.png (1024x1024px) を生成
    console.log('\n1️⃣  icon.png (1024x1024px) を生成中...');
    await sharp(sourceIcon)
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputIcon);
    console.log('✅ icon.png を生成しました');

    // 2. adaptive-icon.png (1024x1024px) を生成
    console.log('\n2️⃣  adaptive-icon.png (1024x1024px) を生成中...');
    await sharp(sourceIcon)
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputAdaptiveIcon);
    console.log('✅ adaptive-icon.png を生成しました');

    // 3. splash.png (2048x2048px) を生成
    // アイコンを中央に配置し、背景色を設定
    console.log('\n3️⃣  splash.png (2048x2048px) を生成中...');

    // アイコンを適切なサイズにリサイズ（スプラッシュ画面の50%程度）
    const iconSize = Math.floor(2048 * 0.5);
    const resizedIcon = await sharp(sourceIcon)
      .resize(iconSize, iconSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();

    // 背景を作成してアイコンを中央に合成
    const offset = Math.floor((2048 - iconSize) / 2);
    await sharp({
      create: {
        width: 2048,
        height: 2048,
        channels: 4,
        background: SPLASH_BG_COLOR
      }
    })
    .composite([{
      input: resizedIcon,
      top: offset,
      left: offset
    }])
    .png()
    .toFile(outputSplash);
    console.log('✅ splash.png を生成しました');

    console.log('\n🎉 すべてのアイコンとスプラッシュ画像の生成が完了しました！');
    console.log('\n生成されたファイル:');
    console.log(`  - ${outputIcon}`);
    console.log(`  - ${outputAdaptiveIcon}`);
    console.log(`  - ${outputSplash}`);

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプトを実行
generateIcons();
