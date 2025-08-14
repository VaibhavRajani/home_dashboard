import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  icon?: ReactNode;
}

export default function Card({
  children,
  className = "",
  title,
  icon,
}: CardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden ${className}`}
    >
      {(title || icon) && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            {icon && <div className="flex-shrink-0">{icon}</div>}
            {title && (
              <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            )}
          </div>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
