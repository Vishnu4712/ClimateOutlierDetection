# Climate Outlier Detection

## Problem Statement
Outlier rainfall/pollution spikes are detected as magnitudes, but ignoring directional consistency leads to false positives.

## Solution
We add a directional autocorrelation check using wind vectors so that an anomaly is considered credible when nearby winds point toward it (physically coherent advection), and filtered otherwise.

## Table of Contents
- [Introduction](#introduction)
- [Tech Stack](#tech-stack)
- [Dataset](#dataset)
- [Quick Start](#quick-start)
- [Demo](#demo)
- [Contributors](#contributors)

## Introduction
Magnitude-only anomaly flags on rainfall/pollution often trigger false positives because they ignore flow direction. We add a directional autocorrelation check using wind vectors so that an anomaly is considered credible when nearby winds point toward it (physically coherent advection), and filtered otherwise.

## Tech Stack
- Python (backend processing and analytics)
- Next.js & React (frontend visualization)
- Tailwind CSS (styling)
- Node.js (runtime for frontend tooling)

## Dataset
- Historical rainfall records sourced from regional meteorological departments
- Pollution measurements from air quality monitoring stations
- Wind vector fields derived from NOAA reanalysis products

## Quick Start
1. Clone the repository: `git clone https://github.com/Vishnu4712/ClimateOutlierDetection.git`
2. Install backend dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
3. Install frontend dependencies:
   ```bash
   cd ../frontend2
   npm install
   ```
4. Run the backend server (example):
   ```bash
   uvicorn app:app --reload --port 8000
   ```
5. Start the frontend development server:
   ```bash
   npm run dev
   ```

## Demo
- Run the frontend development server and navigate to `http://localhost:8000` to interact with the anomaly dashboard showcasing directional validation overlays.

## Contributors
- Medhansh Rawat
- Yash Shrivastava
- Vishnu
- Bhavesh Goyal
- Gaurav
- Keval Patel
