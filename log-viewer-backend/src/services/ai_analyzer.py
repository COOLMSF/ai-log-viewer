import os
import json
from typing import Dict, List, Optional
from openai import OpenAI
from datetime import datetime

class AIAnalyzer:
    def __init__(self):
        # DeepSeek API configuration
        self.client = OpenAI(
            api_key=os.getenv('DEEPSEEK_API_KEY', 'sk-placeholder'),  # User should set this
            base_url="https://api.deepseek.com/v1"
        )
        self.model = "deepseek-chat"
        
    def analyze_logs(self, log_text: str, context: Dict = None) -> Dict:
        """
        Analyze log text using DeepSeek AI and return insights
        
        Args:
            log_text: The log text to analyze
            context: Additional context like file type, timestamp range, etc.
            
        Returns:
            Dictionary containing analysis results
        """
        try:
            # Prepare the analysis prompt
            system_prompt = self._get_system_prompt()
            user_prompt = self._build_user_prompt(log_text, context)
            
            # Call DeepSeek API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            
            # Parse the response
            analysis_text = response.choices[0].message.content
            
            # Try to parse as JSON if possible, otherwise return as text
            try:
                analysis_data = json.loads(analysis_text)
            except json.JSONDecodeError:
                analysis_data = {
                    "summary": analysis_text,
                    "issues": [],
                    "recommendations": [],
                    "severity": "info"
                }
            
            return {
                "success": True,
                "analysis": analysis_data,
                "timestamp": datetime.utcnow().isoformat(),
                "model": self.model,
                "token_usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def _get_system_prompt(self) -> str:
        """Get the system prompt for log analysis"""
        return """You are an expert system administrator and log analysis specialist. Your task is to analyze log entries and provide actionable insights.

When analyzing logs, focus on:
1. Identifying errors, warnings, and critical issues
2. Detecting patterns that might indicate problems
3. Security concerns or suspicious activities
4. Performance issues or bottlenecks
5. Configuration problems
6. Network connectivity issues
7. Resource utilization problems

Provide your analysis in the following JSON format:
{
    "summary": "Brief overview of the log analysis",
    "severity": "critical|high|medium|low|info",
    "issues": [
        {
            "type": "error|warning|security|performance|configuration",
            "description": "Description of the issue",
            "line_numbers": [1, 2, 3],
            "severity": "critical|high|medium|low",
            "recommendation": "Specific action to take"
        }
    ],
    "patterns": [
        {
            "description": "Pattern observed in the logs",
            "frequency": "Number or description of frequency",
            "significance": "Why this pattern is important"
        }
    ],
    "recommendations": [
        "Specific actionable recommendations based on the analysis"
    ],
    "key_metrics": {
        "error_count": 0,
        "warning_count": 0,
        "unique_sources": [],
        "time_range": "Description of time range if applicable"
    }
}

Be concise but thorough. Focus on actionable insights rather than just describing what's in the logs."""

    def _build_user_prompt(self, log_text: str, context: Dict = None) -> str:
        """Build the user prompt with log text and context"""
        prompt = f"Please analyze the following log entries:\n\n{log_text}\n\n"
        
        if context:
            prompt += "Additional context:\n"
            if context.get('file_type'):
                prompt += f"- Log type: {context['file_type']}\n"
            if context.get('file_name'):
                prompt += f"- File name: {context['file_name']}\n"
            if context.get('time_range'):
                prompt += f"- Time range: {context['time_range']}\n"
            if context.get('total_lines'):
                prompt += f"- Total lines in file: {context['total_lines']}\n"
            prompt += "\n"
        
        prompt += "Provide a comprehensive analysis focusing on potential issues, security concerns, and actionable recommendations."
        
        return prompt

    def analyze_specific_issue(self, log_text: str, issue_description: str) -> Dict:
        """
        Analyze logs for a specific issue or question
        
        Args:
            log_text: The log text to analyze
            issue_description: Specific issue or question to investigate
            
        Returns:
            Dictionary containing targeted analysis results
        """
        try:
            system_prompt = """You are an expert system administrator. Analyze the provided logs to answer a specific question or investigate a particular issue. Provide a focused, actionable response."""
            
            user_prompt = f"""Please analyze these logs to investigate the following issue:

ISSUE/QUESTION: {issue_description}

LOG ENTRIES:
{log_text}

Provide a focused analysis addressing the specific issue. Include:
1. Whether the issue is present in the logs
2. Relevant log entries that relate to the issue
3. Root cause analysis if applicable
4. Specific recommendations to resolve or investigate further
5. Any related patterns or concerns

Format your response as clear, actionable text."""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.2,
                max_tokens=1500
            )
            
            return {
                "success": True,
                "analysis": response.choices[0].message.content,
                "issue": issue_description,
                "timestamp": datetime.utcnow().isoformat(),
                "model": self.model
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }

    def get_analysis_suggestions(self, log_entries: List[Dict]) -> List[str]:
        """
        Generate analysis suggestions based on log entries
        
        Args:
            log_entries: List of parsed log entries
            
        Returns:
            List of suggested analysis questions
        """
        suggestions = []
        
        # Analyze log levels
        error_count = sum(1 for entry in log_entries if entry.get('level') in ['ERROR', 'FATAL', 'CRITICAL'])
        warning_count = sum(1 for entry in log_entries if entry.get('level') in ['WARN', 'WARNING'])
        
        if error_count > 0:
            suggestions.append(f"Investigate {error_count} error(s) found in the logs")
        
        if warning_count > 0:
            suggestions.append(f"Review {warning_count} warning(s) for potential issues")
        
        # Analyze sources/components
        sources = set(entry.get('source', '') for entry in log_entries if entry.get('source'))
        if len(sources) > 1:
            suggestions.append(f"Analyze interactions between {len(sources)} different components")
        
        # Look for common patterns
        messages = [entry.get('message', '') for entry in log_entries]
        
        # Check for authentication issues
        auth_keywords = ['authentication', 'login', 'password', 'unauthorized', 'forbidden']
        if any(keyword in ' '.join(messages).lower() for keyword in auth_keywords):
            suggestions.append("Investigate authentication and access control issues")
        
        # Check for network issues
        network_keywords = ['connection', 'timeout', 'network', 'dns', 'socket']
        if any(keyword in ' '.join(messages).lower() for keyword in network_keywords):
            suggestions.append("Analyze network connectivity and communication issues")
        
        # Check for performance issues
        perf_keywords = ['slow', 'timeout', 'memory', 'cpu', 'performance', 'latency']
        if any(keyword in ' '.join(messages).lower() for keyword in perf_keywords):
            suggestions.append("Review performance and resource utilization issues")
        
        # Default suggestions if none specific found
        if not suggestions:
            suggestions = [
                "Analyze overall system health and stability",
                "Look for recurring patterns or anomalies",
                "Review system configuration and setup issues"
            ]
        
        return suggestions[:5]  # Return top 5 suggestions

