import React, { useState } from 'react';
import DraggableCard from './DraggableCard';
import { X } from 'lucide-react';

interface CalculatorProps {
  onClose: () => void;
}

export default function Calculator({ onClose }: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [isNewNumber, setIsNewNumber] = useState(true);

  const handleNumber = (num: string) => {
    if (isNewNumber) {
      setDisplay(num);
      setIsNewNumber(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleOperator = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setIsNewNumber(true);
  };

  const handleEqual = () => {
    const fullEquation = equation + display;
    try {
      // eslint-disable-next-line no-eval
      const result = eval(fullEquation.replace('x', '*').replace('÷', '/'));
      setDisplay(String(result));
      setEquation('');
      setIsNewNumber(true);
    } catch (e) {
      setDisplay('Error');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setIsNewNumber(true);
  };

  const buttons = [
    'C', '÷', 'x', '-',
    '7', '8', '9', '+',
    '4', '5', '6', '=',
    '1', '2', '3', '0',
    '.'
  ];

  return (
    <DraggableCard 
      className="fixed top-16 left-4 w-36 bg-[#c0c0c0] border-2 border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] p-1 font-sans select-none z-50"
    >
      <div className="calc-header bg-[#000080] text-white px-1 py-0.5 flex justify-between items-center mb-1 cursor-grab active:cursor-grabbing">
        <span className="text-[9px] font-bold">Calc</span>
        <button onClick={onClose} className="bg-[#c0c0c0] text-black w-3 h-3 flex items-center justify-center border border-white shadow-[1px_1px_0px_0px_rgba(0,0,0,0.5)] text-[8px] leading-none hover:bg-red-500 hover:text-white">
          <X size={8} />
        </button>
      </div>

      <div className="bg-white border border-[#808080] shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.5)] p-1 mb-1 text-right font-mono text-xs overflow-hidden h-5 flex items-center justify-end">
        {display}
      </div>

      <div className="grid grid-cols-4 gap-0.5">
        {buttons.map((btn) => (
          <button
            key={btn}
            onClick={() => {
              if (btn === 'C') handleClear();
              else if (['+', '-', 'x', '÷'].includes(btn)) handleOperator(btn);
              else if (btn === '=') handleEqual();
              else handleNumber(btn);
            }}
            className={`
              ${btn === '0' ? 'col-span-2' : ''}
              ${btn === '=' ? 'row-span-2 h-full' : 'h-5'}
              bg-[#c0c0c0] border border-white shadow-[1px_1px_0px_0px_rgba(0,0,0,0.5)] active:shadow-[inset_1px_1px_0px_0px_rgba(0,0,0,0.5)] active:border-[#808080]
              text-[10px] font-bold flex items-center justify-center hover:bg-[#d0d0d0]
            `}
          >
            {btn}
          </button>
        ))}
      </div>
    </DraggableCard>
  );
}
