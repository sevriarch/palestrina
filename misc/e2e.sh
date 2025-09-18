#!/bin/bash

set -e
set -o pipefail

test_md5() {
	SUM=$(md5sum $1 | cut -d' ' -f1)

	if [ "$SUM" != "$2" ]; then
		echo "$1: checksum mismatch; was $SUM, expected $2" >&2
		exit 1
	else
		echo "$1: checksum good; was $SUM"
	fi
}

test_music_creation() {
	echo "Executing music sample $1"
	node $1

	test_md5 $1.mid $2
}

cd $(dirname $0)

node ./midi-reader.js

test_music_creation water1.new.js d0422047681ce6632afd75527f33c3ef
test_music_creation danse.js 1005ed2d433072460c5a43614009be90

test_md5 danse.js.svg f9bbdccfd36bad5d064c0aba069d6250
test_md5 danse.js.gamut.svg ac69dff7619e53534f1b2ca471d70f5c
test_md5 danse.js.intervals.svg 2ea25406771b9ecd063302ad8cafb638

cd ../examples
test_music_creation pf-son-1-finale.js dff50ffd4fb4d247db5691118cd058c2
