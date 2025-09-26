import { useState, useEffect } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { ScrollArea } from '@/components/ui/scroll-area.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Search, Filter, ChevronLeft, ChevronRight, Eye, Zap } from 'lucide-react'

const LogViewer = ({ selectedFile, onAnalyzeRequest }) => {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [selectedText, setSelectedText] = useState('')
  const [viewMode, setViewMode] = useState('parsed') // 'parsed' or 'raw'

  const API_BASE = '/api/logs'

  // Load log entries
  const loadEntries = async (page = 1, search = '', level = 'all') => {
    if (!selectedFile) return

    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '50'
      })

      const response = await fetch(`${API_BASE}/files/${selectedFile.id}/entries?${params}`)
      if (response.ok) {
        const data = await response.json()
        let filteredEntries = data.entries

        // Apply search filter
        if (search) {
          filteredEntries = filteredEntries.filter(entry =>
            entry.raw_line.toLowerCase().includes(search.toLowerCase()) ||
            (entry.message && entry.message.toLowerCase().includes(search.toLowerCase()))
          )
        }

        // Apply level filter
        if (level !== 'all') {
          filteredEntries = filteredEntries.filter(entry =>
            entry.level && entry.level.toLowerCase() === level.toLowerCase()
          )
        }

        setEntries(filteredEntries)
        setPagination(data.pagination)
      } else {
        setError('Failed to load log entries')
      }
    } catch (err) {
      setError('Failed to load log entries: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedFile) {
      loadEntries(currentPage, searchTerm, levelFilter)
    }
  }, [selectedFile, currentPage])

  const handleSearch = () => {
    setCurrentPage(1)
    loadEntries(1, searchTerm, levelFilter)
  }

  const handleFilterChange = (newLevel) => {
    setLevelFilter(newLevel)
    setCurrentPage(1)
    loadEntries(1, searchTerm, newLevel)
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleString()
  }

  const getLevelColor = (level) => {
    if (!level) return 'bg-gray-100 text-gray-800'
    
    const colors = {
      ERROR: 'bg-red-100 text-red-800',
      FATAL: 'bg-red-100 text-red-800',
      CRITICAL: 'bg-red-100 text-red-800',
      WARN: 'bg-yellow-100 text-yellow-800',
      WARNING: 'bg-yellow-100 text-yellow-800',
      INFO: 'bg-blue-100 text-blue-800',
      DEBUG: 'bg-green-100 text-green-800',
      TRACE: 'bg-gray-100 text-gray-800'
    }
    return colors[level.toUpperCase()] || 'bg-gray-100 text-gray-800'
  }

  const handleTextSelection = () => {
    const selection = window.getSelection()
    const text = selection.toString().trim()
    if (text && text.length > 10) {
      setSelectedText(text)
    }
  }

  const handleAnalyze = () => {
    if (selectedText && onAnalyzeRequest) {
      onAnalyzeRequest(selectedText)
    }
  }

  const renderLogEntry = (entry) => {
    if (viewMode === 'raw') {
      return (
        <SyntaxHighlighter
          language="log"
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: '8px',
            fontSize: '13px',
            lineHeight: '1.4'
          }}
          wrapLines={true}
          showLineNumbers={true}
          startingLineNumber={entry.line_number}
        >
          {entry.raw_line}
        </SyntaxHighlighter>
      )
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-muted-foreground">#{entry.line_number}</span>
          {entry.timestamp && (
            <span className="text-muted-foreground">{formatTimestamp(entry.timestamp)}</span>
          )}
          {entry.level && (
            <Badge className={getLevelColor(entry.level)} variant="secondary">
              {entry.level}
            </Badge>
          )}
          {entry.source && (
            <Badge variant="outline">{entry.source}</Badge>
          )}
        </div>
        <div className="font-mono text-sm bg-muted/30 p-2 rounded">
          {entry.message || entry.raw_line}
        </div>
      </div>
    )
  }

  if (!selectedFile) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <Eye className="mx-auto h-12 w-12 mb-4" />
            <p>未选择文件</p>
            <p className="text-sm">上传并选择文件以查看其内容</p>
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
            <CardTitle>{selectedFile.original_filename}</CardTitle>
            <CardDescription>
              {selectedFile.file_size} 字节 • {selectedFile.log_type} • {formatTimestamp(selectedFile.upload_time)}
              {selectedFile.processed && <span className="ml-2 text-green-600">• 已处理</span>}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={viewMode} onValueChange={setViewMode}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="parsed">解析</SelectItem>
                <SelectItem value="raw">原始</SelectItem>
              </SelectContent>
            </Select>
            {selectedText && (
              <Button onClick={handleAnalyze} size="sm" className="bg-purple-600 hover:bg-purple-700">
                <Zap className="h-4 w-4 mr-1" />
                分析
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex items-center space-x-2">
          <div className="flex-1 flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索日志..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} size="sm">搜索</Button>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={levelFilter} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有级别</SelectItem>
                <SelectItem value="error">错误</SelectItem>
                <SelectItem value="warning">警告</SelectItem>
                <SelectItem value="info">信息</SelectItem>
                <SelectItem value="debug">调试</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">正在加载条目...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center flex-1 text-destructive">
            <p>{error}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex items-center justify-center flex-1 text-muted-foreground">
            <p>未找到日志条目</p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1" onMouseUp={handleTextSelection}>
              <div className="space-y-4">
                {entries.map((entry) => (
                  <div key={entry.id} className="border-b pb-4 last:border-b-0">
                    {renderLogEntry(entry)}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  第 {pagination.page} 页，共 {pagination.pages} 页 ({pagination.total} 条目)
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    上一页
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage >= pagination.pages}
                  >
                    下一页
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default LogViewer

