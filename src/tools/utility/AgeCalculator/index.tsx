import React, { useState } from 'react';
import { Calendar, Hourglass, ArrowRight } from 'lucide-react';

interface AgeTelemetry {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalWeeks: number;
  totalHours: number;
  totalSeconds: number;
  nextBirthdayCountdown: number;
}

export const AgeCalculator: React.FC = () => {
  const [calcTab, setCalcTab] = useState<'age' | 'gap'>('age');
  
  // Age state
  const [birthdate, setBirthdate] = useState('1998-05-15');
  const [ageStats, setAgeStats] = useState<AgeTelemetry | null>(null);

  // Date Gap state
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [gapDays, setGapDays] = useState<number | null>(null);

  const calculateAgeDetails = () => {
    const birth = new Date(birthdate);
    const now = new Date();
    if (isNaN(birth.getTime())) return;

    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    let days = now.getDate() - birth.getDate();

    if (days < 0) {
      months--;
      // Get days in previous month
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    const totalMs = now.getTime() - birth.getTime();
    const totalSeconds = Math.floor(totalMs / 1000);
    const totalHours = Math.floor(totalSeconds / 3600);
    const totalDays = Math.floor(totalHours / 24);
    const totalWeeks = Math.floor(totalDays / 7);

    // Calculate next birthday countdown
    const nextBday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
    if (now.getTime() > nextBday.getTime()) {
      nextBday.setFullYear(now.getFullYear() + 1);
    }
    const countdownMs = nextBday.getTime() - now.getTime();
    const nextBirthdayCountdown = Math.ceil(countdownMs / (1000 * 60 * 60 * 24));

    setAgeStats({
      years,
      months,
      days,
      totalDays,
      totalWeeks,
      totalHours,
      totalSeconds,
      nextBirthdayCountdown
    });
  };

  const calculateDateGap = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

    const diffMs = Math.abs(end.getTime() - start.getTime());
    setGapDays(Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex flex-col gap-4 border border-border rounded bg-surface p-4">
        <h4 className="font-mono text-[10px] text-ink-muted uppercase tracking-wider border-b border-border pb-2">
          Select Date Calculator Type /
        </h4>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => { setCalcTab('age'); setAgeStats(null); }}
            className={`flex items-center gap-2 px-4 py-2 border rounded font-mono text-xs uppercase tracking-wider transition-colors ${
              calcTab === 'age' ? 'border-accent bg-accent/5 text-ink' : 'border-border text-ink-muted bg-surface hover:text-ink'
            }`}
          >
            <Calendar size={13} /> Birthdate Age Calculator
          </button>
          <button
            type="button"
            onClick={() => { setCalcTab('gap'); setGapDays(null); }}
            className={`flex items-center gap-2 px-4 py-2 border rounded font-mono text-xs uppercase tracking-wider transition-colors ${
              calcTab === 'gap' ? 'border-accent bg-accent/5 text-ink' : 'border-border text-ink-muted bg-surface hover:text-ink'
            }`}
          >
            <Hourglass size={13} /> Date Gap Measurement
          </button>
        </div>
      </div>

      {calcTab === 'age' ? (
        <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in">
          <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
            Age Calculator inputs /
          </span>

          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex flex-col gap-1.5 flex-1 w-full">
              <span className="font-mono text-[9px] text-ink-muted uppercase">Select Birth Date /</span>
              <input
                type="date"
                value={birthdate}
                onChange={e => { setBirthdate(e.target.value); setAgeStats(null); }}
                className="w-full px-3 py-1.5 border border-border bg-bg text-ink rounded text-xs focus:border-accent outline-none font-sans"
              />
            </div>
            
            <button
              type="button"
              onClick={calculateAgeDetails}
              className="px-6 py-2 bg-accent text-white font-mono text-xs uppercase tracking-wider rounded shadow hover:bg-accent-secondary transition-colors shrink-0 w-full sm:w-auto"
            >
              Calculate Age
            </button>
          </div>

          {ageStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border pt-4 mt-2 animate-fade-in">
              <div className="flex flex-col gap-3">
                <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                  Precise Age /
                </span>
                <div className="p-4 bg-bg border border-border/80 rounded text-center">
                  <span className="text-3xl font-extrabold text-accent block leading-none">
                    {ageStats.years}
                  </span>
                  <span className="text-[10px] text-ink-muted uppercase tracking-wider font-mono block mt-2">
                    Years, {ageStats.months} Months, {ageStats.days} Days old
                  </span>
                </div>

                <div className="p-3 bg-accent/5 border border-accent/20 rounded text-xs text-ink-muted text-center font-bold">
                  Next Birthday in: {ageStats.nextBirthdayCountdown} day(s)
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                  Life Breakdown Telemetry /
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-ink-muted">
                  <div className="bg-bg/50 border border-border/30 p-2.5 rounded">
                    <span className="text-[8px] uppercase block">Total Weeks</span>
                    <strong className="text-ink text-sm block mt-1">{ageStats.totalWeeks.toLocaleString()}</strong>
                  </div>
                  <div className="bg-bg/50 border border-border/30 p-2.5 rounded">
                    <span className="text-[8px] uppercase block">Total Days</span>
                    <strong className="text-ink text-sm block mt-1">{ageStats.totalDays.toLocaleString()}</strong>
                  </div>
                  <div className="bg-bg/50 border border-border/30 p-2.5 rounded">
                    <span className="text-[8px] uppercase block">Total Hours</span>
                    <strong className="text-ink text-sm block mt-1">{ageStats.totalHours.toLocaleString()}</strong>
                  </div>
                  <div className="bg-bg/50 border border-border/30 p-2.5 rounded">
                    <span className="text-[8px] uppercase block">Total Seconds</span>
                    <strong className="text-ink text-sm block mt-1">{ageStats.totalSeconds.toLocaleString()}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-border rounded bg-surface p-4 flex flex-col gap-4 animate-fade-in">
          <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
            Date Gap input parameters /
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
            <div className="flex flex-col gap-1.5 w-full">
              <span className="font-mono text-[9px] text-ink-muted uppercase">Start Date /</span>
              <input
                type="date"
                value={startDate}
                onChange={e => { setStartDate(e.target.value); setGapDays(null); }}
                className="w-full px-3 py-1.5 border border-border bg-bg text-ink rounded text-xs focus:border-accent outline-none font-sans"
              />
            </div>

            <div className="flex flex-col gap-1.5 w-full">
              <span className="font-mono text-[9px] text-ink-muted uppercase">End Date /</span>
              <input
                type="date"
                value={endDate}
                onChange={e => { setEndDate(e.target.value); setGapDays(null); }}
                className="w-full px-3 py-1.5 border border-border bg-bg text-ink rounded text-xs focus:border-accent outline-none font-sans"
              />
            </div>
            
            <button
              type="button"
              onClick={calculateDateGap}
              className="px-6 py-2 bg-accent text-white font-mono text-xs uppercase tracking-wider rounded shadow hover:bg-accent-secondary transition-colors w-full"
            >
              Measure Duration
            </button>
          </div>

          {gapDays !== null && (
            <div className="flex flex-col items-center justify-center p-4 border border-border bg-bg rounded mt-4 max-w-sm mx-auto w-full animate-fade-in">
              <span className="font-mono text-[9px] text-ink-muted uppercase tracking-wider">Measured Duration Gap</span>
              <div className="flex items-center gap-4 mt-2">
                <span className="font-mono text-xs text-ink-muted font-bold">{startDate}</span>
                <ArrowRight size={14} className="text-accent" />
                <span className="font-mono text-xs text-ink-muted font-bold">{endDate}</span>
              </div>
              <div className="text-3xl font-extrabold text-accent mt-3 block leading-none">
                {gapDays.toLocaleString()} <span className="text-sm font-normal text-ink-muted">days</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AgeCalculator;
