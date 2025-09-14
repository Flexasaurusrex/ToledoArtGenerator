import os
from flask import Flask, render_template, jsonify, request, send_file
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
import random
from PIL import Image
import io
import base64
import json
from datetime import datetime, timedelta
import zipfile
from werkzeug.utils import secure_filename
import threading
import time

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)
app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY") or "toledo_cityscape_art_key"
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///art.db")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

# Global variables for fallback storage
fallback_storage = []
db_available = False

def init_db():
    global db_available
    try:
        db.init_app(app)
        with app.app_context():
            import models
            db.create_all()
        db_available = True
        print("Database initialized successfully")
    except Exception as e:
        print(f"Database initialization failed: {str(e)}")
        db_available = False

# Try to initialize database
init_db()

# Global flag to track cleanup thread initialization
cleanup_thread_started = False

def run_periodic_cleanup():
    """
    Run cleanup task periodically
    """
    global db_available
    while True:
        try:
            if db_available:
                from models import ArtworkGeneration
                from utils.cleanup import cleanup_artwork_files
                with app.app_context():
                    cleaned_files, cleaned_entries = cleanup_artwork_files(db, ArtworkGeneration)
                    if cleaned_files > 0 or cleaned_entries > 0:
                        print(f"Cleanup completed: removed {cleaned_files} files and {cleaned_entries} database entries")
        except Exception as e:
            print(f"Error in cleanup task: {str(e)}")
        # Run every 6 hours
        time.sleep(6 * 60 * 60)

@app.before_request
def start_cleanup_thread():
    global cleanup_thread_started
    if not cleanup_thread_started and db_available:
        cleanup_thread = threading.Thread(target=run_periodic_cleanup, daemon=True)
        cleanup_thread.start()
        cleanup_thread_started = True

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/history')
def get_history():
    global db_available
    try:
        if db_available:
            from models import ArtworkGeneration
            artworks = ArtworkGeneration.query.order_by(ArtworkGeneration.created_at.desc()).limit(10).all()
            return jsonify([{
                'id': artwork.id,
                'created_at': artwork.created_at.isoformat(),
                'image_path': artwork.image_path,
                'style_params': artwork.style_params
            } for artwork in artworks])
        else:
            # Return from fallback storage
            return jsonify(fallback_storage[-10:] if fallback_storage else [])
    except Exception as e:
        print(f"Error fetching history: {str(e)}")
        return jsonify([])

@app.route('/export-batch', methods=['POST'])
def export_batch():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'status': 'error', 'message': 'No JSON data provided'}), 400

        image_paths = data.get('image_paths', [])
        export_format = data.get('format', 'png')

        if not image_paths:
            return jsonify({'status': 'error', 'message': 'No images selected'}), 400

        # Create a temporary ZIP file
        zip_filename = f'toledo_art_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.zip'
        zip_path = os.path.join('static/generated', zip_filename)

        # Ensure the target resolution
        target_size = (1200, 1200)

        with zipfile.ZipFile(zip_path, 'w') as zipf:
            for idx, path in enumerate(image_paths):
                if path.startswith('/'):
                    path = path[1:]  # Remove leading slash

                if os.path.exists(path):
                    # Open and resize the image to 1200x1200 if needed
                    with Image.open(path) as img:
                        # Resize if not already at target size
                        if img.size != target_size:
                            img = img.resize(target_size, Image.Resampling.LANCZOS)

                        # Convert to RGB if PNG and exporting as JPG
                        if export_format.lower() == 'jpg' and img.mode in ('RGBA', 'LA'):
                            img = img.convert('RGB')

                        # Save to bytes with high quality
                        img_byte_arr = io.BytesIO()
                        save_kwargs = {}
                        if export_format.lower() == 'jpg':
                            save_kwargs['format'] = 'JPEG'
                            save_kwargs['quality'] = 95  # High quality JPEG
                        else:
                            save_kwargs['format'] = 'PNG'
                            save_kwargs['optimize'] = True  # Optimize PNG

                        img.save(img_byte_arr, **save_kwargs)
                        img_byte_arr.seek(0)

                        # Add to ZIP with new format extension
                        base_name = os.path.splitext(os.path.basename(path))[0]
                        zipf.writestr(f'{base_name}.{export_format.lower()}', img_byte_arr.getvalue())

        return jsonify({
            'status': 'success',
            'download_url': f'/{zip_path}'
        })

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

def save_image(image_data, params):
    global db_available, fallback_storage

    # Create directory if it doesn't exist
    os.makedirs('static/generated', exist_ok=True)

    # Clean up old files if database is available
    if db_available:
        from models import ArtworkGeneration
        from utils.cleanup import cleanup_artwork_files
        cleanup_artwork_files(db, ArtworkGeneration)

    # Generate unique filename
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'generated_{timestamp}_{random.randint(1000, 9999)}.png'
    filepath = f'static/generated/{filename}'

    # Decode and save image at 1200x1200 resolution
    img_
