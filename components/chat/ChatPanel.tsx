'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { ChatMessage, CheckIn, Project, RoadmapMilestone } from '@/types'
import {
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  Bot,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  project: Project
  recentCheckins?: CheckIn[]
  initialMessages: ChatMessage[]
  onRoadmapUpdate: (roadmap: RoadmapMilestone[]) => void
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={cn('flex gap-2', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {!isUser && (
        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 mt-1">
          <Bot className="h-3 w-3 text-primary" />
        </div>
      )}
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-muted text-foreground rounded-tl-sm'
        )}
      >
        {message.content}
      </div>
    </div>
  )
}

const SUGGESTIONS = [
  'What should I focus on today?',
  'What are my biggest risks?',
  'Add a marketing milestone',
  'Update my roadmap timeline',
]

export function ChatPanel({ project, initialMessages, onRoadmapUpdate }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || loading) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      created_at: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          message: content.trim(),
          history: messages.slice(-10),
        }),
      })

      const data = await res.json()

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.text,
        created_at: new Date().toISOString(),
      }

      setMessages(prev => [...prev, assistantMsg])

      if (Array.isArray(data.roadmapUpdate) && data.roadmapUpdate.length > 0) {
        onRoadmapUpdate(data.roadmapUpdate)
      }
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        created_at: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
    }
  }, [loading, messages, project.id, onRoadmapUpdate])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          'fixed z-50 flex flex-col transition-all duration-300 ease-in-out',
          // Desktop: right side panel
          'md:top-0 md:right-0 md:h-screen md:border-l md:border-border/60 md:bg-background/95 md:backdrop-blur-md md:shadow-xl',
          open ? 'md:w-[380px]' : 'md:w-12',
          // Mobile: bottom sheet
          'max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:rounded-t-2xl max-md:border-t max-md:border-border/60 max-md:bg-background max-md:shadow-2xl',
          open ? 'max-md:h-[80vh]' : 'max-md:h-14',
        )}
      >
        {/* Toggle button (desktop) */}
        <button
          data-tour="chat"
          onClick={() => setOpen(!open)}
          className={cn(
            'hidden md:flex h-16 items-center justify-center border-b border-border/60 hover:bg-accent transition-colors',
            open ? 'px-4 justify-between' : 'px-0 justify-center',
          )}
        >
          {open ? (
            <>
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm font-semibold">Splynt AI</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </>
          ) : (
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            'md:hidden flex h-14 items-center gap-3 px-4 border-b border-border/60',
            !open && 'justify-center',
          )}
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
            <Bot className="h-3.5 w-3.5 text-primary" />
          </div>
          {open && <span className="text-sm font-semibold flex-1">Splynt AI</span>}
          {open && <ChevronRight className="h-4 w-4 text-muted-foreground rotate-90" />}
        </button>

        {/* Chat content — only visible when open */}
        {open && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Context pill */}
            <div className="px-3 py-2 border-b border-border/40">
              <div className="flex items-center gap-1.5 rounded-lg bg-primary/5 px-2.5 py-1.5">
                <Sparkles className="h-3 w-3 text-primary flex-shrink-0" />
                <p className="text-xs text-muted-foreground truncate">
                  Context: <span className="font-medium text-foreground">{project.name}</span>
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-2 gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                    <Bot className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Ask me anything</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      I know your idea, roadmap, and check-ins. I can update your roadmap too.
                    </p>
                  </div>
                  <div className="w-full space-y-1.5">
                    {SUGGESTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-left text-xs hover:bg-muted/50 hover:border-primary/30 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map(msg => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))}
                  {loading && (
                    <div className="flex gap-2">
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 mt-1">
                        <Bot className="h-3 w-3 text-primary" />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border/40 p-3">
              {messages.length > 0 && (
                <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1">
                  {SUGGESTIONS.slice(0, 2).map(s => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="flex-shrink-0 rounded-full border border-border/60 bg-background px-2.5 py-1 text-xs hover:bg-muted/50 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2 items-end">
                <Textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask anything or say 'update my roadmap'..."
                  className="min-h-10 max-h-32 resize-none text-sm py-2"
                  rows={1}
                />
                <Button
                  size="icon"
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  className="flex-shrink-0 h-9 w-9"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-1.5 text-center text-xs text-muted-foreground">
                Enter to send · Shift+Enter for newline
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
