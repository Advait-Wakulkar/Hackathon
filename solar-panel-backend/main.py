from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import uvicorn
import asyncio
import random
import math

# Create FastAPI app
app = FastAPI(title="Solar Panel AI System", version="1.0.0")

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constants for large-scale simulation
TOTAL_PANELS = 2700
AREA_SIZE_KM = 10  # 10km x 10km
SECTORS_PER_SIDE = 9  # 9x9 grid = 81 sectors
TOTAL_SECTORS = SECTORS_PER_SIDE * SECTORS_PER_SIDE
PANELS_PER_SECTOR = TOTAL_PANELS // TOTAL_SECTORS  # ~33 panels per sector

# Generate sectors and panels
def generate_solar_farm():
    panels = {}
    sectors = {}
    panel_id = 1
    
    # Abu Dhabi base coordinates
    base_lat = 24.4539
    base_lng = 54.3773
    
    # Each sector is approximately 1.11km x 1.11km
    sector_size_km = AREA_SIZE_KM / SECTORS_PER_SIDE
    
    for row in range(SECTORS_PER_SIDE):
        for col in range(SECTORS_PER_SIDE):
            sector_id = f"{chr(65 + row)}{col + 1}"  # A1, A2, ..., I9
            
            # Calculate sector center coordinates
            sector_lat = base_lat + (row - SECTORS_PER_SIDE/2) * (sector_size_km / 111)  # ~111km per degree latitude
            sector_lng = base_lng + (col - SECTORS_PER_SIDE/2) * (sector_size_km / 111)
            
            sectors[sector_id] = {
                "sector_id": sector_id,
                "row": row,
                "col": col,
                "center_lat": sector_lat,
                "center_lng": sector_lng,
                "panel_count": 0,
                "total_capacity": 0,
                "average_efficiency": 0
            }
            
            # Generate panels for this sector
            panels_in_sector = PANELS_PER_SECTOR + random.randint(-3, 3)  # Some variation
            
            for p in range(panels_in_sector):
                panel_id_str = f"PNL-{panel_id:04d}"
                
                # Distribute panels within sector
                panel_lat = sector_lat + random.uniform(-0.005, 0.005)
                panel_lng = sector_lng + random.uniform(-0.005, 0.005)
                
                # Initial panel state with more realistic distribution
                # Most panels should be performing well
                efficiency_distribution = random.random()
                if efficiency_distribution < 0.6:  # 60% of panels are in good condition
                    initial_efficiency = random.uniform(88, 95)
                    initial_dust = random.uniform(100, 250)
                elif efficiency_distribution < 0.85:  # 25% are fair
                    initial_efficiency = random.uniform(82, 88)
                    initial_dust = random.uniform(250, 350)
                else:  # 15% need attention
                    initial_efficiency = random.uniform(75, 82)
                    initial_dust = random.uniform(350, 500)
                
                panels[panel_id_str] = {
                    "panel_id": panel_id_str,
                    "sector_id": sector_id,
                    "location": {"lat": panel_lat, "lng": panel_lng},
                    "capacity": 500,  # 500W per panel
                    "installation_date": "2023-01-15",
                    "status": "active",
                    "current_efficiency": initial_efficiency,
                    "dust_level": initial_dust,
                    "voltage": 19.5 * (initial_efficiency / 100),
                    "last_cleaned": datetime.now() - timedelta(days=random.randint(1, 14))
                }
                
                sectors[sector_id]["panel_count"] += 1
                sectors[sector_id]["total_capacity"] += 500
                
                panel_id += 1
    
    # Calculate sector averages
    for sector_id in sectors:
        sector_panels = [p for p in panels.values() if p["sector_id"] == sector_id]
        if sector_panels:
            sectors[sector_id]["average_efficiency"] = sum(p["current_efficiency"] for p in sector_panels) / len(sector_panels)
    
    return panels, sectors

# Initialize farm data
panels_db, sectors_db = generate_solar_farm()
sensor_history = []
cleaning_history = []
alerts = []

# Pydantic models
class SensorData(BaseModel):
    panel_id: str
    voltage: float
    current: float
    temperature: float
    dust_level: float
    timestamp: Optional[datetime] = None

    def __init__(self, **data):
        if 'timestamp' not in data or data['timestamp'] is None:
            data['timestamp'] = datetime.now()
        super().__init__(**data)

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Solar Panel AI System API - Large Scale",
        "status": "operational",
        "version": "2.0.0",
        "scale": {
            "total_panels": len(panels_db),
            "total_sectors": len(sectors_db),
            "area_km2": AREA_SIZE_KM * AREA_SIZE_KM,
            "total_capacity_mw": (len(panels_db) * 500) / 1_000_000
        }
    }

# Get all sectors summary
@app.get("/api/sectors")
async def get_sectors():
    # Update sector statistics
    for sector_id in sectors_db:
        sector_panels = [p for p in panels_db.values() if p["sector_id"] == sector_id]
        if sector_panels:
            sectors_db[sector_id]["average_efficiency"] = sum(p["current_efficiency"] for p in sector_panels) / len(sector_panels)
            sectors_db[sector_id]["panels_needing_cleaning"] = sum(1 for p in sector_panels if p["dust_level"] > 300 or p["current_efficiency"] < 85)
            sectors_db[sector_id]["total_power_output"] = sum(p["voltage"] * 5.0 for p in sector_panels)  # Assuming 5A current
    
    return list(sectors_db.values())

# Get panels by sector
@app.get("/api/sectors/{sector_id}/panels")
async def get_sector_panels(sector_id: str):
    sector_panels = [p for p in panels_db.values() if p["sector_id"] == sector_id]
    if not sector_panels:
        raise HTTPException(status_code=404, detail="Sector not found")
    
    for panel in sector_panels:
        panel["needs_cleaning"] = panel["dust_level"] > 300 or panel["current_efficiency"] < 85
    
    return {
        "sector_id": sector_id,
        "panel_count": len(sector_panels),
        "panels": sector_panels
    }

# Get all panels (paginated for performance)
@app.get("/api/panels")
async def get_panels(skip: int = 0, limit: int = 100, sector_id: Optional[str] = None):
    if sector_id:
        all_panels = [p for p in panels_db.values() if p["sector_id"] == sector_id]
    else:
        all_panels = list(panels_db.values())
    
    # Add needs_cleaning flag
    for panel in all_panels:
        panel["needs_cleaning"] = panel["dust_level"] > 300 or panel["current_efficiency"] < 85
    
    total = len(all_panels)
    panels = all_panels[skip:skip + limit]
    
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "panels": panels
    }

# Get farm statistics
@app.get("/api/statistics")
async def get_statistics():
    total_efficiency = sum(p["current_efficiency"] for p in panels_db.values()) / len(panels_db)
    panels_needing_cleaning = sum(1 for p in panels_db.values() if p["dust_level"] > 300 or p["current_efficiency"] < 85)
    total_power_output = sum(p["voltage"] * 5.0 for p in panels_db.values())  # MW
    
    # Sector performance
    sector_stats = []
    for sector_id in sectors_db:
        sector_panels = [p for p in panels_db.values() if p["sector_id"] == sector_id]
        if sector_panels:
            sector_efficiency = sum(p["current_efficiency"] for p in sector_panels) / len(sector_panels)
            sector_stats.append({
                "sector_id": sector_id,
                "efficiency": sector_efficiency,
                "panel_count": len(sector_panels)
            })
    
    # Sort sectors by efficiency
    best_sectors = sorted(sector_stats, key=lambda x: x["efficiency"], reverse=True)[:5]
    worst_sectors = sorted(sector_stats, key=lambda x: x["efficiency"])[:5]
    
    return {
        "total_panels": len(panels_db),
        "total_sectors": len(sectors_db),
        "overall_efficiency": round(total_efficiency, 2),
        "panels_needing_cleaning": panels_needing_cleaning,
        "cleaning_percentage": round((panels_needing_cleaning / len(panels_db)) * 100, 2),
        "total_power_output_kw": round(total_power_output / 1000, 2),
        "total_capacity_mw": (len(panels_db) * 500) / 1_000_000,
        "best_performing_sectors": best_sectors,
        "worst_performing_sectors": worst_sectors,
        "estimated_daily_revenue": round(total_power_output * 24 * 0.05, 2)  # Assuming $0.05/kWh
    }

# Clean individual panel
@app.post("/api/clean/{panel_id}")
async def clean_panel(panel_id: str):
    if panel_id not in panels_db:
        raise HTTPException(status_code=404, detail="Panel not found")
    
    # Clean the panel
    panels_db[panel_id]["dust_level"] = random.uniform(50, 150)
    panels_db[panel_id]["current_efficiency"] = random.uniform(92, 98)
    panels_db[panel_id]["voltage"] = 19.5 * (panels_db[panel_id]["current_efficiency"] / 100)
    panels_db[panel_id]["last_cleaned"] = datetime.now()
    panels_db[panel_id]["needs_cleaning"] = False
    
    # Record cleaning
    cleaning_record = {
        "panel_id": panel_id,
        "sector_id": panels_db[panel_id]["sector_id"],
        "timestamp": datetime.now().isoformat(),
        "water_used": 2.3,
        "duration": 120,
        "type": "manual"
    }
    cleaning_history.append(cleaning_record)
    
    return {
        "message": f"Cleaning initiated for panel {panel_id}",
        "panel_id": panel_id,
        "estimated_duration": 120,  # seconds
        "water_usage": 2.3,  # liters
        "status": "completed",
        "new_efficiency": panels_db[panel_id]["current_efficiency"],
        "new_dust_level": panels_db[panel_id]["dust_level"]
    }

# Bulk clean sector
@app.post("/api/sectors/{sector_id}/clean")
async def clean_sector(sector_id: str):
    sector_panels = [p for p in panels_db.values() if p["sector_id"] == sector_id]
    if not sector_panels:
        raise HTTPException(status_code=404, detail="Sector not found")
    
    cleaned_count = 0
    total_water = 0
    
    for panel in sector_panels:
        if panel["dust_level"] > 300 or panel["current_efficiency"] < 85:
            # Clean the panel
            panels_db[panel["panel_id"]]["dust_level"] = random.uniform(50, 150)
            panels_db[panel["panel_id"]]["current_efficiency"] = random.uniform(92, 98)
            panels_db[panel["panel_id"]]["voltage"] = 19.5 * (panels_db[panel["panel_id"]]["current_efficiency"] / 100)
            panels_db[panel["panel_id"]]["last_cleaned"] = datetime.now()
            
            cleaned_count += 1
            total_water += 2.3  # Liters per panel
            
            # Record cleaning
            cleaning_history.append({
                "panel_id": panel["panel_id"],
                "sector_id": sector_id,
                "timestamp": datetime.now().isoformat(),
                "water_used": 2.3
            })
    
    return {
        "sector_id": sector_id,
        "panels_cleaned": cleaned_count,
        "total_water_used": round(total_water, 2),
        "estimated_efficiency_gain": round(cleaned_count * 10 / len(sector_panels), 2),  # Percentage points
        "status": "completed"
    }

# AI prediction for sector
@app.post("/api/predict/sector/{sector_id}")
async def predict_sector_cleaning(sector_id: str):
    sector_panels = [p for p in panels_db.values() if p["sector_id"] == sector_id]
    if not sector_panels:
        raise HTTPException(status_code=404, detail="Sector not found")
    
    # Calculate sector metrics
    avg_dust = sum(p["dust_level"] for p in sector_panels) / len(sector_panels)
    avg_efficiency = sum(p["current_efficiency"] for p in sector_panels) / len(sector_panels)
    days_since_cleaning = 7  # Mock value
    
    # AI scoring
    dust_score = min(avg_dust / 500, 1.0) * 0.4
    time_score = min(days_since_cleaning / 14, 1.0) * 0.3
    efficiency_score = max(0, (100 - avg_efficiency) / 100) * 0.3
    
    need_cleaning_score = dust_score + time_score + efficiency_score
    
    panels_needing_cleaning = sum(1 for p in sector_panels if p["dust_level"] > 300 or p["current_efficiency"] < 85)
    
    return {
        "sector_id": sector_id,
        "cleaning_score": round(need_cleaning_score, 2),
        "should_clean": need_cleaning_score > 0.5,
        "confidence": 0.89,
        "panels_needing_cleaning": panels_needing_cleaning,
        "percentage_needing_cleaning": round((panels_needing_cleaning / len(sector_panels)) * 100, 2),
        "estimated_water_usage": round(panels_needing_cleaning * 2.3, 2),
        "estimated_time_hours": round(panels_needing_cleaning * 0.033, 2),  # 2 min per panel
        "recommendation": f"Clean {panels_needing_cleaning} panels in sector {sector_id}" if need_cleaning_score > 0.5 else "Monitor sector for 48 hours",
        "roi_analysis": {
            "cleaning_cost": round(panels_needing_cleaning * 0.5, 2),  # $0.50 per panel
            "expected_revenue_gain": round(panels_needing_cleaning * 2.5, 2),  # $2.50 per panel
            "net_benefit": round(panels_needing_cleaning * 2.0, 2)
        }
    }

# WebSocket for real-time monitoring
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Simulate real-time updates for a subset of panels
            sample_size = 50  # Monitor 50 random panels in real-time
            sample_panels = random.sample(list(panels_db.values()), sample_size)
            
            # Update panel states (simulate environmental changes)
            for panel in panels_db.values():
                # Gradually increase dust (slower rate for more realistic simulation)
                panels_db[panel["panel_id"]]["dust_level"] = min(800, panels_db[panel["panel_id"]]["dust_level"] + random.uniform(0, 0.5))
                
                # Decrease efficiency based on dust (more gradual)
                dust_factor = panels_db[panel["panel_id"]]["dust_level"] / 1000
                base_efficiency = 95 - (dust_factor * 15)  # Less aggressive efficiency drop
                panels_db[panel["panel_id"]]["current_efficiency"] = max(70, base_efficiency + random.uniform(-1, 1))
                panels_db[panel["panel_id"]]["voltage"] = 19.5 * (panels_db[panel["panel_id"]]["current_efficiency"] / 100)
            
            # Calculate real-time statistics
            total_efficiency = sum(p["current_efficiency"] for p in panels_db.values()) / len(panels_db)
            panels_needing_cleaning = sum(1 for p in panels_db.values() if p["dust_level"] > 300 or p["current_efficiency"] < 85)
            total_power_output = sum(p["voltage"] * 5.0 for p in panels_db.values())
            
            # Sector summaries
            sector_summaries = []
            for sector_id in list(sectors_db.keys())[:9]:  # Top 9 sectors
                sector_panels = [p for p in panels_db.values() if p["sector_id"] == sector_id]
                if sector_panels:
                    sector_efficiency = sum(p["current_efficiency"] for p in sector_panels) / len(sector_panels)
                    sector_summaries.append({
                        "sector_id": sector_id,
                        "efficiency": round(sector_efficiency, 1),
                        "panels_needing_cleaning": sum(1 for p in sector_panels if p["dust_level"] > 300 or p["current_efficiency"] < 85)
                    })
            
            data = {
                "timestamp": datetime.now().isoformat(),
                "farm_statistics": {
                    "total_efficiency": round(total_efficiency, 2),
                    "panels_needing_cleaning": panels_needing_cleaning,
                    "total_power_output_mw": round(total_power_output / 1_000_000, 2),
                    "cleaning_percentage": round((panels_needing_cleaning / len(panels_db)) * 100, 2)
                },
                "sector_summaries": sector_summaries,
                "sample_panels": [
                    {
                        "id": p["panel_id"],
                        "sector": p["sector_id"],
                        "voltage": round(p["voltage"], 2),
                        "current": round(5.0 + random.uniform(-0.3, 0.3), 2),
                        "efficiency": round(p["current_efficiency"], 1),
                        "dust_level": round(p["dust_level"]),
                        "temperature": round(32 + random.uniform(-3, 3), 1),
                        "power_output": round(p["voltage"] * 5.0, 1)
                    }
                    for p in sample_panels[:10]  # Send only 10 panels to avoid overwhelming
                ],
                "weather": {
                    "temperature": round(32 + random.uniform(-2, 2), 1),
                    "humidity": round(45 + random.uniform(-5, 5)),
                    "wind_speed": round(3.5 + random.uniform(-1, 1), 1),
                    "conditions": "clear"
                }
            }
            
            await websocket.send_json(data)
            await asyncio.sleep(3)  # Update every 3 seconds
            
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()

# Submit sensor data (for IoT integration)
@app.post("/api/sensor-data")
async def submit_sensor_data(data: SensorData):
    if data.panel_id not in panels_db:
        raise HTTPException(status_code=404, detail="Panel not found")
    
    # Update panel state
    efficiency = calculate_efficiency(data.voltage, data.current)
    panels_db[data.panel_id]["voltage"] = data.voltage
    panels_db[data.panel_id]["current_efficiency"] = efficiency
    panels_db[data.panel_id]["dust_level"] = data.dust_level
    
    # Store sensor reading
    sensor_reading = {
        "panel_id": data.panel_id,
        "sector_id": panels_db[data.panel_id]["sector_id"],
        "voltage": data.voltage,
        "current": data.current,
        "temperature": data.temperature,
        "dust_level": data.dust_level,
        "efficiency": efficiency,
        "timestamp": data.timestamp.isoformat()
    }
    sensor_history.append(sensor_reading)
    
    # Keep only last 10000 readings
    if len(sensor_history) > 10000:
        sensor_history.pop(0)
    
    return {
        "message": "Data received",
        "panel_id": data.panel_id,
        "sector_id": panels_db[data.panel_id]["sector_id"],
        "efficiency": efficiency,
        "needs_cleaning": data.dust_level > 300 or efficiency < 85
    }

# Get alerts summary
@app.get("/api/alerts/summary")
async def get_alerts_summary():
    # Generate alerts for sectors with poor performance
    sector_alerts = []
    
    for sector_id in sectors_db:
        sector_panels = [p for p in panels_db.values() if p["sector_id"] == sector_id]
        if sector_panels:
            avg_efficiency = sum(p["current_efficiency"] for p in sector_panels) / len(sector_panels)
            panels_needing_cleaning = sum(1 for p in sector_panels if p["dust_level"] > 300 or p["current_efficiency"] < 85)
            
            if avg_efficiency < 85 or panels_needing_cleaning > len(sector_panels) * 0.5:
                sector_alerts.append({
                    "sector_id": sector_id,
                    "type": "sector_performance",
                    "severity": "high" if avg_efficiency < 80 else "medium",
                    "message": f"Sector {sector_id}: {panels_needing_cleaning} panels need cleaning",
                    "avg_efficiency": round(avg_efficiency, 2),
                    "panels_affected": panels_needing_cleaning
                })
    
    # Sort by severity and number of panels affected
    sector_alerts.sort(key=lambda x: (x["severity"] == "high", x["panels_affected"]), reverse=True)
    
    return {
        "total_alerts": len(sector_alerts),
        "high_priority_sectors": sum(1 for a in sector_alerts if a["severity"] == "high"),
        "sectors_needing_attention": [a["sector_id"] for a in sector_alerts[:10]],
        "alerts": sector_alerts[:20]  # Top 20 alerts
    }

# Utility function
def calculate_efficiency(voltage: float, current: float) -> float:
    expected_power = 19.5 * 5.5
    actual_power = voltage * current
    efficiency = (actual_power / expected_power) * 100
    return min(100, max(0, efficiency))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)