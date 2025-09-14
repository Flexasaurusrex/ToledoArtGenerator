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

init_db()

cleanup_thread_started = False

def run_periodic_cleanup():
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

        zip_filename = f'toledo_art_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.zip'
        zip_path = os.path.join('static/generated', zip_filename)

        target_size = (1200, 1200)

        with zipfile.ZipFile(zip_path, 'w') as zipf:
            for idx, path in enumerate(image_paths):
                if path.startswith('/'):
                    path = path[1:]

                if os.path.exists(path):
                    with Image.open(path) as img:
                        if img.size != target_size:
                            img = img.resize(target_size, Image.Resampling.LANCZOS)

                        if export_format.lower() == 'jpg' and img.mode in ('RGBA', 'LA'):
                            img = img.convert('RGB')

                        img_byte_arr = io.BytesIO()
                        save_kwargs = {}
                        if export_format.lower() == 'jpg':
                            save_kwargs['format'] = 'JPEG'
                            save_kwargs['quality'] = 95
                        else:
                            save_kwargs['format'] = 'PNG'
                            save_kwargs['optimize'] = True

                        img.save(img_byte_arr, **save_kwargs)
                        img_byte_arr.seek(0)

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

    os.makedirs('static/generated', exist_ok=True)

    if db_available:
        from models import ArtworkGeneration
        from utils.cleanup import cleanup_artwork_files
        cleanup_artwork_files(db, ArtworkGeneration)

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'generated_{timestamp}_{random.randint(1000, 9999)}.png'
    filepath = f'static/generated/{filename}'

    img_data = base64.b64decode(image_data.split(',')[1])
    with Image.open(io.BytesIO(img_data)) as img:
        if img.size != (1200, 1200):
            img = img.resize((1200, 1200), Image.Resampling.LANCZOS)
        img.save(filepath, 'PNG', optimize=True)

    try:
        if db_available:
            from models import ArtworkGeneration
            artwork = ArtworkGeneration()
            artwork.image_path = filepath
            artwork.style_params = params
            db.session.add(artwork)
            db.session.commit()
        else:
            fallback_storage.append({
                'id': random.randint(1000, 9999),
                'created_at': datetime.utcnow().isoformat(),
                'image_path': filepath,
                'style_params': params
            })
            if len(fallback_storage) > 100:
                fallback_storage.pop(0)
    except Exception as e:
        print(f"Error saving artwork: {str(e)}")

    return filepath

def randomize_parameters(base_params):
    params = base_params.copy()
    
    variations = {
        'intensity': {'range': 0.3, 'min': 0.1, 'max': 1.0, 'weight': 1.2},
        'chaos': {'range': 0.35, 'min': 0.1, 'max': 1.0, 'weight': 1.4},
        'lineThickness': {'range': 0.4, 'min': 0.5, 'max': 3.0, 'weight': 1.0},
        'buildingDensity': {'range': 0.3, 'min': 0.2, 'max': 2.0, 'weight': 1.1},
        'skylineComplexity': {'range': 3, 'min': 3, 'max': 12, 'weight': 1.2},
        'textureGrain': {'range': 0.3, 'min': 0.2, 'max': 2.0, 'weight': 0.9},
        'colorIntensity': {'range': 0.25, 'min': 0.5, 'max': 1.5, 'weight': 1.3},
        'hueAdjust': {'range': 30, 'min': -180, 'max': 180, 'weight': 0.8}
    }
    
    color_tones = {
        'downtown': 0.3,
        'sunset': 0.25,
        'industrial': 0.15,
        'riverfront': 0.2,
        'storm': 0.1
    }
    
    for param_name, variation in variations.items():
        if param_name in params:
            base_value = float(params[param_name])
            variation_amount = variation['range'] * variation['weight']
            
            if param_name == 'skylineComplexity':
                delta = random.randint(-int(variation_amount), int(variation_amount))
                new_value = base_value + delta
            elif param_name == 'hueAdjust':
                delta = random.uniform(-variation_amount, variation_amount) * 15
                new_value = base_value + delta
            else:
                delta = random.uniform(-variation_amount, variation_amount) * base_value
                new_value = base_value + delta
            
            params[param_name] = max(variation['min'], min(variation['max'], new_value))
    
    if 'color_tone' in params:
        if random.random() < 0.5:
            params['color_tone'] = random.choices(
                list(color_tones.keys()),
                weights=list(color_tones.values())
            )[0]
    
    if params.get('chaos', 0) > 0.8:
        params['lineThickness'] = min(3.0, params.get('lineThickness', 1) * 1.2)
        
    if params.get('intensity', 0) < 0.3:
        params['buildingDensity'] = max(0.2, params.get('buildingDensity', 1) * 0.8)
    
    if params.get('color_tone') == 'industrial':
        params['colorIntensity'] = max(0.5, min(1.2, params.get('colorIntensity', 1) * 0.85))
    elif params.get('color_tone') == 'sunset':
        params['colorIntensity'] = max(0.5, min(1.5, params.get('colorIntensity', 1) * 1.15))
    
    return params

@app.route('/generate', methods=['POST'])
def generate_art():
    try:
        base_params = {
            'intensity': float(request.form.get('intensity', 0.5)),
            'chaos': float(request.form.get('chaos', 0.5)),
            'color_tone': request.form.get('color_tone', 'downtown'),
            'lineThickness': float(request.form.get('lineThickness', 1.0)),
            'buildingDensity': float(request.form.get('buildingDensity', 1.0)),
            'skylineComplexity': float(request.form.get('skylineComplexity', 5)),
            'textureGrain': float(request.form.get('textureGrain', 1.0)),
            'colorIntensity': float(request.form.get('colorIntensity', 1.0)),
            'hueAdjust': float(request.form.get('hueAdjust', 0)),
            'redSculpture': request.form.get('redSculpture') == 'true',
            'glassToledo': request.form.get('glassToledo') == 'true',
            'mudHens': request.form.get('mudHens') == 'true',
            'toledoMuseum': request.form.get('toledoMuseum') == 'true'
        }
        
        canvas_data = request.form.get('canvas_data', '')
        if not canvas_data:
            return jsonify({'status': 'error', 'message': 'No canvas data provided'}), 400
        
        variation_params = randomize_parameters(base_params)
        
        filepath = save_image(canvas_data, variation_params)
        
        return jsonify({
            'status': 'success',
            'images': [{
                'image': f'/{filepath}',
                'id': random.randint(1000, 9999),
                'parameters': variation_params
            }]
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True)
