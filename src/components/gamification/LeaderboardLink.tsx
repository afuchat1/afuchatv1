import { Trophy, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const LeaderboardLink = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="flex gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/leaderboard')}
        className="flex items-center gap-2"
      >
        <Trophy className="h-4 w-4 text-primary" />
        <span className="text-sm">{t('gamification.leaderboard')}</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/gift-leaderboard')}
        className="flex items-center gap-2"
      >
        <Gift className="h-4 w-4 text-primary" />
        <span className="text-sm">Gifts</span>
      </Button>
    </div>
  );
};