#!/bin/bash
NETWORK=

usage() {
   me=$(basename "$0")

cat <<-EOT
Usage: this script is used to build docker image for current branch and tag.

$me [options]

Options:
   -h                print this message
   -n network        network of the docker image (e.g. testnet/mainnet)

EOT
   exit 0
}

while getopts ':hn:' opt; do
   case $opt in
      n) NETWORK="$OPTARG";;
      *) usage ;;
   esac
done

if [ -z "$NETWORK" ]; then
   usage
fi

if [ "$NETWORK" == "mainnet" ]; then
	sudo docker build -f Dockerfile.be -t ethhmy-be .
else
	sudo docker build -f Dockerfile.be."$NETWORK" -t ethhmy-be:"$NETWORK" .
fi
