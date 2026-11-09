# VestiAI — AI Model & Dataset Licensing Compliance (TASK-14)

## 1. Overview
In accordance with academic integrity and legal compliance guidelines, all machine learning code, model checkpoints, and training/evaluation datasets used within the **VestiAI** project have been audited for intellectual property, redistribution rights, and commercial restrictions.

---

## 2. Component-by-Component License Breakdown

### 2.1 IDM-VTON
- **Repository:** `https://github.com/yisol/IDM-VTON`
- **Authors:** Yisol Choi, Sangyun Song, Minsoo Kim, Sungwon Park, Jaegul Choo (KAIST & OMNIOUS.AI)
- **Source Code License:** **Apache License 2.0** (Permissive; allows modification, distribution, and commercial use with attribution).
- **Pretrained Model Checkpoints (`yisol/IDM-VTON` on Hugging Face):**
  - **License:** **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)**.
  - **Restrictions:**
    - ✅ Permitted for academic research, university coursework, individual student evaluations, and non-profit demonstrations.
    - ❌ **Commercial prohibition:** Cannot be deployed for commercial services, paid products, or revenue-generating e-commerce platforms without an explicit commercial license from KAIST / OMNIOUS.AI.
    - 🔄 **ShareAlike:** Derivative models trained or fine-tuned on these weights must be released under the same license terms.

### 2.2 CatVTON
- **Repository:** `https://github.com/Zheng-Chong/CatVTON`
- **Authors:** Chong Zheng, Xianming Liu, Chengrui Wang, et al.
- **Source Code License:** **Apache License 2.0**.
- **Model Checkpoints (`zhengchong/CatVTON` on Hugging Face):**
  - **License:** **CC BY-NC-SA 4.0**.
  - **Restrictions:** Same non-commercial research terms as IDM-VTON.

### 2.3 Underlying Base Foundation Models
- **Stable Diffusion v1.5 Inpainting (`runwayml/stable-diffusion-inpainting`):**
  - **License:** **CreativeML OpenRAIL-M**.
  - **Restrictions:** Requires adherence to use-based restrictions (prohibiting generating non-consensual sexual content, defamation, or harm).
- **OpenCLIP / CLIP (`laion/CLIP-ViT-H-14-laion2B-s32B-b79K`):**
  - **License:** **MIT License**.

### 2.4 Research Benchmark Datasets (VITON-HD & DressCode)
- **VITON-HD:**
  - Collected by Choi et al. (CVPR 2021).
  - Terms: Research only. Image redistribution prohibited without consent.
- **DressCode:**
  - Collected by Morelli et al. (CVPR 2022).
  - Terms: Available strictly upon non-commercial academic agreement.
- **VestiAI Policy:**
  - Neither VITON-HD nor DressCode is packaged or committed into the VestiAI Git repository.
  - VestiAI uses only licensed sample flat garments and self-consented demonstration photographs for evaluation.

---

## 3. Academic & College Project Compliance Statement

1. **Educational Use:**
   As an individual college mini-project evaluated for academic degree completion, VestiAI operates strictly within the non-commercial scope permitted by the **CC BY-NC-SA 4.0** and **CreativeML OpenRAIL-M** licenses.
2. **Commercial Deployment Notice:**
   Should VestiAI ever transition toward commercial deployment or SaaS monetization, the pretrained research checkpoints must be replaced with models trained exclusively on proprietary, commercially cleared image datasets with an enterprise commercial agreement.
3. **Attribution:**
   All papers, model repositories, and baseline architectures are explicitly attributed in both the application documentation and final academic report.

