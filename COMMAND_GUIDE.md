# Command Guide

Particle Multiverse OS supports local voice commands and camera hand gestures. Commands are processed locally through the app command router.

## Voice Commands

Voice confidence must be at least `0.65`. The same command will not repeat within one second.

### Page

| Chinese | English | Action |
| --- | --- | --- |
| 下一页 | next | Next world |
| 上一页 | back | Previous world |
| 回到首页 | home | AI World Tree |
| 进入终极模式 | ultimate mode | Ultimate world |

### Scene

| Chinese | English | Action |
| --- | --- | --- |
| 进入生命树 / 打开生命树 / 切到生命树 | world tree | AI World Tree |
| 进入黑洞 / 打开黑洞 / 切到黑洞 | black hole | Black Hole Universe |
| 进入反应堆 / 打开反应堆 / 切到反应堆 | arc reactor | ARC Reactor |
| 进入神经网络 / 打开神经网络 / 切到神经网络 | neural brain | Neural Brain |
| 进入四维宇宙 / 打开四维宇宙 / 切到四维宇宙 | tesseract | Tesseract |

### Particle

| Chinese | English | Action |
| --- | --- | --- |
| 粒子爆发 | burst | Shockwave burst |
| 重置粒子 | reset particles | Reset particles |
| 增强粒子 | quality up | Raise quality |
| 降低粒子 | quality down | Lower quality |

### Music

| Chinese | English | Action |
| --- | --- | --- |
| 播放音乐 | play music | Play current track |
| 暂停音乐 | pause music | Pause current track |
| 音乐模式 | music mode | Toggle music mode |

### System

| Chinese | English | Action |
| --- | --- | --- |
| 打开仪表盘 | open dashboard | Open Dashboard |
| 关闭仪表盘 | close dashboard | Close Dashboard |
| 开启自动模式 | auto mode on | Enable Auto Mode |
| 关闭自动模式 | auto mode off | Disable Auto Mode |
| 显示指令 | show commands | Open Command Help |

## Gesture Commands

Gesture page switching has a one-second cooldown. `DOUBLE_OPEN` burst has a two-second cooldown.

| Gesture | Action |
| --- | --- |
| 张开手 / `OPEN_HAND` | Particle expansion |
| 握拳 / `FIST` | Particle convergence |
| 食指指向 / `POINT` | Particle follows fingertip |
| 左挥 / `SWIPE_LEFT` | Previous world |
| 右挥 / `SWIPE_RIGHT` | Next world |
| 捏合 / `PINCH` | Particle focus |
| 双手张开 / `DOUBLE_OPEN` | Current world burst |
| 双手握拳 / `DOUBLE_FIST` | Calm / focus state |

Complex circle, two-hand rotation, expand, and collapse gestures are intentionally disabled for stability.

## Enable Voice

1. Click `VOICE`, or press `V`.
2. Allow microphone permission when the system asks.
3. Say a supported Chinese or English command.

If voice recognition fails, the HUD shows `未识别命令` or `识别不确定`.

## Enable Camera And Gestures

1. Click `CAMERA / HAND`, or press `H`.
2. Allow camera permission.
3. Keep your hand visible in the camera preview.
4. Use only the stable gestures listed above.

## View Command Help

Open the Command Help panel by:

- Clicking `HELP / COMMAND`.
- Pressing `?`.
- Saying `显示指令` or `show commands`.

The panel is hidden by default and can be closed with `CLOSE` or `Esc`.

## Common Recognition Failures

- Microphone or camera permission was denied.
- Browser speech recognition is unavailable.
- Confidence is below `0.65`.
- The same voice command was repeated within one second.
- Lighting is too dark for hand tracking.
- Hands are too close to the camera edge.
- Gesture is too complex or not in the supported stable gesture list.
