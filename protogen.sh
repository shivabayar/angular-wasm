#!/bin/bash

SOURCE="${BASH_SOURCE[0]}"
DIR_REL=""
while [ -h "$SOURCE" ] ; do SOURCE="$(readlink "$SOURCE")"; done
ROOT_DIR="$( cd -P "$( dirname "$(dirname $SOURCE)" )$DIR_REL" && pwd )"

PBJS_FOLDER="$ROOT_DIR/src/"
PBJSCOMPILER="$ROOT_DIR/node_modules/protobufjs/bin/pbjs"
PBTSCOMPILER="$ROOT_DIR/node_modules/protobufjs/bin/pbts"
echo $PBJSCOMPILER
mkdir -p $PBJS_FOLDER

PBJS_FILE=$PBJS_FOLDER
PBJS_FILE+="compiled.pb"

#dcodeio protobufjs need to combine all proto files to a single static js file
arr=""
space=" "
for f in "$ROOT_DIR"/proto/src/protobuf/*.proto
do
  echo $f
  arr+=$f
  arr+=$space
done

for f in "$ROOT_DIR"/proto/src/protobuf/csvc/*.proto
do
  echo $f
  arr+=$f
  arr+=$space
done

echo "compiling proto files: "
echo $arr

node "$PBJSCOMPILER" -t static-module -w default -o "$PBJS_FILE".js $arr --force-long --no-comments;
node "$PBTSCOMPILER" -o "$PBJS_FILE".d.ts "$PBJS_FILE".js

echo "output to: "$PBJS_FILE".js"
exit