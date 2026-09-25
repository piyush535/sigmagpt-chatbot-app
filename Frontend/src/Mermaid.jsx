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
    const renderChart = async () => {
      if (!containerRef.current || !chart) return;

      try {
        const id =
          "mermaid-" +
          Date.now() +
          "-" +
          Math.random().toString(36).substring(2, 8);

        const { svg } = await mermaid.render(id, chart);

        containerRef.current.innerHTML = svg;
      } catch (error) {
        console.error("Mermaid rendering error:", error);

        containerRef.current.innerHTML = `
          <pre class="mermaid-error">${chart}</pre>
        `;
      }
    };

    renderChart();
  }, [chart]);

  return (
    <div
      ref={containerRef}
      className="mermaid-container"
    />
  );
}

export default Mermaid;