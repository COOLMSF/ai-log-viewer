from src.models.user import db
from datetime import datetime
import os

class LogFile(db.Model):
    __tablename__ = 'log_files'
    
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    log_type = db.Column(db.String(50), nullable=True)  # syslog, dmesg, kubernetes, mysql, etc.
    upload_time = db.Column(db.DateTime, default=datetime.utcnow)
    processed = db.Column(db.Boolean, default=False)
    
    # Relationship to log entries
    entries = db.relationship('LogEntry', backref='log_file', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'original_filename': self.original_filename,
            'file_size': self.file_size,
            'log_type': self.log_type,
            'upload_time': self.upload_time.isoformat() if self.upload_time else None,
            'processed': self.processed,
            'entry_count': len(self.entries)
        }

class LogEntry(db.Model):
    __tablename__ = 'log_entries'
    
    id = db.Column(db.Integer, primary_key=True)
    log_file_id = db.Column(db.Integer, db.ForeignKey('log_files.id'), nullable=False)
    line_number = db.Column(db.Integer, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=True)
    level = db.Column(db.String(20), nullable=True)  # INFO, ERROR, WARNING, DEBUG, etc.
    source = db.Column(db.String(100), nullable=True)  # process name, service name, etc.
    message = db.Column(db.Text, nullable=False)
    raw_line = db.Column(db.Text, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'line_number': self.line_number,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'level': self.level,
            'source': self.source,
            'message': self.message,
            'raw_line': self.raw_line
        }

class AnalysisResult(db.Model):
    __tablename__ = 'analysis_results'
    
    id = db.Column(db.Integer, primary_key=True)
    log_file_id = db.Column(db.Integer, db.ForeignKey('log_files.id'), nullable=False)
    selected_text = db.Column(db.Text, nullable=False)
    analysis = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'log_file_id': self.log_file_id,
            'selected_text': self.selected_text,
            'analysis': self.analysis,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

