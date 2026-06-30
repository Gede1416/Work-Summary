# git-sync 使用手册

## 简介

`git-sync.sh` 是一个自动化 git 同步脚本，按顺序执行 **stash → pull → stash pop → push**，解决"本地有未提交改动时无法直接 pull/push"的日常痛点。

## 快速开始

```bash
# 在任意 git 仓库中运行
bash /f/Goethe/Notes/Work-Summary/git-sync.sh
```

### 推荐：设置别名

在 `~/.bashrc` 中添加：

```bash
alias gsync='bash /f/Goethe/Notes/Work-Summary/git-sync.sh'
```

之后直接 `gsync` 即可。

## 执行流程

| 步骤 | 命令 | 说明 |
|------|------|------|
| 1 | `git stash push` | 暂存本地未提交改动；工作区干净则跳过 |
| 2 | `git pull --rebase` | 拉取远程更新（rebase 保持线性历史） |
| 3 | `git stash pop` | 恢复第 1 步暂存的改动 |
| 4 | `git push` | 推送到远程 |

## 行为细节

### stash 阶段

- 脚本先检查工作区和暂存区是否有改动
- **无改动**：跳过 stash，直接进入 pull
- **有改动**：执行 `git stash push`，附带时间戳消息（如 `auto-stash before sync 20260630-143025`）

### pull 阶段

- 使用 `--rebase` 而非默认 merge，避免产生多余的 merge commit
- 如果 pull 失败（网络问题、冲突等），脚本立即终止，不会继续后续步骤

### stash pop 阶段

- 仅在之前执行了 stash 时才触发
- 如果 pop 产生冲突，脚本**报错退出**，不会自动 push
- 此时你的改动已恢复但存在冲突标记，需手动解决后执行 `git stash drop`

### push 阶段

- 推送到当前分支的远程跟踪分支
- 依赖于前面步骤全部成功

## 错误处理

| 场景 | 行为 |
|------|------|
| 不在 git 仓库中运行 | git 命令直接报错，脚本终止 |
| pull 时网络不通 | 脚本终止，stash 未被 pop（需手动 `git stash pop`） |
| stash pop 冲突 | 脚本终止并提示手动解决，**不会自动 push** |
| push 被拒绝（非 fast-forward） | 脚本终止，需手动处理（通常先 pull 再 push） |

## 安全保证

- **不会丢失代码**：任何步骤失败都会立即停止（`set -e`），stash 不会丢失
- **不会强制推送**：使用普通 `git push`，不会覆盖远程历史
- **冲突不自动合并**：pop 冲突时果断退出，避免带着冲突标记 push

## 适用场景

- 日常开发中，本地有 WIP 改动，需要先拉取同事最新代码再推送自己的提交
- 多人协作同一分支时的快速同步
- 不适合：需要精细控制 stash 列表的场景、有多个 stash 需要管理的情况
