#!/usr/bin/env python3
"""Validate that a pip-wheels bundle satisfies backend/requirements.txt for the
Linux / CPython 3.12 deploy target.

The offline install on the server runs:

    pip install --no-index --find-links ../pip-wheels -r requirements.txt

That resolver evaluates environment markers against Python 3.12 on Linux. When
wheels are downloaded with `pip download --python-version 312 ...` from a newer
local interpreter (3.13+), pip can omit dependencies whose markers are only true
on older pythons (e.g. `typing-extensions>=4.4.0; python_version < "3.13"`), and
the deploy then fails on the server. This script walks the closure the same way
the server's resolver will and reports every distribution that is required but
missing.

Usage:
    python deploy/check_wheels.py <wheels-dir> [requirements.txt]
"""

import os
import sys
import zipfile

try:
    from packaging.markers import Marker
    from packaging.requirements import Requirement
    from packaging.utils import canonicalize_name, parse_wheel_filename
except ImportError:  # fall back to pip's vendored copy
    from pip._vendor.packaging.markers import Marker
    from pip._vendor.packaging.requirements import Requirement
    from pip._vendor.packaging.utils import canonicalize_name, parse_wheel_filename

# Marker environment for the deploy target: Linux, CPython 3.12, x86_64.
TARGET_ENV = {
    "python_version": "3.12",
    "python_full_version": "3.12.0",
    "sys_platform": "linux",
    "platform_system": "Linux",
    "platform_machine": "x86_64",
    "platform_python_implementation": "CPython",
    "implementation_name": "cpython",
    "implementation_version": "3.12.0",
    "os_name": "posix",
}


def read_wheel_requires(path):
    """Return the list of Requirement objects declared by a wheel's METADATA."""
    reqs = []
    with zipfile.ZipFile(path) as zf:
        meta_name = next(
            (n for n in zf.namelist() if n.endswith(".dist-info/METADATA")),
            None,
        )
        if meta_name is None:
            return reqs
        for line in zf.read(meta_name).decode("utf-8", "replace").splitlines():
            if line.startswith("Requires-Dist:"):
                reqs.append(Requirement(line[len("Requires-Dist:"):].strip()))
    return reqs


def marker_applies(requirement):
    """A requirement applies to the target if it has no marker or its marker
    evaluates true for the target environment."""
    if requirement.marker is None:
        return True
    return requirement.marker.evaluate(TARGET_ENV)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    wheels_dir = sys.argv[1]
    reqs_path = sys.argv[2] if len(sys.argv) > 2 else "backend/requirements.txt"

    if not os.path.isdir(wheels_dir):
        print(f"error: wheels dir not found: {wheels_dir}")
        return 1

    # Map canonical dist name -> wheel file.
    wheels = {}
    for fname in os.listdir(wheels_dir):
        if fname.endswith(".whl"):
            name = canonicalize_name(parse_wheel_filename(fname)[0])
            wheels[name] = os.path.join(wheels_dir, fname)

    # Seed the closure with the top-level requirements.
    needed = set()
    with open(reqs_path, "r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            req = Requirement(line)
            if marker_applies(req):
                needed.add(canonicalize_name(req.name))

    # Walk the closure to a fixpoint, exactly like the server resolver will.
    missing = set()
    pending = list(needed)
    while pending:
        name = pending.pop()
        if name in missing:
            continue
        wheel = wheels.get(name)
        if wheel is None:
            missing.add(name)
            continue
        for dep in read_wheel_requires(wheel):
            dep_name = canonicalize_name(dep.name)
            if dep_name not in needed and marker_applies(dep):
                needed.add(dep_name)
                pending.append(dep_name)

    if missing:
        print("MISSING wheels for Linux/CPython 3.12 install:")
        for name in sorted(missing):
            print(f"  - {name}")
        print(f"\n{len(missing)} required distribution(s) absent from {wheels_dir}")
        return 1

    print(f"OK: {len(needed)} required distributions all present in {wheels_dir}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
