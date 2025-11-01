const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// スクリーンショットのディレクトリ
const screenshotsDir = path.join(__dirname, '..', 'screenshots');
const outputDir = path.join(__dirname, '..', 'screenshots-resized');

// 出力ディレクトリを作成
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// App Store用のサイズ（縦向き）
const TARGET_WIDTH = 1284;
const TARGET_HEIGHT = 2778;

// スクリーンショットファイルを取得
const files = fs.readdirSync(screenshotsDir).filter(file =>
  file.endsWith('.PNG') || file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')
);

console.log(`見つかったスクリーンショット: ${files.length}枚\n`);

// 各ファイルを処理
async function processScreenshots() {
  for (const file of files) {
    const inputPath = path.join(screenshotsDir, file);
    const outputPath = path.join(outputDir, file.replace(/\.(PNG|png|jpg|jpeg)$/, '.png'));

    try {
      // 画像のメタデータを取得
      const metadata = await sharp(inputPath).metadata();
      console.log(`処理中: ${file}`);
      console.log(`  元のサイズ: ${metadata.width}x${metadata.height}`);

      const originalWidth = metadata.width;
      const originalHeight = metadata.height;

      // アスペクト比を計算
      const targetAspectRatio = TARGET_WIDTH / TARGET_HEIGHT;
      const currentAspectRatio = originalWidth / originalHeight;

      let resizeWidth, resizeHeight;
      let cropX = 0, cropY = 0;

      // まず、ターゲットサイズに合わせてリサイズ
      if (currentAspectRatio > targetAspectRatio) {
        // 横幅が広すぎる場合（横をトリミング）
        resizeHeight = TARGET_HEIGHT;
        resizeWidth = Math.round(originalWidth * (TARGET_HEIGHT / originalHeight));
        cropX = Math.round((resizeWidth - TARGET_WIDTH) / 2);
      } else if (currentAspectRatio < targetAspectRatio) {
        // 縦幅が長すぎる場合（上からトリミング）
        resizeWidth = TARGET_WIDTH;
        resizeHeight = Math.round(originalHeight * (TARGET_WIDTH / originalWidth));
        cropY = 0; // 上からトリミング
      } else {
        // アスペクト比が一致している場合
        resizeWidth = TARGET_WIDTH;
        resizeHeight = TARGET_HEIGHT;
      }

      // リサイズとトリミングを実行
      await sharp(inputPath)
        .resize(resizeWidth, resizeHeight, {
          fit: 'fill'
        })
        .extract({
          left: cropX,
          top: cropY,
          width: TARGET_WIDTH,
          height: TARGET_HEIGHT
        })
        .png()
        .toFile(outputPath);

      console.log(`  → リサイズ完了: ${TARGET_WIDTH}x${TARGET_HEIGHT}`);
      console.log(`  → 保存先: ${path.basename(outputPath)}\n`);

    } catch (error) {
      console.error(`エラー: ${file} の処理に失敗しました`);
      console.error(error.message);
      console.log('');
    }
  }

  console.log('='.repeat(50));
  console.log('すべてのスクリーンショットの処理が完了しました！');
  console.log(`出力ディレクトリ: ${outputDir}`);
  console.log('='.repeat(50));
}

// 実行
processScreenshots().catch(console.error);
