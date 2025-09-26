from flask import Blueprint, request, jsonify
from src.models.log import db, LogFile, LogEntry, AnalysisResult
from src.services.ai_analyzer import AIAnalyzer
import os

analysis_bp = Blueprint('analysis', __name__)

@analysis_bp.route('/analyze', methods=['POST'])
def analyze_text():
    """Analyze selected log text using AI"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        file_id = data.get('file_id')
        issue_description = data.get('issue_description', '')
        
        if not text:
            return jsonify({'error': 'No text provided for analysis'}), 400
        
        # Check if DeepSeek API key is configured
        if not os.getenv('DEEPSEEK_API_KEY'):
            return jsonify({
                'error': 'DeepSeek API key not configured. Please set DEEPSEEK_API_KEY environment variable.',
                'demo_mode': True,
                'demo_analysis': {
                    "summary": "Demo Analysis: This is a demonstration of the AI analysis feature. To use real AI analysis, configure your DeepSeek API key.",
                    "severity": "info",
                    "issues": [
                        {
                            "type": "configuration",
                            "description": "DeepSeek API key not configured",
                            "severity": "medium",
                            "recommendation": "Set the DEEPSEEK API_KEY environment variable to enable AI analysis"
                        }
                    ],
                    "recommendations": [
                        "Configure DeepSeek API key to enable real-time log analysis",
                        "Review the selected log entries manually for potential issues"
                    ]
                }
            }), 200
        
        # Get file context if file_id provided
        context = {}
        if file_id:
            log_file = LogFile.query.get(file_id)
            if log_file:
                context = {
                    'file_type': log_file.log_type,
                    'file_name': log_file.original_filename,
                    'total_lines': len(log_file.entries)
                }
        
        # Initialize AI analyzer
        analyzer = AIAnalyzer()
        
        # Perform analysis
        if issue_description:
            result = analyzer.analyze_specific_issue(text, issue_description)
        else:
            result = analyzer.analyze_logs(text, context)
        
        # Store analysis result in database
        if result.get('success') and file_id:
            analysis_record = AnalysisResult(
                log_file_id=file_id,
                selected_text=text[:1000],  # Store first 1000 chars
                analysis=str(result.get('analysis', {}))  # Convert to string to match Text field
            )
            db.session.add(analysis_record)
            db.session.commit()
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analysis_bp.route('/suggestions/<int:file_id>', methods=['GET'])
def get_analysis_suggestions(file_id):
    """Get AI analysis suggestions for a log file"""
    try:
        log_file = LogFile.query.get_or_404(file_id)
        
        # Get sample of log entries
        entries = LogEntry.query.filter_by(log_file_id=file_id).limit(50).all()
        
        if not entries:
            return jsonify({'suggestions': ['No log entries found for analysis']}), 200
        
        # Convert entries to dict format
        entry_dicts = []
        for entry in entries:
            entry_dicts.append({
                'level': entry.level,
                'source': entry.source,
                'message': entry.message,
                'timestamp': entry.timestamp.isoformat() if entry.timestamp else None
            })
        
        # Generate suggestions
        analyzer = AIAnalyzer()
        suggestions = analyzer.get_analysis_suggestions(entry_dicts)
        
        return jsonify({
            'suggestions': suggestions,
            'file': log_file.to_dict(),
            'sample_entries': len(entry_dicts)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analysis_bp.route('/history/<int:file_id>', methods=['GET'])
def get_analysis_history(file_id):
    """Get analysis history for a log file"""
    try:
        log_file = LogFile.query.get_or_404(file_id)
        
        # Get analysis history
        analyses = AnalysisResult.query.filter_by(log_file_id=file_id)\
                                     .order_by(AnalysisResult.created_at.desc())\
                                     .limit(10).all()
        
        history = []
        for analysis in analyses:
            history.append({
                'id': analysis.id,
                'selected_text': analysis.selected_text[:100] + '...' if len(analysis.selected_text) > 100 else analysis.selected_text,
                'analysis_summary': analysis.analysis[:200] + '...' if len(analysis.analysis) > 200 else analysis.analysis,
                'created_at': analysis.created_at.isoformat(),
            })
        
        return jsonify({
            'history': history,
            'file': log_file.to_dict(),
            'total_analyses': len(history)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analysis_bp.route('/config', methods=['GET'])
def get_analysis_config():
    """Get AI analysis configuration status"""
    try:
        has_api_key = bool(os.getenv('DEEPSEEK_API_KEY'))
        
        return jsonify({
            'configured': has_api_key,
            'provider': 'DeepSeek',
            'model': 'deepseek-chat',
            'features': {
                'general_analysis': True,
                'specific_issue_analysis': True,
                'analysis_suggestions': True,
                'analysis_history': True
            },
            'setup_instructions': {
                'step1': 'Get a DeepSeek API key from https://platform.deepseek.com/',
                'step2': 'Set the DEEPSEEK_API_KEY environment variable',
                'step3': 'Restart the application to apply the configuration'
            } if not has_api_key else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

