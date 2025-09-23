import re
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from dateutil import parser as date_parser

class LogEntry:
    def __init__(self, line_number: int, raw_line: str):
        self.line_number = line_number
        self.raw_line = raw_line.strip()
        self.timestamp = None
        self.level = None
        self.source = None
        self.message = ""
        self.highlights = []  # List of (start, end, type) tuples for highlighting
        
    def to_dict(self):
        return {
            'line_number': self.line_number,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'level': self.level,
            'source': self.source,
            'message': self.message,
            'raw_line': self.raw_line,
            'highlights': self.highlights
        }

class LogParser:
    def __init__(self):
        self.log_levels = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'WARNING', 'ERROR', 'FATAL', 'CRITICAL']
        
        # Common timestamp patterns
        self.timestamp_patterns = [
            # ISO format: 2025-09-23 22:40:00
            r'(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\.\d+)?)',
            # Syslog format: Sep 23 22:40:00
            r'([A-Za-z]{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})',
            # Apache format: [23/Sep/2025:22:40:00 +0000]
            r'\[(\d{2}/[A-Za-z]{3}/\d{4}:\d{2}:\d{2}:\d{2}\s+[+-]\d{4})\]',
            # Kubernetes format: 2025-09-23T22:40:00.123456Z
            r'(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)',
            # MySQL format: 2025-09-23 22:40:00
            r'(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})',
        ]
        
        # Log level patterns
        self.level_patterns = [
            r'\b(TRACE|DEBUG|INFO|WARN|WARNING|ERROR|FATAL|CRITICAL)\b',
            r'\[(TRACE|DEBUG|INFO|WARN|WARNING|ERROR|FATAL|CRITICAL)\]',
            r'<(TRACE|DEBUG|INFO|WARN|WARNING|ERROR|FATAL|CRITICAL)>',
        ]
        
        # Source/component patterns
        self.source_patterns = [
            r'\[([^\]]+)\]',  # [component]
            r'<([^>]+)>',     # <component>
            r'(\w+):',        # component:
        ]

    def detect_log_format(self, lines: List[str]) -> str:
        """Detect the log format based on content analysis"""
        sample_lines = lines[:min(10, len(lines))]
        
        format_scores = {
            'syslog': 0,
            'dmesg': 0,
            'kubernetes': 0,
            'mysql': 0,
            'nginx': 0,
            'apache': 0,
            'docker': 0,
            'application': 0,
            'generic': 0
        }
        
        for line in sample_lines:
            line_lower = line.lower()
            
            # Syslog patterns
            if re.search(r'[A-Za-z]{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}', line):
                format_scores['syslog'] += 2
            
            # Dmesg patterns
            if re.search(r'\[\s*\d+\.\d+\]', line) or 'kernel:' in line_lower:
                format_scores['dmesg'] += 3
            
            # Kubernetes patterns
            if re.search(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}', line):
                format_scores['kubernetes'] += 2
            if any(k8s_term in line_lower for k8s_term in ['pod/', 'namespace/', 'kubectl', 'kubelet']):
                format_scores['kubernetes'] += 2
            
            # MySQL patterns
            if re.search(r'\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}', line):
                format_scores['mysql'] += 1
            if any(mysql_term in line_lower for mysql_term in ['mysql', 'innodb', 'query', 'connection']):
                format_scores['mysql'] += 2
            
            # Nginx patterns
            if any(nginx_term in line_lower for nginx_term in ['nginx', 'access.log', 'error.log']):
                format_scores['nginx'] += 3
            if re.search(r'\d+\.\d+\.\d+\.\d+', line):  # IP addresses
                format_scores['nginx'] += 1
            
            # Apache patterns
            if any(apache_term in line_lower for apache_term in ['apache', 'httpd']):
                format_scores['apache'] += 3
            if re.search(r'\[.*?\].*?".*?"', line):  # Apache log format
                format_scores['apache'] += 2
            
            # Docker patterns
            if any(docker_term in line_lower for docker_term in ['docker', 'container']):
                format_scores['docker'] += 3
            
            # Application log patterns
            if any(level in line.upper() for level in self.log_levels):
                format_scores['application'] += 1
            
            # Generic fallback
            format_scores['generic'] += 1
        
        # Return the format with the highest score
        detected_format = max(format_scores, key=format_scores.get)
        return detected_format if format_scores[detected_format] > 0 else 'generic'

    def parse_timestamp(self, line: str) -> Optional[datetime]:
        """Extract timestamp from log line"""
        for pattern in self.timestamp_patterns:
            match = re.search(pattern, line)
            if match:
                timestamp_str = match.group(1)
                try:
                    # Try to parse with dateutil (handles many formats)
                    return date_parser.parse(timestamp_str, fuzzy=True)
                except:
                    continue
        return None

    def parse_level(self, line: str) -> Optional[str]:
        """Extract log level from log line"""
        for pattern in self.level_patterns:
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                return match.group(1).upper()
        return None

    def parse_source(self, line: str) -> Optional[str]:
        """Extract source/component from log line"""
        for pattern in self.source_patterns:
            match = re.search(pattern, line)
            if match:
                source = match.group(1)
                # Filter out common non-source patterns
                if source not in self.log_levels and len(source) > 1:
                    return source
        return None

    def generate_highlights(self, entry: LogEntry) -> List[Tuple[int, int, str]]:
        """Generate syntax highlighting information for a log entry"""
        highlights = []
        line = entry.raw_line
        
        # Highlight timestamps
        for pattern in self.timestamp_patterns:
            for match in re.finditer(pattern, line):
                highlights.append((match.start(), match.end(), 'timestamp'))
        
        # Highlight log levels
        for pattern in self.level_patterns:
            for match in re.finditer(pattern, line, re.IGNORECASE):
                level = match.group(1).upper()
                level_type = self.get_level_type(level)
                highlights.append((match.start(), match.end(), level_type))
        
        # Highlight IP addresses
        ip_pattern = r'\b(?:\d{1,3}\.){3}\d{1,3}\b'
        for match in re.finditer(ip_pattern, line):
            highlights.append((match.start(), match.end(), 'ip'))
        
        # Highlight URLs
        url_pattern = r'https?://[^\s]+'
        for match in re.finditer(url_pattern, line):
            highlights.append((match.start(), match.end(), 'url'))
        
        # Highlight file paths
        path_pattern = r'(?:/[^\s]*)+\.[a-zA-Z0-9]+'
        for match in re.finditer(path_pattern, line):
            highlights.append((match.start(), match.end(), 'path'))
        
        # Highlight numbers
        number_pattern = r'\b\d+(?:\.\d+)?\b'
        for match in re.finditer(number_pattern, line):
            # Skip if already highlighted (e.g., in timestamp or IP)
            if not any(h[0] <= match.start() < h[1] for h in highlights):
                highlights.append((match.start(), match.end(), 'number'))
        
        # Highlight quoted strings
        quote_pattern = r'"[^"]*"'
        for match in re.finditer(quote_pattern, line):
            highlights.append((match.start(), match.end(), 'string'))
        
        return highlights

    def get_level_type(self, level: str) -> str:
        """Get the highlight type for a log level"""
        level = level.upper()
        if level in ['ERROR', 'FATAL', 'CRITICAL']:
            return 'error'
        elif level in ['WARN', 'WARNING']:
            return 'warning'
        elif level in ['INFO']:
            return 'info'
        elif level in ['DEBUG', 'TRACE']:
            return 'debug'
        else:
            return 'level'

    def parse_line(self, line_number: int, raw_line: str, log_format: str = 'generic') -> LogEntry:
        """Parse a single log line"""
        entry = LogEntry(line_number, raw_line)
        
        # Extract timestamp
        entry.timestamp = self.parse_timestamp(raw_line)
        
        # Extract log level
        entry.level = self.parse_level(raw_line)
        
        # Extract source/component
        entry.source = self.parse_source(raw_line)
        
        # Extract message (everything after structured parts)
        message = raw_line
        if entry.timestamp:
            # Remove timestamp from message
            for pattern in self.timestamp_patterns:
                message = re.sub(pattern, '', message, count=1)
        
        if entry.level:
            # Remove level from message
            for pattern in self.level_patterns:
                message = re.sub(pattern, '', message, count=1, flags=re.IGNORECASE)
        
        entry.message = message.strip()
        
        # Generate highlights
        entry.highlights = self.generate_highlights(entry)
        
        return entry

    def parse_logs(self, content: str, log_format: str = None) -> Tuple[List[LogEntry], str]:
        """Parse log content and return structured entries"""
        lines = content.split('\n')
        
        # Detect format if not provided
        if not log_format:
            log_format = self.detect_log_format(lines)
        
        entries = []
        for i, line in enumerate(lines, 1):
            if line.strip():  # Skip empty lines
                entry = self.parse_line(i, line, log_format)
                entries.append(entry)
        
        return entries, log_format

