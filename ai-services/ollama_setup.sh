#!/bin/bash
# Ollama Installation & Setup Script

echo "Checking if curl is installed..."
if ! command -v curl &> /dev/null
then
    echo "curl could not be found. Please install it with: sudo apt install curl"
    exit 1
fi

echo "Installing Ollama..."
curl -fsSL https://ollama.com/install.sh | sh

echo "Waiting for Ollama service to start..."
sleep 5

echo "Pulling Llama3 model (this may take a while depending on your internet speed)..."
ollama pull llama3

echo "Ollama setup complete! Your local AI brain is ready."
