# Neuro-Scan: Website & Web Application

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Neuro-Scan** is a deep learning-powered medical imaging system designed to analyze MRI scans. This repository contains the source code for the **web-based interface** built with Next.js, integrating our custom machine learning models (PyTorch) for fast and reliable inference. 

---

## 🌐 About & Live Demo
You can try out the live version of the Neuro-Scan Web application here:
👉 **[Neuro-Scan Web - Live Demo](https://neuroscan-web.netlify.app/)**

> **Mobile Application Repository:** Please note that the companion mobile application for Neuro-Scan can be found here: [Neuroscan_Mobile](https://github.com/Samarth-Sharma21/Neuroscan_Mobile). Both clients interface with the same underlying AI infrastructure to provide cross-platform accessibility.

---

## 🎯 Purpose and Software Impact
This repository accompanies our submission to the *Software Impacts* journal. The Neuro-Scan web application makes advanced neurological MRI analysis accessible to clinical researchers and practitioners through an intuitive interface. It demonstrates a scalable architecture integrating modern web frameworks with complex Python-based deep learning workflows, highlighting reproducibility and ease-of-use.

## ✨ Features
- **Medical Image Upload & Processing:** Secure upload and visualization of MRI scans.
- **AI-Powered Analysis:** Seamless integration with PyTorch-based deep learning models for classification/segmentation.
- **Scalable Architecture:** Built on Next.js with React, ensuring high performance, SEO optimization, and an excellent user experience.
- **Cross-Platform Ecosystem:** Integrates seamlessly with our [Mobile App (Expo)](https://github.com/Samarth-Sharma21/Neuroscan_Mobile).

---

## 🛠️ Required Dependencies
Before running the application, ensure your reproducible environment meets the following compilation requirements:
- **Node.js** (v18.x or above)
- **Machine Learning Backend** (If running locally): Python 3.8+, PyTorch, NumPy, Pandas, Scikit-learn
- **Frontend Stack**: Next.js, React.js

---

## 🚀 Getting Started (How-to Guide)

### 1. Clone the repository
```bash
git clone https://github.com/Samarth-Sharma21/Neuroscan_website.git
cd Neuroscan_website
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory and add the required API keys and configuration parameters (e.g., Hugging Face endpoints, Supabase configuration, or local backend URLs).

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 📂 Repository Structure
- `src/` - Contains the main Next.js App Router source code.
- `public/` - Static assets and images.
- `model/` - Configurations, HuggingFace inference abstractions, or client-side interfaces dealing with the ML model.
- `supabase/` - Database schema, initialization, and configuration files for Supabase backend.

---

## 📄 License & Legal
This project is licensed under the **MIT License**. See the `LICENSE` file for full details.

## 📚 Citation
If you use this software in your research, please cite our corresponding paper in *Software Impacts*:
```bibtex
@article{neuroscan202X,
  title={Neuro-Scan: ...},
  author={Sharma, Samarth and ...},
  journal={Software Impacts},
  year={202X}
}
```

## ✉️ Support
For questions, support, or access to the reproducible capsule, please contact: **Samarthsharma7621@gmail.com**
