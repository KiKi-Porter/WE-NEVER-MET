# 图片素材提示词（image-2）

生成后放到 `fermi/assets/`，**文件名必须与下面一致**。

## 通用要求
- 比例 **16:9 横版**，分辨率选最高档；保存为 PNG。
- **背景必须是纯黑**（#000）：代码会用"滤色 / lighter"方式把图片叠到黑底画面上，黑色部分会自动变透明。
- 画面里**不要有任何文字、logo、水印、边框**。
- 色调：除金唱片外一律是**去饱和的银灰 + 冷蓝**，与视频调色一致。
- 每张多生成 2–3 张备选，挑一张最干净的。

每条提示词末尾都加上这段通用后缀：

```
cinematic, photorealistic, low-key lighting, deep pure black background, desaturated silver and cold blue palette, high contrast, subtle film grain, ultra detailed, 16:9, no text, no letters, no watermark, no border
```

---

### 1. `arecibo.png` — 阿雷西博射电望远镜（场景 III）
```
Aerial night view of the Arecibo radio telescope in Puerto Rico, the giant 305-meter spherical dish nestled in a jungle sinkhole, the triangular receiver platform suspended by cables high above the dish, faint moonlight glinting on the dish's metal panels, dense starfield above, the surrounding jungle falling into total darkness at the frame edges, a sense of solitude and scale, camera at a 45-degree angle from above
```
> 构图要求：望远镜在画面中央偏下，四周大面积留黑，方便镜头推进。

### 2. `voyager.png` — 旅行者 1 号探测器（场景 III、VI）
```
The Voyager 1 space probe drifting alone in deep space, isolated object on a pure black background, three-quarter side view, large white high-gain parabolic antenna dish facing the viewer at an angle, long thin magnetometer boom extending to one side, RTG power arm on the other, a small gold disc mounted on the body, strong rim light from a distant sun at the far left, the rest of the probe in deep shadow, no stars, no planets
```
> 构图要求：**只有探测器，背景纯黑，不要星星**（星空由代码画，方便做视差和旋转）。探测器占画面约 40%，居中。

### 3. `golden_record.png` — 旅行者金唱片（场景 III、VII）
```
The Voyager Golden Record, a gold-plated copper phonograph disc photographed straight-on from directly above, perfectly circular and centered, isolated on a pure black background, fine concentric grooves catching a soft warm specular highlight, a small center hole, subtle engraved geometric line diagrams on the surface, warm gold metal against black, macro product photography, studio lighting
```
> **唯一允许暖金色的素材**。必须正俯视、正圆、居中（代码要让它旋转，椭圆会穿帮）。表面刻纹不准确也没关系，我会在上面用代码再叠一层发光刻线。

### 4. `earth_night.png` — 夜半球地球（场景 I、VI）
```
Planet Earth seen from deep space, half in night, glowing city lights scattered across the dark continents, a thin luminous blue atmospheric rim along the sunlit edge, the planet floating alone on a pure black background, centered, occupying about half the frame height, no moon, no stars, no spacecraft
```
> 构图要求：地球居中，四周纯黑。

### 5. `dead_world.png` — 死寂文明的废墟（场景 V）
```
A desolate alien planet surface at twilight, colossal ancient ruins of an extinct civilization's megastructures half buried in grey dust, broken geometric towers and a shattered dome, a huge ringed gas giant hanging low in a dark sky, thin mist drifting between the ruins, cold silver light, absolute silence and loneliness, wide establishing shot, the sky fading into pure black at the top of the frame
```
> 构图要求：画面上半部分逐渐过渡到纯黑（片名 / 字幕会压在上面）。

### 6. `exoplanet_horizon.png` — 系外行星的地平线（场景 VII）
```
The horizon of an alien ocean world seen from low orbit, a dark planet curving across the lower third of the frame, a thin glowing atmospheric arc, a distant binary star rising behind the planet's limb and casting a long cold-blue light flare across the atmosphere, the upper two-thirds of the frame is deep empty black space, epic, hopeful, quiet
```
> 构图要求：上方 2/3 是纯黑空间（金唱片会叠在这里）。

### 7. `nebula.png` — 深空星云背景（S0，可选）
```
A faint wide deep-space nebula, wispy interstellar dust clouds in monochrome silver-grey with traces of cold blue, very dark and subtle, mostly black with soft glowing filaments, no bright stars, no planets, used as a background plate
```
> 一定要**暗、低对比**，它只是星空粒子后面的底层，不能抢戏。

### 8. `big_ear.png` — Big Ear 射电望远镜（场景 IV，可选）
```
A 1970s radio observatory at night in flat Ohio farmland, an enormous flat ground-level reflector field made of aluminum mesh stretching toward the horizon, a large tilting flat reflector wall at one end and a curved parabolic reflector wall at the other, faint moonlight on the metal mesh, starry sky, deserted, documentary photography style
```
> 这台望远镜模型可能不认识，生成得不像就不要了，场景 IV 会改成全代码绘制的打印纸。

---

## 不需要你生成，由代码绘制
星空、银河系旋臂、M13 星团、0/1 比特雨、阿雷西博图案（真实数据）、德雷克方程与对数轴、Wow! 打印纸、大过滤器台阶与粒子、无线电气泡、暗淡蓝点、所有文字与公式。
