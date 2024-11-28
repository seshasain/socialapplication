import React from 'react';

interface ValidationErrorsProps {
  errors: Array<{ platform: string; message: string }>;
}

export default function ValidationErrors({ errors }: ValidationErrorsProps) {
  if (errors.length === 0) return null;

  return (
    <div className="mb-6 p-3 bg-yellow-100 border border-yellow-200 text-yellow-800 rounded-lg">
      <h3 className="font-semibold mb-2">Platform Validation Issues:</h3>
      <ul className="list-disc pl-5">
        {errors.map((error, index) => (
          <li key={index}>
            {error.platform}: {error.message}
          </li>
        ))}
      </ul>
    </div>
  );
}