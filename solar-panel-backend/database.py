from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from datetime import datetime
from typing import Optional, List, Dict

# Load environment variables
load_dotenv()

# MongoDB connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/")
DATABASE_NAME = os.getenv("DATABASE_NAME", "solar_panel_ai")

# Async MongoDB client for FastAPI
motor_client = AsyncIOMotorClient(MONGODB_URL)
database = motor_client[DATABASE_NAME]

# Collections
panels_collection = database["panels"]
sensor_data_collection = database["sensor_data"]
cleaning_history_collection = database["cleaning_history"]
analytics_collection = database["analytics"]
alerts_collection = database["alerts"]

# Database models/schemas
class DatabaseManager:
    def __init__(self):
        self.db = database
        
    async def initialize_database(self):
        """Create indexes and initial data"""
        # Create indexes for better performance
        await panels_collection.create_index("panel_id", unique=True)
        await sensor_data_collection.create_index([("panel_id", 1), ("timestamp", -1)])
        await cleaning_history_collection.create_index([("panel_id", 1), ("timestamp", -1)])
        
        # Insert sample panels if none exist
        panel_count = await panels_collection.count_documents({})
        if panel_count == 0:
            sample_panels = [
                {
                    "panel_id": "PANEL-001",
                    "location": {"lat": 24.4539, "lng": 54.3773},  # Abu Dhabi coordinates
                    "capacity": 500,  # Watts
                    "installation_date": datetime(2023, 1, 15),
                    "status": "active",
                    "zone": "A1"
                },
                {
                    "panel_id": "PANEL-002",
                    "location": {"lat": 24.4540, "lng": 54.3774},
                    "capacity": 500,
                    "installation_date": datetime(2023, 1, 15),
                    "status": "active",
                    "zone": "A1"
                },
                {
                    "panel_id": "PANEL-003",
                    "location": {"lat": 24.4541, "lng": 54.3775},
                    "capacity": 500,
                    "installation_date": datetime(2023, 1, 15),
                    "status": "active",
                    "zone": "A2"
                }
            ]
            await panels_collection.insert_many(sample_panels)
            print("✅ Sample panels inserted")
    
    # Panel operations
    async def get_all_panels(self) -> List[Dict]:
        """Get all panels with their latest status"""
        panels = []
        async for panel in panels_collection.find({"status": "active"}):
            # Get latest sensor data for each panel
            latest_data = await sensor_data_collection.find_one(
                {"panel_id": panel["panel_id"]},
                sort=[("timestamp", -1)]
            )
            
            # Calculate efficiency if we have data
            if latest_data:
                panel["current_efficiency"] = latest_data.get("efficiency", 0)
                panel["dust_level"] = latest_data.get("dust_level", 0)
                panel["voltage"] = latest_data.get("voltage", 0)
            else:
                panel["current_efficiency"] = 95.0  # Default
                panel["dust_level"] = 100
                panel["voltage"] = 19.5
                
            # Convert ObjectId to string
            panel["_id"] = str(panel["_id"])
            panels.append(panel)
        return panels
    
    async def get_panel_by_id(self, panel_id: str) -> Optional[Dict]:
        """Get specific panel details"""
        panel = await panels_collection.find_one({"panel_id": panel_id})
        if panel:
            panel["_id"] = str(panel["_id"])
        return panel
    
    # Sensor data operations
    async def save_sensor_data(self, data: Dict) -> str:
        """Save sensor reading"""
        data["timestamp"] = datetime.now()
        result = await sensor_data_collection.insert_one(data)
        return str(result.inserted_id)
    
    async def get_sensor_history(self, panel_id: str, hours: int = 24) -> List[Dict]:
        """Get sensor data history for a panel"""
        from datetime import timedelta
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        cursor = sensor_data_collection.find(
            {
                "panel_id": panel_id,
                "timestamp": {"$gte": cutoff_time}
            }
        ).sort("timestamp", 1)
        
        history = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            history.append(doc)
        return history
    
    # Cleaning operations
    async def record_cleaning(self, panel_id: str, water_used: float, duration: int) -> str:
        """Record a cleaning event"""
        cleaning_record = {
            "panel_id": panel_id,
            "timestamp": datetime.now(),
            "water_used_liters": water_used,
            "duration_seconds": duration,
            "trigger_type": "manual",  # or "automatic"
            "pre_cleaning_efficiency": 0,  # Will be updated
            "post_cleaning_efficiency": 0  # Will be updated
        }
        result = await cleaning_history_collection.insert_one(cleaning_record)
        return str(result.inserted_id)
    
    async def get_cleaning_history(self, panel_id: str) -> List[Dict]:
        """Get cleaning history for a panel"""
        cursor = cleaning_history_collection.find(
            {"panel_id": panel_id}
        ).sort("timestamp", -1).limit(10)
        
        history = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            history.append(doc)
        return history
    
    # Analytics operations
    async def save_daily_analytics(self, panel_id: str, analytics_data: Dict):
        """Save daily analytics summary"""
        analytics_data.update({
            "panel_id": panel_id,
            "date": datetime.now().date().isoformat(),
            "timestamp": datetime.now()
        })
        
        # Upsert - update if exists, insert if not
        await analytics_collection.update_one(
            {"panel_id": panel_id, "date": analytics_data["date"]},
            {"$set": analytics_data},
            upsert=True
        )
    
    async def get_panel_analytics(self, panel_id: str, days: int = 7) -> List[Dict]:
        """Get analytics for a panel"""
        from datetime import timedelta
        cutoff_date = (datetime.now() - timedelta(days=days)).date().isoformat()
        
        cursor = analytics_collection.find(
            {
                "panel_id": panel_id,
                "date": {"$gte": cutoff_date}
            }
        ).sort("date", 1)
        
        analytics = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            analytics.append(doc)
        return analytics
    
    # Alert operations
    async def create_alert(self, panel_id: str, alert_type: str, message: str, severity: str = "medium"):
        """Create an alert"""
        alert = {
            "panel_id": panel_id,
            "type": alert_type,  # "dust_high", "efficiency_low", "anomaly"
            "message": message,
            "severity": severity,  # "low", "medium", "high"
            "timestamp": datetime.now(),
            "resolved": False
        }
        await alerts_collection.insert_one(alert)
    
    async def get_active_alerts(self) -> List[Dict]:
        """Get all unresolved alerts"""
        cursor = alerts_collection.find(
            {"resolved": False}
        ).sort("timestamp", -1)
        
        alerts = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            alerts.append(doc)
        return alerts

# Create global database manager instance
db_manager = DatabaseManager()

# Helper function to convert MongoDB ObjectId to string
def serialize_doc(doc: Dict) -> Dict:
    """Convert MongoDB document for JSON serialization"""
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc