import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { ScrollArea } from '@/components/ui/scroll-area.jsx'
import { Upload, FileText, Trash2, Eye, Download, AlertCircle } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import LogViewer from './components/LogViewer.jsx'
import AIAnalysisPanel from './components/AIAnalysisPanel.jsx'
import './App.css'

const API_BASE = '/api/logs'

function App() {
  const [files, setFiles] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileContent, setFileContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [analysisText, setAnalysisText] = useState('')
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false)

  // Fetch uploaded files
  const fetchFiles = async () => {
    try {
      const response = await fetch(`${API_BASE}/files`)
      if (response.ok) {
        const data = await response.json()
        setFiles(data.files)
      }
    } catch (err) {
      setError('Failed to fetch files')
    }
  }

  // Upload file
  const uploadFile = async (file) => {
    setLoading(true)
    setError('')
    
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        await fetchFiles()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Upload failed')
      }
    } catch (err) {
      setError('Upload failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Load file content
  const loadFileContent = async (fileId) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/files/${fileId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedFile(data.file)
      }
    } catch (err) {
      setError('Failed to load file')
    } finally {
      setLoading(false)
    }
  }

  // Handle AI analysis request
  const handleAnalyzeRequest = (text) => {
    setAnalysisText(text)
    setShowAnalysisPanel(true)
  }

  // Delete file
  const deleteFile = async (fileId) => {
    try {
      const response = await fetch(`${API_BASE}/files/${fileId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        await fetchFiles()
        if (selectedFile && selectedFile.id === fileId) {
          setSelectedFile(null)
          setFileContent('')
        }
      }
    } catch (err) {
      setError('Failed to delete file')
    }
  }

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      acceptedFiles.forEach(uploadFile)
    },
    accept: {
      'text/*': ['.log', '.txt', '.out', '.err'],
      'application/json': ['.json']
    },
    maxSize: 100 * 1024 * 1024 // 100MB
  })

  useEffect(() => {
    fetchFiles()
  }, [])

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getLogTypeColor = (logType) => {
    const colors = {
      syslog: 'bg-blue-100 text-blue-800',
      dmesg: 'bg-green-100 text-green-800',
      kubernetes: 'bg-purple-100 text-purple-800',
      mysql: 'bg-orange-100 text-orange-800',
      nginx: 'bg-cyan-100 text-cyan-800',
      apache: 'bg-red-100 text-red-800',
      docker: 'bg-indigo-100 text-indigo-800',
      generic: 'bg-gray-100 text-gray-800'
    }
    return colors[logType] || colors.generic
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Log Viewer</h1>
            </div>
            <Badge variant="secondary">Advanced Log Analysis Tool</Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload & Manage</TabsTrigger>
            <TabsTrigger value="viewer">Log Viewer</TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            {/* Upload Area */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Log Files</CardTitle>
                <CardDescription>
                  Drag and drop log files or click to browse. Supports .log, .txt, .out, .err, and .json files up to 100MB.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  {isDragActive ? (
                    <p className="text-lg">Drop the files here...</p>
                  ) : (
                    <div>
                      <p className="text-lg mb-2">Drag & drop log files here, or click to select</p>
                      <p className="text-sm text-muted-foreground">
                        Supports: syslog, dmesg, Kubernetes, MySQL, Nginx, Apache, Docker logs
                      </p>
                    </div>
                  )}
                </div>
                
                {error && (
                  <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-destructive">{error}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Files List */}
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Files ({files.length})</CardTitle>
                <CardDescription>
                  Manage your uploaded log files
                </CardDescription>
              </CardHeader>
              <CardContent>
                {files.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="mx-auto h-12 w-12 mb-4" />
                    <p>No files uploaded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{file.original_filename}</p>
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <span>{formatFileSize(file.file_size)}</span>
                                <span>•</span>
                                <span>{new Date(file.upload_time).toLocaleString()}</span>
                                {file.log_type && (
                                  <>
                                    <span>•</span>
                                    <Badge className={getLogTypeColor(file.log_type)} variant="secondary">
                                      {file.log_type}
                                    </Badge>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadFileContent(file.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteFile(file.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Viewer Tab */}
          <TabsContent value="viewer">
            <div className={`grid gap-4 ${showAnalysisPanel ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <LogViewer 
                selectedFile={selectedFile} 
                onAnalyzeRequest={handleAnalyzeRequest}
              />
              {showAnalysisPanel && (
                <AIAnalysisPanel
                  selectedText={analysisText}
                  fileId={selectedFile?.id}
                  onClose={() => setShowAnalysisPanel(false)}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App

