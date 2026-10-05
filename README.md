# 夜班频率 Night Shift Frequency

凌晨两点，海边小镇「低潮镇」的港湾便利店。你在收银台上一个八单的夜班：扫码、收款、加热、装袋。
柜台上的收音机开着深夜节目 FM 87.6「夜航台」；窗外海湾对岸，那座停用十二年的中继塔亮着红灯。
今晚，扫码枪会把一瓶可乐读成「备用钥匙」，而你保存的记录，会决定后来那位客人的遭遇。

中英双语，480×270 像素美术，浏览器直接打开即可玩。

## 怎么玩

用浏览器打开 `index.html`，点「开始上班」。不需要服务器，也不需要构建。

- 点商品，再点扫码枪；全部扫完后按顾客说的方式收款（刷卡/手机点刷卡机，现金点零钱托盘）。
- 便当要先付款再加热：点微波炉。要袋子就点塑料袋。
- 收银机屏幕可以点开，查看交易记录。登记和实物对不上时，要先回柜台再扫一次，记录选项才会出现。
- 点收音机可以在 87.6 和 87.7 之间换台。
- 右上角切换中文/英文（或按 L 键）和声音开关。

用 `index.html?seed=review-01` 可以复现同一班的订单。刷新会重新开始，不存档。

## 当前内容

- 八单：六单普通订单（随机组合商品、付款方式、装袋和对白），第 5、8 单是剧情单。
- 第 5 单：黄雨衣的阿雯边打电话边买可乐，登记却是「备用钥匙」。复扫之后选择保留登记或改为实物。
- 第 8 单：一位长得和她几乎一样、头发分向相反的客人来取钥匙。选择沿用 #005 的记录，或按本次扫描记录。
- 两次选择组合出四种结局，由夜航台在交班后读出。87.7「回声台」会念出你没有保存的那份记录。
- 十位常客，用像素部件组合（脸型、发型、外套、配饰）加各自的配色。

世界观设定见 [docs/worldview.md](docs/worldview.md)，实现与验证见 [docs/build-notes.md](docs/build-notes.md)。

## 项目结构

- `index.html`：唯一入口，按顺序加载脚本（经典脚本，`file://` 下可用）。
- `js/content/`：布局、双语文本、顾客外观、剧情与电台台本。
- `js/engine/shift.js`：订单生成、复扫、记录决定和账本（纯逻辑，Node 可测）。
- `js/core/time.js`：统一的游戏时钟，所有等待和动画都由它驱动。
- `js/game/`：结账控制器、对白、收音机、记录面板、合成音效。
- `js/render/`：精灵缓存与换色、位图字体、世界层和界面层绘制。
- `art/`：像素美术的一切——源文件（`src/`）、调色板、手绘覆盖图（`overrides/`）、字体源文件和构建脚本（`tools/`）。
- `assets/`：生成的运行时数据（精灵和字形），不要手改。

## 修改美术和文字

美术源文件在 `art/src/*.cjs`，用调色板颜色名写像素。修改后运行：

```sh
node art/tools/build-art.cjs          # 生成 assets/sprite-data.js、art/palette.gpl，以及 tests/artifacts 里的预览图
node art/tools/build-art.cjs --png    # 额外导出索引色 PNG 到 art/png/（不进版本库）
node art/tools/build-art.cjs --preview customers   # 只预览某个源文件
```

想用 Aseprite 手绘某个精灵：先用 `--png` 导出，打开 `art/png/<名字>.png`，载入 `art/palette.gpl`，只用调色板里的颜色。
画好后另存到 `art/overrides/<名字>.png`，再运行一次 `build-art`，它会替换脚本生成的版本。

文字都在 `js/content/strings.js`，每条都有中文和英文。改动后重新烘焙字形（需要 Python 和 Pillow）：

```sh
python3 art/tools/build-font.py
```

字体是 [Fusion Pixel 12px](https://github.com/TakWolf/fusion-pixel-font)（SIL OFL 1.1，见 `art/font/OFL.txt`）。

## 测试

```sh
node tests/shift-engine.test.cjs   # 500 个种子、四条记录分支、账本不可变
node tests/content.test.cjs        # 双语文本、引用、结局、字形覆盖
node tests/art.test.cjs            # 精灵与源文件一致、调色板、引用、布局和锚点
node tests/browser-flow.cjs        # 真实点击走完四条分支、报表、结局、语言、窄屏
node tests/visual.cjs              # 关键帧截图：贴卡、现金、加热、串台、回声台、英文、横屏手机
```

浏览器测试需要 Chrome 和 Playwright；Playwright 不在本地时，用 `PLAYWRIGHT_MODULE` 指向它的绝对路径。
截图输出到 `tests/artifacts/`，属于可丢弃的测试产物。
