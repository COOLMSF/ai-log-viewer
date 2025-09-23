from flask import Blueprint, request, jsonify
from src.models.log import db, LogFile, LogEntry
from src.parsers.log_parser import LogParser

parser_bp = Blueprint('parser', __name__)

@parser_bp.route('/process/<int:file_id>', methods=['POST'])
def process_log_file(file_id):
    """Process a log file and extract structured entries"""
    try:
        log_file = LogFile.query.get_or_404(file_id)
        
        if log_file.processed:
            return jsonify({'message': 'File already processed'}), 200
        
        # Read file content
        with open(log_file.file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Parse the log content
        parser = LogParser()
        entries, detected_format = parser.parse_logs(content, log_file.log_type)
        
        # Update log file with detected format
        if detected_format != log_file.log_type:
            log_file.log_type = detected_format
        
        # Clear existing entries if any
        LogEntry.query.filter_by(log_file_id=file_id).delete()
        
        # Store parsed entries in database
        for entry in entries:
            db_entry = LogEntry(
                log_file_id=file_id,
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
        
        return jsonify({
            'message': 'File processed successfully',
            'entries_count': len(entries),
            'detected_format': detected_format,
            'file': log_file.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@parser_bp.route('/parse-preview', methods=['POST'])
def parse_preview():
    """Parse log content and return preview without storing"""
    try:
        data = request.get_json()
        content = data.get('content', '')
        log_format = data.get('format', None)
        
        if not content:
            return jsonify({'error': 'No content provided'}), 400
        
        # Parse the log content
        parser = LogParser()
        entries, detected_format = parser.parse_logs(content, log_format)
        
        # Return first 50 entries for preview
        preview_entries = entries[:50]
        
        return jsonify({
            'entries': [entry.to_dict() for entry in preview_entries],
            'total_entries': len(entries),
            'detected_format': detected_format,
            'preview_count': len(preview_entries)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@parser_bp.route('/formats', methods=['GET'])
def get_supported_formats():
    """Get list of supported log formats"""
    formats = {
        'syslog': {
            'name': 'Syslog',
            'description': 'Standard system log format',
            'example': 'Sep 23 22:40:00 server kernel: message'
        },
        'dmesg': {
            'name': 'Kernel Messages',
            'description': 'Linux kernel messages',
            'example': '[12345.678] kernel: message'
        },
        'kubernetes': {
            'name': 'Kubernetes',
            'description': 'Kubernetes container logs',
            'example': '2025-09-23T22:40:00.123Z INFO message'
        },
        'mysql': {
            'name': 'MySQL',
            'description': 'MySQL database logs',
            'example': '2025-09-23 22:40:00 [Note] message'
        },
        'nginx': {
            'name': 'Nginx',
            'description': 'Nginx web server logs',
            'example': '192.168.1.1 - - [23/Sep/2025:22:40:00 +0000] "GET / HTTP/1.1"'
        },
        'apache': {
            'name': 'Apache',
            'description': 'Apache web server logs',
            'example': '192.168.1.1 - - [23/Sep/2025:22:40:00 +0000] "GET / HTTP/1.1"'
        },
        'docker': {
            'name': 'Docker',
            'description': 'Docker container logs',
            'example': '2025-09-23T22:40:00.123456789Z container message'
        },
        'application': {
            'name': 'Application',
            'description': 'Generic application logs',
            'example': '2025-09-23 22:40:00 INFO [component] message'
        },
        'generic': {
            'name': 'Generic',
            'description': 'Generic text logs',
            'example': 'Any text-based log format'
        }
    }
    
    return jsonify({'formats': formats}), 200

