'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';
import { getSurveyT } from '@/lib/survey-translations';

interface SurveyWizardProps {
  dark?: boolean;
}

export function SurveyWizard({ dark }: SurveyWizardProps) {
  const { locale } = useLanguage();
  const t = useMemo(() => getSurveyT(locale), [locale]);

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [recommendedPlan, setRecommendedPlan] = useState<string | null>(null);

  const steps = useMemo(() => {
    const list: Array<{
      id: string;
      question: string;
      options: Array<{ value: string; label: string; plan?: string }>;
    }> = [
      {
        id: 'orgType',
        question: t('orgTypeQuestion'),
        options: [
          { value: 'employee-based', label: t('employeeBased') },
          { value: 'franchise-based', label: t('franchiseBased') },
        ],
      },
    ];
    if (answers.orgType === 'franchise-based') {
      list.push({
        id: 'franchiseRole',
        question: t('franchiseRoleQuestion'),
        options: [
          { value: 'area-franchisor', label: t('areaFranchisor') },
          { value: 'unit-franchisee', label: t('unitFranchisee') },
        ],
      });
    }
    list.push(
      {
        id: 'focus',
        question: t('focusQuestion'),
        options: [
          { value: 'sales-only', label: t('focusSalesOnly'), plan: 'cub' },
          { value: 'sales-qc', label: t('focusSalesQc'), plan: 'grizzly' },
        ],
      },
      {
        id: 'scale',
        question: t('scaleQuestion'),
        options: [
          { value: 'small', label: t('scaleSmall'), plan: 'cub' },
          { value: 'large', label: t('scaleLarge'), plan: 'black-bear' },
        ],
      }
    );
    return list;
  }, [answers.orgType, t]);

  // When steps shrink (e.g. user switches from franchise to employee), keep step index in range
  useEffect(() => {
    if (currentStep >= steps.length) {
      setCurrentStep(Math.max(0, steps.length - 1));
    }
  }, [steps.length, currentStep]);

  const handleAnswer = (value: string) => {
    const step = steps[currentStep];
    if (step.id === 'orgType') {
      setAnswers((prev) => {
        const next: Record<string, string> = { ...prev, orgType: value };
        if (value !== 'franchise-based') delete next.franchiseRole;
        return next;
      });
    } else {
      setAnswers((prev) => ({ ...prev, [step.id]: value }));
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      calculateRecommendation();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  const calculateRecommendation = () => {
    const focus = answers['focus'];
    const scale = answers['scale'];
    let recommended = 'black-bear';
    if (focus === 'sales-only' && scale === 'small') recommended = 'cub';
    else if (focus === 'sales-only' && scale === 'large') recommended = 'black-bear';
    else if (focus === 'sales-qc' && scale === 'small') recommended = 'grizzly';
    else if (focus === 'sales-qc' && scale === 'large') recommended = 'kodiak';
    else if (focus === 'sales-only') recommended = scale === 'large' ? 'black-bear' : 'cub';
    else if (focus === 'sales-qc') recommended = scale === 'large' ? 'kodiak' : 'grizzly';
    setRecommendedPlan(recommended);
  };

  const currentQuestion = steps[currentStep];
  const currentAnswer = answers[currentQuestion.id];
  const canProceed = !!currentAnswer;

  const planNames: Record<string, string> = {
    cub: t('planCub'),
    'black-bear': t('planBlackBear'),
    grizzly: t('planGrizzly'),
    kodiak: t('planKodiak'),
  };

  if (recommendedPlan) {
    return (
      <Card className={dark ? 'bg-zinc-900/80 border-zinc-800 shadow-lg' : 'shadow-lg'}>
        <CardHeader className="text-center">
          <div
            className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${dark ? 'bg-amber-500/10' : 'bg-primary/10'}`}
          >
            <CheckCircle2 className={dark ? 'h-8 w-8 text-amber-400' : 'h-8 w-8 text-primary'} />
          </div>
          <CardTitle className={dark ? 'text-3xl text-white' : 'text-3xl'}>
            {t('weRecommend')}
          </CardTitle>
          <CardDescription className={dark ? 'text-xl mt-2 text-zinc-400' : 'text-xl mt-2'}>
            {t('basedOnAnswers')} <strong className={dark ? 'text-white' : ''}>{planNames[recommendedPlan]}</strong>{' '}
            {t('planPerfectForYou')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <Link href={`/pricing#${recommendedPlan}`}>
              <Button
                size="lg"
                className={
                  dark ? 'text-lg px-8 bg-amber-500 text-white hover:bg-amber-400 border-0' : 'text-lg px-8'
                }
              >
                {t('viewPlan')} {planNames[recommendedPlan]} {t('plan')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <div className={dark ? 'pt-6 border-t border-zinc-800' : 'pt-6 border-t'}>
            <p
              className={
                dark ? 'text-sm text-zinc-400 text-center' : 'text-sm text-gray-600 text-center'
              }
            >
              {t('viewAllPricing')}{' '}
              <Link
                href="/pricing"
                className={dark ? 'text-cyan-400 hover:underline' : 'text-primary hover:underline'}
              >
                {t('viewAllPricingLink')}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={dark ? 'bg-zinc-900/80 border-zinc-800 shadow-lg' : 'shadow-lg'}>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className={dark ? 'text-2xl text-white' : 'text-2xl'}>
            {currentQuestion.question}
          </CardTitle>
          <span className={dark ? 'text-sm text-zinc-500' : 'text-sm text-gray-500'}>
            {currentStep + 1} of {steps.length}
          </span>
        </div>
        <div className={dark ? 'w-full bg-zinc-800 rounded-full h-2' : 'w-full bg-gray-200 rounded-full h-2'}>
          <div
            className={
              dark ? 'bg-amber-500 h-2 rounded-full transition-all' : 'bg-primary h-2 rounded-full transition-all'
            }
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={currentAnswer} onValueChange={handleAnswer}>
          {currentQuestion.options.map((option) => (
            <div
              key={option.value}
              className={
                dark
                  ? 'flex items-center space-x-2 p-4 border border-zinc-700 rounded-lg hover:bg-zinc-800/80 cursor-pointer'
                  : 'flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer'
              }
            >
              <RadioGroupItem value={option.value} id={option.value} />
              <Label
                htmlFor={option.value}
                className={`flex-1 cursor-pointer ${dark ? 'text-zinc-200' : ''}`}
              >
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        <div className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            className={dark ? 'border-zinc-600 text-zinc-200 hover:bg-zinc-800' : ''}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('back')}
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed}
            className={dark ? 'bg-amber-500 text-white hover:bg-amber-400 border-0' : ''}
          >
            {currentStep === steps.length - 1 ? t('getRecommendation') : t('next')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
