# 求职日记（PWA）

手机浏览器就能用的求职追踪应用，可以"添加到主屏幕"当 App 用。数据存在手机本地，不上传任何服务器。

## 功能

- **看板**：累计沟通 / 回复 / 交换简历 / 面试场次 / Offer，自动算转化漏斗（沟通→交换、交换→面试）
- **记录**：每天记一笔（公司、岗位、平台、动作、备注），随时回看
- **面试复盘**：面试后记录形式、自评星级、结果、复盘内容
- **跟进**：待办事项（如"周一 10 点问黄小姐结果"），过期自动标红
- **导入导出**：右上角 ↓ 导出 JSON 备份，↑ 粘贴恢复

## 本地使用

直接双击 `index.html` 用 Chrome / Edge 打开就能用，无需安装。

## 部署到 GitHub Pages（手机访问）

1. 在 GitHub 新建一个**公开**仓库，名字比如 `job-diary`（不要勾选自动生成 README）。
2. 打开 PowerShell，进入本目录后执行（把 `用户名` 换成你的 GitHub 账号）：

```
cd C:\Users\19313\Documents\Codex\2026-08-02\files-mentioned-by-the-user-boss\job-diary
git init
git add -A
git commit -m "init: 求职日记"
git branch -M main
git remote add origin https://github.com/用户名/job-diary.git
git push -u origin main
```

3. 到 GitHub 仓库页面：Settings → Pages → Source 选 "Deploy from a branch" → 分支选 `main`、目录选 `/ (root)` → Save。
4. 等 1-2 分钟，手机浏览器访问：

```
https://用户名.github.io/job-diary/
```

5. 添加到主屏幕：
   - Android Chrome：右上角菜单 → "添加到主屏幕"
   - iPhone Safari：分享按钮 → "添加到主屏幕"

## 数据安全提醒

- 数据只存在手机浏览器本地（localStorage），**清浏览器缓存会丢**。
- 建议每周点右上角 ↓ 导出一次备份，把 JSON 存到微信收藏或邮箱。
- 换手机/换浏览器：在新设备导入备份即可。

## 已知限制

- 没有账号同步（后续可加，当前单机版够用）。
- 暂时没有应用图标，不影响使用。

