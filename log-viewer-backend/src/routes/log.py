import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from src.models.log import db, LogFile, LogEntry, AnalysisResult
import mimetypes

log_bp = Blueprint('log', __name__)

ALLOWED_EXTENSIONS = {'log', 'txt', 'out', 'err', 'json'}
UPLOAD_FOLDER = 'uploads'

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def ensure_upload_folder():
    upload_path = os.path.join(current_app.root_path, UPLOAD_FOLDER)
    if not os.path.exists(upload_path):
        os.makedirs(upload_path)
    return upload_path

def detect_log_type(filename, content_sample):
    """Detect log type based on filename and content"""
    filename_lower = filename.lower()
    
    # Check filename patterns
    if 'syslog' in filename_lower or 'messages' in filename_lower:
        return 'syslog'
    elif 'dmesg' in filename_lower or 'kernel' in filename_lower:
        return 'dmesg'
    elif 'kubernetes' in filename_lower or 'k8s' in filename_lower or 'kubectl' in filename_lower:
        return 'kubernetes'
    elif 'mysql' in filename_lower or 'mariadb' in filename_lower:
        return 'mysql'
    elif 'nginx' in filename_lower:
        return 'nginx'
    elif 'apache' in filename_lower or 'httpd' in filename_lower:
        return 'apache'
    elif 'docker' in filename_lower:
        return 'docker'
    
    # Check content patterns
    if content_sample:
        content_lower = content_sample.lower()
        if 'level=info' in content_lower or 'level=error' in content_lower:
            return 'structured'
        elif '[info]' in content_lower or '[error]' in content_lower:
            return 'application'
        elif 'kernel:' in content_lower:
            return 'dmesg'
    
    return 'generic'

@log_bp.route('/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        if file and allowed_file(file.filename):
            # Generate unique filename
            original_filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4()}_{original_filename}"
            
            # Ensure upload folder exists
            upload_path = ensure_upload_folder()
            file_path = os.path.join(upload_path, unique_filename)
            
            # Save file
            file.save(file_path)
            file_size = os.path.getsize(file_path)
            
            # Read sample content for log type detection
            content_sample = ""
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content_sample = f.read(1000)  # Read first 1000 chars
            except Exception:
                pass
            
            # Detect log type
            log_type = detect_log_type(original_filename, content_sample)
            
            # Create database record
            log_file = LogFile(
                filename=unique_filename,
                original_filename=original_filename,
                file_path=file_path,
                file_size=file_size,
                log_type=log_type
            )
            
            db.session.add(log_file)
            db.session.commit()
            
            # Automatically process the file
            try:
                from src.parsers.log_parser import LogParser
                
                # Read file content for processing
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    file_content = f.read()
                
                # Parse the log content
                parser = LogParser()
                entries, detected_format = parser.parse_logs(file_content, log_type)
                
                # Update log file with detected format
                if detected_format != log_type:
                    log_file.log_type = detected_format
                
                # Store parsed entries in database
                for entry in entries:
                    db_entry = LogEntry(
                        log_file_id=log_file.id,
                        line_number=entry.line_number,
                        timestamp=entry.timestamp,
                        level=entry.level,
                        source=entry.source,
                        message=entry.message,
                        raw_line=entry.raw_line
                    )
                    db.session.add(db_entry)
                
                # Mark file as processed
                log_file.processed = True
                db.session.commit()
                
            except Exception as parse_error:
                # If parsing fails, still return success for upload
                print(f"Parsing failed: {parse_error}")
            
            return jsonify({
                'message': 'File uploaded successfully',
                'file': log_file.to_dict()
            }), 201
        
        return jsonify({'error': 'File type not allowed'}), 400
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@log_bp.route('/files', methods=['GET'])
def get_files():
    try:
        files = LogFile.query.order_by(LogFile.upload_time.desc()).all()
        return jsonify({
            'files': [file.to_dict() for file in files]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@log_bp.route('/files/<int:file_id>', methods=['GET'])
def get_file(file_id):
    try:
        log_file = LogFile.query.get_or_404(file_id)
        return jsonify({
            'file': log_file.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@log_bp.route('/files/<int:file_id>/content', methods=['GET'])
def get_file_content(file_id):
    try:
        log_file = LogFile.query.get_or_404(file_id)
        
        # Read file content
        with open(log_file.file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        return jsonify({
            'content': content,
            'file': log_file.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@log_bp.route('/files/<int:file_id>/entries', methods=['GET'])
def get_file_entries(file_id):
    try:
        log_file = LogFile.query.get_or_404(file_id)
        
        # Get pagination parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 100, type=int)
        
        # Get entries with pagination
        entries = LogEntry.query.filter_by(log_file_id=file_id)\
                              .order_by(LogEntry.line_number)\
                              .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'entries': [entry.to_dict() for entry in entries.items],
            'pagination': {
                'page': entries.page,
                'pages': entries.pages,
                'per_page': entries.per_page,
                'total': entries.total
            },
            'file': log_file.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@log_bp.route('/files/<int:file_id>', methods=['DELETE'])
def delete_file(file_id):
    try:
        log_file = LogFile.query.get_or_404(file_id)
        
        # Delete physical file
        if os.path.exists(log_file.file_path):
            os.remove(log_file.file_path)
        
        # Delete database record (entries will be deleted by cascade)
        db.session.delete(log_file)
        db.session.commit()
        
        return jsonify({'message': 'File deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

