import { forwardRef } from 'react';

const Stage = forwardRef<HTMLDivElement>(function Stage(_, ref) {
  return (
    <div
      ref={ref}
      style={{
        flex: 1,
        minHeight: 0,
        margin: 8,
        border: '2px inset #c0c0c0',
        background: '#ffffff',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#888',
        fontStyle: 'italic',
        userSelect: 'none',
      }}
    >
      (empty stage — animations will render here after the other PR merges)
    </div>
  );
});

export default Stage;
