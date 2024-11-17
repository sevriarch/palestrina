#!/bin/bash

set -e
set -o pipefail

test_music_creation() {
	echo "Executing music sample $1"
	node $1
	SUM=$(md5sum $1.mid | cut -d' ' -f1)

	if [ "$SUM" != "$2" ]; then
		echo "Checksum mismatch; was $SUM, expected $2"
		exit 1
	else
		echo "Checksum good; was $SUM"
	fi
}

cd $(dirname $0)

node ./midi-reader.js

test_music_creation water1.new.js 8b605e819c08319007b585d2724ee404
test_music_creation salope.js 1005ed2d433072460c5a43614009be90
test_music_creation pf-son-1-finale.js a66dc38696bf0df061dcf4e1db93e370
