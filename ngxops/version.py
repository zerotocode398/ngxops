"""提供程序构建版本信息。"""

import argparse
import subprocess
import sys
from pathlib import Path
from typing import Any, Optional, Sequence


def get_commit_id() -> str:
    """读取冻结包内或当前源码仓库中的 Git commit。"""
    if getattr(sys, "frozen", False):
        resource_dir = Path(
            getattr(sys, "_MEIPASS", Path(sys.executable).resolve().parent)
        )
        try:
            return (resource_dir / "ngxops-build-commit.txt").read_text(
                encoding="ascii"
            ).strip() or "unknown"
        except (OSError, UnicodeError):
            return "unknown"

    repository_root = Path(__file__).resolve().parent.parent
    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=str(repository_root),
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True,
        )
    except (OSError, subprocess.SubprocessError):
        return "unknown"
    return result.stdout.strip() or "unknown"


def format_version(app_name: str, version: str) -> str:
    """格式化程序版本和源码提交号。"""
    return "{} {} (commit {})".format(app_name, version, get_commit_id())


class VersionAction(argparse.Action):
    """仅在请求版本参数时读取并显示 Git commit。"""

    def __init__(
        self,
        option_strings: Sequence[str],
        dest: str,
        app_name: str,
        app_version: str,
        **kwargs: Any
    ) -> None:
        """保存显示版本所需的程序名称和版本号。"""
        self.app_name = app_name
        self.app_version = app_version
        super().__init__(option_strings, dest, nargs=0, **kwargs)

    def __call__(
        self,
        parser: argparse.ArgumentParser,
        namespace: argparse.Namespace,
        values: Any,
        option_string: Optional[str] = None,
    ) -> None:
        """输出版本信息并结束参数解析。"""
        parser.exit(
            message="{}\n".format(
                format_version(self.app_name, self.app_version)
            )
        )
