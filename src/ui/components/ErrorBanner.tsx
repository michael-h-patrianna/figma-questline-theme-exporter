import { h } from 'preact';
import { Issue } from '@main/types';

const darkPanel = '#23262F';
const textColor = '#F4F4F4';
const textSecondary = '#A3A3A3';
const border = '#23262F';
const borderRadius = 8;

export function ErrorBanner({ issues }: { issues: Issue[] }) {
  if (!issues || issues.length === 0) return null;

  const errors = issues.filter(i => i.level === 'error');
  const warnings = issues.filter(i => i.level === 'warning');

  return (
    <div style={{ 
      background: 'rgba(231, 76, 60, 0.1)', 
      border: '1px solid rgba(231, 76, 60, 0.3)', 
      borderRadius, 
      padding: 16, 
      marginBottom: 16
    }}>
      <div style={{ 
        color: '#e74c3c', 
        fontWeight: 600, 
        marginBottom: 12,
        fontSize: 14
      }}>
        Issues Found ({issues.length})
      </div>
      
      {errors.length > 0 && (
        <div style={{ marginBottom: warnings.length > 0 ? 12 : 0 }}>
          <div style={{ 
            color: '#e74c3c', 
            fontWeight: 600, 
            marginBottom: 8,
            fontSize: 13
          }}>
            ❌ {errors.length} Error{errors.length > 1 ? 's' : ''}:
          </div>
          {errors.map((issue: Issue, index: number) => (
            <div key={issue.code + (issue.nodeId || '')} style={{ 
              color: textColor, 
              fontSize: 12, 
              marginBottom: 4,
              paddingLeft: 12
            }}>
              {index + 1}. {issue.message}
            </div>
          ))}
        </div>
      )}
      
      {warnings.length > 0 && (
        <div>
          <div style={{ 
            color: '#f39c12', 
            fontWeight: 600, 
            marginBottom: 8,
            fontSize: 13
          }}>
            ⚠️ {warnings.length} Warning{warnings.length > 1 ? 's' : ''}:
          </div>
          {warnings.map((issue: Issue, index: number) => (
            <div key={issue.code + (issue.nodeId || '')} style={{ 
              color: textColor, 
              fontSize: 12, 
              marginBottom: 4,
              paddingLeft: 12
            }}>
              {index + 1}. {issue.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
