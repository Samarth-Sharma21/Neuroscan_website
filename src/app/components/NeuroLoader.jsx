'use client';

/**
 * NeuroLoader — animated inset-morphing loader
 * Inspired by the loaderAnim pattern.
 */
export default function NeuroLoader({ size = 56, color = '#ffffff' }) {
  const style = `
    @keyframes neuroLoaderAnim {
      0%    { inset: 0 ${size * 0.538}px ${size * 0.538}px 0; }
      12.5% { inset: 0 ${size * 0.538}px 0 0; }
      25%   { inset: ${size * 0.538}px ${size * 0.538}px 0 0; }
      37.5% { inset: ${size * 0.538}px 0 0 0; }
      50%   { inset: ${size * 0.538}px 0 0 ${size * 0.538}px; }
      62.5% { inset: 0 0 0 ${size * 0.538}px; }
      75%   { inset: 0 0 ${size * 0.538}px ${size * 0.538}px; }
      87.5% { inset: 0 0 ${size * 0.538}px 0; }
      100%  { inset: 0 ${size * 0.538}px ${size * 0.538}px 0; }
    }
    .neuro-loader-span {
      position: absolute;
      border-radius: 50px;
      box-shadow: inset 0 0 0 3px ${color};
      animation: neuroLoaderAnim 2.5s infinite;
    }
    .neuro-loader-span-delay {
      animation-delay: -1.25s;
    }
  `;

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
      }}
      aria-label='Loading'
      role='status'>
      <span className='neuro-loader-span' />
      <span className='neuro-loader-span neuro-loader-span-delay' />
      <style>{style}</style>
    </div>
  );
}
