#!/bin/bash
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

cd $(dirname $0)
cd ../src/
7z a -tzip -xr\!.DS_Store micro-adblock.xpi
mv micro-adblock.xpi ../release/
wget --post-file=../release/micro-adblock.xpi http://localhost:8889