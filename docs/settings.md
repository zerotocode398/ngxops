# 系统设置与数据保留

## 页面与权限

`/settings/` 按功能分组显示已接线设置。左侧分组在当前页面内切换，不重新加载页面；地址栏和浏览器前进/后退会同步所选分组，未保存的输入在切换时保留。查看要求 `settings.read`；只有超级管理员可以修改。普通有权用户看到只读值。设置表单通过 `POST /api/settings/group` 保存，使用全局会话与 CSRF 校验。

读取 API：

| 方法与路径 | 权限 | 行为 |
|---|---|---|
| `GET /api/settings/group?group=节点管理` | `settings.read` | 返回该组已登记项目的值、说明和校验范围；未知分组返回空列表 |
| `GET /api/settings/all` | `settings.read` | 返回已登记设置的键值映射 |
| `POST /api/settings/group` | 超级管理员与 CSRF | 原子校验并保存分组值，返回实际变更的 key 列表 |

保存请求格式为 `{"group":"节点管理","values":{"node.batch_max_count":"3"}}`。不支持的 key、跨分组 key、空必填值、非整数和越界整数会拒绝整组写入。每个整数预置项的范围由代码元数据提供，不接受任意动态设置。操作审计表和运行日志记录分组、设置名称和 key，以及每项由旧值调整到新值的变化；不会记录请求中未发生变化的值。更新 `node.status_probe_interval_seconds` 时会单独记为“更新节点状态巡检间隔”，与同次保存的其他设置分开记录。

已登记设置的默认值、类型和整数范围均以代码预置项为准，调用方提供的普通 fallback 不会覆盖预置默认值。页面或设置 API 读取时会补齐缺失行并更新展示元数据，保留范围内的已有 value，并将越界整数修正到预置范围内。

`NGXOPS_RELEASE_BACKUP_DIR` 与 `NGXOPS_UPGRADE_PACKAGE_MAX_SIZE_MB` 仅在 v14 设置表不可用时作为兼容默认值；v14 迁移完成后，相应系统设置为运行时权威值。

## 已接线设置

| 分组 | key | 默认值 | 参考范围 | 生效范围 |
|---|---|---:|---:|---|
| 仪表盘 | `dashboard.recent_tasks_count` | 20 | 1 至 100 条 | 仪表盘及升级、安装、启停、卸载首页的最近任务列表；刷新页面后生效 |
| 节点管理 | `node.batch_max_count` | 3 | 1 至 50 台 | 节点探测、锁定、解锁、删除，凭证关联节点探测，配置同步、发布、升级、安装、启停和卸载的后端上限及并发数；页面勾选上限刷新后生效 |
| 节点管理 | `node.ssh_connect_timeout` | 3 秒 | 1 至 10 秒 | 节点探测、凭证测试、配置发现/同步、发布、升级、安装、启停和卸载的下次 SSH 连接 |
| 节点管理 | `node.ssh_default_port` | 26520 | 1 至 65535 | 新建节点和导入时的默认端口，不改写已有节点 |
| 节点管理 | `node.detect_retries` | 1 次 | 0 至 10 次 | 上述 SSH 连接失败后的额外重试次数，不含首次连接 |
| 节点管理 | `node.status_probe_concurrency` | 20 台 | 1 至 30 台 | 后台节点状态巡检的最大并发数；保存后最多 5 秒生效 |
| 节点管理 | `node.status_probe_interval_seconds` | 60 秒（1 分钟） | 30 至 300 秒 | 每台节点两次后台状态巡检的最短间隔；保存后最多 5 秒生效 |
| 配置管理 | `config.discover_max_depth` | 3 层 | 1 至 20 层 | 下次配置发现或同步 |
| 配置管理 | `config.default_nginx_path` | `/etc/nginx/nginx.conf` | — | 新节点或没有已保存路径的配置同步 |
| 配置管理 | `config.default_nginx_bin` | `/usr/sbin/nginx` | — | 新建/导入节点没有填写 Nginx 二进制路径时 |
| 发布管理 | `release.backup_dir` | `/tmp/ngxops/backups` | — | 下次发布；每个节点写入其 hostname 子目录 |
| 登录 | `auth.login_fail_lock_count` | 3 次 | 1 至 5 次 | 下次登录；不能关闭 |
| 登录 | `auth.login_fail_lock_minutes` | 15 分钟 | 1 至 30 分钟 | 下次登录 |
| 系统 | `system.task_progress_poll_interval` | 2 秒 | 1 至 10 秒 | 通用任务中心、节点、配置、发布、升级、安装、启停和卸载任务进度；刷新页面后生效 |
| 系统 | `system.dashboard_refresh_interval` | 30 秒 | 5 至 3600 秒 | 仪表盘统计卡片自动刷新；刷新页面后生效 |
| 系统 | `system.retention_task_center_days` | 90 天 | 0 至 3650 天 | 非发布/升级终态任务与关联日志；0 关闭清理 |
| 系统 | `system.retention_release_history_days` | 90 天 | 0 至 3650 天 | 发布/回滚终态任务与关联日志；0 关闭清理 |
| 系统 | `system.retention_audit_log_days` | 90 天 | 0 至 3650 天 | 操作审计记录；0 关闭清理 |
| 系统 | `system.retention_login_log_days` | 90 天 | 0 至 3650 天 | 登录记录；0 关闭清理 |
| 系统 | `system.retention_upgrade_task_days` | 90 天 | 0 至 3650 天 | Nginx 升级/回滚终态任务及升级运行记录；0 关闭清理 |
| Nginx 升级 | `upgrade.default_work_dir` | `/tmp/ngxops/upgrade` | — | 升级和安装向导的默认远程工作目录 |
| Nginx 升级 | `upgrade.make_jobs_default` | 4 | 1 至 32 核 | 升级和安装向导的默认 make 并行数 |
| Nginx 升级 | `upgrade.package_max_size_mb` | 20 MB | 1 至 2048 MB | 源码和第三方模块包上传大小限制；保存后立即生效 |
| Nginx 升级 | `upgrade.git_clone_timeout_minutes` | 2 分钟 | 1 至 10 分钟 | 在线第三方模块 Git clone/fetch 等待上限；保存后对后续模块获取生效 |
| 安装管理 | `install.default_user` | `mas` | — | 新打开的安装向导默认用户 |
| 安装管理 | `install.default_group` | `dev` | — | 新打开的安装向导默认组 |
| 安装管理 | `install.default_prefix` | `/opt/app` | — | 新打开的安装向导默认安装路径 |
| 安装管理 | `install.default_listen_port` | 80 | 1 至 65535 | 新打开的安装向导默认监听端口 |

整数设置的上下限均包含在参考范围内。系统设置页面会在每个有范围限制的数值项旁显示对应范围；已有设置值在运行时保留，不会因代码默认值变化而覆盖。

## 数据保留

认证用户请求每天最多启动一次后台清理；清理在独立线程及数据库 Session 中执行，不占用 FastAPI 事件循环。每日日期锁按 UTC 日期记录在当前进程中，部署按单个 Uvicorn worker 运行。清理以记录创建时间和当前 UTC 时间计算截止点，保留天数为 0 时跳过对应类别。

数据保留策略分别处理任务中心、发布/回滚和升级/回滚记录。所有策略都跳过 `pending`、`running`。升级记录还会排除 `fetching_config`、`uploading_package`、`downloading_modules`、`configuring`、`compiling`、`backing_up`、`replacing_binary`、`upgrading` 和 `verifying` 阶段，即使任务状态已进入终态也不删除运行中的升级阶段。删除任务时由 SQLite 外键级联清除任务日志和关联安装/卸载/升级运行快照；审计记录没有任务外键，因此由自己的保留策略独立清理。

可使用 `python -m ngxops.settings purge` 立即执行一次清理。命令使用当前 `NGXOPS_HOME` 数据库，不自动升级 schema；执行前应确认目标数据库并备份。输出为各类别实际删除行数的 JSON 对象。

系统设置保存在 SQLite 数据库中。首次部署和升级前应备份并显式运行 `python -m ngxops.database upgrade`；见 [database.md](database.md)。

后台巡检不重试 SSH 失败；巡检并发范围为 1～30 台，默认 20 台。巡检间隔是每台节点上一次探测完成后的最短等待时间，不是全量节点的完成时限；节点数量、SSH 响应时间和队列负载都会影响完整巡检周期。该并发只限制后台状态巡检，不限制用户发起的发布、配置同步等运维任务。

巡检只处理未删除、未锁定且关联启用凭证的节点，在独立线程中执行，不创建任务中心记录，也不占用 FastAPI 事件循环。SSH 连接阶段使用 `node.ssh_connect_timeout`；Nginx 版本命令另有 10 秒上限。单节点探测在途时不会再次提交；探测超过配置间隔只会推迟下一轮，不会积压或并发连接同一节点。SSH 失败会记为离线但保留最近 Nginx 结果；SSH 成功且 Nginx 命令超时会记为 SSH 在线、Nginx 未知并清除旧版本。超过 3 个巡检间隔没有新的对应观测时，SSH/Nginx 状态分别降为未知，避免继续把旧结果当作可用状态。
