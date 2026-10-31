import React from "react";

export const LoadingState: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="relative flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-secondary/20 border-t-brand-secondary"></div>
            </div>
            <p className="mt-4 text-sm font-medium text-neutral-500">Loading data...</p>
        </div>
    );
};
