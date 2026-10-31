import React from "react";

interface PageHeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, action }) => {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2">
            <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
                {description && <p className="text-xs sm:text-sm font-medium text-slate-500">{description}</p>}
            </div>
            {action && <div className="flex items-center gap-3 self-start sm:self-auto">{action}</div>}
        </div>
    );
};
