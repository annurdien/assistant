import { useEffect, useState, useRef } from 'react';
import { Upload, FileText, Trash2, Loader2, Database } from 'lucide-react';
import { api } from '../services/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function KnowledgeBasePage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const docs = await api.kb.list();
      setDocuments(docs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    if (file.type !== 'text/plain') return toast.error('Only .txt files are supported currently.');

    try {
      setIsUploading(true);
      await api.kb.upload(file);
      await fetchDocuments();
      toast.success('Document successfully uploaded and indexed.');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      toast.error(`Error uploading: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.kb.delete(id);
      await fetchDocuments();
      toast.success('Document deleted successfully');
    } catch (err: any) {
      toast.error(`Error deleting document: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground mt-1 text-sm">Upload reference documents to give your AI contextual knowledge.</p>
        </div>
        <div>
          <input 
            type="file" 
            accept=".txt" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
          />
          <Button 
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Upload Document
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-border/50 shadow-sm">
        <div className="bg-secondary/30 border-b border-border/50 px-6 py-5 flex items-center space-x-3">
          <Database className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">Documents</h2>
        </div>
        
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-48 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary/50"/>
            <span className="text-sm text-muted-foreground">Loading documents...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <div className="bg-muted p-4 rounded-full mb-6">
              <Database className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2 tracking-tight">No Documents</h3>
            <p className="text-muted-foreground max-w-sm">No documents have been uploaded yet. Provide text files to give the AI factual context.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[50%] h-12">Filename</TableHead>
                <TableHead className="w-[30%] text-left h-12">Date Uploaded</TableHead>
                <TableHead className="text-right pr-6 h-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id} className="group">
                  <TableCell className="font-medium py-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 border rounded bg-background">
                        <FileText className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="truncate max-w-[300px]">{doc.filename}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs py-4">
                    {new Date(doc.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right pr-6 py-4">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:bg-destructive/10 hover:text-destructive text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Document?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{doc.filename}" and its associated embeddings from the knowledge base.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          {/* @ts-ignore */}
                          <AlertDialogAction className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={() => handleDelete(doc.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
