import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarDays, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateFilterPopoverProps {
  value: string | null;          // "YYYY-MM-DD" ou null = pas de filtre
  onChange: (date: string | null) => void;
}

export function DateFilterPopover({ value, onChange }: DateFilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(value ?? '');

  const todayStr = new Date().toISOString().slice(0, 10);

  const apply = () => {
    onChange(input || null);
    setOpen(false);
  };

  const reset = () => {
    setInput('');
    onChange(null);
    setOpen(false);
  };

  const setToday = () => {
    setInput(todayStr);
  };

  // label affiché sur le bouton
  const label = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Filtrer par date';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('gap-2', value && 'border-accent text-accent-foreground bg-accent/10')}
        >
          <CalendarDays className="h-4 w-4" />
          {label}
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); reset(); }}
              onKeyDown={(e) => e.key === 'Enter' && reset()}
              className="ml-1 rounded-full hover:bg-accent/30 p-0.5"
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-72 p-4 space-y-4" align="start">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Date de livraison prévue</Label>
          <Input
            type="date"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            max="2099-12-31"
          />
        </div>

        {/* Raccourci Aujourd'hui */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={setToday}
        >
          Aujourd'hui ({new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })})
        </Button>

        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" className="flex-1" onClick={reset}>
            Réinitialiser
          </Button>
          <Button size="sm" className="flex-1 gradient-accent text-accent-foreground" onClick={apply}>
            Appliquer
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}