const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// スクリーンショットのディレクトリ
const inputDir = path.join(__dirname, '..', 'screenshots-resized');
const outputDir = path.join(__dirname, '..', 'screenshots-ipad');

// 出力ディレクトリを作成
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// iPad Pro 12.9インチ用のサイズ
const TARGET_WIDTH = 2048;
const TARGET_HEIGHT = 2732;

// iPhoneスクリーンショットを取得（最初の3-5枚を使用）
const files = fs.readdirSync(inputDir)
  .filter(file => file.endsWith('.png') || file.endsWith('.PNG'))
  .slice(0, 5); // 最初の5枚を使用

console.log(`iPad用スクリーンショットを作成: ${files.length}枚\n`);

// 各ファイルを処理
async function createIPadScreenshots() {
  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file.replace(/\.(PNG|png)$/, '_ipad.png'));

    try {
      console.log(`処理中: ${file}`);

      // iPhoneスクリーンショットを読み込み
      const image = sharp(inputPath);
      const metadata = await image.metadata();

      console.log(`  元のサイズ: ${metadata.width}x${metadata.height}`);

      // iPadサイズに合わせてリサイズ（両側に余白を追加）
      // iPhoneスクリーンショットを中央に配置し、背景を追加
      const scaleFactor = Math.min(
        TARGET_WIDTH / metadata.width,
        TARGET_HEIGHT / metadata.height
      ) * 0.9; // 90%のサイズで配置（余白を持たせる）

      const scaledWidth = Math.round(metadata.width * scaleFactor);
      const scaledHeight = Math.round(metadata.height * scaleFactor);

      // 背景を作成（白背景）
      const background = sharp({
        create: {
          width: TARGET_WIDTH,
          height: TARGET_HEIGHT,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
      });

      // リサイズした画像を中央に配置
      const resizedImage = await sharp(inputPath)
        .resize(scaledWidth, scaledHeight, {
          fit: 'contain'
        })
        .toBuffer();

      await background
        .composite([{
          input: resizedImage,
          top: Math.round((TARGET_HEIGHT - scaledHeight) / 2),
          left: Math.round((TARGET_WIDTH - scaledWidth) / 2)
        }])
        .png()
        .toFile(outputPath);

      console.log(`  → 作成完了: ${TARGET_WIDTH}x${TARGET_HEIGHT}`);
      console.log(`  → 保存先: ${path.basename(outputPath)}\n`);

    } catch (error) {
      console.error(`エラー: ${file} の処理に失敗しました`);
      console.error(error.message);
      console.log('');
    }
  }

  console.log('='.repeat(50));
  console.log('iPad用スクリーンショットの作成が完了しました！');
  console.log(`出力ディレクトリ: ${outputDir}`);
  console.log(`作成枚数: ${files.length}枚`);
  console.log('='.repeat(50));
}

// 実行
createIPadScreenshots().catch(console.error);
