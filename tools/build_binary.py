"""为当前操作系统和 CPU 架构构建 ngxops 单文件程序。"""

import argparse
import subprocess
import sys
import sysconfig
from pathlib import Path

from build_target import target_filename


def ensure_ctypes_available(parser: argparse.ArgumentParser) -> None:
    """检查当前 Python 是否包含 PyInstaller 所需的 ctypes 扩展。"""
    try:
        __import__("_ctypes")
    except ImportError:
        parser.error(
            "当前 Python 缺少或无法加载 _ctypes，PyInstaller 无法启动。"
            "请先安装 libffi 开发文件（Debian/Ubuntu: libffi-dev；"
            "RHEL 系: libffi-devel），再重新安装或编译 Python 并重建虚拟环境。"
            "当前解释器: {}".format(sys.executable)
        )


def ensure_shared_python_library(parser: argparse.ArgumentParser) -> None:
    """检查 Linux 构建解释器是否启用了 Python 共享库。"""
    if not sys.platform.startswith("linux"):
        return
    if sysconfig.get_config_var("Py_ENABLE_SHARED") == 1:
        return
    parser.error(
        "当前 Linux Python 未启用共享库，PyInstaller 无法打包。"
        "若从源码编译 Python，请使用 --enable-shared 重新编译并重建虚拟环境。"
        "当前解释器: {}".format(sys.executable)
    )


def main() -> int:
    """显示构建目标或调用 PyInstaller 生成发行文件。"""
    root_dir = Path(__file__).resolve().parent.parent
    parser = argparse.ArgumentParser(
        prog="build-binary",
        description="Build the ngxops one-file executable for this host.",
    )
    parser.add_argument(
        "--print-target",
        action="store_true",
        help="Print the output filename without building.",
    )
    arguments = parser.parse_args()

    try:
        output_name = target_filename()
    except ValueError as exc:
        parser.error(str(exc))
    if arguments.print_target:
        print(output_name)
        return 0

    ensure_ctypes_available(parser)
    ensure_shared_python_library(parser)

    command = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--clean",
        "--noconfirm",
        str(root_dir / "ngxops.spec"),
    ]
    print("Building {}".format(output_name))
    subprocess.run(command, cwd=str(root_dir), check=True)
    print("Build complete: {}".format(root_dir / "dist" / output_name))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
