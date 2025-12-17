import { useState } from 'react';
import { useFamily } from '@/contexts/FamilyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Plus, Mail, Check, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

export const FamilySetup = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { createFamily, myPendingInvitations, acceptInvitation, rejectInvitation, loading } = useFamily();
  const { toast } = useToast();
  
  const [familyName, setFamilyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null);

  const handleCreateFamily = async () => {
    if (!familyName.trim()) return;
    
    setIsCreating(true);
    const { error } = await createFamily(familyName.trim());
    setIsCreating(false);

    if (error) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: t('success'),
        description: t('familyCreated')
      });
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    setProcessingInvitation(invitationId);
    const { error } = await acceptInvitation(invitationId);
    setProcessingInvitation(null);

    if (error) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: t('success'),
        description: t('invitationAccepted')
      });
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    setProcessingInvitation(invitationId);
    const { error } = await rejectInvitation(invitationId);
    setProcessingInvitation(null);

    if (error) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>{t('familyBudget')}</CardTitle>
            <CardDescription>{t('loginToAccessFamily')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/auth">
              <Button className="w-full">{t('loginOrSignup')}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>{t('welcomeFamily')}</CardTitle>
          <CardDescription>{t('familySetupDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={myPendingInvitations.length > 0 ? 'invitations' : 'create'}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {t('createFamily')}
              </TabsTrigger>
              <TabsTrigger value="invitations" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {t('invitations')}
                {myPendingInvitations.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                    {myPendingInvitations.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('familyName')}</label>
                <Input
                  placeholder={t('familyNamePlaceholder')}
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFamily()}
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleCreateFamily}
                disabled={!familyName.trim() || isCreating}
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {t('createFamily')}
              </Button>
            </TabsContent>

            <TabsContent value="invitations" className="mt-4">
              {myPendingInvitations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('noPendingInvitations')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myPendingInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                    >
                      <div>
                        <p className="font-medium">{invitation.family_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('invitedToFamily')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectInvitation(invitation.id)}
                          disabled={processingInvitation === invitation.id}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAcceptInvitation(invitation.id)}
                          disabled={processingInvitation === invitation.id}
                        >
                          {processingInvitation === invitation.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
