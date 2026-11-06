"""映射已接线的系统运行设置。"""

from datetime import datetime
from typing import Optional, Tuple

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from ngxops.database.base import Base


class SystemSetting(Base):
    """保存一个系统设置的值、展示元数据和最近修改人。"""

    __tablename__ = "ngxops_system_settings"
    __table_args__ = (
        Index("ix_ngxops_system_settings_group_order", "group", "sort_order"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    value_type: Mapped[str] = mapped_column(
        "type", String(20), nullable=False, default="string"
    )
    group_name: Mapped[str] = mapped_column("group", String(50), nullable=False)
    label: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    placeholder: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    options: Mapped[str] = mapped_column(Text, nullable=False, default="")
    is_required: Mapped[bool] = mapped_column(Integer, nullable=False, default=1)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated_by: Mapped[Optional[int]] = mapped_column(
        ForeignKey("auth_user.id", ondelete="SET NULL"), nullable=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.current_timestamp()
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.current_timestamp()
    )


PRESET_SETTINGS = (
    {
        "key": "dashboard.recent_tasks_count",
        "group": "仪表盘",
        "type": "integer",
        "value": "20",
        "label": "最近任务显示条数",
        "description": "首页最近任务列表显示条数。",
        "sort_order": 1,
        "min_value": 1,
        "max_value": 100,
        "unit": "条",
    },
    {
        "key": "node.batch_max_count",
        "group": "节点管理",
        "type": "integer",
        "value": "3",
        "label": "批量操作最大节点数",
        "description": "节点探测、锁定/解锁/删除、凭证测试、配置同步、发布、升级、安装、启停和卸载的并行及勾选上限。",
        "sort_order": 10,
        "min_value": 1,
        "max_value": 50,
        "unit": "台",
    },
    {
        "key": "node.ssh_connect_timeout",
        "group": "节点管理",
        "type": "integer",
        "value": "3",
        "label": "SSH 连接超时",
        "description": "SSH 连接超时时间。",
        "sort_order": 11,
        "min_value": 1,
        "max_value": 10,
        "unit": "秒",
    },
    {
        "key": "node.ssh_default_port",
        "group": "节点管理",
        "type": "integer",
        "value": "26520",
        "label": "SSH 默认端口",
        "description": "SSH 端口。",
        "sort_order": 12,
        "min_value": 1,
        "max_value": 65535,
        "unit": "",
    },
    {
        "key": "node.detect_retries",
        "group": "节点管理",
        "type": "integer",
        "value": "1",
        "label": "节点探测重试次数",
        "description": "SSH 重试次数，不含首次。",
        "sort_order": 13,
        "min_value": 0,
        "max_value": 10,
        "unit": "次",
    },
    {
        "key": "node.status_probe_concurrency",
        "group": "节点管理",
        "type": "integer",
        "value": "20",
        "label": "节点状态巡检并发数",
        "description": "后台 SSH/Nginx 状态巡检的最大并发数。",
        "sort_order": 14,
        "min_value": 1,
        "max_value": 30,
        "unit": "台",
    },
    {
        "key": "node.status_probe_interval_seconds",
        "group": "节点管理",
        "type": "integer",
        "value": "60",
        "label": "节点状态巡检间隔",
        "description": "每台节点后台巡检时间间隔。",
        "sort_order": 15,
        "min_value": 30,
        "max_value": 300,
        "unit": "秒",
    },
    {
        "key": "config.discover_max_depth",
        "group": "配置管理",
        "type": "integer",
        "value": "3",
        "label": "配置发现最大递归深度",
        "description": "远程 Nginx 配置 include 扫描最大递归层次。",
        "sort_order": 30,
        "min_value": 1,
        "max_value": 20,
        "unit": "层",
    },
    {
        "key": "config.default_nginx_path",
        "group": "配置管理",
        "type": "string",
        "value": "/etc/nginx/nginx.conf",
        "label": "默认 Nginx 主配置路径",
        "description": "Nginx 主配置文件路径。",
        "sort_order": 31,
        "unit": "",
    },
    {
        "key": "config.default_nginx_bin",
        "group": "配置管理",
        "type": "string",
        "value": "/usr/sbin/nginx",
        "label": "默认 Nginx 可执行文件路径",
        "description": "Nginx 可执行文件路径。",
        "sort_order": 32,
        "unit": "",
    },
    {
        "key": "release.backup_dir",
        "group": "发布管理",
        "type": "string",
        "value": "/tmp/ngxops/backups",
        "label": "远程配置备份目录",
        "description": "发布前远程备份目录。",
        "sort_order": 42,
        "unit": "",
    },
    {
        "key": "upgrade.default_work_dir",
        "group": "Nginx升级",
        "type": "string",
        "value": "/tmp/ngxops/upgrade",
        "label": "默认编译工作目录",
        "description": "升级与安装的远程编译目录。",
        "sort_order": 80,
        "unit": "",
    },
    {
        "key": "upgrade.make_jobs_default",
        "group": "Nginx升级",
        "type": "integer",
        "value": "4",
        "label": "默认并行编译数 (-j)",
        "description": "升级与安装的 make 并行编译数。",
        "sort_order": 81,
        "min_value": 1,
        "max_value": 32,
        "unit": "核",
    },
    {
        "key": "upgrade.package_max_size_mb",
        "group": "Nginx升级",
        "type": "integer",
        "value": "20",
        "label": "源码包/第三方模块包上传限制",
        "description": "源码与模块归档共用的上传上限。",
        "sort_order": 82,
        "min_value": 1,
        "max_value": 2048,
        "unit": "MB",
    },
    {
        "key": "upgrade.git_clone_timeout_minutes",
        "group": "Nginx升级",
        "type": "integer",
        "value": "2",
        "label": "Git clone 超时",
        "description": "在线第三方模块 clone/fetch 的超时时间。",
        "sort_order": 83,
        "min_value": 1,
        "max_value": 10,
        "unit": "分钟",
    },
    {
        "key": "install.default_user",
        "group": "安装管理",
        "type": "string",
        "value": "mas",
        "label": "默认用户 (--user)",
        "description": "安装时默认的用户。",
        "sort_order": 90,
        "unit": "",
    },
    {
        "key": "install.default_group",
        "group": "安装管理",
        "type": "string",
        "value": "dev",
        "label": "默认用户组 (--group)",
        "description": "安装时默认的用户组。",
        "sort_order": 91,
        "unit": "",
    },
    {
        "key": "install.default_prefix",
        "group": "安装管理",
        "type": "string",
        "value": "/opt/app",
        "label": "默认安装路径 (--prefix)",
        "description": "安装时默认的安装路径。",
        "sort_order": 92,
        "unit": "",
    },
    {
        "key": "install.default_listen_port",
        "group": "安装管理",
        "type": "integer",
        "value": "80",
        "label": "默认监听端口 (--listen)",
        "description": "安装时默认的监听端口。",
        "sort_order": 93,
        "min_value": 1,
        "max_value": 65535,
        "unit": "",
    },
    {
        "key": "auth.login_fail_lock_count",
        "group": "登录",
        "type": "integer",
        "value": "3",
        "label": "连续登录失败锁定次数",
        "description": "账号连续密码错误达到该次数后临时锁定；成功登录清零；",
        "sort_order": 50,
        "min_value": 1,
        "max_value": 5,
        "unit": "次",
    },
    {
        "key": "auth.login_fail_lock_minutes",
        "group": "登录",
        "type": "integer",
        "value": "15",
        "label": "登录失败锁定时长",
        "description": "达到失败次数后的锁定时间；到期后自动解除。",
        "sort_order": 51,
        "min_value": 1,
        "max_value": 30,
        "unit": "分钟",
    },
    {
        "key": "system.task_progress_poll_interval",
        "group": "系统",
        "type": "integer",
        "value": "2",
        "label": "任务进度轮询间隔",
        "description": "前端任务进度轮询间隔。",
        "sort_order": 60,
        "min_value": 1,
        "max_value": 10,
        "unit": "秒",
    },
    {
        "key": "system.dashboard_refresh_interval",
        "group": "系统",
        "type": "integer",
        "value": "30",
        "label": "仪表盘自动刷新间隔",
        "description": "仪表盘统计卡片自动刷新间隔。",
        "sort_order": 61,
        "min_value": 5,
        "max_value": 3600,
        "unit": "秒",
    },
    {
        "key": "system.retention_task_center_days",
        "group": "系统",
        "type": "integer",
        "value": "90",
        "label": "任务中心保留天数",
        "description": "任务超过天数后清理；0 表示不清理。",
        "sort_order": 62,
        "min_value": 0,
        "max_value": 3650,
        "unit": "天",
    },
    {
        "key": "system.retention_release_history_days",
        "group": "系统",
        "type": "integer",
        "value": "90",
        "label": "发布历史保留天数",
        "description": "发布和回滚任务超过天数后清理；0 表示不清理。",
        "sort_order": 63,
        "min_value": 0,
        "max_value": 3650,
        "unit": "天",
    },
    {
        "key": "system.retention_audit_log_days",
        "group": "系统",
        "type": "integer",
        "value": "90",
        "label": "操作日志保留天数",
        "description": "操作日志超过天数后清理；0 表示不清理。",
        "sort_order": 64,
        "min_value": 0,
        "max_value": 3650,
        "unit": "天",
    },
    {
        "key": "system.retention_login_log_days",
        "group": "系统",
        "type": "integer",
        "value": "90",
        "label": "登录日志保留天数",
        "description": "登录日志超过天数后清理；0 表示不清理。",
        "sort_order": 65,
        "min_value": 0,
        "max_value": 3650,
        "unit": "天",
    },
    {
        "key": "system.retention_upgrade_task_days",
        "group": "系统",
        "type": "integer",
        "value": "90",
        "label": "Nginx 升级任务保留天数",
        "description": "升级和回滚任务超过天数后清理；0 表示不清理。",
        "sort_order": 66,
        "min_value": 0,
        "max_value": 3650,
        "unit": "天",
    },
)


def preset_by_key():
    """返回按设置键索引的预置元数据。"""
    return {item["key"]: item for item in PRESET_SETTINGS}


def integer_preset_values(key: str) -> Tuple[int, int, int]:
    """返回整数预置项的默认值、最小值和最大值。"""
    preset = preset_by_key()[key]
    if preset["type"] != "integer":
        raise ValueError("设置不是整数类型：{}".format(key))
    return (
        int(preset["value"]),
        int(preset["min_value"]),
        int(preset["max_value"]),
    )
