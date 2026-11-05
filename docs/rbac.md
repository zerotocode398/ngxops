# 用户、角色与用户组

## 权限解析

权限编码使用 `resource.action`。角色、用户组、用户资料和权限关系由数据库迁移维护；启动 Web 服务不会自动创建或修改表。数据库升级步骤见 [database.md](database.md)。

每次权限判断按以下顺序执行：

1. 超级管理员允许所有权限。
2. 用户直授权限命中时允许。
3. 用户属于的用户组关联了角色时，合并这些用户组角色权限，个人角色不参与。
4. 没有生效的用户组角色时，合并个人角色权限。
5. 其他情况拒绝。

个人角色最多 3 个；用户组角色不占该上限。组角色按所有所属用户组取并集；移除组角色关联后，该角色立即不再对组成员生效，用户组成员关系和个人角色关系仍分别保留。用户直授权限独立叠加。用户、角色和用户组管理只允许超级管理员访问。相同解析函数接入 `require_permission` 与全局导航，菜单和页面门禁使用同一规则。

Nginx 全新安装和编译安装/升级共用 `upgrade.read/create/delete/execute` 权限资源。页面权限相同，但安装和升级任务仍分别记录各自的操作类型。

## 页面

| 页面 | 路径 |
|---|---|
| 用户列表 | `/users/` |
| 新建用户 | `/users/create/` |
| 编辑/删除/启停用户 | `/users/{user_id}/edit/`、`/users/{user_id}/delete/`、`/users/{user_id}/lock/` |
| 角色列表 | `/users/roles/`，兼容别名 `/users/groups/` |
| 角色新建/编辑/删除 | `/users/roles/create/`、`/users/roles/{role_id}/edit/`、`/users/roles/{role_id}/delete/` |
| 角色成员 | `/users/roles/{role_id}/manage-users/` |
| 用户组列表、新建、编辑、删除 | `/users/teams/`、`/users/teams/create/`、`/users/teams/{team_id}/edit/`、`/users/teams/{team_id}/delete/` |

用户编辑可设置账号、邮箱、备注、密码、超级管理员标记、个人角色、用户组和直授权限；角色和用户组通过可搜索的选择弹窗关联。创建用户默认从普通账户开始；不能删除或停用当前登录账户。管理员可提前解除登录锁定。用户、角色和用户组列表支持标签查询与分页；用户组表单维护角色继承，成员选择支持按用户名或邮箱搜索及分页批量加入/移出。

## JSON 接口

| 方法与路径 | 行为 |
|---|---|
| `GET /api/users/teams/{team_id}/members?page=1&per_page=10&search=...` | 默认每页 10 人（接口接受 1–100，界面提供 10/25/50/100），按逗号分隔的用户名/邮箱搜索词过滤，返回成员标记、当前生效角色数和分页状态 |
| `POST /api/users/teams/{team_id}/members` | JSON 请求体为 `{"action":"add"|"remove","user_ids":[...]}`，单批最多 200 人；重复加入/移出幂等 |

两个接口都要求超级管理员会话；POST 另外要求全局 CSRF Cookie 和 `X-CSRFToken` 头。响应模型、状态码和安全方案在 `/openapi.json` 中登记，错误结构遵循 [api.md](api.md)。
