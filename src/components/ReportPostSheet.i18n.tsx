import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose, SheetDescription } from '@/components/ui/sheet';
import { X, Flag } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';

interface ReportPostSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onReport: (reason: string) => void;
  isReporting?: boolean;
}

const REPORT_REASONS = [
  { value: 'spam', label: 'reportPost.spam' },
  { value: 'harassment', label: 'reportPost.harassment' },
  { value: 'violence', label: 'reportPost.violence' },
  { value: 'misinformation', label: 'reportPost.misinformation' },
  { value: 'other', label: 'reportPost.other' }
];

const ReportPostSheet = ({ isOpen, onClose, onReport, isReporting = false }: ReportPostSheetProps) => {
  const { t } = useTranslation();
  const [selectedReason, setSelectedReason] = useState('');

  const handleReport = () => {
    if (!selectedReason) return;
    onReport(selectedReason);
    onClose();
    setSelectedReason('');
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-2xl p-0 border-t border-border overflow-y-auto">
        <div className="px-6 py-5">
          <SheetHeader className="text-left space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl font-bold">{t('reportPost.title')}</SheetTitle>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </div>
            <SheetDescription className="text-muted-foreground text-sm">
              {t('reportPost.description')}
            </SheetDescription>
          </SheetHeader>

          <RadioGroup value={selectedReason} onValueChange={setSelectedReason} className="space-y-3 mb-6">
            {REPORT_REASONS.map((reason) => (
              <div
                key={reason.value}
                className={`flex items-start space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                  selectedReason === reason.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                }`}
                onClick={() => setSelectedReason(reason.value)}
              >
                <RadioGroupItem value={reason.value} id={reason.value} className="mt-1" />
                <Label htmlFor={reason.value} className="cursor-pointer flex-1">
                  <div className="font-semibold text-foreground">{t(reason.label)}</div>
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="space-y-3">
            <Button
              onClick={handleReport}
              disabled={!selectedReason || isReporting}
              className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold h-12 rounded-full"
            >
              {isReporting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {t('reportPost.submitting')}
                </>
              ) : (
                <>
                  <Flag className="h-4 w-4 mr-2" />
                  {t('reportPost.submit')}
                </>
              )}
            </Button>

            <SheetClose asChild>
              <Button variant="outline" className="w-full h-12 rounded-full font-bold border-border" disabled={isReporting}>
                {t('common.cancel')}
              </Button>
            </SheetClose>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ReportPostSheet;
