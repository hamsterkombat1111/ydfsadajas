#!/bin/bash

# Install Node.js dependencies and build React app
cd frontend
yarn install
yarn build

# Install backend dependencies
cd ../backend
pip install -r requirements.txt

# Start the FastAPI server
uvicorn server:app --host 0.0.0.0 --port 10000