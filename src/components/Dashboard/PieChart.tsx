import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface Transaction {
  amount: number;
  date: string;
}

export default function MoneyFlowPieChart() {
  const ref = useRef<SVGSVGElement | null>(null);
  const [data, setData] = useState<{ deposits: number; purchases: number } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate })
      };

      const [depositsRes, purchasesRes] = await Promise.all([
        fetch('/api/user/fetch/deposits', options),
        fetch('/api/user/fetch/purchases', options),
      ]);

      const deposits: Transaction[] = await depositsRes.json();
      const purchases: Transaction[] = await purchasesRes.json();

      const totalDeposits = deposits.reduce((acc, t) => acc + t.amount, 0);
      const totalPurchases = purchases.reduce((acc, t) => acc + t.amount, 0);

      setData({ deposits: totalDeposits, purchases: totalPurchases });
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!data || !ref.current) return;

    const pieData = [
      { label: "Money In", value: data.deposits },
      { label: "Money Out", value: data.purchases },
    ];

    const width = 300;
    const height = 300;
    const radius = Math.min(width, height) / 2;

    const svg = d3
      .select(ref.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal<string>().domain(pieData.map(d => d.label)).range(["#4ade80", "#f87171"]);

    const pie = d3.pie<{ label: string; value: number }>().value(d => d.value);
    const arc = d3.arc<d3.PieArcDatum<{ label: string; value: number }>>()
      .innerRadius(0)
      .outerRadius(radius);

    const arcs = svg.selectAll("arc")
      .data(pie(pieData))
      .enter()
      .append("g")
      .attr("class", "arc");

    arcs.append("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data.label));

    arcs.append("text")
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .attr("text-anchor", "middle")
      .text(d => `${d.data.label}`)
      .style("fill", "white")
      .style("font-size", "12px");

    return () => {
      d3.select(ref.current).selectAll("*").remove();
    };
  }, [data]);

  return (
    <div className="w-full flex justify-center">
      <svg ref={ref}></svg>
    </div>
  );
}