import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { ScrollArea } from '@/components/ui/scroll-area.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { 
  Zap, 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Settings,
  Lightbulb,
  Target,
  TrendingUp
} from 'lucide-react'

const AIAnalysisPanel = ({ selectedText, fileId, onClose }) => {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [config, setConfig] = useState(null)
  const [customQuestion, setCustomQuestion] = useState('')
  const [suggestions, setSuggestions] = useState([])

  const API_BASE = '/api/analysis'

  // Load AI configuration
  useEffect(() => {
    loadConfig()
    if (fileId) {
      loadSuggestions()
    }
  }, [fileId])

  const loadConfig = async () => {
    try {
      const response = await fetch(`${API_BASE}/config`)
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
      }
    } catch (err) {
      console.error('Failed to load AI config:', err)
    }
  }

  const loadSuggestions = async () => {
    try {
      const response = await fetch(`${API_BASE}/suggestions/${fileId}`)
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (err) {
      console.error('Failed to load suggestions:', err)
    }
  }

  const analyzeText = async (text, issueDescription = '') => {
    if (!text) return

    setLoading(true)
    setError('')
    setAnalysis(null)

    try {
      // Construct a specific prompt that focuses on operations and development expertise
      const enhancedIssueDescription = `作为运维和研发专家，请分析以下日志文本，仅返回有用的中文分析结果，不要输出无用信息。如果提供了问题描述，请针对性分析：${issueDescription || '请分析这段日志的关键信息、异常、错误或重要事件。'}`;
      
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          file_id: fileId,
          issue_description: enhancedIssueDescription
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAnalysis(data)
      } else {
        setError('Failed to analyze text')
      }
    } catch (err) {
      setError('Failed to analyze text: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCustomAnalysis = () => {
    if (selectedText && customQuestion.trim()) {
      analyzeText(selectedText, customQuestion.trim())
      setCustomQuestion('')
    }
  }

  const handleSuggestionClick = (suggestion) => {
    if (selectedText) {
      analyzeText(selectedText, suggestion)
    }
  }

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200',
      info: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[severity] || colors.info
  }

  const getIssueIcon = (type) => {
    const icons = {
      error: <XCircle className="h-4 w-4" />,
      warning: <AlertTriangle className="h-4 w-4" />,
      security: <AlertTriangle className="h-4 w-4" />,
      performance: <TrendingUp className="h-4 w-4" />,
      configuration: <Settings className="h-4 w-4" />
    }
    return icons[type] || <AlertTriangle className="h-4 w-4" />
  }

  const renderAnalysisResult = () => {
    if (!analysis) return null

    if (analysis.demo_mode) {
      return (
        <div className="space-y-6">
          <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200/50 shadow-sm">
            <div className="flex items-start space-x-3">
              <Brain className="h-5 w-5 mt-0.5 text-amber-600 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-semibold text-lg mb-1">演示模式</div>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-xl font-semibold mt-5 mb-3" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-lg font-medium mt-4 mb-2" {...props} />,
                      h4: ({node, ...props}) => <h4 className="text-base font-medium mt-3 mb-2" {...props} />,
                      p: ({node, ...props}) => <p className="mb-3 leading-relaxed" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-2" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />,
                      li: ({node, ...props}) => <li className="ml-4" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                      em: ({node, ...props}) => <em className="italic" {...props} />,
                      code: ({node, ...props}) => <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props} />,
                      pre: ({node, ...props}) => <pre className="bg-muted p-3 rounded overflow-x-auto text-sm font-mono" {...props} />,
                    }}
                  >
                    {analysis.demo_analysis.summary}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (!analysis.success) {
      return (
        <div variant="destructive" className="p-5 rounded-xl shadow-sm bg-destructive/10 border border-destructive/20">
          <div className="flex items-start space-x-3">
            <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-destructive" />
            <div>
              <div className="font-semibold text-lg mb-1 text-destructive">分析失败</div>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-xl font-semibold mt-5 mb-3" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-lg font-medium mt-4 mb-2" {...props} />,
                    h4: ({node, ...props}) => <h4 className="text-base font-medium mt-3 mb-2" {...props} />,
                    p: ({node, ...props}) => <p className="mb-3 leading-relaxed" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-2" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />,
                    li: ({node, ...props}) => <li className="ml-4" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                    em: ({node, ...props}) => <em className="italic" {...props} />,
                    code: ({node, ...props}) => <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props} />,
                    pre: ({node, ...props}) => <pre className="bg-muted p-3 rounded overflow-x-auto text-sm font-mono" {...props} />,
                  }}
                >
                  {analysis.error}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )
    }

    const result = analysis.analysis

    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="p-5 bg-gradient-to-br from-muted/50 to-muted/20 rounded-xl border border-border/50 shadow-sm">
          <div className="flex items-start space-x-3">
            <div className="mt-0.5 flex-shrink-0">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-lg mb-3 flex items-center">
                分析摘要
              </h4>
              <div className="prose prose-sm max-w-none">
                {typeof result === 'string' ? (
                  <ReactMarkdown
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-xl font-semibold mt-5 mb-3" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-lg font-medium mt-4 mb-2" {...props} />,
                      h4: ({node, ...props}) => <h4 className="text-base font-medium mt-3 mb-2" {...props} />,
                      p: ({node, ...props}) => <p className="mb-3 leading-relaxed" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-2" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />,
                      li: ({node, ...props}) => <li className="ml-4" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                      em: ({node, ...props}) => <em className="italic" {...props} />,
                      code: ({node, ...props}) => <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props} />,
                      pre: ({node, ...props}) => <pre className="bg-muted p-3 rounded overflow-x-auto text-sm font-mono" {...props} />,
                    }}
                  >
                    {result}
                  </ReactMarkdown>
                ) : (
                  <p className="text-base leading-relaxed">{result.summary}</p>
                )}
              </div>
              {result.severity && (
                <div className="mt-3">
                  <Badge className={`${getSeverityColor(result.severity)} px-3 py-1 text-sm font-medium`}>
                    {result.severity.toUpperCase()}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Issues */}
        {result.issues && result.issues.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-lg flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              发现问题 ({result.issues.length})
            </h4>
            <div className="grid gap-4">
              {result.issues.map((issue, index) => (
                <div key={index} className="p-4 bg-card border rounded-xl hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getIssueIcon(issue.type)}
                      <span className="font-medium text-base">{issue.type}</span>
                    </div>
                    <Badge className={`${getSeverityColor(issue.severity)} px-3 py-1 text-sm font-medium`} variant="outline">
                      {issue.severity}
                    </Badge>
                  </div>
                  <p className="text-foreground mb-3">{issue.description}</p>
                  {issue.recommendation && (
                    <div className="p-3 bg-blue-50/80 rounded-lg border border-blue-200/50">
                      <p className="text-sm">
                        <span className="font-medium text-blue-700">建议: </span>
                        {issue.recommendation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {result.recommendations && result.recommendations.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-lg flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              建议
            </h4>
            <div className="grid gap-3">
              {result.recommendations.map((rec, index) => (
                <div key={index} className="p-4 bg-green-50/60 rounded-xl border border-green-200/50">
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5 flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-base">{rec}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Patterns */}
        {result.patterns && result.patterns.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-lg flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-purple-500" />
              检测到的模式
            </h4>
            <div className="grid gap-3">
              {result.patterns.map((pattern, index) => (
                <div key={index} className="p-4 bg-purple-50/60 rounded-xl border border-purple-200/50">
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5 flex-shrink-0">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{pattern.description}</p>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center">
                        <span className="mr-3">频率: {pattern.frequency}</span>
                        <span>{pattern.significance}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metrics */}
        {result.key_metrics && (
          <div className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200/50 shadow-sm">
            <h4 className="font-semibold text-lg mb-3">关键指标</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {result.key_metrics.error_count !== undefined && (
                <div className="p-3 bg-destructive/10 rounded-lg text-center border border-destructive/20">
                  <div className="text-2xl font-bold text-destructive">{result.key_metrics.error_count}</div>
                  <div className="text-xs text-muted-foreground mt-1">错误</div>
                </div>
              )}
              {result.key_metrics.warning_count !== undefined && (
                <div className="p-3 bg-yellow-50/80 rounded-lg text-center border border-yellow-200/50">
                  <div className="text-2xl font-bold text-yellow-700">{result.key_metrics.warning_count}</div>
                  <div className="text-xs text-muted-foreground mt-1">警告</div>
                </div>
              )}
              {result.key_metrics.unique_sources && (
                <div className="p-3 bg-blue-50/80 rounded-lg text-center border border-blue-200/50">
                  <div className="text-2xl font-bold text-blue-700">{result.key_metrics.unique_sources.length}</div>
                  <div className="text-xs text-muted-foreground mt-1">来源</div>
                </div>
              )}
              {result.key_metrics.time_range && (
                <div className="p-3 bg-purple-50/80 rounded-lg text-center border border-purple-200/50">
                  <div className="text-sm font-medium text-purple-700 break-words">{result.key_metrics.time_range}</div>
                  <div className="text-xs text-muted-foreground mt-1">时间范围</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!selectedText) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <Target className="mx-auto h-12 w-12 mb-4" />
            <p>选择日志文本进行分析</p>
            <p className="text-sm">在日志查看器中高亮文本以获取AI洞察</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              AI 分析
            </CardTitle>
            <CardDescription>
              {config?.configured ? '由DeepSeek AI驱动' : '演示模式 - 配置API密钥以获得完整功能'}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            关闭
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Selected Text */}
        <div className="p-3 bg-muted/30 rounded-lg">
          <h4 className="font-semibold mb-2 text-sm">选定文本 ({selectedText.length} 字符)</h4>
          <ScrollArea className="h-20">
            <p className="text-xs font-mono">{selectedText}</p>
          </ScrollArea>
        </div>

        {/* Quick Analysis */}
        <div className="flex space-x-2">
          <Button 
            onClick={() => analyzeText(selectedText)} 
            disabled={loading}
            className="flex-1"
          >
            {loading ? <Clock className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
            分析
          </Button>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center">
              <Lightbulb className="h-4 w-4 mr-2" />
              建议分析
            </h4>
            <div className="space-y-1">
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full text-left justify-start h-auto p-2"
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={loading}
                >
                  <span className="text-xs">{suggestion}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Question */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">提出具体问题</h4>
          <Textarea
            placeholder="例如，为什么出现身份验证失败？数据库错误的原因是什么？"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            className="min-h-[60px]"
          />
          <Button 
            onClick={handleCustomAnalysis}
            disabled={loading || !customQuestion.trim()}
            size="sm"
            variant="outline"
            className="w-full"
          >
            询问AI
          </Button>
        </div>

        <Separator />

        {/* Analysis Results */}
        <ScrollArea className="flex-1">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">分析中...</p>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {renderAnalysisResult()}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export default AIAnalysisPanel

