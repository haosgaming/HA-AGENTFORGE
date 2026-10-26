import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { Activity, Cpu, Flame, Info, RefreshCw, Clock, Filter } from "lucide-react";
import { AgentInstance } from "../types";

export interface HeatmapCellData {
  agentId: number;
  agentName: string;
  hourIndex: number; // 0 to 23
  hourLabel: string;
  cpuPercent: number;
  peakPercent: number;
  notes: string;
}

interface AgentCpuHeatmapProps {
  agents: AgentInstance[];
}

export const AgentCpuHeatmap: React.FC<AgentCpuHeatmapProps> = ({ agents }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [metricType, setMetricType] = useState<"avg" | "peak">("avg");
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>("all");
  const [tooltipData, setTooltipData] = useState<HeatmapCellData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Generate deterministic 24-hour historical telemetry matching inventory
  const heatmapData = useMemo<HeatmapCellData[]>(() => {
    const data: HeatmapCellData[] = [];
    const now = new Date();
    const currentHour = now.getHours();

    agents.forEach((agent) => {
      for (let i = 0; i < 24; i++) {
        const hour = (currentHour - 23 + i + 24) % 24;
        const hourLabel = `${hour.toString().padStart(2, "0")}:00`;

        // Telemetry baseline per agent
        let baseCpu = 2.0;
        let peakCpu = 5.0;
        let note = "Běžný pohotovostní cyklus agenta";

        if (agent.name.includes("FVE")) {
          // Daylight hours (08:00 - 17:00) have higher solar balancer activity
          if (hour >= 8 && hour <= 17) {
            baseCpu = 18.5 + Math.sin((hour - 8) / 9 * Math.PI) * 24.0 + (i % 3) * 3.5;
            peakCpu = baseCpu + 15.0;
            note = "Aktivní FVE balancer (Carspa MKS1000-12 telemetrie & RF EV1527 spínání)";
          } else {
            baseCpu = 2.4;
            peakCpu = 4.8;
            note = "Noční útlum - monitorování napětí 12V baterie";
          }
        } else if (agent.name.includes("SubGHz")) {
          // ESP32-S3 Sub-GHz packet watcher
          baseCpu = 8.0 + ((i * 7) % 18);
          peakCpu = baseCpu + 22.0;
          note = "ESP32-S3 CC1101 příjem RF paketů (433.92MHz) a debouncing 650ms";
        } else if (agent.name.includes("Proxmox")) {
          // Dell PowerEdge R510 load sentinel
          baseCpu = 12.0 + ((i * 11) % 25);
          peakCpu = baseCpu + 18.0;
          note = "Dell R510 telemetrie: Dual Xeon L5640, ZFS scrub a AdGuard DNS";
        }

        data.push({
          agentId: agent.id,
          agentName: agent.name,
          hourIndex: i,
          hourLabel,
          cpuPercent: +baseCpu.toFixed(1),
          peakPercent: +peakCpu.toFixed(1),
          notes: note,
        });
      }
    });

    return data;
  }, [agents]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    if (selectedAgentFilter === "all") return heatmapData;
    return heatmapData.filter((d) => d.agentName === selectedAgentFilter);
  }, [heatmapData, selectedAgentFilter]);

  const activeAgents = useMemo(() => {
    if (selectedAgentFilter === "all") return agents;
    return agents.filter((a) => a.name === selectedAgentFilter);
  }, [agents, selectedAgentFilter]);

  // D3 Rendering Hook
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const margin = { top: 25, right: 30, bottom: 45, left: 180 };
    const width = 860 - margin.left - margin.right;
    const cellHeight = 36;
    const height = activeAgents.length * cellHeight + 10;

    // Set container height dynamically
    svg.attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // X Scale: 24 hourly buckets
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const xScale = d3
      .scaleBand<number>()
      .domain(hours)
      .range([0, width])
      .padding(0.08);

    // Y Scale: Agents
    const yScale = d3
      .scaleBand<string>()
      .domain(activeAgents.map((a) => a.name))
      .range([0, activeAgents.length * cellHeight])
      .padding(0.12);

    // Color Scale matching ROG Cyber Slate Glass: Deep Slate -> Cyan -> Green -> Amber -> Crimson
    const colorScale = d3
      .scaleLinear<string>()
      .domain([0, 10, 25, 55, 85])
      .range(["#0d1424", "#00f0ff", "#10b981", "#f59e0b", "#ef4444"])
      .interpolate(d3.interpolateRgb);

    // X Axis: Hour labels
    const xAxis = d3
      .axisBottom(xScale)
      .tickFormat((d) => {
        const item = heatmapData.find((h) => h.hourIndex === d);
        return item ? item.hourLabel : `${d}h`;
      })
      .tickSize(4);

    const gx = g
      .append("g")
      .attr("transform", `translate(0,${activeAgents.length * cellHeight + 6})`)
      .call(xAxis);

    gx.selectAll("text")
      .attr("font-family", "ui-monospace, monospace")
      .attr("font-size", "10px")
      .attr("fill", "#94a3b8")
      .attr("transform", "rotate(-35)")
      .style("text-anchor", "end");

    gx.select(".domain").attr("stroke", "rgba(255,255,255,0.1)");
    gx.selectAll(".tick line").attr("stroke", "rgba(255,255,255,0.1)");

    // Y Axis: Agent labels
    const yAxis = d3.axisLeft(yScale).tickSize(0);
    const gy = g.append("g").call(yAxis);

    gy.selectAll("text")
      .attr("font-family", "ui-monospace, monospace")
      .attr("font-size", "11px")
      .attr("font-weight", "bold")
      .attr("fill", "#e2e8f0");

    gy.select(".domain").remove();

    // Render Heatmap Cells
    g.selectAll(".heatmap-cell")
      .data(filteredData)
      .enter()
      .append("rect")
      .attr("class", "heatmap-cell")
      .attr("x", (d) => xScale(d.hourIndex) || 0)
      .attr("y", (d) => yScale(d.agentName) || 0)
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("fill", (d) => colorScale(metricType === "avg" ? d.cpuPercent : d.peakPercent))
      .attr("stroke", "rgba(255,255,255,0.06)")
      .attr("stroke-width", 1)
      .style("cursor", "crosshair")
      .style("transition", "all 0.15s ease-out")
      .on("mouseover", function (event, d) {
        d3.select(this)
          .attr("stroke", "#00f0ff")
          .attr("stroke-width", 2)
          .style("filter", "drop-shadow(0 0 6px rgba(0, 240, 255, 0.7))");

        const containerRect = svgRef.current?.getBoundingClientRect();
        if (containerRect) {
          setTooltipPos({
            x: event.clientX - containerRect.left + 15,
            y: event.clientY - containerRect.top - 65,
          });
        }
        setTooltipData(d);
      })
      .on("mouseout", function () {
        d3.select(this)
          .attr("stroke", "rgba(255,255,255,0.06)")
          .attr("stroke-width", 1)
          .style("filter", "none");

        setTooltipData(null);
      });
  }, [filteredData, activeAgents, metricType]);

  return (
    <div className="rog-glass p-4 border border-cyan-500/30 text-slate-200 glow-cyan mb-4 relative">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3 mb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-500/50 glow-cyan">
            <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                Heatmapa Vytížení CPU Agentů (D3.js – Posledních 24 Hodin)
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 border border-cyan-400/50 text-cyan-300">
                D3 v7 SCALE-BAND
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Časové rozložení zátěže jader Dell R510 (192.168.1.108) a MiniPC HAOS (192.168.1.110) v 1hodinových oknech
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Metric toggle */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-white/10">
            <button
              onClick={() => setMetricType("avg")}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                metricType === "avg"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Průměrné CPU %
            </button>
            <button
              onClick={() => setMetricType("peak")}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                metricType === "peak"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-400/50 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Špičkové CPU % (Peak)
            </button>
          </div>

          {/* Agent Filter */}
          <div className="flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedAgentFilter}
              onChange={(e) => setSelectedAgentFilter(e.target.value)}
              className="bg-slate-900 border border-white/10 text-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-cyan-400"
            >
              <option value="all">Všichni agenti ({agents.length})</option>
              {agents.map((a) => (
                <option key={a.id} value={a.name}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="w-full overflow-x-auto relative min-h-[170px] flex items-center justify-center bg-[#070a12]/80 rounded-xl p-2 border border-white/5">
        <svg ref={svgRef} className="overflow-visible select-none" />

        {/* Hover Tooltip */}
        {tooltipData && (
          <div
            className="absolute z-30 pointer-events-none p-2.5 rounded-lg bg-slate-950/95 border border-cyan-400/60 shadow-xl glow-cyan text-xs font-mono text-slate-200 animate-fade-in"
            style={{
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y}px`,
              maxWidth: "280px",
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-cyan-300">{tooltipData.agentName}</span>
              <span className="text-slate-400 text-[10px]">{tooltipData.hourLabel}</span>
            </div>
            <div className="flex items-center space-x-2 text-[11px] mb-1">
              <span>Zátěž CPU:</span>
              <span className="font-bold text-emerald-400">
                {metricType === "avg" ? `${tooltipData.cpuPercent}%` : `${tooltipData.peakPercent}% (Peak)`}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight font-sans">{tooltipData.notes}</p>
          </div>
        )}
      </div>

      {/* Heatmap Legend */}
      <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center space-x-2">
          <span>Škála vytížení CPU:</span>
          <div className="flex items-center space-x-1">
            <span className="w-3.5 h-3.5 rounded bg-[#0d1424] border border-white/10" title="< 5% Idle" />
            <span className="text-[10px]">0%</span>
            <span className="w-3.5 h-3.5 rounded bg-[#00f0ff]" title="10-25% Nominal" />
            <span className="text-[10px]">10%</span>
            <span className="w-3.5 h-3.5 rounded bg-[#10b981]" title="25-50% Standard" />
            <span className="text-[10px]">25%</span>
            <span className="w-3.5 h-3.5 rounded bg-[#f59e0b]" title="50-75% Zvýšená" />
            <span className="text-[10px]">50%</span>
            <span className="w-3.5 h-3.5 rounded bg-[#ef4444]" title="> 75% Špička" />
            <span className="text-[10px]">85%+</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-[10px]">
          <span>D3 Vektorová Vizualizace</span>
          <span className="text-emerald-400 font-bold">• Aktivní</span>
        </div>
      </div>
    </div>
  );
};
