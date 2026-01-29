'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface SurveyAnswer {
  question: string;
  answer: string;
}

const questions = [
  {
    id: 'locations',
    question: 'How many locations do you manage?',
    options: [
      { value: '1-5', label: '1-5 locations', plan: 'starter' },
      { value: '6-25', label: '6-25 locations', plan: 'professional' },
      { value: '26+', label: '26+ locations', plan: 'enterprise' },
    ],
  },
  {
    id: 'inspections',
    question: 'How many inspections do you perform per month?',
    options: [
      { value: '1-20', label: '1-20 inspections', plan: 'starter' },
      { value: '21-100', label: '21-100 inspections', plan: 'professional' },
      { value: '100+', label: '100+ inspections', plan: 'enterprise' },
    ],
  },
  {
    id: 'team',
    question: 'How many team members will use the platform?',
    options: [
      { value: '1-5', label: '1-5 team members', plan: 'starter' },
      { value: '6-20', label: '6-20 team members', plan: 'professional' },
      { value: '21+', label: '21+ team members', plan: 'enterprise' },
    ],
  },
  {
    id: 'features',
    question: 'Which features are most important to you?',
    options: [
      { value: 'basic', label: 'Basic inspections and reporting', plan: 'starter' },
      { value: 'advanced', label: 'Team management and scheduling', plan: 'professional' },
      { value: 'enterprise', label: 'Custom integrations and API access', plan: 'enterprise' },
    ],
  },
  {
    id: 'support',
    question: 'What level of support do you need?',
    options: [
      { value: 'email', label: 'Email support is sufficient', plan: 'starter' },
      { value: 'priority', label: 'Priority email and chat support', plan: 'professional' },
      { value: 'dedicated', label: 'Dedicated account manager', plan: 'enterprise' },
    ],
  },
];

interface SurveyWizardProps {
  dark?: boolean;
}

export function SurveyWizard({ dark }: SurveyWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [recommendedPlan, setRecommendedPlan] = useState<string | null>(null);

  const handleAnswer = (value: string) => {
    setAnswers({ ...answers, [questions[currentStep].id]: value });
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      calculateRecommendation();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateRecommendation = () => {
    const planScores: Record<string, number> = { starter: 0, professional: 0, enterprise: 0 };

    Object.values(answers).forEach((answer) => {
      const question = questions.find((q) => q.options.some((opt) => opt.value === answer));
      if (question) {
        const option = question.options.find((opt) => opt.value === answer);
        if (option) {
          planScores[option.plan] = (planScores[option.plan] || 0) + 1;
        }
      }
    });

    // Find the plan with the highest score
    const maxScore = Math.max(...Object.values(planScores));
    const recommended = Object.keys(planScores).find(
      (plan) => planScores[plan] === maxScore
    ) || 'professional';

    setRecommendedPlan(recommended);
  };

  const currentQuestion = questions[currentStep];
  const currentAnswer = answers[currentQuestion.id];
  const canProceed = !!currentAnswer;

  if (recommendedPlan) {
    const planNames: Record<string, string> = {
      starter: 'Starter',
      professional: 'Professional',
      enterprise: 'Enterprise',
    };

    return (
      <Card className={dark ? 'bg-zinc-900/80 border-zinc-800 shadow-lg' : 'shadow-lg'}>
        <CardHeader className="text-center">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${dark ? 'bg-orange-500/10' : 'bg-primary/10'}`}>
            <CheckCircle2 className={dark ? 'h-8 w-8 text-orange-400' : 'h-8 w-8 text-primary'} />
          </div>
          <CardTitle className={dark ? 'text-3xl text-white' : 'text-3xl'}>We Recommend</CardTitle>
          <CardDescription className={dark ? 'text-xl mt-2 text-zinc-400' : 'text-xl mt-2'}>
            Based on your answers, the <strong className={dark ? 'text-white' : ''}>{planNames[recommendedPlan]}</strong> plan is perfect for you!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <Link href={`/pricing#${recommendedPlan}`}>
              <Button size="lg" className={dark ? 'text-lg px-8 bg-orange-500 text-white hover:bg-orange-400 border-0' : 'text-lg px-8'}>
                View {planNames[recommendedPlan]} Plan
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <div className={dark ? 'pt-6 border-t border-zinc-800' : 'pt-6 border-t'}>
            <p className={dark ? 'text-sm text-zinc-400 text-center' : 'text-sm text-gray-600 text-center'}>
              Want to see all plans? <Link href="/pricing" className={dark ? 'text-cyan-400 hover:underline' : 'text-primary hover:underline'}>View all pricing</Link>
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
          <CardTitle className={dark ? 'text-2xl text-white' : 'text-2xl'}>{currentQuestion.question}</CardTitle>
          <span className={dark ? 'text-sm text-zinc-500' : 'text-sm text-gray-500'}>
            {currentStep + 1} of {questions.length}
          </span>
        </div>
        <div className={dark ? 'w-full bg-zinc-800 rounded-full h-2' : 'w-full bg-gray-200 rounded-full h-2'}>
          <div
            className={dark ? 'bg-orange-500 h-2 rounded-full transition-all' : 'bg-primary h-2 rounded-full transition-all'}
            style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
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
              <Label htmlFor={option.value} className={`flex-1 cursor-pointer ${dark ? 'text-zinc-200' : ''}`}>
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
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed}
            className={dark ? 'bg-orange-500 text-white hover:bg-orange-400 border-0' : ''}
          >
            {currentStep === questions.length - 1 ? 'Get Recommendation' : 'Next'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
