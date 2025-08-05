// Example usage of RequirementsContext
import React from 'react';
import { useRequirements } from '../state/SettingsContext';

// Example 1: Simple dropdown component
export function RequirementsDropdown({ onChange, value }) {
  const { state, actions } = useRequirements();

  if (state.status === 'loading') {
    return <div>Loading requirements...</div>;
  }

  if (state.status === 'error') {
    return (
      <div>
        <div>Error: {state.error}</div>
        <button onClick={actions.reload}>Retry</button>
      </div>
    );
  }

  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select requirement...</option>
      {state.requirements.map((req) => (
        <option key={req.value} value={req.value}>
          {req.text}
        </option>
      ))}
    </select>
  );
}

// Example 2: Requirements list component
export function RequirementsList({ selectedRequirements = [] }) {
  const { state, actions } = useRequirements();

  if (state.status !== 'ready') return null;

  return (
    <div>
      <h3>Selected Requirements:</h3>
      {selectedRequirements.map((reqValue) => {
        const requirement = actions.getRequirementByValue(reqValue);
        return (
          <div key={reqValue}>
            <strong>{requirement?.text || 'Unknown'}</strong>
            <span> ({reqValue})</span>
          </div>
        );
      })}
    </div>
  );
}

// Example 3: Replace old requirements.jsx functions
export function LegacyReplacementExample() {
  const { actions } = useRequirements();

  const requirements = actions.getRequirements();
  const requirementText = actions.getRequirementInClear('proof_of_funds');

  return (
    <div>
      <h3>All Requirements:</h3>
      {requirements.map(req => (
        <div key={req.value}>{req.text}</div>
      ))}
      
      <h3>Specific Requirement:</h3>
      <div>{requirementText}</div>
    </div>
  );
}