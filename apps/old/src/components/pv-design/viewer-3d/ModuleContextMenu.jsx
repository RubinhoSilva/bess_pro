import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Move } from 'lucide-react';

const ModuleContextMenu = ({ position, onClose, onMove }) => {
  if (!position) return null;

  const handleMoveClick = (e) => {
    e.stopPropagation();
    onMove();
    onClose();
  };

  return (
    <div
      className="fixed z-50"
      style={{ top: position.y, left: position.x }}
      onClick={(e) => e.stopPropagation()}
    >
      <Card className="w-48 bg-slate-800/90 border-slate-700 text-white shadow-2xl">
        <CardContent className="p-1">
          <Button
            variant="ghost"
            className="w-full justify-start px-2 py-1.5 text-sm"
            onClick={handleMoveClick}
          >
            <Move className="w-4 h-4 mr-2" />
            Mover Seleção
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModuleContextMenu;