import { useState, useEffect } from 'react'
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
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          file_id: fileId,
          issue_description: issueDescription
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
        <div className="space-y-4">
          <Alert>
            <Brain className="h-4 w-4" />
            <AlertDescription>
              <strong>Demo Mode:</strong> {analysis.demo_analysis.summary}
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h4 className="font-semibold flex items-center">
              <Lightbulb className="h-4 w-4 mr-2" />
              Configuration Required
            </h4>
            {analysis.demo_analysis.recommendations.map((rec, index) => (
              <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (!analysis.success) {
      return (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Analysis failed: {analysis.error}
          </AlertDescription>
        </Alert>
      )
    }

    const result = analysis.analysis

    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className="p-4 bg-muted/30 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center">
            <Brain className="h-4 w-4 mr-2" />
            Analysis Summary
          </h4>
          <p className="text-sm">{typeof result === 'string' ? result : result.summary}</p>
          {result.severity && (
            <Badge className={`mt-2 ${getSeverityColor(result.severity)}`}>
              {result.severity.toUpperCase()}
            </Badge>
          )}
        </div>

        {/* Issues */}
        {result.issues && result.issues.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Issues Found ({result.issues.length})
            </h4>
            {result.issues.map((issue, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getIssueIcon(issue.type)}
                    <span className="font-medium text-sm">{issue.type}</span>
                  </div>
                  <Badge className={getSeverityColor(issue.severity)} variant="outline">
                    {issue.severity}
                  </Badge>
                </div>
                <p className="text-sm mb-2">{issue.description}</p>
                {issue.recommendation && (
                  <div className="p-2 bg-blue-50 rounded text-sm">
                    <strong>Recommendation:</strong> {issue.recommendation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {result.recommendations && result.recommendations.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Recommendations
            </h4>
            {result.recommendations.map((rec, index) => (
              <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm">{rec}</p>
              </div>
            ))}
          </div>
        )}

        {/* Patterns */}
        {result.patterns && result.patterns.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Patterns Detected
            </h4>
            {result.patterns.map((pattern, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <p className="text-sm font-medium">{pattern.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Frequency: {pattern.frequency} | {pattern.significance}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Metrics */}
        {result.key_metrics && (
          <div className="p-3 bg-muted/20 rounded-lg">
            <h4 className="font-semibold mb-2">Key Metrics</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {result.key_metrics.error_count !== undefined && (
                <div>Errors: {result.key_metrics.error_count}</div>
              )}
              {result.key_metrics.warning_count !== undefined && (
                <div>Warnings: {result.key_metrics.warning_count}</div>
              )}
              {result.key_metrics.unique_sources && (
                <div>Sources: {result.key_metrics.unique_sources.length}</div>
              )}
              {result.key_metrics.time_range && (
                <div>Time Range: {result.key_metrics.time_range}</div>
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
            <p>Select log text to analyze</p>
            <p className="text-sm">Highlight text in the log viewer to get AI insights</p>
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
              AI Analysis
            </CardTitle>
            <CardDescription>
              {config?.configured ? 'Powered by DeepSeek AI' : 'Demo Mode - Configure API key for full functionality'}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Selected Text */}
        <div className="p-3 bg-muted/30 rounded-lg">
          <h4 className="font-semibold mb-2 text-sm">Selected Text ({selectedText.length} chars)</h4>
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
            Analyze
          </Button>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center">
              <Lightbulb className="h-4 w-4 mr-2" />
              Suggested Analysis
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
          <h4 className="font-semibold text-sm">Ask Specific Question</h4>
          <Textarea
            placeholder="e.g., Why are there authentication failures? What caused the database errors?"
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
            Ask AI
          </Button>
        </div>

        <Separator />

        {/* Analysis Results */}
        <ScrollArea className="flex-1">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Analyzing...</p>
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

