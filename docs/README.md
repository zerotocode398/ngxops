# 文档索引

本文档按平台左侧导航组织功能说明，并列出页面地址、对应文档和接口入口。

## 平台功能

| 导航分组 | 功能 | 页面地址 | 功能文档 | 主要接口 |
|---|---|---|---|---|
| 首页 | 首页 | `/` | [dashboard.md](dashboard.md) | `GET /api/stats/` |
| 节点管理 | 节点列表 | `/nodes/` | [nodes.md](nodes.md) | `/api/nodes/*` |
| 节点管理 | 节点组管理 | `/nodes/groups/` | [nodes.md](nodes.md) | `/api/nodes/groups` |
| 凭证管理 | 凭证管理 | `/credentials/` | [credentials.md](credentials.md) | `/api/credentials/*` |
| 配置管理 | 配置管理 | `/configs/` | [configs.md](configs.md) | `/api/configs/*` |
| 发布管理 | 发布中心 | `/releases/center/` | [releases.md](releases.md) | `/api/releases/*` |
| 发布管理 | 任务中心 | `/tasks/` | [tasks.md](tasks.md) | `/api/tasks*` |
| 发布管理 | 发布历史 | `/releases/` | [releases.md](releases.md) | `/api/releases/history*` |
| 运维工具 | Nginx 升级 | `/upgrade/` | [upgrade.md](upgrade.md) | `/api/upgrade/*` |
| 运维工具 | Nginx 安装 | `/nginx-install/` | [nginx-install.md](nginx-install.md) | `/api/nginx-install/*` |
| 运维工具 | Nginx 启停 | `/nginx/service/` | [nginx-service.md](nginx-service.md) | `/api/nginx/service/*` |
| 运维工具 | Nginx 卸载 | `/nginx/uninstall/` | [nginx-uninstall.md](nginx-uninstall.md) | `/api/nginx/uninstall/*` |
| 用户管理 | 用户列表 | `/users/` | [rbac.md](rbac.md) | 页面表单；用户组成员使用 `/api/users/*` |
| 用户管理 | 角色管理 | `/users/roles/` | [rbac.md](rbac.md) | 页面表单 |
| 用户管理 | 用户组管理 | `/users/teams/` | [rbac.md](rbac.md) | `/api/users/teams/*` |
| 审计日志 | 操作日志 | `/audit/` | [audit.md](audit.md) | 服务端页面 |
| 审计日志 | 登录日志 | `/audit/logins/` | [audit.md](audit.md) | 服务端页面 |
| 系统设置 | 系统设置 | `/settings/` | [settings.md](settings.md) | `/api/settings/*` |

点击左侧功能菜单时，页面只切换右侧内容，侧栏保持原位；浏览器前进和后退仍可切换页面。

账号登录、个人资料和密码修改见 [accounts.md](accounts.md)。这些页面与用户、角色、用户组管理分属不同文档：账户文档说明个人访问和会话，RBAC 文档说明管理员管理身份及授权。

## FastAPI 接口

服务运行后，可在同一主机和端口打开以下地址：

| 地址 | 用途 |
|---|---|
| `/docs` | Swagger UI，可查看接口并交互式发送请求 |
| `/redoc` | ReDoc，适合阅读接口说明 |
| `/openapi.json` | OpenAPI JSON，供工具导入和自动化生成客户端 |
| `/health` | Web 进程探活，不检查数据库或远程节点 |

例如服务监听 `127.0.0.1:8000` 时，Swagger UI 地址为 `http://127.0.0.1:8000/docs`。生产环境请使用部署时配置的主机名、端口和 HTTPS 地址。

`/docs` 展示纳入 OpenAPI 的 JSON API；Jinja2 页面路由不属于 JSON API，因此不会列在该界面。公开 API 总表见 [api.md](api.md)，各模块文档列出本模块接口；当前代码路由生成的 59 个 `/api/` 操作已逐项核对。账户页面使用的 `GET /api/session/status` 是前端会话检查接口，当前有意不公开到 OpenAPI；操作日志和登录日志也没有独立 JSON API。

## 项目与运维文档

| 文档 | 内容 |
|---|---|
| [deployment.md](deployment.md) | Linux 安装、初始化、运行、配置和备份 |
| [packaging.md](packaging.md) | 单文件构建、CLI、进程管理和运行日志 |
| [api.md](api.md) | JSON API 清单、认证、请求/响应和错误约定 |
| [database.md](database.md) | SQLite 数据、迁移、约束和备份恢复 |
| [security.md](security.md) | 会话、CSRF、权限和敏感信息保护 |
| [optimization-ledger.md](optimization-ledger.md) | 历史页面优化记录的模块化归类及编号核对 |

## 历史优化台账

指定历史提交中的页面优化记录已按当前功能模块重新归类并改写为可读摘要。`docs/README.md` 提供模块入口；逐项说明、编号核对和纳入范围见 [optimization-ledger.md](optimization-ledger.md)。这些条目用于了解历史调整背景，不替代当前功能文档，也不代表当前分支的验收状态。

| 功能模块 | 历史编号 | 主要主题 |
|---|---|---|
| 公共导航与交互 | 1–3、10、14、17、55 | 侧栏、提示、查询标签、分页和通用交互规则 |
| 首页 | 6、141 | 首页入口和时间展示 |
| 账号与会话 | 20、330–331 | 登录失败锁定、会话有效期和账户审计 |
| 用户、角色与用户组 | 4–5、11–16、19–22 | 导航分工、RBAC 展示、角色继承和关联选择 |
| 节点与节点组 | 7–9、18、23–39、52–53、56–57、62–64、68、76–78、135、140、244、299 | 节点表单、批量操作、导入校验、探测状态和节点组选择 |
| 凭证管理 | 40–51、67、69、71–75、79–81 | 凭证查询、导入导出、删除、关联节点和测试反馈 |
| 配置管理 | 54、82–101 | 配置绑定、发现、部分/批量同步、任务日志和进度 |
| 发布中心与发布历史 | 102–143 | 节点筛选、配置版本、发布/回滚、历史层级和批次导航 |
| 任务中心 | 58–66、122、128、136、142、202、206–220、223–225、254、257、260、264、267–270、302–313 | 多节点结果、日志筛选、时间、任务详情和生命周期任务展示 |
| Nginx 升级 | 144–191、193–201、202–205、326–328 | 包管理、升级向导、编译参数、进度、日志和失败恢复 |
| Nginx 安装 | 226–258 | 安装向导、参数确认、路径检查、任务进度和详情 |
| Nginx 启停 | 259–276、333 | 服务操作、批次进度、历史和逐行远程日志 |
| Nginx 卸载 | 277–301 | 卸载范围、风险确认、执行进度和路径处理 |
| 操作日志、登录日志与系统设置 | 60、70、73、126、196–198、245、314–325、329–332、334 | 审计筛选、任务结果、登录事件、日志详情和设置变更 |

历史记录的 192 为单次测试结果、195 为当时的数据盘点、221 只有模块标题，未作为产品优化项收录；编号 264、329、332 的同号后续修正已并入对应摘要。历史编号 222 缺失，335 只有 `asd`，两者均待补充原始内容。具体核对规则见台账。

同一历史编号可能影响多个模块；索引按主要受影响功能归类，逐项摘要只在台账中记录一次。

## 业务流程

常见运维流程为：创建 SSH 凭证并登记节点；发现并同步 Nginx 配置；在发布中心推送配置或从发布历史回滚；按需安装、升级、启停或卸载 Nginx。配置同步只把远程配置读入平台，发布才会写入远程配置并执行校验和 reload。每个模块的节点门禁、权限和失败行为以相应功能文档为准。
