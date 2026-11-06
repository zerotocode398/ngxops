# -*- mode: python ; coding: utf-8 -*-

import subprocess
import sys
from pathlib import Path

from PyInstaller.utils.hooks import collect_all, collect_submodules


ROOT = Path(SPECPATH)
TOOLS_DIR = ROOT / "tools"
if str(TOOLS_DIR) not in sys.path:
    sys.path.insert(0, str(TOOLS_DIR))
from build_target import target_name


TARGET_NAME = target_name()
PSUTIL_DATAS, PSUTIL_BINARIES, PSUTIL_HIDDENIMPORTS = collect_all("psutil")


def _current_commit() -> str:
    """读取构建源码对应的 Git commit；仓库信息不可用时返回 unknown。"""
    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=str(ROOT),
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True,
        )
    except (OSError, subprocess.SubprocessError):
        return "unknown"
    return result.stdout.strip() or "unknown"


BUILD_INFO_PATH = ROOT / "build" / "ngxops-build-commit.txt"
BUILD_INFO_PATH.parent.mkdir(parents=True, exist_ok=True)
BUILD_INFO_PATH.write_text(_current_commit(), encoding="ascii")
analysis = Analysis(
    [str(ROOT / "ngxops" / "__main__.py")],
    pathex=[str(ROOT)],
    binaries=PSUTIL_BINARIES,
    datas=[
        (str(ROOT / "templates"), "templates"),
        (str(ROOT / "static"), "static"),
        (str(BUILD_INFO_PATH), "."),
    ] + PSUTIL_DATAS,
    hiddenimports=(
        collect_submodules("paramiko")
        + ["ngxops.asgi", "ngxops.service_manager"]
        + PSUTIL_HIDDENIMPORTS
    ),
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
archive = PYZ(analysis.pure)
executable = EXE(
    archive,
    analysis.scripts,
    analysis.binaries,
    analysis.datas,
    [],
    name=TARGET_NAME,
    debug=False,
    # 避免进程组 Ctrl+C 经 bootloader 转发后对子进程重复投递。
    bootloader_ignore_signals=True,
    strip=False,
    upx=False,
    console=True,
    disable_windowed_traceback=False,
)
