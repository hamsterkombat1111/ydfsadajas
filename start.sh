#!/bin/bash

# Build files should already be included in the repository
# Install backend dependencies
cd backend
pip install -r requirements.txt

# Start the FastAPI server
uvicorn server:app --host 0.0.0.0 --port 10000