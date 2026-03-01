'use client';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className='site-footer' id='footer'>
      <div className='footer-inner'>
        {/* Grid */}
        <div className='footer-grid'>
          {/* Brand */}
          <div className='footer-brand'>
            <p className='footer-brand-name'>
              Neuro<span>scan</span>
            </p>
            <p className='footer-brand-desc'>
              A final-year research project using deep learning to classify
              dementia stages from brain MRI scans and visualize model
              attention.
            </p>
          </div>

          {/* Navigation */}
          <div className='footer-col'>
            <h4>Navigation</h4>
            <ul>
              <li>
                <a href='/'>Home</a>
              </li>
              <li>
                <a href='#features'>Features</a>
              </li>
              <li>
                <a href='#how-it-works'>How It Works</a>
              </li>
              <li>
                <a href='/upload'>Upload MRI</a>
              </li>
              <li>
                <a href='/doctors'>Doctor Support</a>
              </li>
            </ul>
          </div>

          {/* Project */}
          <div className='footer-col'>
            <h4>Project</h4>
            <ul>
              <li>
                <a
                  href='https://github.com/Samarth-Sharma21'
                  target='_blank'
                  rel='noopener noreferrer'>
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href='https://huggingface.co/spaces/Samarth-21/neuroscan-api'
                  target='_blank'
                  rel='noopener noreferrer'>
                  Model API
                </a>
              </li>
            </ul>
          </div>

          {/* Technical */}
          <div className='footer-col'>
            <h4>Built With</h4>
            <ul>
              <li>
                <a
                  href='https://nextjs.org'
                  target='_blank'
                  rel='noopener noreferrer'>
                  Next.js
                </a>
              </li>
              <li>
                <a
                  href='https://pytorch.org'
                  target='_blank'
                  rel='noopener noreferrer'>
                  PyTorch
                </a>
              </li>
              <li>
                <a
                  href='https://fastapi.tiangolo.com'
                  target='_blank'
                  rel='noopener noreferrer'>
                  FastAPI
                </a>
              </li>
              <li>
                <a
                  href='https://huggingface.co'
                  target='_blank'
                  rel='noopener noreferrer'>
                  Hugging Face
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className='footer-bottom'>
          <p>&copy; {year} Neuroscan &mdash; Samarth Sharma.</p>
          <p>HUFA-Net v1 &middot; MRI-Based Dementia Screening</p>
        </div>
      </div>
    </footer>
  );
}
