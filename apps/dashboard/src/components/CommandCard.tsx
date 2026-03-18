import type { Command } from '../services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, TerminalSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

interface Props {
  command: Command;
  onDelete: () => void;
}

export default function CommandCard({ command, onDelete }: Props) {
  const navigate = useNavigate();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TerminalSquare className="w-5 h-5 text-primary" />
            <CardTitle className="text-xl">/{command.name}</CardTitle>
          </div>
          {!command.enabled && <Badge variant="secondary">Disabled</Badge>}
        </div>
        <CardDescription className="line-clamp-2 mt-2">{command.description || 'No execution description provided.'}</CardDescription>
      </CardHeader>
      
      <CardContent className="pt-4 pb-2">
        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <div className="flex justify-between items-center">
            <span>Engine ID:</span>
            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{command.id.substring(0, 8)}...</span>
          </div>
          <div className="flex justify-between mt-2">
            <span>Last Compiled:</span>
            <span className="text-xs">{new Date(command.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-4 flex justify-end gap-2 border-t border-border/20">
        <Button variant="outline" size="sm" onClick={() => navigate(`/?id=${command.id}`)}>
          Edit Context Structure
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="px-2">
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the <strong>{command.name}</strong> command script from the memory mapping index.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Memory Allocation</AlertDialogCancel>
              {/* @ts-ignore */}
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onDelete}>Execute Dump</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
