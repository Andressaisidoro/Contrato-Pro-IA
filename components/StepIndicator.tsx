import React from 'react';
import { AppStep } from '../types';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: AppStep;
}

const steps = [
  { id: AppStep.SELECT_SERVICE, label: 'Serviço' },
  { id: AppStep.INPUT_DETAILS, label: 'Dados' },
  { id: AppStep.PREVIEW_EDIT, label: 'Revisão' },
  { id: AppStep.SIGNATURE, label: 'Assinatura' },
  { id: AppStep.FINAL, label: 'Pronto' },
];

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  return (
    <div className="w-full py-8 px-4 mb-4">
      <div className="flex justify-between items-center max-w-4xl mx-auto relative">
        {/* Progress Line Background */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10 rounded-full" />
        
        {/* Steps */}
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <div key={step.id} className="flex flex-col items-center px-2 bg-slate-50">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm ${
                  isCompleted
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : isCurrent
                    ? 'bg-white border-indigo-600 text-indigo-600 ring-4 ring-indigo-50'
                    : 'bg-white border-slate-300 text-slate-300'
                }`}
              >
                {isCompleted ? <Check size={18} strokeWidth={3} /> : <span className="text-sm font-bold">{index + 1}</span>}
              </div>
              <span className={`text-xs mt-3 font-semibold tracking-wide uppercase ${isCurrent ? 'text-indigo-600' : 'text-slate-400'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;