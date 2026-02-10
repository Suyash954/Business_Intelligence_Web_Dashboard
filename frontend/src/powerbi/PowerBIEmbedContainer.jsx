import React, { useEffect, useRef } from "react";
import * as powerbi from "powerbi-client";

// Generic Power BI report embed container.
// Expects: { embedUrl, accessToken, reportId } from backend /api/powerbi/embed-config.

export function PowerBIEmbedContainer({ embedUrl, accessToken, reportId }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !embedUrl || !accessToken || !reportId) return;

    const service = new powerbi.service.Service(
      powerbi.factories.hpmFactory,
      powerbi.factories.wpmpFactory,
      powerbi.factories.routerFactory
    );

    const config = {
      type: "report",
      tokenType: powerbi.models.TokenType.Embed,
      accessToken,
      embedUrl,
      id: reportId,
      settings: {
        panes: {
          filters: { visible: false },
          pageNavigation: { visible: true }
        }
      }
    };

    service.embed(containerRef.current, config);

    return () => {
      service.reset(containerRef.current);
    };
  }, [embedUrl, accessToken, reportId]);

  return <div className="powerbi-container" ref={containerRef} />;
}

