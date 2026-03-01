'use client';

export default function HeroContent() {
  return (
    <div className='hero-content-layer'>
      <div className='hero-content-inner'>
        {/* Eyebrow label */}
        <div className='hero-label'>MRI-Based Screening Research</div>

        {/* Main headline */}
        <h1 className='hero-headline'>
          Mapping Dementia
          <br />
          From Brain MRI Scans
        </h1>

        {/* Subheadline */}
        <p className='hero-subheadline'>
          Neuroscan uses a deep learning model trained on brain MRI data to
          classify stages of dementia and highlight regions the model attends to
          — helping visualize what the network learns.
        </p>

        {/* Action buttons */}
        <div className='hero-buttons'>
          <a href='/upload' className='btn-primary' id='hero-upload-btn'>
            <svg
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2.5'
              strokeLinecap='round'
              strokeLinejoin='round'>
              <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
              <polyline points='17 8 12 3 7 8' />
              <line x1='12' y1='3' x2='12' y2='15' />
            </svg>
            Try It Out
          </a>
          <a href='#how-it-works' className='btn-secondary' id='hero-demo-btn'>
            See How It Works
          </a>
        </div>
      </div>
    </div>
  );
}
