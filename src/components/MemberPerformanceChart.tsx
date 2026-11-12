/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend
} from 'recharts';
import { TrendingDown, TrendingUp, BarChart3, Activity, Minus } from 'lucide-react';
import { Member, TournamentResult, Event, GolfCourse, Season } from '../types';
import { formatAppDate, getBaseEventId, normalizeDateToYMD } from '../utils/dateUtils';

interface MemberPerformanceChartProps {
  members: Member[];
  selectedMember: Member | null;
  onSelectMember: (memberId: string) => void;
  results: TournamentResult[];
  events: Event[];
  courses: GolfCourse[];
  seasons: Season[];
  activeSeasonId: string;
}

type TrendMetricMode = 'scoring' | 'handicap';

interface PerformancePoint {
  eventId: string;
  label: string;
  fullTitle: string;
  dateFormatted: string;
  courseName: string;
  coursePar: number;
  eventGross: number;
  eventNet: number;
  runningGrossAvg: number;
  runningNetAvg: number;
  playedHandicap: number;
  points: number;
  position: number;
  vsParGross: number;
  vsParNet: number;
  isCurrentOfficial?: boolean;
}

function formatVsPar(diff: number): string {
  const rounded = Math.round(diff * 10) / 10;
  if (rounded > 0) return `+${rounded}`;
  if (rounded < 0) return `${rounded}`;
  return 'E';
}

function truncateLabel(text: string, maxLen = 18): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1).trimEnd() + '…';
}

export default function MemberPerformanceChart({
  members,
  selectedMember,
  onSelectMember,
  results,
  events,
  courses,
  seasons,
  activeSeasonId
}: MemberPerformanceChartProps) {
  const [metricMode, setMetricMode] = useState<TrendMetricMode>('scoring');

  const activeSeason = seasons.find(s => s.id === activeSeasonId);
  const activeSeasonName = activeSeason?.name || 'Current Season';

  const seasonEvents = useMemo(() => {
    return events
      .filter(e => e.seasonId === activeSeasonId)
      .sort((a, b) => normalizeDateToYMD(a.date).localeCompare(normalizeDateToYMD(b.date)));
  }, [events, activeSeasonId]);

  const { chartData, handicapChartData, summary } = useMemo(() => {
    if (!selectedMember) {
      return {
        chartData: [] as PerformancePoint[],
        handicapChartData: [] as PerformancePoint[],
        summary: null
      };
    }

    const memberResults = results.filter(r => r.playerId === selectedMember.id);
    const points: PerformancePoint[] = [];

    let cumulativeGross = 0;
    let cumulativeNet = 0;

    seasonEvents.forEach((evt) => {
      const matchingResults = memberResults.filter(r => getBaseEventId(r.eventId) === evt.id);
      if (matchingResults.length === 0) return;

      // Prefer main/base event entry if multiple divisions exist
      const res =
        matchingResults.find(r => r.eventId === evt.id || r.eventId === `${evt.id}-main`) ||
        matchingResults[0];

      const course = courses.find(c => c.id === evt.courseId);
      const coursePar = course?.par || 72;

      // Inspect entered round scores to determine if scores are relative-to-par or raw strokes
      const trackedRounds = evt.roundsCount || 1;
      const enteredRounds = [
        res.round1Score,
        trackedRounds >= 2 ? res.round2Score : undefined,
        trackedRounds >= 3 ? res.round3Score : undefined,
        trackedRounds >= 4 ? res.round4Score : undefined
      ].filter((v): v is number => v !== undefined && v !== null && Number(v) !== 0);

      const hasRelativeRounds = enteredRounds.some(r => r < 50);
      const grossRaw = Number(res.grossScore) || 0;
      const netRaw = Number(res.netScore) || 0;

      let perRoundGross = grossRaw;
      let perRoundNet = netRaw;

      if (grossRaw <= 0 || hasRelativeRounds || (grossRaw > 0 && grossRaw <= 50)) {
        // Scores stored relative to par
        const roundDivisor = enteredRounds.length > 0 ? enteredRounds.length : Math.max(1, trackedRounds);
        perRoundGross = coursePar + grossRaw / roundDivisor;
        perRoundNet = coursePar + netRaw / roundDivisor;
      } else if (grossRaw > coursePar * 1.5) {
        // Multi-round cumulative raw stroke totals
        const roundDivisor =
          enteredRounds.length > 0
            ? enteredRounds.length
            : Math.min(Math.max(Math.round(grossRaw / coursePar), 1), Math.max(1, trackedRounds));
        perRoundGross = grossRaw / roundDivisor;
        perRoundNet = netRaw / roundDivisor;
      }

      const eventGross = Number(perRoundGross.toFixed(1));
      const eventNet = Number(perRoundNet.toFixed(1));

      cumulativeGross += eventGross;
      cumulativeNet += eventNet;
      const count = points.length + 1;

      const runningGrossAvg = Number((cumulativeGross / count).toFixed(1));
      const runningNetAvg = Number((cumulativeNet / count).toFixed(1));

      let playedHandicap = selectedMember.handicap;
      if (res.handicap !== undefined && res.handicap !== null && !isNaN(Number(res.handicap))) {
        playedHandicap = Number(res.handicap);
      } else if (grossRaw > 0 && netRaw > 0) {
        const derived = Number((grossRaw - netRaw).toFixed(1));
        if (derived >= 0 && derived <= 54) {
          playedHandicap = derived;
        }
      }

      const shortDate = formatAppDate(evt.date).slice(0, 5);
      points.push({
        eventId: evt.id,
        label: `${truncateLabel(evt.title, 15)} (${shortDate})`,
        fullTitle: evt.title,
        dateFormatted: formatAppDate(evt.date),
        courseName: course?.name || 'Club Fixture',
        coursePar,
        eventGross,
        eventNet,
        runningGrossAvg,
        runningNetAvg,
        playedHandicap,
        points: Number(res.points) || 0,
        position: Number(res.position) || 0,
        vsParGross: Number((eventGross - coursePar).toFixed(1)),
        vsParNet: Number((eventNet - coursePar).toFixed(1))
      });
    });

    if (points.length === 0) {
      return {
        chartData: [] as PerformancePoint[],
        handicapChartData: [] as PerformancePoint[],
        summary: null
      };
    }

    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    const avgPar = Number(
      (points.reduce((sum, p) => sum + p.coursePar, 0) / points.length).toFixed(1)
    );
    const bestNet = Math.min(...points.map(p => p.eventNet));
    const bestGross = Math.min(...points.map(p => p.eventGross));
    const totalSeasonPoints = points.reduce((sum, p) => sum + p.points, 0);
    const hcpChange = Number((selectedMember.handicap - firstPoint.playedHandicap).toFixed(1));

    // Append current official handicap as the latest point in Handicap History
    // so even a 1-event season displays a continuous handicap trajectory
    const hcpPoints: PerformancePoint[] = [
      ...points,
      {
        eventId: 'official-current',
        label: 'Current HCP',
        fullTitle: 'Current Official Handicap',
        dateFormatted: 'Active Standing',
        courseName: 'Society Handicap Index',
        coursePar: avgPar,
        eventGross: lastPoint.eventGross,
        eventNet: lastPoint.eventNet,
        runningGrossAvg: lastPoint.runningGrossAvg,
        runningNetAvg: lastPoint.runningNetAvg,
        playedHandicap: Number(selectedMember.handicap.toFixed(1)),
        points: 0,
        position: 0,
        vsParGross: lastPoint.vsParGross,
        vsParNet: lastPoint.vsParNet,
        isCurrentOfficial: true
      }
    ];

    return {
      chartData: points,
      handicapChartData: hcpPoints,
      summary: {
        seasonGrossAvg: lastPoint.runningGrossAvg,
        seasonNetAvg: lastPoint.runningNetAvg,
        avgPar,
        bestNet,
        bestGross,
        eventsPlayed: points.length,
        totalSeasonEvents: seasonEvents.length,
        totalSeasonPoints,
        hcpChange
      }
    };
  }, [selectedMember, results, seasonEvents, courses]);

  // Quick suggestions for members who have current season results if active member has none
  const membersWithSeasonData = useMemo(() => {
    const seasonEvtIds = new Set(seasonEvents.map(e => e.id));
    const playerIdsWithData = new Set(
      results
        .filter(r => seasonEvtIds.has(getBaseEventId(r.eventId)))
        .map(r => r.playerId)
    );
    return members.filter(m => playerIdsWithData.has(m.id));
  }, [members, results, seasonEvents]);

  if (members.length === 0) return null;

  const activeData = metricMode === 'scoring' ? chartData : handicapChartData;

  const scoringDomain = useMemo(() => {
    if (chartData.length === 0) return [60, 100];
    const allVals = chartData.flatMap(d => [d.eventGross, d.eventNet, d.runningGrossAvg, d.runningNetAvg, d.coursePar]);
    const min = Math.floor(Math.min(...allVals) - 4);
    const max = Math.ceil(Math.max(...allVals) + 4);
    return [min, max];
  }, [chartData]);

  const handicapDomain = useMemo(() => {
    if (handicapChartData.length === 0) return [0, 36];
    const allVals = handicapChartData.map(d => d.playedHandicap);
    const min = Math.max(0, Math.floor(Math.min(...allVals) - 2));
    const max = Math.min(36, Math.ceil(Math.max(...allVals) + 2));
    return [min, max === min ? min + 2 : max];
  }, [handicapChartData]);

  const renderTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data: PerformancePoint = payload[0].payload;

    return (
      <div className="bg-stone-950 text-stone-100 border border-stone-700 rounded-xl p-3.5 shadow-xl text-xs min-w-[230px] space-y-2">
        <div className="border-b border-stone-800 pb-2">
          <div className="font-display font-bold text-amber-300 text-sm leading-snug">
            {data.fullTitle}
          </div>
          <div className="text-[11px] text-stone-400 mt-0.5">
            {data.dateFormatted} · {data.courseName}
          </div>
        </div>

        {metricMode === 'scoring' ? (
          <div className="space-y-1.5 font-mono tabular-nums">
            <div className="flex justify-between gap-4">
              <span className="text-stone-400">Event Gross:</span>
              <span className="font-bold text-stone-100">
                {data.eventGross} ({formatVsPar(data.vsParGross)})
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-stone-400">Event Net:</span>
              <span className="font-bold text-emerald-300">
                {data.eventNet} ({formatVsPar(data.vsParNet)})
              </span>
            </div>
            <div className="border-t border-stone-800/80 my-1 pt-1 flex justify-between gap-4">
              <span className="text-amber-300/90">Gross Avg (YTD):</span>
              <span className="font-bold text-amber-300">{data.runningGrossAvg}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-emerald-400">Net Avg (YTD):</span>
              <span className="font-bold text-emerald-400">{data.runningNetAvg}</span>
            </div>
            <div className="border-t border-stone-800/80 pt-1 flex justify-between gap-4 text-[11px] text-stone-300">
              <span>Finish: #{data.position || '-'}</span>
              <span>{data.points} PTS · Par {data.coursePar}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5 font-mono tabular-nums">
            <div className="flex justify-between gap-4">
              <span className="text-stone-400">
                {data.isCurrentOfficial ? 'Official Index:' : 'Event Handicap:'}
              </span>
              <span className="font-bold text-emerald-300 text-sm">
                {data.playedHandicap.toFixed(1)}
              </span>
            </div>
            {!data.isCurrentOfficial && (
              <>
                <div className="flex justify-between gap-4">
                  <span className="text-stone-400">Gross / Net:</span>
                  <span className="text-stone-200">
                    {data.eventGross} / {data.eventNet}
                  </span>
                </div>
                <div className="flex justify-between gap-4 text-[11px] text-stone-400">
                  <span>Finish: #{data.position || '-'}</span>
                  <span>{data.points} PTS</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <section
      aria-label="Member Performance Trends"
      className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5"
    >
      {/* Top Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-800" />
            <h2 className="font-display font-bold text-lg text-stone-900 tracking-tight">
              Performance Trends
            </h2>
          </div>
          <p className="text-xs text-stone-500">
            {selectedMember ? (
              <>
                {selectedMember.name} · {selectedMember.division} · {activeSeasonName}
              </>
            ) : (
              <>Select a member below or from the ledger to inspect seasonal trends.</>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Member Picker */}
          <div className="flex items-center gap-2 text-xs">
            <label htmlFor="trend-member-select" className="text-stone-500 font-medium">
              Player:
            </label>
            <select
              id="trend-member-select"
              value={selectedMember?.id || ''}
              onChange={(e) => onSelectMember(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-900 font-medium focus:outline-none focus:border-emerald-700 cursor-pointer max-w-[220px]"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} (HCP {m.handicap.toFixed(1)})
                </option>
              ))}
            </select>
          </div>

          {/* Metric View Toggle */}
          <div
            role="tablist"
            aria-label="Performance metric view"
            className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg border border-stone-200/80"
          >
            <button
              type="button"
              role="tab"
              aria-selected={metricMode === 'scoring'}
              onClick={() => setMetricMode('scoring')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                metricMode === 'scoring'
                  ? 'bg-emerald-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Scoring Average
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={metricMode === 'handicap'}
              onClick={() => setMetricMode('handicap')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                metricMode === 'handicap'
                  ? 'bg-emerald-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Handicap History
            </button>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      {selectedMember && summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-stone-100 pb-4">
          <div>
            <div className="text-[11px] font-medium text-stone-500">Season Gross Avg</div>
            <div className="mt-0.5 flex items-baseline gap-2 font-mono tabular-nums">
              <span className="text-xl font-bold text-stone-900">{summary.seasonGrossAvg}</span>
              <span className="text-xs font-semibold text-amber-700">
                {formatVsPar(summary.seasonGrossAvg - summary.avgPar)} vs par
              </span>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-stone-500">Season Net Avg</div>
            <div className="mt-0.5 flex items-baseline gap-2 font-mono tabular-nums">
              <span className="text-xl font-bold text-emerald-900">{summary.seasonNetAvg}</span>
              <span className="text-xs font-semibold text-emerald-700">
                Best {summary.bestNet}
              </span>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-stone-500">Official Handicap</div>
            <div className="mt-0.5 flex items-center gap-2 font-mono tabular-nums">
              <span className="text-xl font-bold text-stone-900">
                {selectedMember.handicap.toFixed(1)}
              </span>
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                  summary.hcpChange < 0
                    ? 'text-emerald-700'
                    : summary.hcpChange > 0
                    ? 'text-amber-700'
                    : 'text-stone-500'
                }`}
              >
                {summary.hcpChange < 0 ? (
                  <>
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>{summary.hcpChange.toFixed(1)}</span>
                  </>
                ) : summary.hcpChange > 0 ? (
                  <>
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>+{summary.hcpChange.toFixed(1)}</span>
                  </>
                ) : (
                  <>
                    <Minus className="w-3 h-3" />
                    <span>Steady</span>
                  </>
                )}
              </span>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-stone-500">Season Participation</div>
            <div className="mt-0.5 flex items-baseline gap-2 font-mono tabular-nums">
              <span className="text-xl font-bold text-stone-900">
                {summary.eventsPlayed} / {summary.totalSeasonEvents}
              </span>
              <span className="text-xs font-semibold text-stone-600">
                {summary.totalSeasonPoints} PTS
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Recharts Visualization */}
      {activeData.length > 0 ? (
        <div className="w-full h-[290px] pt-1">
          <ResponsiveContainer width="100%" height="100%">
            {metricMode === 'scoring' ? (
              <ComposedChart
                data={chartData}
                margin={{ top: 12, right: 18, left: -8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#57534e', fontSize: 11 }}
                  axisLine={{ stroke: '#d6d3d1' }}
                  tickLine={false}
                />
                <YAxis
                  domain={scoringDomain}
                  allowDecimals={false}
                  tick={{ fill: '#57534e', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                />
                <Tooltip content={renderTooltip} />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                  iconType="circle"
                />
                {summary && (
                  <ReferenceLine
                    y={summary.avgPar}
                    stroke="#a8a29e"
                    strokeDasharray="4 4"
                    label={{
                      value: `Par ${Math.round(summary.avgPar)}`,
                      position: 'insideTopRight',
                      fill: '#78716c',
                      fontSize: 10
                    }}
                  />
                )}
                <Bar
                  dataKey="eventGross"
                  name="Event Gross"
                  barSize={24}
                  fill="#fbbf24"
                  fillOpacity={0.32}
                  radius={[5, 5, 0, 0]}
                />
                <Bar
                  dataKey="eventNet"
                  name="Event Net"
                  barSize={24}
                  fill="#10b981"
                  fillOpacity={0.28}
                  radius={[5, 5, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="runningGrossAvg"
                  name="Gross Scoring Avg"
                  stroke="#d97706"
                  strokeWidth={2.5}
                  strokeDasharray="5 4"
                  dot={{ r: 4, fill: '#d97706', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="runningNetAvg"
                  name="Net Scoring Avg"
                  stroke="#065f46"
                  strokeWidth={3}
                  dot={{ r: 4.5, fill: '#065f46', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 6.5 }}
                />
              </ComposedChart>
            ) : (
              <AreaChart
                data={handicapChartData}
                margin={{ top: 12, right: 18, left: -8, bottom: 8 }}
              >
                <defs>
                  <linearGradient id="handicapAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#57534e', fontSize: 11 }}
                  axisLine={{ stroke: '#d6d3d1' }}
                  tickLine={false}
                />
                <YAxis
                  domain={handicapDomain}
                  tick={{ fill: '#57534e', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                />
                <Tooltip content={renderTooltip} />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                  iconType="circle"
                />
                {selectedMember && (
                  <ReferenceLine
                    y={selectedMember.handicap}
                    stroke="#d97706"
                    strokeDasharray="4 4"
                    label={{
                      value: `Current ${selectedMember.handicap.toFixed(1)}`,
                      position: 'insideTopRight',
                      fill: '#b45309',
                      fontSize: 10
                    }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="playedHandicap"
                  name="Playing Handicap Index"
                  stroke="#065f46"
                  strokeWidth={3}
                  fill="url(#handicapAreaGrad)"
                  dot={{ r: 5, fill: '#065f46', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#fbbf24', stroke: '#064e3b', strokeWidth: 2 }}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[220px] flex flex-col items-center justify-center text-center bg-stone-50/70 border border-dashed border-stone-200 rounded-xl px-4 space-y-2.5">
          <Activity className="w-7 h-7 text-stone-400" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-stone-800">
              No {activeSeasonName} tournament scores logged for {selectedMember?.name || 'this player'} yet
            </p>
            <p className="text-xs text-stone-500">
              Current Official Handicap: <span className="font-mono font-bold text-emerald-900">{selectedMember?.handicap.toFixed(1)}</span>
            </p>
          </div>
          {membersWithSeasonData.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <span className="text-[11px] text-stone-500">View active player:</span>
              {membersWithSeasonData.slice(0, 4).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelectMember(m.id)}
                  className="px-2.5 py-1 text-xs font-medium bg-white border border-stone-200 hover:border-emerald-700 hover:text-emerald-900 rounded-md transition-colors cursor-pointer"
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
