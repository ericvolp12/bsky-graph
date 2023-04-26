#!/bin/bash

# Ensure Node is using version 18
export NVM_DIR=$HOME/.nvm;
source $NVM_DIR/nvm.sh;
nvm use 18

# Go into the exporter directory
cd ./exporter

# Run yarn start and wait for success
yarn start

# Go back to the root directory
cd ..

# Add public/ to the git staging area
git add public/

# Commit with the comment "graph bump"
git commit -m "graph bump"

# Push the changes
git push
