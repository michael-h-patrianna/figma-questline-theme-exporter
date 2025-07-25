import { h } from 'preact';
import { Issue } from '@main/types';

const darkPanel = '#23262F';
const textColor = '#F4F4F4';
const textSecondary = '#A3A3A3';
const border = '#23262F';
const borderRadius = 8;

export function QuestTable({ quests, issues }: { quests: any[]; issues: Issue[] }) {
  console.log('QuestTable DEBUG: Received quests:', quests?.length, quests);
  console.log('QuestTable DEBUG: Received issues:', issues?.length, issues);
  
  if (!quests || quests.length === 0) {
    return (
      <div style={{ 
        color: textSecondary, 
        fontSize: 14, 
        textAlign: 'center',
        padding: 0
      }}>
        No quests found.
      </div>
    );
  }

  const questIssues = new Map<string, Issue[]>();
  (issues || []).forEach((issue: Issue) => {
    if (issue.nodeId) {
      if (!questIssues.has(issue.nodeId)) {
        questIssues.set(issue.nodeId, []);
      }
      questIssues.get(issue.nodeId)!.push(issue);
    }
  });

  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      <div style={{ 
        padding: '8px 0',
        color: textSecondary,
        fontSize: 12,
        textAlign: 'center',
        borderBottom: `1px solid ${border}`,
        flexShrink: 0
      }}>
        Showing {quests.length} quest{quests.length !== 1 ? 's' : ''}
      </div>
      <div style={{ 
        flex: 1,
        overflowY: 'scroll',
        minHeight: 0,
        maxHeight: '300px' // Force a fixed height to ensure scrollbar appears
      }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          fontSize: 12
        }}>
          <thead>
            <tr style={{ 
              background: 'rgba(255, 255, 255, 0.05)',
              borderBottom: `1px solid ${border}`
            }}>
              <th style={{ 
                padding: '12px 16px', 
                textAlign: 'left', 
                color: textSecondary,
                fontWeight: 600,
                fontSize: 12
              }}>Quest Key</th>
              <th style={{ 
                padding: '12px 8px', 
                textAlign: 'center', 
                color: textSecondary,
                fontWeight: 600,
                fontSize: 12
              }}>Position</th>
              <th style={{ 
                padding: '12px 8px', 
                textAlign: 'center', 
                color: textSecondary,
                fontWeight: 600,
                fontSize: 12
              }}>Size</th>
              <th style={{ 
                padding: '12px 8px', 
                textAlign: 'center', 
                color: textSecondary,
                fontWeight: 600,
                fontSize: 12
              }}>Rotation</th>
              <th style={{ 
                padding: '12px 8px', 
                textAlign: 'center', 
                color: textSecondary,
                fontWeight: 600,
                fontSize: 12
              }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {quests.map((q: any, index: number) => {
              const hasIssues = questIssues.has(q.nodeId);
              const questIssuesList = questIssues.get(q.nodeId) || [];
              
              return (
                <tr key={q.nodeId} style={{ 
                  background: hasIssues ? 'rgba(231, 76, 60, 0.1)' : index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                  borderBottom: `1px solid ${border}`
                }}>
                  <td style={{ 
                    padding: '12px 16px', 
                    color: textColor,
                    fontWeight: 500
                  }}>
                    {q.questKey}
                  </td>
                  <td style={{ 
                    padding: '12px 8px', 
                    textAlign: 'center', 
                    color: textSecondary,
                    fontSize: 11
                  }}>
                    {q.x.toFixed(2)}, {q.y.toFixed(2)}
                  </td>
                  <td style={{ 
                    padding: '12px 8px', 
                    textAlign: 'center', 
                    color: textSecondary,
                    fontSize: 11
                  }}>
                    {q.w.toFixed(2)} × {q.h.toFixed(2)}
                  </td>
                  <td style={{ 
                    padding: '12px 8px', 
                    textAlign: 'center', 
                    color: textSecondary,
                    fontSize: 11
                  }}>
                    {q.rotation.toFixed(2)}°
                  </td>
                  <td style={{ 
                    padding: '12px 8px', 
                    textAlign: 'center'
                  }}>
                    {hasIssues ? (
                      <span style={{ 
                        color: '#e74c3c', 
                        fontSize: 11,
                        fontWeight: 600
                      }}>
                        {questIssuesList.length} issue{questIssuesList.length > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span style={{ 
                        color: '#1ecb7a', 
                        fontSize: 11,
                        fontWeight: 600
                      }}>
                        ✓ OK
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
