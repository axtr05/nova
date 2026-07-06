"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarEvent, ChecklistItem, Priority } from "@/types";
import { attachmentService, AttachmentMetadata } from "@/services/storage/attachmentService";
import { useAuth } from "@/frontend/contexts/AuthContext";
import { toast } from "sonner";
import { 
  Trash2, 
  Clock, 
  AlignLeft, 
  Tag, 
  Calendar as CalendarIcon,
  CheckSquare,
  ListTodo,
  FileText,
  AlertCircle,
  Plus,
  X,
  CheckCircle2,
  Circle,
  Paperclip,
  Image as ImageIcon,
  Loader2,
  ExternalLink
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null; // Null means create new
  defaultStart?: string; // Preselected ISO start time
  onSave: (event: Omit<CalendarEvent, "id"> & { id?: string }) => void;
  onDelete?: (id: string) => void;
}

const COLORS = [
  { key: "violet", name: "Violet", bg: "bg-violet-500/20 text-violet-300 border-violet-500/30", dot: "bg-violet-400" },
  { key: "blue", name: "Blue", bg: "bg-blue-500/20 text-blue-300 border-blue-500/30", dot: "bg-blue-400" },
  { key: "emerald", name: "Emerald", bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", dot: "bg-emerald-400" },
  { key: "pink", name: "Pink", bg: "bg-pink-500/20 text-pink-300 border-pink-500/30", dot: "bg-pink-400" },
  { key: "amber", name: "Amber", bg: "bg-amber-500/20 text-amber-300 border-amber-500/30", dot: "bg-amber-400" },
];

export function EventModal({
  isOpen,
  onClose,
  event,
  defaultStart,
  onSave,
  onDelete,
}: EventModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  
  const [color, setColor] = useState("violet");
  const [priority, setPriority] = useState<Priority>("medium");
  const [completed, setCompleted] = useState(false);
  
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState("");

  const { user } = useAuth();
  const [draftEventId, setDraftEventId] = useState("");
  
  const [attachments, setAttachments] = useState<AttachmentMetadata[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Initialize fields when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle(event ? event.title : "");
      setDescription(event ? event.description || "" : "");
      setNotes(event ? event.notes || "" : "");
      
      const defaultDate = event ? parseISO(event.start) : (defaultStart ? parseISO(defaultStart) : new Date());
      setDate(format(defaultDate, "yyyy-MM-dd"));
      setStartTime(format(defaultDate, "HH:mm"));
      
      if (event) {
        setEndTime(format(parseISO(event.end), "HH:mm"));
      } else {
        const dEnd = new Date(defaultDate.getTime() + 60 * 60 * 1000);
        setEndTime(format(dEnd, "HH:mm"));
      }
      
      setColor(event ? event.color || "violet" : "violet");
      setPriority(event ? event.priority || "medium" : "medium");
      setCompleted(event ? !!event.completed : false);
      setTags(event && event.tags ? [...event.tags] : []);
      setChecklist(event && event.checklist ? [...event.checklist] : []);
      setAttachments(event && event.attachments ? [...event.attachments] : []);
      
      setDraftEventId(event?.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9)));
      
      setNewTag("");
      setNewChecklistText("");
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [isOpen, event, defaultStart]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const startISO = new Date(`${date}T${startTime}:00`).toISOString();
    const endISO = new Date(`${date}T${endTime}:00`).toISOString();

    onSave({
      id: event?.id,
      title,
      description,
      start: startISO,
      end: endISO,
      color,
      notes,
      checklist,
      priority,
      tags,
      completed,
      attachments,
    });
    onClose();
  };

  // Tag Handlers
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTag.trim()) {
      e.preventDefault();
      if (!tags.includes(newTag.trim().toLowerCase())) {
        setTags([...tags, newTag.trim().toLowerCase()]);
      }
      setNewTag("");
    }
  };
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Checklist Handlers
  const addChecklistItem = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ((e.type === "keydown" && (e as React.KeyboardEvent).key === "Enter") || e.type === "click") {
      e.preventDefault();
      if (newChecklistText.trim()) {
        const newItem: ChecklistItem = {
          id: Math.random().toString(36).substring(2, 9),
          text: newChecklistText.trim(),
          completed: false,
        };
        setChecklist([...checklist, newItem]);
        setNewChecklistText("");
      }
    }
  };
  
  const toggleChecklistItem = (id: string) => {
    setChecklist(checklist.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const removeChecklistItem = (id: string) => {
    setChecklist(checklist.filter(item => item.id !== id));
  };

  // Attachment Handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user) {
      toast.error("Upload Failed", { description: "You must be logged in to upload files." });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error("File Too Large", { description: "Attachments must be less than 5MB." });
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      const metadata = await attachmentService.uploadAttachment(
        user.uid,
        draftEventId,
        file,
        (progress) => setUploadProgress(progress)
      );

      setAttachments(prev => [...prev, metadata]);
      toast.success("File Uploaded");
    } catch (error: any) {
      toast.error("Upload Failed", { description: error.message || "An unknown error occurred." });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteAttachment = async (attachment: AttachmentMetadata) => {
    try {
      await attachmentService.deleteAttachment(attachment.storagePath);
      setAttachments(prev => prev.filter(a => a.id !== attachment.id));
      toast.success("Attachment Deleted");
    } catch (error: any) {
      toast.error("Delete Failed", { description: error.message || "Failed to remove attachment." });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto overflow-x-hidden glass-card text-slate-100 border-white/10 shadow-2xl p-6 rounded-2xl custom-scrollbar">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-gradient-nova animate-pulse" />
            {event ? "Workspace" : "New Workspace"}
            
            <div className="ml-auto flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCompleted(!completed)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  completed 
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                    : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
                }`}
              >
                {completed ? <CheckSquare className="h-3.5 w-3.5" /> : <ListTodo className="h-3.5 w-3.5" />}
                {completed ? "Completed" : "Mark Complete"}
              </button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Main Details */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="title" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Event Title</label>
              <Input
                id="title"
                type="text"
                placeholder="e.g. Weekly Product Sync"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="glass-input h-10 w-full rounded-xl bg-white/5 border-white/10 px-3 text-sm text-white placeholder-slate-500 focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/40"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" /> Date
                </label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="glass-input h-10 w-full rounded-xl bg-white/5 border-white/10 px-3 text-sm text-white focus:border-violet-500/40"
                  required
                />
              </div>
              <div className="flex gap-4">
                <div className="space-y-1.5 flex-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Start
                  </label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="glass-input h-10 w-full rounded-xl bg-white/5 border-white/10 px-3 text-sm text-white focus:border-violet-500/40"
                    required
                  />
                </div>
                <div className="space-y-1.5 flex-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="h-3 w-3" /> End
                  </label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="glass-input h-10 w-full rounded-xl bg-white/5 border-white/10 px-3 text-sm text-white focus:border-violet-500/40"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <AlignLeft className="h-3 w-3" /> Description
              </label>
              <textarea
                placeholder="Short summary..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="glass-input w-full rounded-xl bg-white/5 border-white/10 p-3 text-sm text-white placeholder-slate-500 focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/40 resize-none"
              />
            </div>
          </div>

          <div className="h-px w-full bg-white/5" />

          {/* Workspace Advanced Settings */}
          <div className="grid grid-cols-2 gap-8">
            
            {/* Left Column */}
            <div className="space-y-6">
              
              {/* Rich Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <FileText className="h-3 w-3" /> Rich Notes
                </label>
                <textarea
                  placeholder="Extended notes, meeting minutes, thoughts..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={5}
                  className="glass-input w-full rounded-xl bg-white/5 border-white/10 p-3 text-sm text-white placeholder-slate-500 focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/40 resize-y min-h-[100px] custom-scrollbar"
                />
              </div>

              {/* Checklist */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <ListTodo className="h-3 w-3" /> Checklist
                </label>
                
                <div className="space-y-2">
                  <AnimatePresence>
                    {checklist.map((item) => (
                      <motion.div 
                        key={item.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2"
                      >
                        <button
                          type="button"
                          onClick={() => toggleChecklistItem(item.id)}
                          className="text-slate-400 hover:text-white shrink-0"
                        >
                          {item.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Circle className="h-4 w-4" />
                          )}
                        </button>
                        <span className={`text-sm flex-1 truncate ${item.completed ? "line-through text-slate-500" : "text-slate-200"}`}>
                          {item.text}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeChecklistItem(item.id)}
                          className="text-slate-500 hover:text-red-400 p-1"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="flex gap-2 relative">
                  <Input
                    type="text"
                    placeholder="Add task... (Press Enter)"
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    onKeyDown={addChecklistItem}
                    className="glass-input h-9 w-full rounded-lg bg-white/5 border-white/10 px-3 text-sm text-white placeholder-slate-500 focus:border-violet-500/40"
                  />
                  <Button
                    type="button"
                    onClick={addChecklistItem}
                    variant="ghost"
                    className="h-9 w-9 p-0 rounded-lg hover:bg-white/10 shrink-0"
                  >
                    <Plus className="h-4 w-4 text-slate-300" />
                  </Button>
                </div>
              </div>

            </div>

            {/* Right Column */}
            <div className="space-y-6">
              
              {/* Priority */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Priority
                </label>
                <div className="flex gap-2">
                  {["low", "medium", "high"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p as Priority)}
                      className={`flex-1 capitalize py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        priority === p
                          ? p === "high" ? "bg-red-500/20 text-red-300 border-red-500/40" :
                            p === "medium" ? "bg-amber-500/20 text-amber-300 border-amber-500/40" :
                            "bg-blue-500/20 text-blue-300 border-blue-500/40"
                          : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Tag className="h-3 w-3" /> Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  <AnimatePresence>
                    {tags.map(tag => (
                      <motion.span
                        key={tag}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 border border-white/10 rounded-md text-xs font-medium text-slate-200"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-slate-400 hover:text-red-400 focus:outline-none"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
                <Input
                  type="text"
                  placeholder="Add tag... (Press Enter)"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="glass-input h-9 w-full rounded-lg bg-white/5 border-white/10 px-3 text-sm text-white placeholder-slate-500 focus:border-violet-500/40"
                />
              </div>

              {/* Color Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  Theme Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setColor(c.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                        color === c.key
                          ? "bg-white/15 text-white border-white/35 scale-105"
                          : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-slate-200"
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Attachments */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Paperclip className="h-3 w-3" /> Attachments
                </label>
                
                <div className="space-y-2">
                  <AnimatePresence>
                    {attachments.map((file) => {
                      const isImage = file.type.startsWith("image/");
                      return (
                        <motion.div
                          key={file.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                        >
                          <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-slate-900/50 flex items-center justify-center border border-white/5">
                            {isImage ? (
                              <img src={file.downloadURL} alt={file.name} className="h-full w-full object-cover" />
                            ) : (
                              <FileText className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-200 truncate">{file.name}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a 
                              href={file.downloadURL} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-white/10"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDeleteAttachment(file)}
                              className="p-1.5 text-slate-400 hover:text-red-400 rounded-md hover:bg-red-500/10"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  <div className="relative">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="image/*,.pdf,.txt,.doc,.docx"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => !isUploading && fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full h-9 rounded-xl border-dashed border-white/20 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/40"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading {Math.round(uploadProgress)}%
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Attachment
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Action Buttons */}
          <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between mt-8 pt-4 border-t border-white/5">
            {event && onDelete ? (
              <Button
                id="delete-event-btn"
                type="button"
                variant="destructive"
                onClick={() => {
                  onDelete(event.id);
                  onClose();
                }}
                className="h-10 rounded-xl px-4 text-sm font-medium bg-red-950/60 text-red-300 border border-red-500/30 hover:bg-red-950/90"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete Workspace
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="h-10 rounded-xl px-4 text-sm text-slate-400 hover:text-white hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-10 rounded-xl px-6 text-sm font-medium bg-gradient-nova hover:bg-gradient-nova-hover text-white shadow-lg shadow-violet-500/20"
              >
                Save Workspace
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
