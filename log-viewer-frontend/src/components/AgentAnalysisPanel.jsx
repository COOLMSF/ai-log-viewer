import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { ScrollArea } from '@/components/ui/scroll-area.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { CalendarIcon, Clock, Search, Target, Zap, Brain, AlertTriangle, CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const AgentAnalysisPanel = ({ fileId, onClose }) => {
  const [symptoms, setSymptoms] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const API_BASE = '/api/analysis'

  const agentAnalyze = async () => {
    if (!fileId || !symptoms.trim()) return

    setLoading(true)
    setError('')
    setAnalysis(null)

    try {
      const response = await fetch(`${API_BASE}/agent-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          file_id: fileId,
          symptoms: symptoms.trim(),
          start_time: startTime || null,
          end_time: endTime || null
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAnalysis(data)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to analyze logs')
      }
    } catch (err) {
      setError('Failed to analyze logs: ' + err.message)
    } finally {
      setLoading(false)
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
                问题分析
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
            </div>
          </div>
        </div>

        {/* Relevant Log Entries */}
        {analysis.relevant_entries && analysis.relevant_entries.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-lg flex items-center">
              <Search className="h-5 w-5 mr-2 text-blue-500" />
              相关日志条目
            </h4>
            <div className="space-y-2">
              {analysis.relevant_entries.slice(0, 5).map((entry, index) => (
                <div key={index} className="p-3 bg-blue-50/60 rounded-lg border border-blue-200/50">
                  <div className="text-sm font-mono">
                    <span className="text-muted-foreground">{entry.timestamp || 'N/A'}</span> - 
                    <span className={`ml-2 ${entry.level === 'ERROR' ? 'text-red-600' : 
                      entry.level === 'WARN' ? 'text-yellow-600' : 
                      entry.level === 'INFO' ? 'text-green-600' : 
                      entry.level === 'DEBUG' ? 'text-gray-500' : 'text-foreground'}`}>
                      {entry.level || 'N/A'}
                    </span> - 
                    <span className="ml-2 text-foreground">{entry.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Issues */}
        {analysis.issues && analysis.issues.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-lg flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              识别的问题
            </h4>
            <div className="grid gap-4">
              {analysis.issues.map((issue, index) => (
                <div key={index} className="p-4 bg-card border rounded-xl hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="font-medium text-base">{issue.type}</span>
                    </div>
                    <Badge className={`${getSeverityColor(issue.severity)} px-3 py-1 text-sm font-medium`} variant="outline">
                      {issue.severity}
                    </Badge>
                  </div>
                  <p className="text-foreground mb-2">{issue.description}</p>
                  {issue.time && (
                    <p className="text-xs text-muted-foreground mb-2">时间: {issue.time}</p>
                  )}
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
        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-lg flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              建议措施
            </h4>
            <div className="grid gap-3">
              {analysis.recommendations.map((rec, index) => (
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

        {/* Root Cause Analysis */}
        {analysis.root_cause && (
          <div className="space-y-4">
            <h4 className="font-semibold text-lg flex items-center">
              <Target className="h-5 w-5 mr-2 text-purple-500" />
              根本原因分析
            </h4>
            <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200/50">
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
                  {analysis.root_cause}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        {analysis.timeline && (
          <div className="space-y-4">
            <h4 className="font-semibold text-lg flex items-center">
              <Clock className="h-5 w-5 mr-2 text-amber-500" />
              时间线
            </h4>
            <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/50">
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
                  {analysis.timeline}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {/* Metrics */}
        {analysis.key_metrics && (
          <div className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200/50 shadow-sm">
            <h4 className="font-semibold text-lg mb-3">关键指标</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {analysis.key_metrics.error_count !== undefined && (
                <div className="p-3 bg-destructive/10 rounded-lg text-center border border-destructive/20">
                  <div className="text-2xl font-bold text-destructive">{analysis.key_metrics.error_count}</div>
                  <div className="text-xs text-muted-foreground mt-1">相关错误</div>
                </div>
              )}
              {analysis.key_metrics.warning_count !== undefined && (
                <div className="p-3 bg-yellow-50/80 rounded-lg text-center border border-yellow-200/50">
                  <div className="text-2xl font-bold text-yellow-700">{analysis.key_metrics.warning_count}</div>
                  <div className="text-xs text-muted-foreground mt-1">相关警告</div>
                </div>
              )}
              {analysis.key_metrics.unique_sources && (
                <div className="p-3 bg-blue-50/80 rounded-lg text-center border border-blue-200/50">
                  <div className="text-2xl font-bold text-blue-700">{analysis.key_metrics.unique_sources.length}</div>
                  <div className="text-xs text-muted-foreground mt-1">来源</div>
                </div>
              )}
              {analysis.key_metrics.time_range && (
                <div className="p-3 bg-purple-50/80 rounded-lg text-center border border-purple-200/50">
                  <div className="text-sm font-medium text-purple-700 break-words">{analysis.key_metrics.time_range}</div>
                  <div className="text-xs text-muted-foreground mt-1">时间范围</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              智能代理分析
            </CardTitle>
            <CardDescription>
              基于故障现象和时间范围分析整个日志文件
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            关闭
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Input Form */}
        <div className="space-y-4">
          {/* Symptoms Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">故障现象描述</label>
            <Textarea
              placeholder="请详细描述故障现象、错误信息或问题症状..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Time Range Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                开始时间 (可选)
              </label>
              <Input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                结束时间 (可选)
              </label>
              <Input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          {/* Analyze Button */}
          <Button 
            onClick={agentAnalyze} 
            disabled={loading || !symptoms.trim()}
            className="w-full"
          >
            {loading ? (
              <Clock className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Target className="h-4 w-4 mr-2" />
            )}
            开始分析
          </Button>
        </div>

        <Separator />

        {/* Analysis Results */}
        <ScrollArea className="flex-1">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">正在分析日志...</p>
                <p className="text-xs text-muted-foreground">搜索与症状相关的信息</p>
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

export default AgentAnalysisPanel