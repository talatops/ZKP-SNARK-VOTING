#!/bin/bash
set -e

echo "Building ZKP Docker image..."
docker build -t zkp-compiler -f Dockerfile.zkp .

echo "Running ZKP circuit compilation..."
docker run --rm -v $(pwd)/circuits:/app/circuits zkp-compiler

echo "Circuit compilation completed!" 