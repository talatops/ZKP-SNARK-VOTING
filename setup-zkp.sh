#!/bin/bash
set -e

echo "Setting up ZKP infrastructure..."

# Install Rust if not already installed
if ! command -v rustc &> /dev/null; then
    echo "Installing Rust..."
    apt-get update
    apt-get install -y curl build-essential
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
    echo "Rust installed successfully"
else
    echo "Rust is already installed"
fi

# Install dependencies for circom
apt-get install -y git cmake

# Install circom if not already installed
if ! command -v circom &> /dev/null; then
    echo "Installing circom..."
    # Clone circom repository 
    git clone https://github.com/iden3/circom.git
    cd circom
    cargo build --release
    cargo install --path circom
    cd ..
    echo "circom installed successfully"
else
    echo "circom is already installed"
fi

# Install snarkjs if not already installed
if ! command -v snarkjs &> /dev/null; then
    echo "Installing snarkjs globally..."
    npm install -g snarkjs
else
    echo "snarkjs is already installed"
fi

# Make the compile-circuits.js executable
chmod +x circuits/compile-circuits.js

# Run the circuit compilation script
echo "Compiling circuits..."
node circuits/compile-circuits.js

echo "ZKP setup completed!" 