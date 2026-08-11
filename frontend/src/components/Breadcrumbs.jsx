import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { getBreadcrumbSchema } from '../utils/seoSchemas';

const Breadcrumbs = ({ items = [] }) => {
  const fullItems = [
    { name: 'Home', path: '/' },
    ...items
  ];

  const schemaData = getBreadcrumbSchema(fullItems);

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      {/* Inject BreadcrumbList JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <ol className="flex items-center flex-wrap gap-2 text-xs font-medium text-gray-500">
        {fullItems.map((item, index) => {
          const isLast = index === fullItems.length - 1;
          return (
            <li key={index} className="flex items-center gap-2">
              {index > 0 && <ChevronRight size={14} className="text-gray-400" />}
              {isLast ? (
                <span className="font-extrabold text-brand-navy truncate max-w-[200px] md:max-w-xs" aria-current="page">
                  {item.name}
                </span>
              ) : (
                <Link
                  to={item.path}
                  className="hover:text-brand-emerald transition-colors flex items-center gap-1 text-gray-600"
                >
                  {index === 0 && <Home size={14} className="text-brand-emerald" />}
                  <span>{item.name}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
