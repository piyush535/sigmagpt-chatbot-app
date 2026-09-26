import { useEffect, useRef } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
});

function Mermaid({ chart }) {
  const containerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const renderChart = async () => {
      if (!containerRef.current || !chart?.trim()) {
        return;
      }

      try {
        const id =
          "mermaid-" +
          Date.now() +
          "-" +
          Math.random().toString(36).substring(2, 8);

        const cleanChart = chart.trim();

        // Don't attempt to render obviously incomplete diagrams.
        if (
          cleanChart.endsWith("-->") ||
          cleanChart.endsWith("---") ||
          cleanChart.endsWith("-.->") ||
          cleanChart.endsWith("==>")
        ) {
          console.warn("Skipping incomplete Mermaid diagram:", cleanChart);
          return;
        }

        const { svg } = await mermaid.render(id, cleanChart);

        // Don't update an unmounted component
        if (cancelled) return;

        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (error) {
        if (cancelled) return;

        console.warn("Invalid mermaid diagram:", error);

        if (containerRef.current) {
          containerRef.current.innerHTML = `
                        <div class="mermaid-error">
                            Unable to render this flowchart.
                        </div>
                    `;
        }
      }
    };

    renderChart();

    return () => {
      cancelled = true;

      if (containerRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        containerRef.current.innerHTML = "";
      }
    };
  }, [chart]);

  return <div ref={containerRef} className="mermaid-container" />;
}

export default Mermaid;
