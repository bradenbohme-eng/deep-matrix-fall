import React, { useEffect } from 'react';
import DiagramOrganizer from '@/components/matrix/DiagramOrganizer';

const Architecture: React.FC = () => {
  // Basic SEO for SPA
  useEffect(() => {
    document.title = 'System Architecture Diagram | Lumin';

    const metaDescId = 'meta-architecture-desc';
    let metaDesc = document.getElementById(metaDescId) as HTMLMetaElement | null;
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      metaDesc.id = metaDescId;
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = 'Interactive architecture diagram of the Lumin codebase with RAG-connected nodes.';

    const linkId = 'link-architecture-canonical';
    let link = document.getElementById(linkId) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      link.id = linkId;
      document.head.appendChild(link);
    }
    link.href = window.location.origin + '/architecture';
  }, []);

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-mono text-primary mb-4">System Architecture Diagram</h1>
      <DiagramOrganizer mode="architecture" />
    </div>
  );
};

export default Architecture;
