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
            
            # Get the response - now it should be markdown text
            analysis_text = response.choices[0].message.content
            
            return {
                "success": True,
                "analysis": analysis_text,  # Return the markdown text directly
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
        return """You are a senior operations (运维) and development (研发) expert. Analyze the provided log text and return your analysis in Chinese in Markdown format. Focus only on useful information and avoid unnecessary output.

When analyzing logs, focus on:
1. Identifying errors, warnings, and critical issues
2. Detecting patterns that might indicate problems
3. Security concerns or suspicious activities
4. Performance issues or bottlenecks
5. Configuration problems
6. Network connectivity issues
7. Resource utilization problems

Provide your analysis in Markdown format with the following structure:
# 分析摘要
[Provide a brief overview of the log analysis in a paragraph or two]

## 严重程度
[critical|high|medium|low|info]

## 发现问题
For each issue found:
### [Issue Type]
- **描述**: [Issue description]
- **严重程度**: [critical|high|medium|low]
- **建议**: [Specific action to take]

## 检测到的模式
For each pattern detected:
### [Pattern description]
- **频率**: [Number or description of frequency]
- **重要性**: [Why this pattern is important]

## 建议
- [Specific actionable recommendation 1]
- [Specific actionable recommendation 2]
- [Specific actionable recommendation 3]

## 关键指标
- **错误数量**: [Number of errors]
- **警告数量**: [Number of warnings]
- **来源数量**: [Number of unique sources]
- **时间范围**: [Description of time range if applicable]

回答必须使用中文，并以Markdown格式返回，不要使用JSON格式。专注于可操作的见解，而不是仅仅描述日志中的内容。仅输出最有用的信息，格式要清晰美观。"""

    def _build_user_prompt(self, log_text: str, context: Dict = None) -> str:
        """Build the user prompt with log text and context"""
        prompt = f"请分析以下日志条目并以中文Markdown格式返回分析结果。只关注有用信息，避免不必要的输出。\n\n{log_text}\n\n"
        
        if context:
            prompt += "附加上下文:\n"
            if context.get('file_type'):
                prompt += f"- 日志类型: {context['file_type']}\n"
            if context.get('file_name'):
                prompt += f"- 文件名: {context['file_name']}\n"
            if context.get('time_range'):
                prompt += f"- 时间范围: {context['time_range']}\n"
            if context.get('total_lines'):
                prompt += f"- 文件总行数: {context['total_lines']}\n"
            prompt += "\n"
        
        prompt += "请以中文Markdown格式提供全面的分析，重点关注潜在问题、安全问题和可操作的建议。只输出有用信息，格式要清晰美观。"
        
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
            system_prompt = """You are a senior operations (运维) and development (研发) expert. Analyze the provided logs to answer a specific question or investigate a particular issue. Provide a focused, actionable response in Chinese in Markdown format. Focus only on useful information and avoid unnecessary output. Do not return results in JSON format."""
            
            user_prompt = f"""请分析这些日志以调查以下问题：

问题/问题: {issue_description}

日志条目：
{log_text}

请在中文中提供针对特定问题的集中分析。包括：
1. 问题是否存在于日志中
2. 与问题相关的日志条目
3. 如有需要，进行根本原因分析
4. 解决或进一步调查的具体建议
5. 任何相关的模式或关切

以中文Markdown格式清晰、可操作地格式化您的响应。不要使用JSON格式。只关注有用信息，避免不必要的输出。格式要清晰美观。"""

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

