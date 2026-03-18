import { useEffect, useState, useRef } from 'react';
import { Upload, FileText, Trash2, Loader2, Database } from 'lucide-react';
import { api } from '../services/api';

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
    if (file.type !== 'text/plain') {
      alert('Only .txt files are supported currently.');
      return;
    }

    try {
      setIsUploading(true);
      await api.kb.upload(file);
      await fetchDocuments();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document and purge its vector embeddings forever?')) return;
    try {
      await api.kb.delete(id);
      await fetchDocuments();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Vector Knowledge Base</h1>
          <p className="text-gray-500">Inject textual documents into the Retrieval-Augmented Generation (RAG) pool.</p>
        </div>
        <div>
          <input 
            type="file" 
            accept=".txt" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
          />
          <button 
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
          >
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Upload Text Document
          </button>
        </div>
      </div>

      <div className="rounded-md border bg-white">
        <div className="p-4 border-b bg-gray-50 flex items-center space-x-2">
          <Database className="h-5 w-5 text-gray-500" />
          <h2 className="font-semibold text-gray-700">Indexed Files</h2>
        </div>
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-gray-500"/></div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
            <Database className="h-12 w-12 mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900">Knowledge Base Empty</h3>
            <p>Upload your first `.txt` file to automatically chunk and embed it into the Vector space.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3">Filename</th>
                <th className="px-6 py-3">Ingested At</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900 flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span>{doc.filename}</span>
                  </td>
                  <td className="px-6 py-4">{new Date(doc.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-600 hover:text-red-900 px-3 py-1 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                    >
                      <Trash2 className="h-4 w-4 inline-block" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
